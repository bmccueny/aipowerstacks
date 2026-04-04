'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Bookmark } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { getAnonBookmarks, setAnonBookmarks } from '@/lib/bookmarks/merge'

const NUDGE_3_KEY = 'aips_bm_nudge_3'
const NUDGE_5_KEY = 'aips_bm_nudge_5'

export function BookmarkButton({ toolId }: { toolId: string }) {
  const [bookmarked, setBookmarked] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checked, setChecked] = useState(false)
  const [justBookmarked, setJustBookmarked] = useState(false)
  const [isAuthed, setIsAuthed] = useState(false)
  const popTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        // Anon: check localStorage
        const anon = getAnonBookmarks()
        setBookmarked(anon.includes(toolId))
        setChecked(true)
        return
      }
      setIsAuthed(true)
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

  useEffect(() => {
    return () => {
      if (popTimeoutRef.current) clearTimeout(popTimeoutRef.current)
    }
  }, [])

  const showNudgeIfNeeded = (count: number) => {
    if (count === 3 && !sessionStorage.getItem(NUDGE_3_KEY)) {
      sessionStorage.setItem(NUDGE_3_KEY, '1')
      toast('Your saved tools are stored locally. Sign up to sync across devices!', {
        action: { label: 'Sign up', onClick: () => { window.location.href = '/login?signup=true' } },
        duration: 6000,
      })
    } else if (count >= 5 && !sessionStorage.getItem(NUDGE_5_KEY)) {
      sessionStorage.setItem(NUDGE_5_KEY, '1')
      toast(`You have ${count} saved tools! Create a free account to never lose them.`, {
        action: { label: 'Sign up', onClick: () => { window.location.href = '/login?signup=true' } },
        duration: 6000,
      })
    }
  }

  const toggle = async () => {
    setLoading(true)

    if (!isAuthed) {
      // Anon: toggle localStorage
      const anon = getAnonBookmarks()
      if (bookmarked) {
        setAnonBookmarks(anon.filter((id) => id !== toolId))
        setBookmarked(false)
      } else {
        const updated = [...anon, toolId]
        setAnonBookmarks(updated)
        setBookmarked(true)
        setJustBookmarked(true)
        if (popTimeoutRef.current) clearTimeout(popTimeoutRef.current)
        popTimeoutRef.current = setTimeout(() => setJustBookmarked(false), 350)
        showNudgeIfNeeded(updated.length)
      }
      setLoading(false)
      return
    }

    // Authed: use API
    if (bookmarked) {
      await fetch(`/api/bookmarks?toolId=${toolId}`, { method: 'DELETE' })
      setBookmarked(false)
    } else {
      const res = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolId }),
      })
      if (res.ok) {
        setBookmarked(true)
        setJustBookmarked(true)
        if (popTimeoutRef.current) clearTimeout(popTimeoutRef.current)
        popTimeoutRef.current = setTimeout(() => setJustBookmarked(false), 350)
      }
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
      className={`gap-2 ${bookmarked ? 'bg-primary/10 text-primary border-primary/30' : ''}`}
    >
      <Bookmark className={`h-4 w-4 ${bookmarked ? 'fill-current' : ''} ${justBookmarked ? 'animate-bookmark-pop' : ''}`} />
      {bookmarked ? 'Saved' : 'Save'}
    </Button>
  )
}
