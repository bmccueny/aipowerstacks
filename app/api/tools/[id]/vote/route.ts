import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'

const paramsSchema = z.object({
  id: z.string().uuid(),
})

const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const parsedParams = paramsSchema.safeParse(await params)
  if (!parsedParams.success) {
    return NextResponse.json({ error: 'Invalid tool id' }, { status: 400 })
  }

  const { id } = parsedParams.data
  const admin = createAdminClient()

  const { data: tool, error: toolError } = await admin
    .from('tools')
    .select('id')
    .eq('id', id)
    .eq('status', 'published')
    .maybeSingle()

  if (toolError || !tool) {
    return NextResponse.json({ error: 'Tool not found' }, { status: 404 })
  }

  const reqCookie = request.headers.get('cookie') ?? ''
  const visitorCookie = reqCookie
    .split(';')
    .map((s) => s.trim())
    .find((s) => s.startsWith('visitor_id='))
  const existingVisitorId = visitorCookie?.split('=')[1]
  const visitorId = existingVisitorId ? decodeURIComponent(existingVisitorId) : crypto.randomUUID()
  const isNewVisitor = !existingVisitorId

  const { error: voteError } = await admin
    .from('tool_votes')
    .insert({ tool_id: id, visitor_id: visitorId })

  if (voteError && voteError.code !== '23505') {
    return NextResponse.json({ error: voteError.message }, { status: 400 })
  }

  const { count } = await admin
    .from('tool_votes')
    .select('id', { count: 'exact', head: true })
    .eq('tool_id', id)

  const upvoteCount = count ?? 0

  await admin
    .from('tools')
    .update({ upvote_count: upvoteCount, updated_at: new Date().toISOString() })
    .eq('id', id)

  const response = NextResponse.json({
    upvoteCount,
    voted: true,
    alreadyVoted: voteError?.code === '23505',
  })

  if (isNewVisitor) {
    response.cookies.set('visitor_id', visitorId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: ONE_YEAR_IN_SECONDS,
      path: '/',
    })
  }

  return response
}
