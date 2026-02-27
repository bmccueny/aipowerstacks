export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          display_name: string | null
          avatar_url: string | null
          bio: string | null
          website: string | null
          role: 'user' | 'editor' | 'admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          website?: string | null
          role?: 'user' | 'editor' | 'admin'
          created_at?: string
          updated_at?: string
        }
        Update: {
          username?: string | null
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          website?: string | null
          role?: 'user' | 'editor' | 'admin'
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          icon: string | null
          color: string | null
          tool_count: number
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          icon?: string | null
          color?: string | null
          tool_count?: number
          sort_order?: number
          created_at?: string
        }
        Update: {
          name?: string
          slug?: string
          description?: string | null
          icon?: string | null
          color?: string | null
          tool_count?: number
          sort_order?: number
        }
        Relationships: []
      }
      tags: {
        Row: {
          id: string
          name: string
          slug: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          created_at?: string
        }
        Update: {
          name?: string
          slug?: string
        }
        Relationships: []
      }
      tools: {
        Row: {
          id: string
          name: string
          slug: string
          tagline: string
          description: string
          website_url: string
          logo_url: string | null
          screenshot_urls: Json
          category_id: string
          pricing_model: 'free' | 'freemium' | 'paid' | 'trial' | 'contact' | 'unknown'
          pricing_details: string | null
          use_cases: string[] | null
          is_verified: boolean
          is_featured: boolean
          is_supertools: boolean
          is_editors_pick: boolean
          status: 'pending' | 'published' | 'rejected' | 'archived'
          submitted_by: string | null
          approved_by: string | null
          approved_at: string | null
          avg_rating: number
          review_count: number
          view_count: number
          bookmark_count: number
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          tagline: string
          description: string
          website_url: string
          logo_url?: string | null
          screenshot_urls?: Json
          category_id: string
          pricing_model?: 'free' | 'freemium' | 'paid' | 'trial' | 'contact' | 'unknown'
          pricing_details?: string | null
          use_cases?: string[] | null
          is_verified?: boolean
          is_featured?: boolean
          is_supertools?: boolean
          is_editors_pick?: boolean
          status?: 'pending' | 'published' | 'rejected' | 'archived'
          submitted_by?: string | null
          approved_by?: string | null
          approved_at?: string | null
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          slug?: string
          tagline?: string
          description?: string
          website_url?: string
          logo_url?: string | null
          screenshot_urls?: Json
          category_id?: string
          pricing_model?: 'free' | 'freemium' | 'paid' | 'trial' | 'contact' | 'unknown'
          pricing_details?: string | null
          use_cases?: string[] | null
          is_verified?: boolean
          is_featured?: boolean
          is_supertools?: boolean
          is_editors_pick?: boolean
          status?: 'pending' | 'published' | 'rejected' | 'archived'
          approved_by?: string | null
          approved_at?: string | null
          published_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tool_tags: {
        Row: { tool_id: string; tag_id: string }
        Insert: { tool_id: string; tag_id: string }
        Update: { tool_id?: string; tag_id?: string }
        Relationships: []
      }
      reviews: {
        Row: {
          id: string
          tool_id: string
          user_id: string
          rating: number
          title: string | null
          body: string | null
          is_verified: boolean
          helpful_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tool_id: string
          user_id: string
          rating: number
          title?: string | null
          body?: string | null
          is_verified?: boolean
          helpful_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          rating?: number
          title?: string | null
          body?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      bookmarks: {
        Row: { user_id: string; tool_id: string; created_at: string }
        Insert: { user_id: string; tool_id: string; created_at?: string }
        Update: Record<string, never>
        Relationships: []
      }
      tool_submissions: {
        Row: {
          id: string
          submitted_by: string | null
          submitter_email: string | null
          name: string
          website_url: string
          tagline: string
          description: string
          category_id: string | null
          pricing_model: string | null
          logo_url: string | null
          notes: string | null
          status: 'pending' | 'approved' | 'rejected'
          reviewed_by: string | null
          reviewed_at: string | null
          rejection_reason: string | null
          converted_tool_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          submitted_by?: string | null
          submitter_email?: string | null
          name: string
          website_url: string
          tagline: string
          description: string
          category_id?: string | null
          pricing_model?: string | null
          logo_url?: string | null
          notes?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          created_at?: string
        }
        Update: {
          status?: 'pending' | 'approved' | 'rejected'
          reviewed_by?: string | null
          reviewed_at?: string | null
          rejection_reason?: string | null
          converted_tool_id?: string | null
        }
        Relationships: []
      }
      blog_categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          created_at?: string
        }
        Update: {
          name?: string
          slug?: string
          description?: string | null
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          id: string
          title: string
          slug: string
          excerpt: string
          content: string
          cover_image_url: string | null
          author_id: string
          category_id: string | null
          tags: string[]
          status: 'draft' | 'published' | 'archived'
          is_featured: boolean
          video_embed_url: string | null
          reading_time_min: number | null
          view_count: number
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          slug: string
          excerpt: string
          content: string
          cover_image_url?: string | null
          author_id: string
          category_id?: string | null
          tags?: string[]
          status?: 'draft' | 'published' | 'archived'
          is_featured?: boolean
          video_embed_url?: string | null
          reading_time_min?: number | null
          view_count?: number
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          slug?: string
          excerpt?: string
          content?: string
          cover_image_url?: string | null
          category_id?: string | null
          tags?: string[]
          status?: 'draft' | 'published' | 'archived'
          is_featured?: boolean
          video_embed_url?: string | null
          reading_time_min?: number | null
          published_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          id: string
          email: string
          status: 'active' | 'unsubscribed'
          source: string | null
          subscribed_at: string
          unsubscribed_at: string | null
        }
        Insert: {
          id?: string
          email: string
          status?: 'active' | 'unsubscribed'
          source?: string | null
          subscribed_at?: string
          unsubscribed_at?: string | null
        }
        Update: {
          status?: 'active' | 'unsubscribed'
          unsubscribed_at?: string | null
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      search_tools: {
        Args: {
          search_query?: string
          p_category?: string
          p_pricing?: string
          p_verified?: boolean
          p_sort?: string
          p_limit?: number
          p_offset?: number
        }
        Returns: {
          id: string
          name: string
          slug: string
          tagline: string
          logo_url: string | null
          pricing_model: string
          is_verified: boolean
          is_featured: boolean
          avg_rating: number
          review_count: number
          category_id: string
          published_at: string | null
          rank: number
        }[]
      }
      is_admin: {
        Args: Record<string, never>
        Returns: boolean
      }
    }
  }
}
