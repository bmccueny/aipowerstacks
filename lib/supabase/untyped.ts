import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Access tables not yet in database.ts without `as any`.
 * Cast the result (not the client) per CLAUDE.md conventions.
 *
 * Usage:
 *   const { data } = await fromTable(supabase, 'stack_snapshots')
 *     .select('user_id, total_monthly')
 *     .eq('snapshot_date', date) as { data: MyType[] | null }
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function fromTable(supabase: SupabaseClient<any>, table: string) {
  return supabase.from(table)
}
