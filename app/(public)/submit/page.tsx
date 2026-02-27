import { getAllCategories } from '@/lib/supabase/queries/categories'
import { SubmitToolForm } from '@/components/tools/SubmitToolForm'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Submit an AI Tool' }

export default async function SubmitPage() {
  const categories = await getAllCategories()
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Submit an AI Tool</h1>
      <p className="text-muted-foreground mb-8">
        Know a great AI tool that&apos;s not listed? Submit it for review and we&apos;ll add it to the directory.
      </p>
      <SubmitToolForm categories={categories.map((c) => ({ id: c.id, name: c.name }))} />
    </div>
  )
}
