'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

export function StackViewIncrement({ collectionId }: { collectionId: string }) {
  const incremented = useRef(false)

  useEffect(() => {
    if (incremented.current) return
    incremented.current = true

    const supabase = createClient()
    supabase.rpc('increment_stack_view', { collection_id: collectionId })
      .then(({ error }) => {
        if (error) console.error('Failed to increment stack view:', error)
      })
  }, [collectionId])

  return null
}
