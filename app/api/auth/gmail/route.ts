import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import { createClient } from '@/lib/supabase/server'

function buildOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/gmail/callback`,
  )
}

/** GET /api/auth/gmail
 *  - Without ?connect=1  → returns { connected: boolean }
 *  - With    ?connect=1  → redirects to Google OAuth consent screen
 */
export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)

  if (searchParams.get('connect') === '1') {
    const oauth2Client = buildOAuthClient()
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: ['https://www.googleapis.com/auth/gmail.readonly'],
    })
    return NextResponse.redirect(url)
  }

  // Status check — does the user have a stored token?
  const { data } = await supabase
    .from('user_gmail_tokens')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  return NextResponse.json({ connected: data != null })
}

/** DELETE /api/auth/gmail — disconnect Gmail */
export async function DELETE() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await supabase.from('user_gmail_tokens').delete().eq('user_id', user.id)
  return NextResponse.json({ ok: true })
}
