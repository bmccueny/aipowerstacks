'use client'

import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function RemoveFromStackButton({ collectionId, toolId, toolName }: {
  collectionId: string
  toolId: string
  toolName: string
}) {
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!confirming) { setConfirming(true); return }
    remove()
  }

  const cancel = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setConfirming(false)
  }

  const remove = async () => {
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('collection_items')
      .delete()
      .eq('collection_id', collectionId)
      .eq('tool_id', toolId)

    if (error) {
      toast.error(error.message)
      setLoading(false)
      setConfirming(false)
    } else {
      toast.success(`Removed ${toolName} from stack`)
      router.refresh()
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1" onClick={e => e.preventDefault()}>
        <button
          onClick={handleClick}
          disabled={loading}
          className="text-[10px] font-semibold text-red-500 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full hover:bg-red-500/20 transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Remove'}
        </button>
        <button
          onClick={cancel}
          className="text-[10px] font-semibold text-muted-foreground bg-muted border border-border px-2 py-0.5 rounded-full hover:bg-muted/80 transition-colors"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={handleClick}
      title={`Remove ${toolName} from stack`}
      className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-muted-foreground/40 hover:text-red-500 hover:bg-red-500/10 transition-all"
    >
      <X className="h-4 w-4" />
    </button>
  )
}
