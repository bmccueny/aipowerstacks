'use client'

import { useState } from 'react'
import { Plus, Loader2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { STACK_TEMPLATES } from '@/lib/stacks/templates'

const STACK_ICONS = ['⚡', '🚀', '🧠', '🎯', '🔥', '💡', '🛠️', '📊', '✍️', '🎨', '📸', '🤖', '📱', '🌐', '🔐', '📈']

export function CreateStackDialog() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<'template' | 'form'>('template')
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('⚡')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const resetAndClose = () => {
    setOpen(false)
    setStep('template')
    setSelectedTemplateId(null)
    setName('')
    setDescription('')
    setIcon('⚡')
  }

  const selectTemplate = (templateId: string | null) => {
    setSelectedTemplateId(templateId)
    if (templateId) {
      const tpl = STACK_TEMPLATES.find((t) => t.id === templateId)
      if (tpl) {
        setName(tpl.name)
        setDescription(tpl.description)
        setIcon(tpl.icon)
      }
    } else {
      setName('')
      setDescription('')
      setIcon('⚡')
    }
    setStep('form')
  }

  const handleCreate = async () => {
    if (!name.trim()) return
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setLoading(true)
    const { error } = await supabase.from('collections').insert({
      user_id: user.id,
      name: name.trim(),
      description: description.trim() || null,
      icon,
      is_public: false,
      template_id: selectedTemplateId,
    })

    if (error) {
      toast.error(error.message)
    } else {
      toast.success(`Stack "${name.trim()}" created!`)
      resetAndClose()
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <>
      <Button size="sm" variant="outline" className="gap-1.5 h-9 rounded-full font-bold border-primary/20 hover:border-primary/40 hover:bg-primary/5 px-4" onClick={() => setOpen(true)}>
        <Plus className="h-3.5 w-3.5" /> New Stack
      </Button>

      <Dialog open={open} onOpenChange={(o) => { if (!o) resetAndClose() }}>
        <DialogContent className="sm:max-w-md">
          {step === 'template' ? (
            <>
              <DialogHeader>
                <DialogTitle>Start from a template</DialogTitle>
              </DialogHeader>
              <div className="space-y-2">
                {STACK_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => selectTemplate(tpl.id)}
                    className="w-full text-left flex items-start gap-3 p-3.5 rounded-lg border border-foreground/15 hover:border-primary/50 hover:bg-primary/5 transition-colors"
                  >
                    <span className="text-2xl shrink-0 mt-0.5">{tpl.icon}</span>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm">{tpl.name}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{tpl.description}</p>
                    </div>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => selectTemplate(null)}
                  className="w-full text-left flex items-center gap-3 p-3.5 rounded-lg border border-dashed border-foreground/20 hover:border-primary/40 hover:bg-muted/40 transition-colors text-muted-foreground"
                >
                  <span className="text-2xl shrink-0">➕</span>
                  <div>
                    <p className="font-semibold text-sm text-foreground">Start from scratch</p>
                    <p className="text-xs mt-0.5">Build your own custom stack.</p>
                  </div>
                </button>
              </div>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setStep('template')}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  Create a Stack
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-2 font-medium">Pick an icon</p>
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
                <Input
                  autoFocus
                  placeholder="Stack name..."
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleCreate() }}
                />
                <Input
                  placeholder="Description (optional)"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setStep('template')}>Back</Button>
                <Button onClick={handleCreate} disabled={loading || !name.trim()}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
