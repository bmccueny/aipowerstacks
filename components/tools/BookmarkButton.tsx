'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Bookmark } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function BookmarkButton({ toolId }: { toolId: string }) {
  const [bookmarked, setBookmarked] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { setChecked(true); return }
      supabase
        .from('bookmarks')
        .select('tool_id')
        .eq('user_id', data.user.id)
        .eq('tool_id', toolId)
        .maybeSingle()
        .then(({ data: bm }) => {
          setBookmarked(!!bm)
          setChecked(true)
        })
    })
  }, [toolId])

  const toggle = async () => {
    setLoading(true)
    if (bookmarked) {
      await fetch(`/api/bookmarks?toolId=${toolId}`, { method: 'DELETE' })
      setBookmarked(false)
    } else {
      const res = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolId }),
      })
      if (res.status === 401) {
        window.location.href = '/login'
        return
      }
      setBookmarked(true)
    }
    setLoading(false)
  }

  if (!checked) return null

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggle}
      disabled={loading}
      className={`gap-2 border-white/10 ${bookmarked ? 'bg-primary/10 text-primary border-primary/30' : ''}`}
    >
      <Bookmark className={`h-4 w-4 ${bookmarked ? 'fill-current' : ''}`} />
      {bookmarked ? 'Saved' : 'Save'}
    </Button>
  )
}
