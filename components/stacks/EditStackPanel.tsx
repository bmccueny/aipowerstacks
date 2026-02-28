'use client'

import { useState } from 'react'
import { Pencil, Check, X, Loader2, Globe, Lock } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Props {
  collectionId: string
  initialName: string
  initialDescription: string | null
  initialIsPublic: boolean
}

export function EditStackPanel({ collectionId, initialName, initialDescription, initialIsPublic }: Props) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(initialName)
  const [description, setDescription] = useState(initialDescription ?? '')
  const [isPublic, setIsPublic] = useState(initialIsPublic)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const save = async () => {
    if (!name.trim()) return
    setLoading(true)
    const { error } = await createClient()
      .from('collections')
      .update({ name: name.trim(), description: description.trim() || null, is_public: isPublic })
      .eq('id', collectionId)

    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Stack updated')
      setEditing(false)
      router.refresh()
    }
    setLoading(false)
  }

  const cancel = () => {
    setName(initialName)
    setDescription(initialDescription ?? '')
    setIsPublic(initialIsPublic)
    setEditing(false)
  }

  if (!editing) {
    return (
      <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground" onClick={() => setEditing(true)}>
        <Pencil className="h-3.5 w-3.5" /> Edit Stack
      </Button>
    )
  }

  return (
    <div className="glass-card rounded-xl p-5 space-y-4 border-primary/20">
      <p className="text-sm font-semibold">Edit Stack</p>

      <div className="space-y-2">
        <Input
          autoFocus
          placeholder="Stack name..."
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <Input
          placeholder="Description (optional)"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsPublic(!isPublic)}
          className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
            isPublic
              ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20'
              : 'text-muted-foreground bg-muted border-border hover:bg-muted/80'
          }`}
        >
          {isPublic ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
          {isPublic ? 'Public' : 'Private'} — click to toggle
        </button>
      </div>

      <div className="flex gap-2">
        <Button size="sm" onClick={save} disabled={loading || !name.trim()} className="gap-1.5">
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          Save
        </Button>
        <Button size="sm" variant="ghost" onClick={cancel} className="gap-1.5">
          <X className="h-3.5 w-3.5" /> Cancel
        </Button>
      </div>
    </div>
  )
}
