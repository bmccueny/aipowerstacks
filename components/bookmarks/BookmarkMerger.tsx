'use client'

import { useEffect, useRef } from 'react'
import { mergeAnonBookmarks, getAnonBookmarks } from '@/lib/bookmarks/merge'

export function BookmarkMerger() {
  const mergedRef = useRef(false)

  useEffect(() => {
    if (mergedRef.current) return
    const anon = getAnonBookmarks()
    if (anon.length === 0) return
    mergedRef.current = true
    mergeAnonBookmarks()
  }, [])

  return null
}
