'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type Category = {
  id: string
  name: string
  slug: string
  icon: string | null
  description: string | null
  color: string | null
  sort_order: number
  tool_count: number
}

interface CategoryManagerProps {
  initialCategories: Category[]
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function CategoryManager({ initialCategories }: CategoryManagerProps) {
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [createLoading, setCreateLoading] = useState(false)
  const [error, setError] = useState('')
  const [createForm, setCreateForm] = useState({
    name: '',
    slug: '',
    icon: '',
    color: '',
    sort_order: '0',
    description: '',
  })

  const sorted = useMemo(
    () => [...categories].sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name)),
    [categories]
  )
  const getErrorMessage = (value: unknown, fallback: string) => {
    if (typeof value === 'string') return value
    return fallback
  }

  const updateLocalCategory = (id: string, patch: Partial<Category>) => {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)))
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateLoading(true)
    setError('')

    const payload = {
      name: createForm.name.trim(),
      slug: createForm.slug.trim(),
      icon: createForm.icon.trim() || null,
      color: createForm.color.trim() || null,
      sort_order: Number(createForm.sort_order || '0'),
      description: createForm.description.trim() || null,
    }

    const res = await fetch('/api/admin/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(getErrorMessage(data.error, 'Failed to create category'))
      setCreateLoading(false)
      return
    }

    setCategories((prev) => [...prev, data.category as Category])
    setCreateForm({
      name: '',
      slug: '',
      icon: '',
      color: '',
      sort_order: '0',
      description: '',
    })
    setCreateLoading(false)
  }

  const handleSaveRow = async (category: Category) => {
    setLoadingId(category.id)
    setError('')

    const res = await fetch(`/api/admin/categories/${category.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: category.name.trim(),
        slug: category.slug.trim(),
        icon: category.icon?.trim() || null,
        color: category.color?.trim() || null,
        sort_order: Number(category.sort_order),
        description: category.description?.trim() || null,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(getErrorMessage(data.error, 'Failed to update category'))
      setLoadingId(null)
      return
    }

    updateLocalCategory(category.id, data.category as Category)
    setLoadingId(null)
  }

  const handleDelete = async (category: Category) => {
    if (!confirm(`Delete "${category.name}"? This only works if no tools are assigned.`)) return

    setDeletingId(category.id)
    setError('')
    const res = await fetch(`/api/admin/categories/${category.id}`, { method: 'DELETE' })
    const data = await res.json()

    if (!res.ok) {
      setError(getErrorMessage(data.error, 'Failed to delete category'))
      setDeletingId(null)
      return
    }

    setCategories((prev) => prev.filter((c) => c.id !== category.id))
    setDeletingId(null)
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleCreate} className="glass-card rounded-xl p-4 space-y-3">
        <h2 className="font-semibold">Create Category</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input
            value={createForm.name}
            onChange={(e) => {
              const name = e.target.value
              setCreateForm((prev) => ({
                ...prev,
                name,
                slug: prev.slug || slugify(name),
              }))
            }}
            placeholder="Name"
            required
            className="bg-white/5 border-white/10"
          />
          <Input
            value={createForm.slug}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, slug: e.target.value }))}
            placeholder="slug"
            required
            className="bg-white/5 border-white/10"
          />
          <Input
            value={createForm.sort_order}
            type="number"
            min={0}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, sort_order: e.target.value }))}
            placeholder="Sort order"
            className="bg-white/5 border-white/10"
          />
          <Input
            value={createForm.icon}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, icon: e.target.value }))}
            placeholder="Icon (optional)"
            className="bg-white/5 border-white/10"
          />
          <Input
            value={createForm.color}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, color: e.target.value }))}
            placeholder="Color (optional)"
            className="bg-white/5 border-white/10"
          />
          <Input
            value={createForm.description}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Description (optional)"
            className="bg-white/5 border-white/10"
          />
        </div>
        <Button type="submit" size="sm" disabled={createLoading}>
          {createLoading ? 'Creating...' : 'Create Category'}
        </Button>
      </form>

      <div className="glass-card rounded-xl overflow-x-auto">
        <table className="w-full text-sm min-w-[920px]">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left p-3 font-medium text-muted-foreground">Sort</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Icon</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Name</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Slug</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Color</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Description</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Tools</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((category) => (
              <tr key={category.id} className="border-b border-white/5">
                <td className="p-2">
                  <Input
                    type="number"
                    min={0}
                    value={String(category.sort_order)}
                    onChange={(e) => updateLocalCategory(category.id, { sort_order: Number(e.target.value || 0) })}
                    className="h-8 bg-white/5 border-white/10"
                  />
                </td>
                <td className="p-2">
                  <Input
                    value={category.icon ?? ''}
                    onChange={(e) => updateLocalCategory(category.id, { icon: e.target.value })}
                    className="h-8 bg-white/5 border-white/10"
                  />
                </td>
                <td className="p-2">
                  <Input
                    value={category.name}
                    onChange={(e) => updateLocalCategory(category.id, { name: e.target.value })}
                    className="h-8 bg-white/5 border-white/10"
                  />
                </td>
                <td className="p-2">
                  <Input
                    value={category.slug}
                    onChange={(e) => updateLocalCategory(category.id, { slug: e.target.value })}
                    className="h-8 bg-white/5 border-white/10"
                  />
                </td>
                <td className="p-2">
                  <Input
                    value={category.color ?? ''}
                    onChange={(e) => updateLocalCategory(category.id, { color: e.target.value })}
                    className="h-8 bg-white/5 border-white/10"
                  />
                </td>
                <td className="p-2">
                  <Input
                    value={category.description ?? ''}
                    onChange={(e) => updateLocalCategory(category.id, { description: e.target.value })}
                    className="h-8 bg-white/5 border-white/10"
                  />
                </td>
                <td className="p-3 text-muted-foreground">{category.tool_count}</td>
                <td className="p-2">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={loadingId === category.id}
                      onClick={() => handleSaveRow(category)}
                    >
                      {loadingId === category.id ? 'Saving...' : 'Save'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                      disabled={deletingId === category.id}
                      onClick={() => handleDelete(category)}
                    >
                      {deletingId === category.id ? 'Deleting...' : 'Delete'}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
