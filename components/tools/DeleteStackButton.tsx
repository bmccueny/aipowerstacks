'use client'

import { useState, useEffect, useRef } from 'react'
import { Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function DeleteStackButton({ collectionId }: { collectionId: string }) {
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
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
    setLoading(true)
    const { error } = await createClient().from('collections').delete().eq('id', collectionId)
    if (error) {
      toast.error(error.message)
      setLoading(false)
      setConfirming(false)
    } else {
      toast.success('Stack deleted')
      router.refresh()
    }
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  if (confirming) {
    return (
      <div className="flex items-center gap-1" onClick={e => e.preventDefault()}>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="text-[10px] font-semibold text-red-500 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-full hover:bg-red-500/20 transition-colors disabled:opacity-50"
        >
          {loading ? '...' : 'Delete'}
        </button>
        <button
          onClick={cancel}
          className="text-[10px] font-semibold text-muted-foreground bg-muted border border-border px-2 py-1 rounded-full hover:bg-muted/80 transition-colors"
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
      className="flex items-center justify-center h-11 w-11 rounded-lg text-muted-foreground/40 hover:text-red-500 hover:bg-red-500/10 transition-colors"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  )
}
