'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, ThumbsUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface ChallengeVoteButtonProps {
  challengeId: string
  collectionId: string
  hasVoted: boolean
}

export function ChallengeVoteButton({ challengeId, collectionId, hasVoted }: ChallengeVoteButtonProps) {
  const [voted, setVoted] = useState(hasVoted)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const toggle = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/challenges/${challengeId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collection_id: collectionId }),
      })
      if (!res.ok) throw new Error('Vote failed')
      const { voted: newVoted } = await res.json()
      setVoted(newVoted)
      router.refresh()
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant={voted ? 'default' : 'outline'}
      size="sm"
      onClick={toggle}
      disabled={loading}
      className="gap-1.5 h-8 px-3"
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <ThumbsUp className="h-3.5 w-3.5" />
      )}
    </Button>
  )
}
