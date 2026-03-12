import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const email = url.searchParams.get('email')

  if (!email) {
    return new NextResponse(html('Missing email parameter.', false), {
      status: 400,
      headers: { 'Content-Type': 'text/html' },
    })
  }

  const supabase = createAdminClient()

  const { error } = await supabase
    .from('newsletter_subscribers')
    .update({ status: 'unsubscribed', unsubscribed_at: new Date().toISOString() })
    .eq('email', email)

  if (error) {
    return new NextResponse(html('Something went wrong. Please try again later.', false), {
      status: 500,
      headers: { 'Content-Type': 'text/html' },
    })
  }

  return new NextResponse(html('You have been unsubscribed. You will no longer receive emails from AIPowerStacks.', true), {
    status: 200,
    headers: { 'Content-Type': 'text/html' },
  })
}

function html(message: string, success: boolean) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://aipowerstacks.com'
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Unsubscribe</title></head>
<body style="margin: 0; padding: 40px 20px; background: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; text-align: center;">
  <div style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
    <h1 style="font-size: 20px; font-weight: 800; color: #1a1a1a; margin: 0 0 12px;">${success ? 'Unsubscribed' : 'Error'}</h1>
    <p style="font-size: 15px; color: #666; line-height: 1.6; margin: 0 0 20px;">${message}</p>
    <a href="${appUrl}" style="color: #d03050; font-weight: 600; text-decoration: none; font-size: 14px;">Back to AIPowerStacks &rarr;</a>
  </div>
</body>
</html>`
}
