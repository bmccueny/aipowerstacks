'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Check, Copy, Edit2, ExternalLink, SkipForward, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'

interface SocialPostActionsProps {
  post: {
    id: string
    content: string
    status: string
    link_url: string | null
  }
}

export function SocialPostActions({ post }: SocialPostActionsProps) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState(post.content)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const updatePost = async (updates: Record<string, any>) => {
    setLoading(true)
    const res = await fetch(`/api/admin/social/${post.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    setLoading(false)
    if (!res.ok) {
      const data = await res.json()
      toast.error(data.error || 'Failed to update')
      return false
    }
    router.refresh()
    return true
  }

  const deletePost = async () => {
    if (!confirm('Delete this draft?')) return
    setLoading(true)
    const res = await fetch(`/api/admin/social/${post.id}`, { method: 'DELETE' })
    setLoading(false)
    if (!res.ok) {
      toast.error('Failed to delete')
      return
    }
    toast.success('Deleted')
    router.refresh()
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(post.content)
      setCopied(true)
      toast.success('Copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy')
    }
  }

  const handleSaveEdit = async () => {
    const ok = await updatePost({ content: editContent })
    if (ok) {
      setEditing(false)
      toast.success('Updated')
    }
  }

  const handleMarkPosted = async () => {
    await updatePost({ status: 'posted' })
    toast.success('Marked as posted')
  }

  const handleApprove = async () => {
    await updatePost({ status: 'approved' })
    toast.success('Approved')
  }

  const handleSkip = async () => {
    await updatePost({ status: 'skipped' })
    toast.success('Skipped')
  }

  if (editing) {
    return (
      <div className="space-y-3 mt-3">
        <textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          rows={4}
          maxLength={280}
          className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <p className="text-xs text-muted-foreground">{editContent.length}/280</p>
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSaveEdit} disabled={loading} className="gap-1.5">
            <Check className="h-3.5 w-3.5" /> Save
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setEditContent(post.content) }}>
            <X className="h-3.5 w-3.5" /> Cancel
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap mt-3">
      <Button
        size="sm"
        variant="outline"
        onClick={copyToClipboard}
        className="gap-1.5 border-border/50 h-8"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? 'Copied' : 'Copy'}
      </Button>

      <Button
        size="sm"
        variant="outline"
        onClick={() => setEditing(true)}
        className="gap-1.5 border-border/50 h-8"
      >
        <Edit2 className="h-3.5 w-3.5" /> Edit
      </Button>

      {post.status === 'draft' && (
        <Button
          size="sm"
          variant="outline"
          onClick={handleApprove}
          disabled={loading}
          className="gap-1.5 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 h-8"
        >
          <Check className="h-3.5 w-3.5" /> Approve
        </Button>
      )}

      {(post.status === 'draft' || post.status === 'approved') && (
        <Button
          size="sm"
          variant="outline"
          onClick={handleMarkPosted}
          disabled={loading}
          className="gap-1.5 border-blue-500/30 text-blue-400 hover:bg-blue-500/10 h-8"
        >
          <ExternalLink className="h-3.5 w-3.5" /> Mark Posted
        </Button>
      )}

      {post.status === 'draft' && (
        <Button
          size="sm"
          variant="outline"
          onClick={handleSkip}
          disabled={loading}
          className="gap-1.5 border-border/50 text-muted-foreground h-8"
        >
          <SkipForward className="h-3.5 w-3.5" /> Skip
        </Button>
      )}

      <Button
        size="sm"
        variant="ghost"
        onClick={deletePost}
        disabled={loading}
        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 w-8 p-0"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}
