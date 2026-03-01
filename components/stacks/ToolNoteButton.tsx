'use client'

import { useState } from 'react'
import { MessageSquare, Check, X, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Props {
  collectionId: string
  toolId: string
  initialNote?: string | null
}

export function ToolNoteButton({ collectionId, toolId, initialNote }: Props) {
  const [editing, setEditing] = useState(false)
  const [note, setNote] = useState(initialNote ?? '')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const save = async () => {
    setLoading(true)
    const { error } = await createClient()
      .from('collection_items')
      .update({ note: note.trim() || null })
      .eq('collection_id', collectionId)
      .eq('tool_id', toolId)

    if (error) {
      toast.error(error.message)
    } else {
      setEditing(false)
      router.refresh()
    }
    setLoading(false)
  }

  if (editing) {
    return (
      <div className="mt-2 flex items-center gap-2">
        <input
          autoFocus
          type="text"
          placeholder="Why did you include this tool?"
          value={note}
          onChange={e => setNote(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false) }}
          className="flex-1 text-xs bg-muted border border-border rounded-md px-2.5 py-1.5 outline-none focus:border-primary/50 placeholder:text-muted-foreground/50"
        />
        <button
          onClick={save}
          disabled={loading}
          className="h-7 w-7 flex items-center justify-center rounded-md bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
        </button>
        <button
          onClick={() => { setNote(initialNote ?? ''); setEditing(false) }}
          className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    )
  }

  if (note) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="mt-3 text-left text-[13px] text-foreground/80 leading-relaxed bg-primary/5 hover:bg-primary/10 border border-primary/10 rounded-md px-3 py-2 transition-all flex items-start gap-2.5 group w-full"
      >
        <MessageSquare className="h-4 w-4 shrink-0 mt-0.5 text-primary opacity-70 group-hover:opacity-100" />
        <span className="italic">"{note}"</span>
      </button>
    )
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="mt-1.5 text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors flex items-center gap-1"
    >
      <MessageSquare className="h-3 w-3" />
      Add a note
    </button>
  )
}
