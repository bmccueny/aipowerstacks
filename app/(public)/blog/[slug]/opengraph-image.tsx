import { ImageResponse } from 'next/og'
import { createClient } from '@supabase/supabase-js'
import { SITE_URL } from '@/lib/constants/site'

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

  const { data: author } = await supabase
    .from('profiles')
    .select('display_name, username, avatar_url')
    .eq('id', post.author_id)
    .single()

  return { ...post, author: author || null }
}

function resolveImageUrl(url: string | null): string | null {
  if (!url) return null
  if (url.startsWith('http')) return url
  return `${SITE_URL}${url}`
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

  const coverUrl = resolveImageUrl(post.cover_image_url)
  const tag = post.tags?.[0] ?? 'AI Briefing'
  const authorName = post.author?.display_name ?? 'AIPowerStacks Team'

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: 'sans-serif',
          color: 'white',
        }}
      >
        {/* Cover image as full background */}
        {coverUrl ? (
          <img
            src={coverUrl}
            alt=""
            width={1200}
            height={630}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: '#0a0a0f' }} />
        )}

        {/* Dark gradient overlay for text readability */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.2) 100%)',
            display: 'flex',
          }}
        />

        {/* Accent gradient bar at top */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '6px',
            background: 'linear-gradient(90deg, #f97316, #ef4444, #8b5cf6, #3b82f6)',
            display: 'flex',
          }}
        />

        {/* Content overlay */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            height: '100%',
            width: '100%',
            padding: '50px 60px',
          }}
        >
          {/* Tag */}
          <div style={{ display: 'flex', marginBottom: '16px' }}>
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
                display: 'flex',
              }}
            >
              {tag}
            </div>
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: post.title.length > 60 ? 46 : 56,
              fontWeight: 900,
              lineHeight: 1.15,
              letterSpacing: '-0.03em',
              maxWidth: '90%',
              display: 'flex',
              textShadow: '0 2px 20px rgba(0,0,0,0.8)',
              marginBottom: '20px',
            }}
          >
            {post.title}
          </div>

          {/* Author + branding row */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: '#f97316',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  fontWeight: 800,
                  color: '#000',
                }}
              >
                {authorName[0]}
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, display: 'flex' }}>
                {authorName}
              </div>
            </div>

            <div style={{ fontSize: 20, fontWeight: 700, color: 'rgba(255,255,255,0.7)', display: 'flex' }}>
              aipowerstacks.com
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
