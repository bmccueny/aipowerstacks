import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/supabase/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: targetUserId } = await params
  const { user, error: authError } = await requireRole('admin')
  if (authError) return authError

  if (targetUserId === user!.id) {
    return NextResponse.json({ error: 'You cannot delete your own account from the admin panel' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { error: authDeleteError } = await admin.auth.admin.deleteUser(targetUserId)
  if (authDeleteError) {
    return NextResponse.json({ error: `Auth deletion failed: ${authDeleteError.message}` }, { status: 400 })
  }

  // Profile cleanup — may already be gone via cascade/trigger
  const { error: profileError } = await admin
    .from('profiles')
    .delete()
    .eq('id', targetUserId)

  if (profileError) {
    console.warn('Profile deletion after auth delete (may already be cascaded):', profileError.message)
  }

  return NextResponse.json({ success: true })
}
