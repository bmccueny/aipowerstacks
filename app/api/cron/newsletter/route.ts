import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'

/* ── Config ──────────────────────────────────────────────────────────────────── */

const XAI_BASE_URL = 'https://api.x.ai/v1'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://aipowerstacks.com'
const PRIMARY_COLOR = '#d03050' // Brand crimson

/* ── Types ───────────────────────────────────────────────────────────────────── */

interface BlogRow {
  title: string
  slug: string
  excerpt: string | null
  cover_image_url: string | null
}

interface NewsRow {
  title: string
  url: string
  summary: string | null
  source_name: string | null
}

/* ── Grok AI news summary ────────────────────────────────────────────────────── */

async function generateNewsSummary(
  news: NewsRow[],
  posts: BlogRow[],
): Promise<string> {
  const apiKey = process.env.XAI_API_KEY
  if (!apiKey) return 'Here is your weekly roundup of what happened in AI.'

  const newsItems = news.map((n) => `- ${n.title} (${n.source_name ?? 'unknown'})`).join('\n')
  const postTitles = posts.map((p) => `- ${p.title}`).join('\n')

  const prompt = `You are writing the main body of a weekly AI newsletter for AIPowerStacks, an AI tools directory.

Here are the top AI news stories from this week:
${newsItems || '(no news items available)'}

Here are blog posts published this week on AIPowerStacks:
${postTitles || '(no blog posts this week)'}

Write a 3-4 paragraph summary of what happened in AI this week. Cover the most important developments. Be conversational, insightful, and opinionated. Write like a smart friend catching someone up over coffee.

Rules:
- No em dashes, en dashes, or semicolons
- Do not use "exciting", "game-changing", "revolutionary", or "groundbreaking"
- Do not use bullet points or numbered lists
- Write in flowing paragraphs
- Keep it under 250 words
- End with a forward-looking sentence about what to watch next week`

  try {
    const res = await fetch(`${XAI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-3-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0.8,
      }),
    })
    const data = await res.json()
    return data.choices?.[0]?.message?.content?.trim() || 'Here is your weekly roundup of what happened in AI.'
  } catch {
    return 'Here is your weekly roundup of what happened in AI.'
  }
}

/* ── HTML email template ─────────────────────────────────────────────────────── */

function buildEmailHtml(
  summary: string,
  posts: BlogRow[],
  unsubUrl: string,
): string {
  // Convert newlines in summary to paragraphs
  const summaryHtml = summary
    .split(/\n\n+/)
    .filter(Boolean)
    .map((p) => `<p style="font-size: 15px; line-height: 1.7; color: #333; margin: 0 0 16px 0;">${p.trim()}</p>`)
    .join('')

  const postsHtml = posts.length > 0
    ? posts.map((p) => `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
            <a href="${APP_URL}/blog/${p.slug}" style="color: ${PRIMARY_COLOR}; font-weight: 700; font-size: 15px; text-decoration: none;">${p.title}</a>
            ${p.excerpt ? `<div style="color: #666; font-size: 13px; margin-top: 4px; line-height: 1.5;">${p.excerpt.slice(0, 120)}${p.excerpt.length > 120 ? '...' : ''}</div>` : ''}
          </td>
        </tr>`).join('')
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" style="background: #f5f5f5; padding: 20px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" style="max-width: 600px; width: 100%; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">

        <!-- Header -->
        <tr><td style="background: #0d0d0d; padding: 28px 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 22px; font-weight: 900; letter-spacing: -0.5px;">
            <span style="color: #ffffff;">AI</span><span style="color: ${PRIMARY_COLOR};">PowerStacks</span>
          </h1>
          <div style="color: #888; font-size: 12px; margin-top: 6px; text-transform: uppercase; letter-spacing: 2px;">Weekly Briefing</div>
        </td></tr>

        <!-- AI News Summary -->
        <tr><td style="padding: 30px 30px 20px;">
          <h2 style="font-size: 18px; font-weight: 800; color: #1a1a1a; margin: 0 0 16px 0; text-transform: uppercase; letter-spacing: 0.5px;">This Week in AI</h2>
          ${summaryHtml}
        </td></tr>

        <!-- Blog Posts -->
        ${posts.length > 0 ? `
        <tr><td style="padding: 0 30px 10px;">
          <h2 style="font-size: 18px; font-weight: 800; color: #1a1a1a; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 0.5px;">From the Blog</h2>
        </td></tr>
        <tr><td style="padding: 0 30px 20px;">
          <table role="presentation" width="100%">${postsHtml}</table>
        </td></tr>` : ''}

        <!-- CTA -->
        <tr><td style="padding: 10px 30px 30px; text-align: center;">
          <a href="${APP_URL}" style="display: inline-block; background: ${PRIMARY_COLOR}; color: #fff; padding: 12px 28px; border-radius: 6px; font-size: 14px; font-weight: 700; text-decoration: none;">Explore AIPowerStacks &rarr;</a>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding: 24px 30px; border-top: 1px solid #eee; background: #fafafa;">
          <table role="presentation" width="100%">
            <tr>
              <td style="color: #999; font-size: 12px; line-height: 1.6;">
                Sent by <a href="${APP_URL}" style="color: ${PRIMARY_COLOR}; text-decoration: none; font-weight: 600;">AIPowerStacks</a><br>
                You received this because you subscribed to our newsletter.<br>
                <a href="${unsubUrl}" style="color: #999; text-decoration: underline;">Unsubscribe</a>
              </td>
            </tr>
          </table>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

/* ── Main handler ────────────────────────────────────────────────────────────── */

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const resendKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'newsletter@aipowerstacks.com'
  if (!resendKey) {
    return NextResponse.json({ error: 'RESEND_API_KEY not set' }, { status: 500 })
  }

  const resend = new Resend(resendKey)
  const supabase = createAdminClient()

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  // Fetch this week's content in parallel
  const [newsRes, postsRes, subscribersRes] = await Promise.all([
    // Latest AI news from the past week
    supabase
      .from('ai_news')
      .select('title, url, summary, source_name')
      .gte('published_at', oneWeekAgo)
      .order('published_at', { ascending: false })
      .limit(15),
    // Latest blog posts from the past week
    supabase
      .from('blog_posts')
      .select('title, slug, excerpt, cover_image_url')
      .eq('status', 'published')
      .gte('published_at', oneWeekAgo)
      .order('published_at', { ascending: false })
      .limit(3),
    // All active subscribers
    supabase
      .from('newsletter_subscribers')
      .select('email')
      .eq('status', 'active'),
  ])

  const news = (newsRes.data ?? []) as NewsRow[]
  const posts = (postsRes.data ?? []) as BlogRow[]
  const subscribers = subscribersRes.data ?? []

  if (subscribers.length === 0) {
    return NextResponse.json({ message: 'No active subscribers', sent: 0 })
  }

  // Generate AI-written news summary
  const summary = await generateNewsSummary(news, posts)

  // Build subject line
  const today = new Date()
  const monthDay = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const subject = `AI Weekly: What happened in AI this week (${monthDay})`

  // Send emails in batches of 50
  const BATCH_SIZE = 50
  let sent = 0
  let errors = 0

  for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
    const batch = subscribers.slice(i, i + BATCH_SIZE)

    const sendResults = await Promise.allSettled(
      batch.map((sub) => {
        const unsubUrl = `${APP_URL}/api/newsletter/unsubscribe?email=${encodeURIComponent(sub.email)}`
        const html = buildEmailHtml(summary, posts, unsubUrl)
        return resend.emails.send({
          from: `AIPowerStacks <${fromEmail}>`,
          to: sub.email,
          subject,
          html,
        })
      }),
    )

    for (const result of sendResults) {
      if (result.status === 'fulfilled' && !result.value.error) {
        sent++
      } else {
        errors++
      }
    }
  }

  return NextResponse.json({
    message: 'Newsletter sent',
    subject,
    subscribers: subscribers.length,
    sent,
    errors,
    newsItems: news.length,
    posts: posts.length,
  })
}
