import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = { title: 'Manage Categories' }

export default async function AdminCategoriesPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('categories')
    .select('id, name, slug, icon, tool_count, sort_order')
    .order('sort_order', { ascending: true })

  const categories = (data ?? []) as { id: string; name: string; slug: string; icon: string | null; tool_count: number; sort_order: number }[]

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Categories ({categories.length})</h1>

      <div className="glass-card rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left p-3 font-medium text-muted-foreground w-8">#</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Icon</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Name</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Slug</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Tools</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={cat.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                <td className="p-3 text-muted-foreground">{cat.sort_order}</td>
                <td className="p-3 text-xl">{cat.icon}</td>
                <td className="p-3 font-medium">{cat.name}</td>
                <td className="p-3 text-muted-foreground">{cat.slug}</td>
                <td className="p-3">
                  <Badge variant="outline" className="text-xs">{cat.tool_count}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
