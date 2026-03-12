import { createAdminClient } from '@/lib/supabase/admin'
import type { Metadata } from 'next'
import { CategoryManager } from '@/components/admin/CategoryManager'

export const metadata: Metadata = { title: 'Manage Categories' }

export default async function AdminCategoriesPage() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('categories')
    .select('id, name, slug, icon, description, color, tool_count, sort_order')
    .order('sort_order', { ascending: true })

  const categories = (data ?? []) as {
    id: string
    name: string
    slug: string
    icon: string | null
    description: string | null
    color: string | null
    tool_count: number
    sort_order: number
  }[]

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Categories ({categories.length})</h1>
      <CategoryManager initialCategories={categories} />
    </div>
  )
}
