import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const schema = z.object({
  email: z.string().email(),
  source: z.string().max(50).optional(),
})

export async function POST(request: Request) {
  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Valid email required' }, { status: 400 })

  const { email, source } = parsed.data
  const supabase = await createClient()
  const { error } = await supabase
    .from('newsletter_subscribers')
    .insert({ email, source: source ?? null })

  if (error) {
    if (error.code === '23505') return NextResponse.json({ success: true })
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // Send welcome email immediately
  if (process.env.RESEND_API_KEY) {
    try {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)
      const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'newsletter@aipowerstacks.com'
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://aipowerstacks.com'

      await resend.emails.send({
        from: `AIPowerStacks <${fromEmail}>`,
        to: email,
        subject: "You're on the list. Here's what to expect.",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background: #0a0a0f; color: #f2f2f7;">
            <h1 style="font-size: 22px; font-weight: 800; margin: 0 0 16px; color: #f2f2f7;">Welcome to The AI Stack Report</h1>
            <p style="font-size: 15px; line-height: 1.6; color: #a1a1aa; margin: 0 0 20px;">Every Friday, you'll get:</p>
            <ul style="font-size: 15px; line-height: 1.8; color: #a1a1aa; margin: 0 0 24px; padding-left: 20px;">
              <li>AI tool pricing changes that affect your wallet</li>
              <li>New tools worth trying (and old ones worth dropping)</li>
              <li>Data on what smart teams are actually using</li>
            </ul>
            <p style="font-size: 15px; line-height: 1.6; color: #a1a1aa; margin: 0 0 24px;">While you wait, try the free AI Spend Tracker — most people find $40-80/mo in wasted subscriptions.</p>
            <a href="${appUrl}/tracker" style="display: inline-block; background: #d03050; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 15px;">Track My AI Spend →</a>
            <p style="font-size: 13px; color: #52525b; margin-top: 32px; border-top: 1px solid #27272a; padding-top: 16px;">You signed up at aipowerstacks.com. <a href="${appUrl}/api/newsletter/unsubscribe?token=PLACEHOLDER" style="color: #52525b;">Unsubscribe</a></p>
          </div>
        `,
      })
    } catch {
      // Welcome email is best-effort — don't fail the signup
    }
  }

  return NextResponse.json({ success: true })
}
