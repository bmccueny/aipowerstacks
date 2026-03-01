'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Send, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'

interface Stack {
  id: string
  name: string
  icon: string | null
  share_slug: string
}

interface ChallengeSubmitButtonProps {
  challengeId: string
  userStacks: Stack[]
}

export function ChallengeSubmitButton({ challengeId, userStacks }: ChallengeSubmitButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  if (userStacks.length === 0) {
    return (
      <Button variant="outline" size="sm" disabled>
        No public stacks to submit
      </Button>
    )
  }

  const submit = async (collectionId: string, stackName: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/challenges/${challengeId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collection_id: collectionId }),
      })
      if (res.status === 409) {
        toast.error('Already submitted')
        return
      }
      if (!res.ok) throw new Error('Submission failed')
      toast.success(`"${stackName}" submitted!`)
      router.refresh()
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" disabled={loading} className="gap-2 shrink-0">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Send className="h-4 w-4" /> Submit Stack
              <ChevronDown className="h-3.5 w-3.5 opacity-60" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {userStacks.map((stack) => (
          <DropdownMenuItem
            key={stack.id}
            onClick={() => submit(stack.id, stack.name)}
            className="flex items-center gap-2"
          >
            <span>{stack.icon || '⚡'}</span>
            <span className="truncate">{stack.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
