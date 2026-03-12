import Link from 'next/link'
import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CategoryManager } from '@/components/admin/CategoryManager'
import { SubmissionActions } from '@/components/admin/SubmissionActions'
import { UserRoleActions } from '@/components/admin/UserRoleActions'
import { ExternalLink, Plus } from 'lucide-react'

export const metadata: Metadata = { title: 'Control Center' }

export default async function AdminControlCenterPage() {
  const supabase = createAdminClient()

  const [toolsRes, submissionsRes, usersRes, categoriesRes] = await Promise.all([
    supabase
      .from('tools')
      .select('id, name, slug, status, pricing_model, review_count, avg_rating, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(15),
    supabase
      .from('tool_submissions')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(15),
    supabase
      .from('profiles')
      .select('id, display_name, username, role, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(30),
    supabase
      .from('categories')
      .select('id, name, slug, icon, description, color, tool_count, sort_order', { count: 'exact' })
      .order('sort_order', { ascending: true }),
  ])

  const tools = (toolsRes.data ?? []) as {
    id: string
    name: string
    slug: string
    status: string
    pricing_model: string
    review_count: number
    avg_rating: number
    created_at: string
  }[]

  const submissions = (submissionsRes.data ?? []) as {
    id: string
    name: string
    website_url: string
    tagline: string
    description: string
    pricing_model: string | null
    status: string
    submitter_email: string | null
    created_at: string
    notes: string | null
    category_id: string | null
  }[]

  const users = (usersRes.data ?? []) as {
    id: string
    display_name: string | null
    username: string | null
    role: 'user' | 'editor' | 'admin'
    created_at: string
  }[]

  const categories = (categoriesRes.data ?? []) as {
    id: string
    name: string
    slug: string
    icon: string | null
    description: string | null
    color: string | null
    tool_count: number
    sort_order: number
  }[]

  const statusColors: Record<string, string> = {
    published: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
    archived: 'bg-white/10 text-muted-foreground border-white/20',
    approved: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    draft: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  }

  const roleColors: Record<string, string> = {
    admin: 'bg-red-500/20 text-red-400 border-red-500/30',
    editor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    user: 'bg-white/10 text-muted-foreground border-white/20',
  }

  const pendingSubmissions = submissions.filter((s) => s.status === 'pending').length

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold">Control Center</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage tools, submissions, users, and categories in one place.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/tools/new">
            <Button size="sm"><Plus className="h-4 w-4 mr-1.5" /> Add Tool</Button>
          </Link>
          <Link href="/admin/blog/new">
            <Button size="sm" variant="outline">New Blog Post</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-card/50 border border-border/50 rounded-lg p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Total Tools</p>
          <p className="text-2xl font-semibold">{toolsRes.count ?? 0}</p>
        </div>
        <div className="bg-card/50 border border-border/50 rounded-lg p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Pending Submissions</p>
          <p className="text-2xl font-semibold">{pendingSubmissions}</p>
        </div>
        <div className="bg-card/50 border border-border/50 rounded-lg p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Users</p>
          <p className="text-2xl font-semibold">{usersRes.count ?? 0}</p>
        </div>
        <div className="bg-card/50 border border-border/50 rounded-lg p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Categories</p>
          <p className="text-2xl font-semibold">{categoriesRes.count ?? 0}</p>
        </div>
      </div>

      <div className="grid xl:grid-cols-2 gap-6">
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Recent Tools</h2>
            <Link href="/admin/tools" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          <div className="bg-card/50 border border-border/50 rounded-lg overflow-x-auto">
            <table className="w-full text-sm min-w-[500px]">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Tool</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Reviews</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {tools.map((tool) => (
                  <tr key={tool.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium">{tool.name}</p>
                      <p className="text-xs text-muted-foreground">{tool.pricing_model}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={`text-xs ${statusColors[tool.status] ?? ''}`}>{tool.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{tool.review_count} ({tool.avg_rating.toFixed(1)}★)</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Link href={`/admin/tools/${tool.id}`}>
                          <Button size="sm" variant="ghost">Edit</Button>
                        </Link>
                        <Link href={`/tools/${tool.slug}`} target="_blank">
                          <Button size="sm" variant="ghost"><ExternalLink className="h-3.5 w-3.5" /></Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {tools.length === 0 && <div className="p-6 text-center text-sm text-muted-foreground">No tools yet.</div>}
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Recent Submissions</h2>
            <Link href="/admin/submissions" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          <div className="space-y-3 max-h-[520px] overflow-auto pr-1">
            {submissions.map((sub) => (
              <div key={sub.id} className="bg-card/50 border border-border/50 rounded-lg p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold">{sub.name}</h3>
                      <Badge variant="outline" className={`text-xs ${statusColors[sub.status] ?? ''}`}>{sub.status}</Badge>
                    </div>
                    <a
                      href={sub.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline block truncate mb-1"
                    >
                      {sub.website_url}
                    </a>
                    <p className="text-sm text-muted-foreground line-clamp-2">{sub.tagline}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {sub.submitter_email && <span className="mr-3">From: {sub.submitter_email}</span>}
                      {new Date(sub.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {sub.status === 'pending' && (
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
                  )}
                </div>
              </div>
            ))}
            {submissions.length === 0 && (
              <div className="bg-card/50 border border-border/50 rounded-lg p-6 text-center text-sm text-muted-foreground">No submissions yet.</div>
            )}
          </div>
        </section>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">User Roles</h2>
          <Link href="/admin/users" className="text-xs text-primary hover:underline">View users page</Link>
        </div>
        <div className="bg-card/50 border border-border/50 rounded-lg overflow-x-auto">
          <table className="w-full text-sm min-w-[650px]">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Username</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Role</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Change Role</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3 font-medium">{user.display_name ?? 'Anonymous'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{user.username ?? '—'}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={`text-xs ${roleColors[user.role] ?? ''}`}>{user.role}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <UserRoleActions userId={user.id} currentRole={user.role} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{new Date(user.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && <div className="p-6 text-center text-sm text-muted-foreground">No users yet.</div>}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Categories</h2>
          <Link href="/admin/categories" className="text-xs text-primary hover:underline">View categories page</Link>
        </div>
        <CategoryManager initialCategories={categories} />
      </section>
    </div>
  )
}
