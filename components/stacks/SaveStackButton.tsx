'use client'

import { useState, useEffect } from 'react'
import { Bookmark, Loader2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Props {
  sourceCollectionId: string
  stackName: string
  toolIds: string[]
}

export function SaveStackButton({ sourceCollectionId, stackName, toolIds }: Props) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    createClient().auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setUser(session.user)
    })
  }, [])

  const handleSave = async () => {
    if (!user) {
      window.location.href = `/login?redirectTo=${window.location.pathname}`
      return
    }

    setLoading(true)
    const supabase = createClient()

    const { data: newCol, error: colError } = await supabase
      .from('collections')
      .insert({ user_id: user.id, name: stackName, is_public: false })
      .select().single()

    if (colError) { toast.error(colError.message); setLoading(false); return }

    if (toolIds.length > 0) {
      await supabase.from('collection_items').insert(
        toolIds.map(toolId => ({ collection_id: newCol.id, tool_id: toolId }))
      )
    }

    setSaved(true)
    setLoading(false)
    toast.success('Stack saved to your dashboard!')
  }

  if (saved) {
    return (
      <Button variant="outline" className="gap-2" disabled>
        <Check className="h-4 w-4 text-emerald-500" /> Saved to Dashboard
      </Button>
    )
  }

  return (
    <Button variant="outline" className="gap-2" onClick={handleSave} disabled={loading}>
      {loading
        ? <Loader2 className="h-4 w-4 animate-spin" />
        : <Bookmark className="h-4 w-4" />
      }
      {user ? 'Save to My Dashboard' : 'Sign up to Save this Stack'}
    </Button>
  )
}
