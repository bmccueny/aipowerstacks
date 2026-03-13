import { ImageResponse } from 'next/og'
import { createClient } from '@supabase/supabase-js'

export const alt = 'Blog Post Preview'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'
export const dynamic = 'force-dynamic'

async function getBlogPostBySlug(slug: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )

  const { data: post } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (!post) return null

  // Fetch author
  const { data: author } = await supabase
    .from('profiles')
    .select('display_name, username, avatar_url')
    .eq('id', post.author_id)
    .single()

  return { ...post, author: author || null }
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getBlogPostBySlug(slug)

  if (!post) {
    return new ImageResponse(
      (
        <div
          style={{
            fontSize: 48,
            background: 'black',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
          }}
        >
          AIPowerStacks
        </div>
      ),
      { ...size }
    )
  }

  const tag = post.tags?.[0] ?? 'AI Briefing'
  const authorName = post.author?.display_name ?? 'AIPowerStacks Team'
  const date = post.published_at
    ? new Date(post.published_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : ''

  return new ImageResponse(
    (
      <div
        style={{
          background: '#0a0a0f',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'sans-serif',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Accent gradient */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '6px',
            background: 'linear-gradient(90deg, #f97316, #ef4444, #8b5cf6, #3b82f6)',
          }}
        />

        {/* Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '100%',
            padding: '60px 70px 50px',
          }}
        >
          {/* Top: tag + date */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                background: '#f97316',
                color: '#000',
                fontSize: 18,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                padding: '6px 18px',
                borderRadius: '999px',
              }}
            >
              {tag}
            </div>
            {date && (
              <div style={{ fontSize: 20, color: '#888', fontWeight: 600 }}>
                {date}
              </div>
            )}
          </div>

          {/* Middle: title */}
          <div
            style={{
              fontSize: post.title.length > 60 ? 52 : 62,
              fontWeight: 900,
              lineHeight: 1.15,
              letterSpacing: '-0.03em',
              maxWidth: '90%',
              display: 'flex',
            }}
          >
            {post.title}
          </div>

          {/* Bottom: author + branding */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: '#f97316',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                  fontWeight: 800,
                  color: '#000',
                }}
              >
                {authorName[0]}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div style={{ fontSize: 22, fontWeight: 700 }}>{authorName}</div>
                <div style={{ fontSize: 16, color: '#666' }}>AIPowerStacks</div>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: '#f97316',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    width: '20px',
                    height: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '3px',
                  }}
                >
                  <div style={{ width: '100%', height: '3px', background: '#000', borderRadius: '2px' }} />
                  <div style={{ width: '70%', height: '3px', background: '#000', borderRadius: '2px' }} />
                  <div style={{ width: '45%', height: '3px', background: '#000', borderRadius: '2px' }} />
                </div>
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#999' }}>
                aipowerstacks.com
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
