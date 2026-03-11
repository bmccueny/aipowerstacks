'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Layers, Plus, Check, Loader2 } from 'lucide-react'
import { createPortal } from 'react-dom'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { useMediaQuery } from '@/hooks/useMediaQuery'

const STACK_ICONS = ['⚡', '🚀', '🧠', '🎯', '🔥', '💡', '🛠️', '📊', '✍️', '🎨', '📸', '🤖', '📱', '🌐', '🔐', '📈']

type Collection = {
  id: string
  name: string
  icon: string | null
}

export function AddToStackButton({
  toolId,
  toolName,
  className,
  showLabel = true,
  iconOnly = false,
}: {
  toolId: string
  toolName: string
  className?: string
  showLabel?: boolean
  iconOnly?: boolean
}) {
  const [collections, setCollections] = useState<Collection[]>([])
  const [itemCounts, setItemCounts] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newStackName, setNewStackName] = useState('')
  const [newStackIcon, setNewStackIcon] = useState('⚡')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [justAdded, setJustAdded] = useState(false)
  const addedAnimationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const isMobile = useMediaQuery('(max-width: 767px)')

  const redirectToLogin = () => {
    const redirectTo = `${window.location.pathname}${window.location.search}`
    window.location.href = `/login?redirectTo=${encodeURIComponent(redirectTo)}`
  }

  const fetchCollectionsViaClient = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('collections')
      .select('id, name, icon')
      .eq('user_id', user.id)
      .is('source_collection_id', null)
      .order('name')

    if (error) throw error
    return (data ?? []) as Collection[]
  }

  const fetchMembershipViaClient = async (collectionIds: string[]) => {
    if (collectionIds.length === 0) return {} as Record<string, boolean>

    const supabase = createClient()
    const { data, error } = await supabase
      .from('collection_items')
      .select('collection_id')
      .eq('tool_id', toolId)
      .in('collection_id', collectionIds)

    if (error) throw error

    return (data ?? []).reduce<Record<string, boolean>>((acc, row) => {
      acc[row.collection_id] = true
      return acc
    }, {})
  }

  const fetchCollections = async () => {
    setFetching(true)
    try {
      const cols = await fetchCollectionsViaClient()
      if (!cols) {
        redirectToLogin()
        return false
      }
      setCollections(cols)

      const fallbackMembership = await fetchMembershipViaClient(cols.map((c) => c.id))
      setItemCounts(fallbackMembership)
      return true
    } catch (err: any) {
      toast.error('Failed to load your stacks: ' + (err.message || 'Unknown error'))
      return false
    } finally {
      setFetching(false)
    }
  }

  const toggleToolInCollection = async (collectionId: string, currentlyIn: boolean) => {
    const supabase = createClient()
    if (currentlyIn) {
      setItemCounts(prev => ({ ...prev, [collectionId]: false }))
      const { error } = await supabase
        .from('collection_items')
        .delete()
        .eq('collection_id', collectionId)
        .eq('tool_id', toolId)
      if (error) {
        setItemCounts(prev => ({ ...prev, [collectionId]: true }))
        toast.error(error.message || 'Failed to remove from stack')
      } else {
        toast.success('Removed from stack')
      }
    } else {
      setItemCounts(prev => ({ ...prev, [collectionId]: true }))
      const { error } = await supabase
        .from('collection_items')
        .insert({ collection_id: collectionId, tool_id: toolId })

      if (error && error.code !== '23505') {
        setItemCounts(prev => ({ ...prev, [collectionId]: false }))
        toast.error(error.message || 'Failed to add to stack')
      } else {
        triggerAddedAnimation()
        setPickerOpen(false)
        toast.success('Added to stack')
      }
    }
  }

  const createAndAdd = async () => {
    const name = newStackName.trim()
    if (!name) return
    setLoading(true)
    
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        redirectToLogin()
        return
      }

      const { data: newCol, error: createError } = await supabase
        .from('collections')
        .insert({
          user_id: user.id,
          name,
          icon: newStackIcon,
          is_public: false,
        })
        .select('id')
        .single()
      if (createError) throw createError

      const { error: addError } = await supabase
        .from('collection_items')
        .insert({ collection_id: newCol.id, tool_id: toolId })
      if (addError && addError.code !== '23505') throw addError

      await fetchCollections()
      triggerAddedAnimation()
      setNewStackName('')
      setNewStackIcon('⚡')
      setIsDialogOpen(false)
      toast.success(`"${name}" created and tool added!`)
    } catch (err: any) {
      toast.error(err.message || 'Failed to create stack')
    } finally {
      setLoading(false)
    }
  }

  const handleTriggerClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      redirectToLogin()
      return
    }
    setPickerOpen(true)
  }

  useEffect(() => {
    if (!pickerOpen) return
    let active = true
    ;(async () => {
      const loaded = await fetchCollections()
      if (active && !loaded) setPickerOpen(false)
    })()
    return () => {
      active = false
    }
  }, [pickerOpen, toolId])

  // Position the desktop dropdown relative to the trigger button
  useEffect(() => {
    if (isMobile || !pickerOpen || !triggerRef.current || !dropdownRef.current) return

    const trigger = triggerRef.current
    const dropdown = dropdownRef.current
    const rect = trigger.getBoundingClientRect()

    // Position below-end of the button
    const top = rect.bottom + 8
    const right = window.innerWidth - rect.right

    dropdown.style.position = 'fixed'
    dropdown.style.top = `${top}px`
    dropdown.style.right = `${right}px`
    dropdown.style.left = 'auto'
  }, [pickerOpen, isMobile])

  // Close on outside click (desktop)
  useEffect(() => {
    if (isMobile || !pickerOpen) return
    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        setPickerOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [pickerOpen, isMobile])

  // Close on Escape
  useEffect(() => {
    if (!pickerOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPickerOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [pickerOpen])

  useEffect(() => {
    return () => {
      if (addedAnimationTimeoutRef.current) {
        clearTimeout(addedAnimationTimeoutRef.current)
      }
    }
  }, [])

  const triggerAddedAnimation = () => {
    setJustAdded(true)
    if (addedAnimationTimeoutRef.current) {
      clearTimeout(addedAnimationTimeoutRef.current)
    }
    addedAnimationTimeoutRef.current = setTimeout(() => {
      setJustAdded(false)
    }, 1400)
  }

  const alreadyInAStack = Object.values(itemCounts).some(Boolean)

  /* ── Shared stack list content ── */
  const stackListContent = (
    <>
      <div className="max-h-72 overflow-y-auto">
        {fetching && collections.length === 0 ? (
          <div className="p-6 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        ) : collections.length === 0 ? (
          <div className="p-4 text-center">
            <p className="text-sm font-medium text-muted-foreground">No stacks yet</p>
            <p className="text-[11px] text-muted-foreground/70 mt-0.5">Create your first stack below.</p>
          </div>
        ) : (
          collections.map((col) => (
            <button
              key={col.id}
              className="w-full flex items-center gap-3 p-3 hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors rounded-lg cursor-pointer text-left"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                toggleToolInCollection(col.id, !!itemCounts[col.id])
              }}
            >
              <div className="h-9 w-9 rounded-lg bg-primary/5 dark:bg-primary/10 flex items-center justify-center shrink-0 text-lg">
                {col.icon || '⚡'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold leading-none truncate">{col.name}</p>
                {itemCounts[col.id] && (
                  <p className="text-[10px] text-primary mt-1 leading-tight">Added</p>
                )}
              </div>
              {itemCounts[col.id] && (
                <Check className="h-4 w-4 text-primary shrink-0" />
              )}
            </button>
          ))
        )}
      </div>
      <div className="border-t border-border/50 pt-1 mt-1">
        <button
          className="w-full flex items-center gap-3 p-3 hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors rounded-lg cursor-pointer text-primary text-left"
          onClick={(e) => {
            e.preventDefault()
            setPickerOpen(false)
            setTimeout(() => setIsDialogOpen(true), 350)
          }}
        >
          <div className="h-9 w-9 rounded-lg bg-primary/5 dark:bg-primary/10 flex items-center justify-center shrink-0 text-primary">
            <Plus className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-bold leading-none">Create New Stack</p>
            <p className="text-[10px] text-muted-foreground mt-1 leading-tight">Start a new workflow</p>
          </div>
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* ── Trigger button ── */}
      <Button
        ref={triggerRef}
        variant="outline"
        size="sm"
        className={cn(
          "relative shrink-0 whitespace-nowrap gap-2 rounded-sm font-medium transition-all add-to-stack-btn",
          iconOnly ? "w-9 h-9 p-0 flex items-center justify-center" : "w-auto max-w-full px-3 h-9 brutalist-card-effect",
          alreadyInAStack ? 'text-primary border-primary/40' : '',
          justAdded ? 'scale-[1.05] bg-primary/10 border-primary' : '',
          className
        )}
        onClick={handleTriggerClick}
        disabled={loading}
      >
        {justAdded && (
          <span className="pointer-events-none absolute inset-0 rounded-md border border-primary/30 animate-stack-success-ring" />
        )}
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : alreadyInAStack ? (
          <Check className={cn("h-5 w-5 text-primary", justAdded ? 'animate-stack-success-icon' : '')} />
        ) : (
          <Layers className="h-5 w-5" />
        )}
        {!iconOnly && showLabel && (
          <span className={justAdded ? '' : 'hidden sm:inline'}>
            {justAdded ? 'Added!' : alreadyInAStack ? 'In Your Stack' : 'Add to Stack'}
          </span>
        )}
      </Button>

      {/* ── Mobile: bottom sheet ── */}
      {isMobile && (
        <Sheet open={pickerOpen} onOpenChange={setPickerOpen}>
          <SheetContent
            side="bottom"
            className="!bg-background/95 !backdrop-blur-2xl rounded-t-3xl px-4 pb-8 max-h-[80vh]"
            showCloseButton
          >
            <SheetHeader className="pb-2">
              <SheetTitle className="text-base font-black">Add to Stack</SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground">
                Save <strong>{toolName}</strong> to one of your stacks.
              </SheetDescription>
            </SheetHeader>
            {stackListContent}
          </SheetContent>
        </Sheet>
      )}

      {/* ── Desktop: positioned dropdown with backdrop overlay ── */}
      {!isMobile && pickerOpen && typeof document !== 'undefined' && createPortal(
        <>
          <div
            className="fixed inset-0 z-[100] bg-black/25 backdrop-blur-md transition-opacity duration-300"
            aria-hidden="true"
            onClick={() => setPickerOpen(false)}
          />
          <div
            ref={dropdownRef}
            className="z-[101] w-72 p-2 rounded-lg border border-border/60 bg-background/95 dark:bg-neutral-900/95 backdrop-blur-2xl shadow-[0_25px_70px_rgba(0,0,0,0.3)] dark:shadow-[0_25px_70px_rgba(0,0,0,0.6)] animate-in fade-in-0 zoom-in-95 duration-150"
          >
            <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
              Add {toolName} to a stack
            </p>
            <div className="h-px bg-border/50 my-1" />
            {stackListContent}
          </div>
        </>,
        document.body
      )}

      {/* ── Create new stack dialog ── */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) { setNewStackName(''); setNewStackIcon('⚡') } }}>
        <DialogContent className="sm:max-w-sm" onClick={e => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Create a New Stack</DialogTitle>
            <DialogDescription>
              Add <strong>{toolName}</strong> to a new stack.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground mb-2 font-medium">Pick an icon</p>
              <div className="grid grid-cols-6 sm:grid-cols-8 gap-1">
                {STACK_ICONS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setNewStackIcon(e)}
                    className={`h-9 w-9 rounded-lg text-lg flex items-center justify-center transition-colors ${
                      newStackIcon === e
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
              placeholder="e.g. Content Creation, Dev Tools..."
              value={newStackName}
              onChange={e => setNewStackName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.stopPropagation()
                  createAndAdd()
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={createAndAdd} disabled={loading || !newStackName.trim()}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create & Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
