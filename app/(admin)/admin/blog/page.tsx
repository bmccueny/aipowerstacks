import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus, ExternalLink } from 'lucide-react'

export const metadata: Metadata = { title: 'Manage Blog' }

export default async function AdminBlogPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('blog_posts')
    .select('id, title, slug, status, is_featured, published_at, view_count')
    .order('created_at', { ascending: false })
    .limit(50)

  const posts = (data ?? []) as { id: string; title: string; slug: string; status: string; is_featured: boolean; published_at: string | null; view_count: number }[]

  const statusColors: Record<string, string> = {
    published: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    draft: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    archived: 'bg-white/10 text-muted-foreground border-white/20',
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <h1 className="text-2xl lg:text-3xl font-semibold">Blog Posts ({posts.length})</h1>
        <Link href="/admin/blog/new">
          <Button size="sm"><Plus className="h-4 w-4 mr-1.5" /> New Post</Button>
        </Link>
      </div>

      <div className="bg-card/50 border border-border/50 rounded-lg overflow-x-auto">
        <table className="w-full text-sm min-w-[550px]">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Title</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Published</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Views</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                <td className="px-4 py-3">
                  <span className="font-medium line-clamp-1">{post.title}</span>
                  {post.is_featured && <Badge variant="outline" className="ml-2 text-xs bg-primary/10 text-primary border-primary/30">Featured</Badge>}
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className={`text-xs ${statusColors[post.status] ?? ''}`}>{post.status}</Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                  {post.published_at ? new Date(post.published_at).toLocaleDateString() : '—'}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{post.view_count}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 justify-end">
                    <Link href={`/admin/blog/${post.id}`}>
                      <Button variant="ghost" size="sm">Edit</Button>
                    </Link>
                    {post.status === 'published' && (
                      <Link href={`/blog/${post.slug}`} target="_blank">
                        <Button variant="ghost" size="sm"><ExternalLink className="h-3.5 w-3.5" /></Button>
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {posts.length === 0 && (
          <div className="p-8 text-center text-sm text-muted-foreground">No posts yet. Create your first post!</div>
        )}
      </div>
    </div>
  )
}
