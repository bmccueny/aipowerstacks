import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    return NextResponse.json({ error: 'Resend not configured' }, { status: 500 })
  }

  const supabase = createAdminClient()
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  const [toolsCount, newTools, reviewsCount, newReviews, subscribersCount] = await Promise.all([
    supabase.from('tools').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('tools').select('id', { count: 'exact', head: true }).gte('created_at', today).eq('status', 'published'),
    supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('is_approved', true),
    supabase.from('reviews').select('id', { count: 'exact', head: true }).gte('created_at', today).eq('is_approved', true),
    supabase.from('newsletter_subscribers').select('id', { count: 'exact', head: true }).eq('subscribed', true),
  ])

  const stats = {
    totalTools: toolsCount.count || 0,
    newToolsToday: newTools.count || 0,
    totalReviews: reviewsCount.count || 0,
    newReviewsToday: newReviews.count || 0,
    totalSubscribers: subscribersCount.count || 0,
    date: today
  }

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; }
    .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
    .stat-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
    .stat-value { font-size: 32px; font-weight: bold; color: #f43f5e; }
    .stat-label { font-size: 14px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
    .footer { text-align: center; margin-top: 20px; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 24px;">AIPowerStacks Daily</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.8;">${today}</p>
    </div>
    
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">${stats.totalTools}</div>
        <div class="stat-label">Total Tools</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">+${stats.newToolsToday}</div>
        <div class="stat-label">New Today</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${stats.totalReviews}</div>
        <div class="stat-label">Total Reviews</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">+${stats.newReviewsToday}</div>
        <div class="stat-label">Reviews Today</div>
      </div>
    </div>
    
    <div class="stat-card" style="margin-top: 15px;">
      <div class="stat-value">${stats.totalSubscribers}</div>
      <div class="stat-label">Newsletter Subscribers</div>
    </div>
    
    <div class="footer">
      <p>Sent by AIPowerStacks Cron</p>
    </div>
  </div>
</body>
</html>
`

  const { Resend } = require('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: 'bmccueny@gmail.com',
      subject: `AIPowerStacks Stats - ${today}`,
      html: emailHtml
    })

    return NextResponse.json({ success: true, stats })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to send email', details: error }, { status: 500 })
  }
}
