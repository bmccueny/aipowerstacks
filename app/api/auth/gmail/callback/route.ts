import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { encryptToken } from '@/lib/gmail-crypto'

function buildOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/gmail/callback`,
  )
}

/** GET /api/auth/gmail/callback — Google redirects here after user grants consent */
export async function GET(request: Request) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(`${appUrl}/tracker?gmail=error`)
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(`${appUrl}/tracker?gmail=error`)
  }

  let tokens
  try {
    const oauth2Client = buildOAuthClient()
    const { tokens: exchanged } = await oauth2Client.getToken(code)
    tokens = exchanged
  } catch {
    return NextResponse.redirect(`${appUrl}/tracker?gmail=error`)
  }

  if (!tokens.access_token || !tokens.refresh_token) {
    // refresh_token is only returned on first consent — user must re-authorize if missing
    return NextResponse.redirect(`${appUrl}/tracker?gmail=error`)
  }

  const expiresAt = tokens.expiry_date
    ? new Date(tokens.expiry_date).toISOString()
    : new Date(Date.now() + 3600_000).toISOString()

  // Use admin client so the upsert bypasses RLS (the user cookie may not be
  // available in the same request that Google redirected to)
  const admin = createAdminClient()
  const { error: upsertError } = await admin.from('user_gmail_tokens').upsert(
    {
      user_id: user.id,
      access_token: encryptToken(tokens.access_token),
      refresh_token: encryptToken(tokens.refresh_token),
      expires_at: expiresAt,
      connected_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  )

  if (upsertError) {
    return NextResponse.redirect(`${appUrl}/tracker?gmail=error`)
  }

  return NextResponse.redirect(`${appUrl}/tracker?gmail=connected`)
}
