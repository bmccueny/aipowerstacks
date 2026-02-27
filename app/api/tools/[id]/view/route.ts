import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const admin = createAdminClient()
  await admin.rpc('increment_view_count' as never, { tool_id: id } as never)
  return NextResponse.json({ success: true })
}
