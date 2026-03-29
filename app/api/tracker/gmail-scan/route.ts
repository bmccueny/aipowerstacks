import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { encryptToken, decryptToken } from '@/lib/gmail-crypto'
import { rateLimit } from '@/lib/rate-limit'

// ---------------------------------------------------------------------------
// Known AI billing senders -> tool slug (exact email address match)
// ---------------------------------------------------------------------------
const SENDER_TO_SLUG: Record<string, string> = {
  'billing@openai.com': 'chatgpt',
  'noreply@openai.com': 'chatgpt',
  'noreply@anthropic.com': 'claude',
  'billing@anthropic.com': 'claude',
  'billing@vercel.com': 'vercel',
  'noreply@vercel.com': 'vercel',
  'billing@cursor.sh': 'cursor',
  'hello@cursor.sh': 'cursor',
  'billing@github.com': 'github-copilot',
  'noreply@github.com': 'github-copilot',
  'billing@notion.so': 'notion',
  'billing@linear.app': 'linear',
  'billing@figma.com': 'figma',
  'billing@midjourney.com': 'midjourney',
  'noreply@midjourney.com': 'midjourney',
  'hello@perplexity.ai': 'perplexity-ai',
  'billing@perplexity.ai': 'perplexity-ai',
  'billing@runway.ml': 'runway',
  'billing@elevenlabs.io': 'elevenlabs',
  'hello@elevenlabs.io': 'elevenlabs',
  'billing@pika.art': 'pika',
  'billing@heygen.com': 'heygen',
  'noreply@heygen.com': 'heygen',
  'support@jasper.ai': 'jasper',
  'billing@copy.ai': 'copy-ai',
  'billing@writesonic.com': 'writesonic',
  'billing@grammarly.com': 'grammarly',
  'billing@otter.ai': 'otter-ai',
  'billing@synthesia.io': 'synthesia',
  'billing@descript.com': 'descript',
}

// Broad Gmail search — server-side filtering is much cheaper than fetching all
const GMAIL_QUERY =
  'subject:(receipt OR invoice OR payment OR subscription OR billing OR "your plan") ' +
  'newer_than:180d'

// Matches $20, $20.00, USD 20.00
const AMOUNT_RE = /\$\s*(\d{1,4}(?:\.\d{1,2})?)|(\d{1,4}(?:\.\d{1,2})?)\s*USD/gi

export type DetectedSubscription = {
  tool_id: string | null
  tool_name: string
  tool_slug: string | null
  logo_url: string | null
  amount: number
  email_subject: string
  email_from: string
}

function extractAmount(text: string): number | null {
  AMOUNT_RE.lastIndex = 0
  const amounts: number[] = []
  let m: RegExpExecArray | null
  while ((m = AMOUNT_RE.exec(text)) !== null) {
    const val = parseFloat(m[1] ?? m[2])
    if (!isNaN(val) && val > 0 && val < 10_000) amounts.push(val)
  }
  if (amounts.length === 0) return null
  // Prefer smallest amount (monthly charge, not annual total)
  return amounts.sort((a, b) => a - b)[0]
}

function extractEmailAddress(from: string): string {
  const m = from.match(/<([^>]+)>/)
  return (m ? m[1] : from).toLowerCase().trim()
}

/** GET /api/tracker/gmail-scan — check whether Gmail is connected */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('user_gmail_tokens')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  return NextResponse.json({ connected: data != null })
}

