import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function isAdmin(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase.from('profiles').select('role').eq('id', userId).single()
  return (data as { role: string } | null)?.role === 'admin'
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: targetUserId } = await params
  const supabase = await createClient()
  const { data: { user: currentUser } } = await supabase.auth.getUser()

  if (!currentUser || !await isAdmin(supabase, currentUser.id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (targetUserId === currentUser.id) {
    return NextResponse.json({ error: 'You cannot delete your own account from the admin panel' }, { status: 400 })
  }

  const admin = createAdminClient()

  // 1. Delete from Supabase Auth (This will trigger profile deletion if CASCADE is set, 
  // but we usually delete profiles explicitly or have triggers)
  const { error: authError } = await admin.auth.admin.deleteUser(targetUserId)

  if (authError) {
    return NextResponse.json({ error: `Auth deletion failed: ${authError.message}` }, { status: 400 })
  }

  // 2. Explicitly delete from profiles if not already gone via cascade/trigger
  const { error: profileError } = await admin
    .from('profiles')
    .delete()
    .eq('id', targetUserId)

  if (profileError) {
    console.error('Profile deletion error (might already be deleted):', profileError.message)
  }

  return NextResponse.json({ success: true })
}
