import { createClient } from '@/lib/supabase/server'
import type { Category } from '@/lib/types'

export async function getAllCategories(): Promise<Category[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .gt('tool_count', 0)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  if (error) return []
  return data ?? []
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) return null
  return data
}
