import { createClient } from '@/lib/supabase/server'
import { getAllCategories } from '@/lib/supabase/queries/categories'
import { ToolForm } from '@/components/admin/ToolForm'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Edit Tool' }

export default async function EditToolPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data } = await supabase
    .from('tools')
    .select('id, name, slug, tagline, description, website_url, logo_url, category_id, pricing_model, pricing_details, status, is_verified, is_featured, is_supertools, is_editors_pick')
    .eq('id', id)
    .single()

  if (!data) notFound()
  const tool = data as {
    id: string; name: string; slug: string; tagline: string; description: string
    website_url: string; logo_url: string | null; category_id: string
    pricing_model: string; pricing_details: string | null; status: string
    is_verified: boolean; is_featured: boolean; is_supertools: boolean; is_editors_pick: boolean
  }

  const categories = await getAllCategories()

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Edit Tool</h1>
      <ToolForm tool={tool} categories={categories.map((c) => ({ id: c.id, name: c.name }))} />
    </div>
  )
}
