import Link from 'next/link'
import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CategoryManager } from '@/components/admin/CategoryManager'
import { SubmissionActions } from '@/components/admin/SubmissionActions'
import { UserRoleActions } from '@/components/admin/UserRoleActions'
import { ExternalLink, Plus, Wrench, Users, Inbox, Layers, TrendingUp, Star, Clock, ChevronRight } from 'lucide-react'

export const revalidate = 0

export const metadata: Metadata = { title: 'Control Center' }

export default async function AdminControlCenterPage() {
  const supabase = createAdminClient()

  const [toolsRes, submissionsRes, usersRes, categoriesRes, reviewsRes] = await Promise.all([
    supabase
      .from('tools')
      .select('id, name, slug, status, pricing_model, review_count, avg_rating, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('tool_submissions')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('profiles')
      .select('id, display_name, username, role, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('categories')
      .select('id, name, slug, icon, description, color, tool_count, sort_order', { count: 'exact' })
      .order('sort_order', { ascending: true }),
    supabase
      .from('reviews')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published'),
  ])

  const tools = (toolsRes.data ?? []) as {
    id: string; name: string; slug: string; status: string
    pricing_model: string; review_count: number; avg_rating: number; created_at: string
  }[]

  const submissions = (submissionsRes.data ?? []) as {
    id: string; name: string; website_url: string; tagline: string; description: string
    pricing_model: string | null; status: string; submitter_email: string | null
    created_at: string; notes: string | null; category_id: string | null
  }[]

  const users = (usersRes.data ?? []) as {
    id: string; display_name: string | null; username: string | null
    role: 'user' | 'editor' | 'admin'; created_at: string
  }[]

  const categories = (categoriesRes.data ?? []) as {
    id: string; name: string; slug: string; icon: string | null
    description: string | null; color: string | null; tool_count: number; sort_order: number
  }[]

  const pendingSubmissions = submissions.filter((s) => s.status === 'pending').length
  const publishedTools = tools.filter(t => t.status === 'published').length
  const totalTools = toolsRes.count ?? 0
  const totalUsers = usersRes.count ?? 0
  const totalReviews = reviewsRes.count ?? 0

  const statusPill: Record<string, string> = {
    published: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
    pending: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
    rejected: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400',
    archived: 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400',
    approved: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
    draft: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  }

  const rolePill: Record<string, string> = {
    admin: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400',
    editor: 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
    user: 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400',
  }

  function timeAgo(date: string) {
    const d = Date.now() - new Date(date).getTime()
    if (d < 3600000) return `${Math.floor(d / 60000)}m ago`
    if (d < 86400000) return `${Math.floor(d / 3600000)}h ago`
    if (d < 604800000) return `${Math.floor(d / 86400000)}d ago`
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="max-w-[1100px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-[19px] font-semibold tracking-[-0.01em]">Control Center</h1>
          <p className="text-[13px] text-muted-foreground">Overview of your platform</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/tools/new">
            <Button size="sm" className="h-8 text-xs gap-1.5 rounded-lg"><Plus className="h-3.5 w-3.5" /> Add Tool</Button>
          </Link>
          <Link href="/admin/blog/new">
            <Button size="sm" variant="outline" className="h-8 text-xs rounded-lg">New Post</Button>
          </Link>
        </div>
      </div>

      {/* KPI Grid — USAD style */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <Link href="/admin/tools" className="flex items-center gap-3 bg-card border border-border rounded-xl px-3 py-3 min-h-[72px] hover:bg-accent/40 transition-colors">
          <span className="h-11 w-11 rounded-full bg-primary text-white flex items-center justify-center shrink-0">
            <Wrench className="h-5 w-5" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] text-foreground truncate">Tools</p>
            <p className="text-[12px] text-muted-foreground">{publishedTools} published</p>
          </div>
          <span className="text-[20px] font-semibold tabular-nums">{totalTools}</span>
        </Link>

        <Link href="/admin/submissions" className="flex items-center gap-3 bg-card border border-border rounded-xl px-3 py-3 min-h-[72px] hover:bg-accent/40 transition-colors">
          <span className={`h-11 w-11 rounded-full flex items-center justify-center shrink-0 ${pendingSubmissions > 0 ? 'bg-amber-500 text-white' : 'bg-muted text-muted-foreground'}`}>
            <Inbox className="h-5 w-5" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] text-foreground truncate">Submissions</p>
            <p className="text-[12px] text-muted-foreground">{pendingSubmissions} pending</p>
          </div>
          <span className="text-[20px] font-semibold tabular-nums">{submissionsRes.count ?? 0}</span>
        </Link>

        <Link href="/admin/users" className="flex items-center gap-3 bg-card border border-border rounded-xl px-3 py-3 min-h-[72px] hover:bg-accent/40 transition-colors">
          <span className="h-11 w-11 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0">
            <Users className="h-5 w-5" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] text-foreground truncate">Users</p>
            <p className="text-[12px] text-muted-foreground">{totalReviews} reviews</p>
          </div>
          <span className="text-[20px] font-semibold tabular-nums">{totalUsers}</span>
        </Link>

        <Link href="/admin/categories" className="flex items-center gap-3 bg-card border border-border rounded-xl px-3 py-3 min-h-[72px] hover:bg-accent/40 transition-colors">
          <span className="h-11 w-11 rounded-full bg-violet-500 text-white flex items-center justify-center shrink-0">
            <Layers className="h-5 w-5" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] text-foreground truncate">Categories</p>
            <p className="text-[12px] text-muted-foreground">{categoriesRes.count ?? 0} total</p>
          </div>
          <span className="text-[20px] font-semibold tabular-nums">{categoriesRes.count ?? 0}</span>
        </Link>
      </div>

      {/* Two-column layout */}
      <div className="grid xl:grid-cols-2 gap-5">
        {/* Queue: Pending Submissions */}
        <section className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Needs Attention</h2>
            <Link href="/admin/submissions" className="text-[11px] font-medium text-primary flex items-center gap-0.5">
              All <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-border/60">
            {submissions.filter(s => s.status === 'pending').length === 0 && (
              <div className="px-4 py-10 text-center">
                <div className="inline-flex items-center justify-center h-11 w-11 rounded-full bg-emerald-500 text-white mb-2">
                  <Star className="h-5 w-5" />
                </div>
                <p className="text-[14px] text-foreground font-medium">All clear</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">No pending submissions</p>
              </div>
            )}
            {submissions.filter(s => s.status === 'pending').slice(0, 6).map(sub => (
              <div key={sub.id} className="flex items-center gap-3 px-4 min-h-[64px] py-2 hover:bg-accent/40 transition-colors">
                <span className="h-9 w-9 rounded-full bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center shrink-0">
                  <Inbox className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] text-foreground font-medium truncate">{sub.name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{sub.submitter_email ?? sub.website_url}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-muted-foreground">{timeAgo(sub.created_at)}</span>
                  <SubmissionActions
                    submissionId={sub.id}
                    submission={{
                      name: sub.name,
                      website_url: sub.website_url,
                      tagline: sub.tagline,
                      description: sub.description,
                      pricing_model: sub.pricing_model,
                      category_id: sub.category_id,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Tools — Row-based like USAD */}
        <section className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Recent Tools</h2>
            <Link href="/admin/tools" className="text-[11px] font-medium text-primary flex items-center gap-0.5">
              All <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-border/60">
            {tools.slice(0, 8).map(tool => (
              <Link
                key={tool.id}
                href={`/admin/tools/${tool.id}`}
                className="flex items-center gap-3 px-4 min-h-[56px] py-2 hover:bg-accent/40 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] text-foreground font-medium truncate">{tool.name}</p>
                  <p className="text-[11px] text-muted-foreground">{tool.pricing_model} · {tool.avg_rating > 0 ? `${tool.avg_rating.toFixed(1)}★` : 'No rating'}</p>
                </div>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusPill[tool.status] ?? ''}`}>
                  {tool.status}
                </span>
                <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo(tool.created_at)}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>

      {/* Users — compact rows */}
      <section className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Recent Users</h2>
          <Link href="/admin/users" className="text-[11px] font-medium text-primary flex items-center gap-0.5">
            All <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="divide-y divide-border/60">
          {users.slice(0, 10).map(user => (
            <div key={user.id} className="flex items-center gap-3 px-4 min-h-[48px] py-2 hover:bg-accent/40 transition-colors">
              <span className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-[11px] font-bold text-muted-foreground shrink-0">
                {(user.display_name ?? user.username ?? '?')[0].toUpperCase()}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-foreground truncate">{user.display_name ?? 'Anonymous'}</p>
                <p className="text-[11px] text-muted-foreground">{user.username ? `@${user.username}` : 'No username'}</p>
              </div>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${rolePill[user.role] ?? ''}`}>
                {user.role}
              </span>
              <UserRoleActions userId={user.id} currentRole={user.role} />
              <span className="text-[10px] text-muted-foreground shrink-0 hidden sm:inline">{timeAgo(user.created_at)}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Categories</h2>
          <Link href="/admin/categories" className="text-[11px] font-medium text-primary flex items-center gap-0.5">
            Manage <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        <CategoryManager initialCategories={categories} />
      </section>
    </div>
  )
}
