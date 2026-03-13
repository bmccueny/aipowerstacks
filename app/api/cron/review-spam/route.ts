import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { data: recentReviews } = await supabase
    .from('reviews')
    .select('id, body, created_at, status')
    .gte('created_at', oneDayAgo)
    .eq('status', 'published')

  if (!recentReviews?.length) {
    return NextResponse.json({ message: 'No recent reviews to check', checked: 0 })
  }

  const spamPatterns = [
    /check out my channel/i,
    /subscribe to my youtube/i,
    /free followers/i,
    /buy cheap/i,
    /click here for free/i,
    /dm me for/i,
    /\b(wow|amazing|awesome|best)\b.*\1/i,
  ]

  const flagged = []
  const approved = []

  for (const review of recentReviews) {
    let isSpam = false
    
    for (const pattern of spamPatterns) {
      if (pattern.test(review.body || '')) {
        isSpam = true
        break
      }
    }

    if (isSpam) {
      await supabase
        .from('reviews')
        .update({ 
          status: 'draft',
          rejection_reason: 'spam_detected'
        })
        .eq('id', review.id)
      
      flagged.push(review.id)
    } else {
      approved.push(review.id)
    }
  }

  return NextResponse.json({ 
    message: 'Review spam check completed',
    checked: recentReviews.length,
    flagged: flagged.length,
    approved: approved.length
  })
}
