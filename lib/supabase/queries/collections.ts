import { createClient } from '../server'
import type { Collection, ToolCardData } from '@/lib/types'

/**
 * Fetch all collections for a user
 */
export async function getUserCollections(userId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('collections')
    .select(`
      *,
      items:collection_items(count)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data.map(c => ({
    ...c,
    itemCount: c.items?.[0]?.count ?? 0
  }))
}

/**
 * Create a new collection
 */
export async function createCollection(userId: string, name: string, description?: string, isPublic = false) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('collections')
    .insert({
      user_id: userId,
      name,
      description,
      is_public: isPublic
    })
    .select()
    .single()

  if (error) throw error
  return data as Collection
}

/**
 * Add a tool to a collection
 */
export async function addToolToCollection(collectionId: string, toolId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('collection_items')
    .insert({
      collection_id: collectionId,
      tool_id: toolId
    })

  if (error) throw error
  return true
}

/**
 * Remove a tool from a collection
 */
export async function removeToolFromCollection(collectionId: string, toolId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('collection_items')
    .delete()
    .eq('collection_id', collectionId)
    .eq('tool_id', toolId)

  if (error) throw error
  return true
}

/**
 * Fetch a public collection by share slug
 */
export async function getCollectionBySlug(slug: string) {
  const supabase = await createClient()
  const { data: collection, error } = await supabase
    .from('collections')
    .select(`
      *,
      profiles:user_id (display_name, avatar_url, username)
    `)
    .eq('share_slug', slug)
    .single()

  if (error) return null

  // If private, only owner can see (handled by RLS if user is logged in)
  // But for this public query, we check if it's public
  if (!collection.is_public) {
     // Check if current user is owner
     const { data: { user } } = await supabase.auth.getUser()
     if (user?.id !== collection.user_id) return null
  }

  const { data: items } = await supabase
    .from('collection_items')
    .select(`
      tool_id,
      tools:tool_id (*)
    `)
    .eq('collection_id', collection.id)
    .order('sort_order', { ascending: true })

  return {
    ...collection,
    tools: (items?.map(i => i.tools) ?? []) as any[]
  }
}
