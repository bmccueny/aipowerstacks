import { createClient } from '@/lib/supabase/server'
import type { Review } from '@/lib/types'

export async function getReviewsByTool(toolId: string, currentUserId?: string): Promise<(Review & { profiles: { display_name: string | null; avatar_url: string | null; role: string | null } })[]> {
  const supabase = await createClient()

  let query = supabase
    .from('reviews')
    .select('*')
    .eq('tool_id', toolId)

  if (currentUserId) {
    query = query.or(`status.eq.published,user_id.eq.${currentUserId}`)
  } else {
    query = query.eq('status', 'published')
  }

  const { data, error } = await query
    .order('helpful_count', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(20)

  if (error || !data) return []

  const reviews = data as Review[]
  const userIds = [...new Set(reviews.map((r) => r.user_id))]
  if (userIds.length === 0) {
    return reviews.map((r) => ({ ...r, profiles: { display_name: null, avatar_url: null, role: null } }))
  }

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url, username, role')
    .in('id', userIds)

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, {
    display_name: p.display_name,
    avatar_url: p.avatar_url,
    username: p.username,
    role: p.role,
  }]))

  return reviews.map((review) => ({
    ...review,
    profiles: profileMap.get(review.user_id) ?? { display_name: null, avatar_url: null, role: null },
  }))
}
