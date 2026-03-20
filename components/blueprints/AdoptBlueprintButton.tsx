'use client'

import { useState } from 'react'
import { Plus, Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Props {
  blueprintId: string
  title: string
  toolIds: string[]
  toolNotes: Record<string, string> // toolId -> note (role)
}

export function AdoptBlueprintButton({ blueprintId, title, toolIds, toolNotes }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleAdopt = async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      window.location.href = `/login?redirectTo=/blueprints`
      return
    }

    try {
      // 1. Create new collection
      const shareSlug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-blueprint-${Math.random().toString(36).substring(2, 6)}`
      
      const { data: collection, error: colError } = await supabase
        .from('collections')
        .insert({
          user_id: user.id,
          name: title,
          description: `Generated from "${title}" blueprint.`,
          is_public: false,
          share_slug: shareSlug,
          icon: '📋'
        })
        .select()
        .single()

      if (colError) throw colError

      // 2. Add tools with their roles as notes
      const items = toolIds.map((toolId, i) => ({
        collection_id: collection.id,
        tool_id: toolId,
        sort_order: i,
        note: `Role: ${toolNotes[toolId]}`
      }))

      const { error: itemsError } = await supabase
        .from('collection_items')
        .insert(items)

      if (itemsError) throw itemsError

      setSuccess(true)
      toast.success(`"${title}" added to your dashboard!`)
      setTimeout(() => router.push('/dashboard'), 1500)

    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to adopt blueprint')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Button disabled className="flex-1 h-11 bg-emerald-500 text-white gap-2">
        <CheckCircle2 className="h-4 w-4" />
        Blueprint Adopted
      </Button>
    )
  }

  return (
    <Button 
      onClick={handleAdopt} 
      disabled={loading} 
      className="flex-1 h-11 font-black uppercase tracking-widest text-xs gap-2"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
      Adopt Blueprint
    </Button>
  )
}
