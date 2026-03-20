'use client'

import { useState, useEffect } from 'react'
import { Bookmark, Loader2, Check, ArrowRight, CopyPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import Link from 'next/link'
import type { User } from '@supabase/supabase-js'

interface Props {
  sourceCollectionId: string
  stackName: string
  toolIds: string[]
  variant?: 'default' | 'icon'
  className?: string
}

export function SaveStackButton({ sourceCollectionId, stackName, toolIds, variant = 'default', className }: Props) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    createClient().auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        // Check if already saved (as a link) OR cloned
        const supabase = createClient()
        Promise.all([
          supabase.from('collection_saves').select('user_id').eq('user_id', session.user.id).eq('collection_id', sourceCollectionId).maybeSingle(),
          supabase.from('collections').select('id').eq('user_id', session.user.id).eq('source_collection_id', sourceCollectionId).maybeSingle()
        ]).then(([saveRes, cloneRes]) => {
          if (saveRes.data || cloneRes.data) setSaved(true)
        })
      }
    })
  }, [sourceCollectionId])

  const handleSave = async () => {
    if (!user || saved) {
      if (!user) window.location.href = `/login?redirectTo=${window.location.pathname}`
      return
    }

    setLoading(true)
    const supabase = createClient()

    if (variant === 'icon') {
      // LINKING: Save as a reference in collection_saves
      const { error } = await (supabase as unknown as { from: (table: string) => { insert: (row: Record<string, string>) => Promise<{ error: { message: string } | null }> } })
        .from('collection_saves')
        .insert({ user_id: user.id, collection_id: sourceCollectionId })
      
      if (error) { toast.error(error.message); setLoading(false); return }
    } else {
      // CLONING: Create a new editable copy in collections
      const { data: newCol, error: colError } = await supabase
        .from('collections')
        .insert({ user_id: user.id, name: stackName, is_public: false, source_collection_id: sourceCollectionId })
        .select().single()

      if (colError) { toast.error(colError.message); setLoading(false); return }

      if (toolIds.length > 0) {
        await supabase.from('collection_items').insert(
          toolIds.map(toolId => ({ collection_id: newCol.id, tool_id: toolId }))
        )
      }
    }

    await supabase.rpc('increment_save_count', { collection_id: sourceCollectionId }).maybeSingle()

    setSaved(true)
    setLoading(false)
    toast.success(variant === 'icon' ? 'Stack added to your library!' : 'Stack cloned to your dashboard!')
  }

  if (saved) {
    if (variant === 'icon') {
      return (
        <Button variant="outline" size="default" className="h-10 w-10 p-0 text-emerald-500 border-emerald-500/30" asChild>
          <Link href="/dashboard" title="Saved! View Dashboard">
            <Check className="h-4 w-4" />
          </Link>
        </Button>
      )
    }
    return (
      <Button variant="outline" className={`gap-2 ${className ?? ''}`} asChild>
        <Link href="/dashboard">
          <Check className="h-4 w-4 text-emerald-500" />
          Saved to Dashboard
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
    )
  }

  if (variant === 'icon') {
    return (
      <Button
        variant="outline"
        size="default"
        className="h-10 w-10 p-0 text-muted-foreground hover:text-primary transition-all"
        onClick={handleSave}
        disabled={loading}
        title={user ? 'Save to My Stacks' : 'Sign in to save'}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bookmark className="h-4 w-4" />}
      </Button>
    )
  }

  return (
    <Button variant="outline" size="default" className={`h-10 gap-2 btn-stack-effect ${className ?? ''}`} onClick={handleSave} disabled={loading}>
      {loading
        ? <Loader2 className="h-4 w-4 animate-spin" />
        : <CopyPlus className="h-4 w-4" />
      }
      {user ? 'Copy to My Stacks' : 'Sign in to save this Stack'}
    </Button>
  )
}
