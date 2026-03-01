'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { Trash2, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function DeleteStackButton({ collectionId, stackName }: { collectionId: string, stackName?: string }) {
  const [confirming, setConfirming] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const startConfirm = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setConfirming(true)
    timerRef.current = setTimeout(() => setConfirming(false), 5000)
  }

  const cancel = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (timerRef.current) clearTimeout(timerRef.current)
    setConfirming(false)
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (timerRef.current) clearTimeout(timerRef.current)
    
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      // Try to delete from collection_saves first (linking table)
      await supabase
        .from('collection_saves')
        .delete()
        .eq('collection_id', collectionId)
        .eq('user_id', user.id)

      // Also try deleting from collections if it's the owner
      const { error: colError } = await supabase
        .from('collections')
        .delete()
        .eq('id', collectionId)
        .eq('user_id', user.id)

      if (colError) {
        toast.error(colError.message)
      } else {
        toast.success(stackName ? `Deleted stack: ${stackName}` : 'Stack deleted')
        startTransition(() => {
          router.refresh()
        })
      }
    }
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  if (confirming) {
    return (
      <div className="flex items-center gap-1" onClick={e => e.preventDefault()}>
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="text-[10px] font-semibold text-red-500 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-full hover:bg-red-500/20 transition-colors disabled:opacity-50 flex items-center gap-1"
        >
          {isPending ? <Loader2 className="h-2 w-2 animate-spin" /> : null}
          {isPending ? 'Deleting...' : 'Confirm'}
        </button>
        <button
          onClick={cancel}
          disabled={isPending}
          className="text-[10px] font-semibold text-muted-foreground bg-muted border border-border px-2 py-1 rounded-full hover:bg-muted/80 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={startConfirm}
      title="Delete stack"
      className="flex items-center justify-center h-8 w-8 rounded-lg text-muted-foreground/40 hover:text-red-500 hover:bg-red-500/10 transition-colors"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  )
}
