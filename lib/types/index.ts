export type { Database } from './database'

import type { Database } from './database'

type Tables = Database['public']['Tables']

export type Profile = Tables['profiles']['Row']
export type Category = Tables['categories']['Row']
export type Tag = Tables['tags']['Row']
export type Tool = Tables['tools']['Row']
export type Review = Tables['reviews']['Row']
export type Bookmark = Tables['bookmarks']['Row']
export type ToolSubmission = Tables['tool_submissions']['Row']
export type BlogCategory = Tables['blog_categories']['Row']
export type BlogPost = Tables['blog_posts']['Row']
export type AINews = Tables['ai_news']['Row']
export type NewsletterSubscriber = Tables['newsletter_subscribers']['Row']
export type Collection = Tables['collections']['Row']
export type CollectionItem = Tables['collection_items']['Row']

export type ToolSearchResult = Database['public']['Functions']['search_tools']['Returns'][number] & {
  pricing_tags?: string[] | null
  pricing_details?: string | null
  model_provider?: string | null
  is_api_wrapper?: boolean
}

export type ToolCardData = ToolSearchResult & { 
  screenshot_urls?: string[] | null
  pricing_tags?: string[] | null
  pricing_details?: string | null
  model_provider?: string | null
  is_api_wrapper?: boolean
}

export type PricingModel = 'free' | 'freemium' | 'paid' | 'trial' | 'contact' | 'unknown'
export type SortOption = 'relevance' | 'newest' | 'rating' | 'popular'
export type ToolStatus = 'pending' | 'published' | 'rejected' | 'archived'
export type UserRole = 'user' | 'editor' | 'admin'

export type ToolWithCategory = Tool & {
  categories: Pick<Category, 'id' | 'name' | 'slug' | 'icon' | 'color'>
}

export type ToolWithTags = ToolWithCategory & {
  tool_tags: { tags: Pick<Tag, 'id' | 'name' | 'slug'> }[]
  verified_by_admin?: boolean
  api_latency?: number | null
  api_uptime?: number | null
  admin_review_video_url?: string | null
  admin_review_notes?: string | null
  pros?: string[] | null
  cons?: string[] | null
  pricing_tags?: string[] | null
  pricing_details?: string | null
}

export type BlogPostWithAuthor = BlogPost & {
  profiles: Pick<Profile, 'id' | 'display_name' | 'avatar_url' | 'username'>
  blog_categories: Pick<BlogCategory, 'id' | 'name' | 'slug'> | null
}

/** Profile fields selected in stack page collection query */
export type CollectionCreatorProfile = Pick<Profile, 'display_name' | 'avatar_url' | 'username'>

/** Source collection joined in stack page query */
export type CollectionSource = {
  id: string
  name: string
  share_slug: string
  profiles: Pick<Profile, 'username' | 'display_name'> | null
}

/** Full collection row with joined profiles and source for the stack page */
export type CollectionWithJoins = Collection & {
  profiles: CollectionCreatorProfile | null
  source: CollectionSource | null
}

/** Tool category fields selected in the collection_items join */
export type StackToolCategory = Pick<Category, 'name' | 'slug' | 'icon' | 'color'>

/** Tool fields selected in the collection_items join */
export type StackTool = Pick<Tool,
  'id' | 'name' | 'slug' | 'tagline' | 'description' | 'website_url' | 'logo_url' |
  'pricing_model' | 'avg_rating' | 'review_count' | 'upvote_count' |
  'is_verified' | 'has_api' | 'is_open_source' | 'use_cases'
> & {
  categories: StackToolCategory | null
}

/** StackTool with curator note attached from collection_items */
export type StackToolWithNote = StackTool & {
  _note: string | null
}
