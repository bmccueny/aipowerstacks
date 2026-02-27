import { getAllCategories } from '@/lib/supabase/queries/categories'
import { ToolForm } from '@/components/admin/ToolForm'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Add Tool' }

export default async function NewToolPage() {
  const categories = await getAllCategories()
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Add Tool</h1>
      <ToolForm categories={categories.map((c) => ({ id: c.id, name: c.name }))} />
    </div>
  )
}
