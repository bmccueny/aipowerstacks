import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { UserRole } from '@/lib/types'

/**
 * Check if the current user has the given role.
 * Shared across all admin API routes to avoid duplicating the isAdmin check.
 */
export async function requireRole(role: UserRole = 'admin') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { supabase, user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const userRole = (data as { role: string } | null)?.role
  const allowed = role === 'admin' ? userRole === 'admin'
    : role === 'editor' ? userRole === 'admin' || userRole === 'editor'
    : true

  if (!allowed) {
    return { supabase, user, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }

  return { supabase, user, error: null }
}
