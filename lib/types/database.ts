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
          monthly_budget: number | null
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
          monthly_budget?: number | null
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
          monthly_budget?: number | null
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
          use_case: string | null
          team_size: string | null
          integrations: string[] | null
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
          upvote_count: number
          view_count: number
          bookmark_count: number
          published_at: string | null
          has_api: boolean
          has_mobile_app: boolean
          is_open_source: boolean
          pricing_type: string | null
          trains_on_data: boolean
          has_sso: boolean
          security_certifications: string[] | null
          model_provider: string | null
          target_audience: string | null
          api_latency: number | null
          api_uptime: number | null
          last_benchmarked_at: string | null
          is_api_wrapper: boolean
          wrapper_details: string | null
          verified_by_admin: boolean
          admin_review_video_url: string | null
          admin_review_notes: string | null
          admin_review_at: string | null
          deployment_type: 'cloud' | 'self-hosted' | 'both' | null
          time_to_value: 'instant' | 'minutes' | 'hours' | 'days' | 'weeks' | null
          not_for: string | null
          needs_review: boolean
          needs_review_reason: string | null
          affiliate_url: string | null
          affiliate_commission_pct: number | null
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
          use_case?: string | null
          team_size?: string | null
          integrations?: string[] | null
          is_verified?: boolean
          is_featured?: boolean
          is_supertools?: boolean
          is_editors_pick?: boolean
          status?: 'pending' | 'published' | 'rejected' | 'archived'
          submitted_by?: string | null
          approved_by?: string | null
          approved_at?: string | null
          published_at?: string | null
          upvote_count?: number
          has_api?: boolean
          has_mobile_app?: boolean
          is_open_source?: boolean
          pricing_type?: string | null
          trains_on_data?: boolean
          has_sso?: boolean
          security_certifications?: string[] | null
          model_provider?: string | null
          target_audience?: string | null
          api_latency?: number | null
          api_uptime?: number | null
          last_benchmarked_at?: string | null
          is_api_wrapper?: boolean
          wrapper_details?: string | null
          verified_by_admin?: boolean
          admin_review_video_url?: string | null
          admin_review_notes?: string | null
          admin_review_at?: string | null
          deployment_type?: 'cloud' | 'self-hosted' | 'both' | null
          time_to_value?: 'instant' | 'minutes' | 'hours' | 'days' | 'weeks' | null
          not_for?: string | null
          needs_review?: boolean
          needs_review_reason?: string | null
          affiliate_url?: string | null
          affiliate_commission_pct?: number | null
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
          use_case?: string | null
          team_size?: string | null
          integrations?: string[] | null
          is_verified?: boolean
          is_featured?: boolean
          is_supertools?: boolean
          is_editors_pick?: boolean
          status?: 'pending' | 'published' | 'rejected' | 'archived'
          approved_by?: string | null
          approved_at?: string | null
          published_at?: string | null
          upvote_count?: number
          has_api?: boolean
          has_mobile_app?: boolean
          is_open_source?: boolean
          pricing_type?: string | null
          trains_on_data?: boolean
          has_sso?: boolean
          security_certifications?: string[] | null
          model_provider?: string | null
          target_audience?: string | null
          api_latency?: number | null
          api_uptime?: number | null
          last_benchmarked_at?: string | null
          is_api_wrapper?: boolean
          wrapper_details?: string | null
          verified_by_admin?: boolean
          admin_review_video_url?: string | null
          admin_review_notes?: string | null
          admin_review_at?: string | null
          deployment_type?: 'cloud' | 'self-hosted' | 'both' | null
          time_to_value?: 'instant' | 'minutes' | 'hours' | 'days' | 'weeks' | null
          not_for?: string | null
          needs_review?: boolean
          needs_review_reason?: string | null
          affiliate_url?: string | null
          affiliate_commission_pct?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      affiliate_clicks: {
        Row: {
          id: string
          tool_id: string | null
          user_id: string | null
          page: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tool_id?: string | null
          user_id?: string | null
          page?: string | null
          created_at?: string
        }
        Update: Record<string, never>
        Relationships: []
      }
      tool_benchmarks: {
        Row: {
          id: string
          tool_id: string
          latency: number
          is_up: boolean
          created_at: string
        }
        Insert: {
          id?: string
          tool_id: string
          latency: number
          is_up: boolean
          created_at?: string
        }
        Update: {
          latency?: number
          is_up?: boolean
        }
        Relationships: []
      }
      tool_tags: {
        Row: { tool_id: string; tag_id: string }
        Insert: { tool_id: string; tag_id: string }
        Update: { tool_id?: string; tag_id?: string }
        Relationships: []
      }
      tool_votes: {
        Row: {
          id: string
          tool_id: string
          visitor_id: string
          created_at: string
        }
        Insert: {
          id?: string
          tool_id: string
          visitor_id: string
          created_at?: string
        }
        Update: Record<string, never>
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
          status: 'draft' | 'pending' | 'published'
          moderated_by: string | null
          moderated_at: string | null
          rejection_reason: string | null
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
          status?: 'draft' | 'pending' | 'published'
          moderated_by?: string | null
          moderated_at?: string | null
          rejection_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          rating?: number
          title?: string | null
          body?: string | null
          helpful_count?: number
          status?: 'draft' | 'pending' | 'published'
          moderated_by?: string | null
          moderated_at?: string | null
          rejection_reason?: string | null
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
          model_provider: string | null
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
          model_provider?: string | null
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
      ai_news: {
        Row: {
          id: string
          guid: string
          title: string
          url: string
          summary: string | null
          source_name: string
          source_url: string | null
          image_url: string | null
          published_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          guid: string
          title: string
          url: string
          summary?: string | null
          source_name?: string
          source_url?: string | null
          image_url?: string | null
          published_at: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          guid?: string
          title?: string
          url?: string
          summary?: string | null
          source_name?: string
          source_url?: string | null
          image_url?: string | null
          published_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      social_posts: {
        Row: {
          id: string
          platform: string
          post_type: string
          content: string
          hashtags: string[] | null
          link_url: string | null
          link_title: string | null
          source_type: string | null
          source_id: string | null
          status: 'draft' | 'approved' | 'posted' | 'skipped'
          scheduled_for: string | null
          posted_at: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          platform: string
          post_type: string
          content: string
          hashtags?: string[] | null
          link_url?: string | null
          link_title?: string | null
          source_type?: string | null
          source_id?: string | null
          status?: 'draft' | 'approved' | 'posted' | 'skipped'
          scheduled_for?: string | null
          posted_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          platform?: string
          post_type?: string
          content?: string
          hashtags?: string[] | null
          link_url?: string | null
          link_title?: string | null
          source_type?: string | null
          source_id?: string | null
          status?: 'draft' | 'approved' | 'posted' | 'skipped'
          scheduled_for?: string | null
          posted_at?: string | null
          notes?: string | null
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
      collections: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          is_public: boolean
          share_slug: string
          icon: string | null
          save_count: number
          view_count: number
          source_collection_id: string | null
          template_id: string | null
          featured_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          is_public?: boolean
          share_slug?: string
          icon?: string | null
          save_count?: number
          view_count?: number
          source_collection_id?: string | null
          template_id?: string | null
          featured_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          description?: string | null
          is_public?: boolean
          share_slug?: string
          icon?: string | null
          save_count?: number
          view_count?: number
          source_collection_id?: string | null
          template_id?: string | null
          featured_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "collections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      collection_items: {
        Row: {
          collection_id: string
          tool_id: string
          sort_order: number
          note: string | null
          created_at: string
        }
        Insert: {
          collection_id: string
          tool_id: string
          sort_order?: number
          note?: string | null
          created_at?: string
        }
        Update: {
          collection_id?: string
          tool_id?: string
          sort_order?: number
          note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collection_items_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_items_tool_id_fkey"
            columns: ["tool_id"]
            isOneToOne: false
            referencedRelation: "tools"
            referencedColumns: ["id"]
          }
        ]
      }
      blueprint_requests: {
        Row: {
          id: string
          email: string
          goal: string
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          goal: string
          created_at?: string
        }
        Update: {
          email?: string
          goal?: string
        }
        Relationships: []
      }
      profile_follows: {
        Row: {
          follower_id: string
          following_id: string
          created_at: string
        }
        Insert: {
          follower_id: string
          following_id: string
          created_at?: string
        }
        Update: {
          follower_id?: string
          following_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      stack_challenges: {
        Row: {
          id: string
          title: string
          description: string | null
          prompt: string
          starts_at: string
          ends_at: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          prompt: string
          starts_at: string
          ends_at: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          title?: string
          description?: string | null
          prompt?: string
          starts_at?: string
          ends_at?: string
          is_active?: boolean
        }
        Relationships: []
      }
      challenge_submissions: {
        Row: {
          id: string
          challenge_id: string
          collection_id: string
          user_id: string
          vote_count: number
          submitted_at: string
        }
        Insert: {
          id?: string
          challenge_id: string
          collection_id: string
          user_id: string
          vote_count?: number
          submitted_at?: string
        }
        Update: {
          vote_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "challenge_submissions_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "stack_challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_submissions_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      challenge_votes: {
        Row: {
          challenge_id: string
          collection_id: string
          user_id: string
          voted_at: string
        }
        Insert: {
          challenge_id: string
          collection_id: string
          user_id: string
          voted_at?: string
        }
        Update: {
          collection_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_votes_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "stack_challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_votes_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      direct_messages: {
        Row: {
          id: string
          sender_id: string
          receiver_id: string
          content: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          sender_id: string
          receiver_id: string
          content: string
          is_read?: boolean
          created_at?: string
        }
        Update: {
          content?: string
          is_read?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "direct_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      user_subscriptions: {
        Row: {
          id: string
          user_id: string
          tool_id: string
          monthly_cost: number
          billing_cycle: string | null
          use_tags: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tool_id: string
          monthly_cost: number
          billing_cycle?: string | null
          use_tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          monthly_cost?: number
          billing_cycle?: string | null
          use_tags?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      tool_pricing_tiers: {
        Row: {
          id: string
          tool_id: string
          tier_name: string
          monthly_price: number
          annual_price: number | null
          features: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tool_id: string
          tier_name: string
          monthly_price: number
          annual_price?: number | null
          features?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          tier_name?: string
          monthly_price?: number
          annual_price?: number | null
          features?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      usage_checkins: {
        Row: {
          id: string
          user_id: string
          tool_id: string
          week_start: string
          used: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tool_id: string
          week_start: string
          used: boolean
          created_at?: string
        }
        Update: {
          used?: boolean
        }
        Relationships: []
      }
      tool_switches: {
        Row: {
          id: string
          from_tool_id: string
          to_tool_id: string
          user_id: string
          reason: string | null
          satisfaction: number | null
          created_at: string
        }
        Insert: {
          id?: string
          from_tool_id: string
          to_tool_id: string
          user_id: string
          reason?: string | null
          satisfaction?: number | null
          created_at?: string
        }
        Update: {
          reason?: string | null
          satisfaction?: number | null
        }
        Relationships: []
      }
      tool_changelog: {
        Row: {
          id: string
          tool_id: string
          event_type: string
          title: string
          summary: string | null
          source_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tool_id: string
          event_type: string
          title: string
          summary?: string | null
          source_url?: string | null
          created_at?: string
        }
        Update: {
          event_type?: string
          title?: string
          summary?: string | null
          source_url?: string | null
        }
        Relationships: []
      }
      cost_snapshots: {
        Row: {
          id: string
          user_id: string
          month: string
          total_monthly: number
          tool_count: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          month: string
          total_monthly: number
          tool_count: number
          created_at?: string
        }
        Update: {
          total_monthly?: number
          tool_count?: number
        }
        Relationships: []
      }
      shared_stacks: {
        Row: {
          id: string
          user_id: string
          display_name: string | null
          snapshot: Record<string, unknown>
          total_monthly: number
          tool_count: number
          grade: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          user_id: string
          display_name?: string | null
          snapshot: Record<string, unknown>
          total_monthly?: number
          tool_count?: number
          grade?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          display_name?: string | null
          snapshot?: Record<string, unknown>
          total_monthly?: number
          tool_count?: number
          grade?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_gmail_tokens: {
        Row: {
          user_id: string
          access_token: string
          refresh_token: string
          expires_at: string
          connected_at: string
        }
        Insert: {
          user_id: string
          access_token: string
          refresh_token: string
          expires_at: string
          connected_at?: string
        }
        Update: {
          access_token?: string
          refresh_token?: string
          expires_at?: string
        }
        Relationships: []
      }
      gmail_import_logs: {
        Row: {
          id: string
          user_id: string
          tool_id: string | null
          email_subject: string | null
          email_from: string | null
          amount_detected: number | null
          imported_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tool_id?: string | null
          email_subject?: string | null
          email_from?: string | null
          amount_detected?: number | null
          imported_at?: string
        }
        Update: {
          tool_id?: string | null
          email_subject?: string | null
          email_from?: string | null
          amount_detected?: number | null
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
          p_use_case?: string
          p_team_size?: string
          p_integration?: string
          p_sort?: string
          p_limit?: number
          p_offset?: number
        }
        Returns: {
          id: string
          name: string
          slug: string
          tagline: string
          website_url: string
          logo_url: string | null
          pricing_model: string
          is_verified: boolean
          is_featured: boolean
          avg_rating: number
          review_count: number
          upvote_count: number
          category_id: string
          use_case: string | null
          team_size: string | null
          integrations: string[] | null
          has_api: boolean
          has_mobile_app: boolean
          is_open_source: boolean
          has_cloud_sync: boolean
          api_latency: number | null
          api_uptime: number | null
          verified_by_admin: boolean
          admin_review_video_url: string | null
          published_at: string | null
          model_provider: string | null
          is_api_wrapper: boolean
          rank: number
        }[]
      }
      increment_view_count: {
        Args: { tool_id: string }
        Returns: void
      }
      get_tool_uptime: {
        Args: { p_tool_id: string }
        Returns: number
      }
      match_tools_semantic: {
        Args: {
          query_embedding: number[]
          match_threshold?: number
          match_count?: number
        }
        Returns: {
          id: string
          name: string
          slug: string
          tagline: string
          logo_url: string | null
          pricing_model: string
          is_verified: boolean
          avg_rating: number
          review_count: number
          upvote_count: number
          category_id: string
          similarity: number
        }[]
      }
      is_admin: {
        Args: Record<string, never>
        Returns: boolean
      }
      increment_save_count: {
        Args: { collection_id: string }
        Returns: void
      }
      increment_stack_view: {
        Args: { collection_id: string }
        Returns: void
      }
      get_tool_price_trend: {
        Args: { p_tool_id: string; p_days?: number }
        Returns: {
          current_price: number
          previous_price: number
          percent_change: number
        }[]
      }
    }
  }
}
