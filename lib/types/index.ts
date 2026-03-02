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
}

export type ToolCardData = ToolSearchResult & { 
  screenshot_urls?: string[] | null
  pricing_tags?: string[] | null
  pricing_details?: string | null
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
}

export type BlogPostWithAuthor = BlogPost & {
  profiles: Pick<Profile, 'id' | 'display_name' | 'avatar_url' | 'username'>
  blog_categories: Pick<BlogCategory, 'id' | 'name' | 'slug'> | null
}
