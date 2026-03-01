import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus, ExternalLink } from 'lucide-react'
import { DeleteToolButton } from '@/components/admin/DeleteToolButton'

export const metadata: Metadata = { title: 'Manage Tools' }

export default async function AdminToolsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>
}) {
  const { page: pageStr, status } = await searchParams
  const page = Math.max(1, parseInt(pageStr ?? '1'))
  const limit = 25
  const offset = (page - 1) * limit

  const supabase = await createClient()
  let query = supabase
    .from('tools')
    .select('id, name, slug, status, pricing_model, review_count, avg_rating, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status) query = query.eq('status', status as 'published' | 'pending' | 'rejected' | 'archived')

  const { data, count } = await query
  const tools = (data ?? []) as { id: string; name: string; slug: string; status: string; pricing_model: string; review_count: number; avg_rating: number; created_at: string }[]
  const totalPages = Math.ceil((count ?? 0) / limit)

  const statusColors: Record<string, string> = {
    published: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
    archived: 'bg-white/10 text-muted-foreground border-white/20',
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Tools ({count ?? 0})</h1>
        <Link href="/admin/tools/new">
          <Button size="sm"><Plus className="h-4 w-4 mr-1.5" /> Add Tool</Button>
        </Link>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {(['', 'published', 'pending', 'rejected', 'archived'] as const).map((s) => (
          <Link
            key={s || 'all'}
            href={`/admin/tools${s ? `?status=${s}` : ''}`}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              (status ?? '') === s
                ? 'bg-primary text-white'
                : 'glass-card text-muted-foreground hover:text-foreground'
            }`}
          >
            {s || 'All'}
          </Link>
        ))}
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left p-3 font-medium text-muted-foreground">Name</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Pricing</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Reviews</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {tools.map((tool) => (
              <tr key={tool.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                <td className="p-3 font-medium">{tool.name}</td>
                <td className="p-3">
                  <Badge variant="outline" className={`text-xs ${statusColors[tool.status] ?? ''}`}>{tool.status}</Badge>
                </td>
                <td className="p-3 text-muted-foreground">{tool.pricing_model}</td>
                <td className="p-3 text-muted-foreground">{tool.review_count} ({tool.avg_rating.toFixed(1)}★)</td>
                <td className="p-3">
                  <div className="flex items-center gap-2 justify-end">
                    <Link href={`/admin/tools/${tool.id}`}>
                      <Button variant="ghost" size="sm" className="h-8">Edit</Button>
                    </Link>
                    <Link href={`/tools/${tool.slug}`} target="_blank">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><ExternalLink className="h-3.5 w-3.5" /></Button>
                    </Link>
                    <DeleteToolButton toolId={tool.id} toolName={tool.name} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {tools.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">No tools found.</div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {page > 1 && (
            <Link href={`/admin/tools?page=${page - 1}${status ? `&status=${status}` : ''}`}>
              <Button variant="outline" size="sm">Previous</Button>
            </Link>
          )}
          <span className="flex items-center text-sm text-muted-foreground px-3">Page {page} of {totalPages}</span>
          {page < totalPages && (
            <Link href={`/admin/tools?page=${page + 1}${status ? `&status=${status}` : ''}`}>
              <Button variant="outline" size="sm">Next</Button>
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
