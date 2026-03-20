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

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: post } = await supabase
    .from('blog_posts')
    .select('cover_image_url')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  const coverUrl = post?.cover_image_url
    ? (post.cover_image_url.startsWith('http') ? post.cover_image_url : `${SITE_URL}${post.cover_image_url}`)
    : null

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: '#0a0a0f',
        }}
      >
        {coverUrl ? (
          <img
            src={coverUrl}
            alt=""
            width={1200}
            height={630}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 48,
              fontWeight: 900,
              color: 'white',
            }}
          >
            AIPowerStacks
          </div>
        )}
      </div>
    ),
    { ...size }
  )
}
