import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const ADMIN_EMAIL = 'bmccueny@gmail.com'

export async function POST(req: NextRequest) {
  try {
    const { email, goal } = await req.json()
    
    if (!email || !goal) {
      return NextResponse.json({ error: 'Email and Goal are required' }, { status: 400 })
    }

    // 1. Save to Supabase
    const supabase = await createClient()
    const { error: dbError } = await supabase
      .from('blueprint_requests')
      .insert({ email, goal })

    if (dbError) throw dbError

    // 2. Send to Admin via Resend if API key exists
    if (resend) {
      try {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'blueprints@aipowerstacks.com',
          to: ADMIN_EMAIL,
          subject: `New Blueprint Request from ${email}`,
          html: `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
              <h2 style="color: #000;">New Blueprint Request</h2>
              <p><strong>User Email:</strong> ${email}</p>
              <p><strong>Goal / Requirements:</strong></p>
              <div style="background: #f9f9f9; padding: 15px; border-radius: 4px; border-left: 4px solid #000;">
                ${goal.replace(/\n/g, '<br/>')}
              </div>
              <hr style="margin: 20px 0; border: 0; border-top: 1px solid #eee;" />
              <p style="font-size: 12px; color: #666;">This request was saved in the database.</p>
            </div>
          `
        })
      } catch (emailErr) {
        console.error('Failed to send admin email:', emailErr)
        // We don't fail the whole request if just the email fails, since DB saved it.
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Blueprint Request Error:', err)
    return NextResponse.json({ error: 'Failed to save request' }, { status: 500 })
  }
}
