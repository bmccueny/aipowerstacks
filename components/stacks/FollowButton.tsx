'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, UserPlus, UserCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface FollowButtonProps {
  followingId: string
  initialIsFollowing: boolean
  className?: string
}

export function FollowButton({ followingId, initialIsFollowing, className }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const toggle = async () => {
    setLoading(true)
    try {
      if (isFollowing) {
        const res = await fetch(`/api/follows?followingId=${followingId}`, { method: 'DELETE' })
        if (!res.ok) throw new Error('Failed to unfollow')
        setIsFollowing(false)
        toast.success('Unfollowed')
      } else {
        const res = await fetch('/api/follows', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ following_id: followingId }),
        })
        if (res.status === 401) {
          router.push('/login')
          return
        }
        if (!res.ok) throw new Error('Failed to follow')
        setIsFollowing(true)
        toast.success('Following!')
      }
      router.refresh()
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant={isFollowing ? 'outline' : 'default'}
      size="sm"
      onClick={toggle}
      disabled={loading}
      className={`gap-2 shrink-0 ${className ?? ''}`}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isFollowing ? (
        <>
          <UserCheck className="h-4 w-4" /> Following
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4" /> Follow
        </>
      )}
    </Button>
  )
}