/** POST /api/tracker/gmail-scan — scan Gmail for AI billing emails */
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { success } = rateLimit(`gmail-scan:${user.id}`, 1, 3_600_000)
  if (!success) {
    return NextResponse.json(
      { error: 'You can only scan once per hour. Please try again later.' },
      { status: 429 },
    )
  }

  const { data: tokenRow } = await supabase
    .from('user_gmail_tokens')
    .select('access_token, refresh_token, expires_at')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!tokenRow) {
    return NextResponse.json({ error: 'Gmail not connected', connected: false }, { status: 400 })
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/gmail/callback`,
  )

  const decryptedRefresh = decryptToken(tokenRow.refresh_token)
  const expiresAt = new Date(tokenRow.expires_at).getTime()

  if (Date.now() >= expiresAt - 60_000) {
    oauth2Client.setCredentials({ refresh_token: decryptedRefresh })
    let newCreds
    try {
      const { credentials } = await oauth2Client.refreshAccessToken()
      newCreds = credentials
    } catch {
      return NextResponse.json(
        { error: 'Gmail token expired. Please reconnect.', connected: false },
        { status: 400 },
      )
    }
    oauth2Client.setCredentials(newCreds)

    const admin = createAdminClient()
    await admin.from('user_gmail_tokens').update({
      access_token: encryptToken(newCreds.access_token ?? ''),
      expires_at: newCreds.expiry_date
        ? new Date(newCreds.expiry_date).toISOString()
        : new Date(Date.now() + 3_600_000).toISOString(),
    }).eq('user_id', user.id)
  } else {
    oauth2Client.setCredentials({
      access_token: decryptToken(tokenRow.access_token),
      refresh_token: decryptedRefresh,
      expiry_date: expiresAt,
    })
  }

  // Load published tools for fuzzy matching
  const { data: allTools } = await supabase
    .from('tools')
    .select('id, name, slug, logo_url')
    .eq('status', 'published')

  const toolsBySlug = new Map((allTools ?? []).map(t => [t.slug, t]))

  function resolveBySlug(slug: string) {
    return slug ? (toolsBySlug.get(slug) ?? null) : null
  }

  function fuzzyMatchTool(sender: string, subject: string) {
    if (!allTools) return null
    const haystack = `${sender} ${subject}`.toLowerCase()
    for (const tool of allTools) {
      const name = tool.name.toLowerCase()
      if (name.length >= 3 && haystack.includes(name)) return tool
    }
    return null
  }

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client })

  let messageIds: string[] = []
  try {
    const listRes = await gmail.users.messages.list({
      userId: 'me',
      q: GMAIL_QUERY,
      maxResults: 100,
    })
    messageIds = (listRes.data.messages ?? []).map(m => m.id!).filter(Boolean)
  } catch {
    return NextResponse.json(
      { error: 'Failed to read Gmail. Please reconnect.' },
      { status: 500 },
    )
  }

  if (messageIds.length === 0) {
    return NextResponse.json({ detected: [], connected: true })
  }

  const detected: DetectedSubscription[] = []
  const seen = new Set<string>()

  await Promise.allSettled(
    messageIds.map(async (id) => {
      try {
        const msgRes = await gmail.users.messages.get({
          userId: 'me',
          id,
          format: 'metadata',
          metadataHeaders: ['From', 'Subject'],
        })
        const headers = msgRes.data.payload?.headers ?? []
        const from = headers.find(h => h.name === 'From')?.value ?? ''
        const subject = headers.find(h => h.name === 'Subject')?.value ?? ''
        const snippet = msgRes.data.snippet ?? ''

        const sender = extractEmailAddress(from)
        const amount = extractAmount(`${snippet} ${subject}`)
        if (!amount) return

        const exactSlug = SENDER_TO_SLUG[sender]
        const tool = resolveBySlug(exactSlug ?? '') ?? fuzzyMatchTool(sender, subject)

        const dedupeKey = `${tool?.id ?? sender}::${amount}`
        if (seen.has(dedupeKey)) return
        seen.add(dedupeKey)

        detected.push({
          tool_id: tool?.id ?? null,
          tool_name: tool?.name ?? (sender.split('@')[1]?.split('.')[0] ?? sender),
          tool_slug: tool?.slug ?? null,
          logo_url: tool?.logo_url ?? null,
          amount,
          email_subject: subject,
          email_from: from,
        })
      } catch { /* skip individual message errors */ }
    }),
  )

  // Matched tools first, then by amount descending
  detected.sort((a, b) => {
    if (a.tool_id && !b.tool_id) return -1
    if (!a.tool_id && b.tool_id) return 1
    return b.amount - a.amount
  })

  return NextResponse.json({ detected, connected: true })
}
