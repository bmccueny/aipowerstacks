import { createClient } from '@/lib/supabase/server'
import type { Review } from '@/lib/types'

export async function getReviewsByTool(toolId: string): Promise<(Review & { profiles: { display_name: string | null; avatar_url: string | null } })[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('reviews')
    .select(`
      *,
      profiles (display_name, avatar_url)
    `)
    .eq('tool_id', toolId)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) return []
  return data as never
}
