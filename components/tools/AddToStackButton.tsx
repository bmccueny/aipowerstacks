'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Layers, Plus, Check, Loader2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export function AddToStackButton({ toolId, toolName }: { toolId: string; toolName: string }) {
  const [collections, setCollections] = useState<any[]>([])
  const [itemCounts, setItemCounts] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [newStackName, setNewStackName] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [user, setUser] = useState<any>(null)

  // Lightweight session check — reads from local cache, no network call
  useEffect(() => {
    createClient().auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setUser(session.user)
    })
  }, [])

  const fetchCollections = async () => {
    const supabase = createClient()
    setFetching(true)
    const [{ data }, { data: items }] = await Promise.all([
      supabase.from('collections').select('id, name, is_public').eq('user_id', user.id).order('name'),
      supabase.from('collection_items').select('collection_id').eq('tool_id', toolId),
    ])
    const inCollections: Record<string, boolean> = {}
    items?.forEach(i => { inCollections[i.collection_id] = true })
    setCollections(data ?? [])
    setItemCounts(inCollections)
    setFetching(false)
  }

  const toggleToolInCollection = async (collectionId: string, currentlyIn: boolean) => {
    const supabase = createClient()
    if (currentlyIn) {
      const { error } = await supabase.from('collection_items').delete()
        .eq('collection_id', collectionId).eq('tool_id', toolId)
      if (!error) {
        setItemCounts(prev => ({ ...prev, [collectionId]: false }))
        toast.success('Removed from stack')
      } else {
        toast.error(error.message)
      }
    } else {
      const { error } = await supabase.from('collection_items')
        .insert({ collection_id: collectionId, tool_id: toolId })
      if (!error || error.code === '23505') {
        setItemCounts(prev => ({ ...prev, [collectionId]: true }))
        toast.success('Added to stack')
      } else {
        toast.error(error.message)
      }
    }
  }

  const createAndAdd = async () => {
    const name = newStackName.trim()
    if (!name) return
    const supabase = createClient()
    setLoading(true)
    try {
      const { data: newCol, error: createError } = await supabase
        .from('collections')
        .insert({ user_id: user.id, name, is_public: true })
        .select().single()

      if (createError) { toast.error(createError.message); setLoading(false); return }

      const { error: addError } = await supabase
        .from('collection_items').insert({ collection_id: newCol.id, tool_id: toolId })

      if (addError && addError.code !== '23505') {
        toast.error(addError.message)
      } else {
        setCollections(prev => [...prev, newCol].sort((a, b) => a.name.localeCompare(b.name)))
        setItemCounts(prev => ({ ...prev, [newCol.id]: true }))
        setNewStackName('')
        setIsDialogOpen(false)
        toast.success('Stack created and tool added!')
      }
    } catch (err: any) {
      toast.error(err.message ?? 'Unexpected error')
    }
    setLoading(false)
  }

  if (!user) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="w-full gap-2 border-border"
        onClick={() => window.location.href = `/login?redirectTo=${window.location.pathname}`}
      >
        <Layers className="h-4 w-4" />
        Add to Stack
      </Button>
    )
  }

  return (
    <>
      <DropdownMenu onOpenChange={(open) => open && fetchCollections()}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="w-full gap-2 border-border">
            <Layers className="h-4 w-4" />
            Add to Stack
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Select a Stack</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {fetching && collections.length === 0 ? (
            <div className="p-4 flex justify-center"><Loader2 className="h-4 w-4 animate-spin" /></div>
          ) : (
            <div className="max-h-60 overflow-y-auto">
              {collections.map((col) => (
                <DropdownMenuItem
                  key={col.id}
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleToolInCollection(col.id, !!itemCounts[col.id])}
                >
                  <span className="truncate">{col.name}</span>
                  {itemCounts[col.id] && <Check className="h-4 w-4 text-primary" />}
                </DropdownMenuItem>
              ))}
              {collections.length === 0 && (
                <p className="text-xs text-muted-foreground p-3 text-center">No stacks yet.</p>
              )}
            </div>
          )}

          <DropdownMenuSeparator />
          <DropdownMenuItem className="cursor-pointer gap-2 text-primary" onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Create New Stack
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setNewStackName('') }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Create New Stack</DialogTitle>
          </DialogHeader>
          <Input
            autoFocus
            placeholder="Stack name..."
            value={newStackName}
            onChange={e => setNewStackName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') createAndAdd() }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={createAndAdd} disabled={loading || !newStackName.trim()}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
