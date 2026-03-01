'use client'

import { useState } from 'react'
import { Pencil, Check, X, Loader2, Globe, Lock } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

const STACK_ICONS = ['⚡', '🚀', '🧠', '🎯', '🔥', '💡', '🛠️', '📊', '✍️', '🎨', '📸', '🤖', '📱', '🌐', '🔐', '📈']

interface Props {
  collectionId: string
  initialName: string
  initialDescription: string | null
  initialIsPublic: boolean
  initialIcon?: string
}

export function EditStackPanel({ collectionId, initialName, initialDescription, initialIsPublic, initialIcon = '⚡' }: Props) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(initialName)
  const [description, setDescription] = useState(initialDescription ?? '')
  const [isPublic, setIsPublic] = useState(initialIsPublic)
  const [icon, setIcon] = useState(initialIcon)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const save = async () => {
    if (!name.trim()) return
    setLoading(true)
    const { error } = await createClient()
      .from('collections')
      .update({ name: name.trim(), description: description.trim() || null, is_public: isPublic, icon })
      .eq('id', collectionId)

    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Stack updated')
      setOpen(false)
      router.refresh()
    }
    setLoading(false)
  }

  const cancel = () => {
    setName(initialName)
    setDescription(initialDescription ?? '')
    setIsPublic(initialIsPublic)
    setIcon(initialIcon)
    setOpen(false)
  }

  return (
    <>
      <Button variant="outline" className="w-full gap-2 h-10 btn-stack-effect" onClick={() => setOpen(true)}>
        <Pencil className="h-4 w-4" /> Edit Stack
      </Button>

      <Dialog open={open} onOpenChange={(o) => { if (!o) cancel(); else setOpen(true) }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Stack</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground mb-2 font-medium">Icon</p>
              <div className="grid grid-cols-6 sm:grid-cols-8 gap-1">
                {STACK_ICONS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setIcon(e)}
                    className={`h-9 w-9 rounded-lg text-lg flex items-center justify-center transition-colors ${
                      icon === e
                        ? 'bg-primary/20 border-2 border-primary/60'
                        : 'hover:bg-muted border-2 border-transparent'
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

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

          <DialogFooter>
            <Button size="sm" variant="ghost" onClick={cancel} className="gap-1.5">
              <X className="h-3.5 w-3.5" /> Cancel
            </Button>
            <Button size="sm" onClick={save} disabled={loading || !name.trim()} className="gap-1.5">
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
