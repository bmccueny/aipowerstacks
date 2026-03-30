'use client'

import { useState, useCallback } from 'react'
import { Share2, Copy, Check, ExternalLink, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function ShareStackButton() {
  const [sharing, setSharing] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleShare = useCallback(async () => {
    setSharing(true)
    try {
      const res = await fetch('/api/tracker/share', { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate share link')
      }
      const fullUrl = `${window.location.origin}${data.url}`
      setShareUrl(fullUrl)
      setShowModal(true)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : String(err))
    }
    setSharing(false)
  }, [])

  const copyUrl = useCallback(() => {
    if (!shareUrl) return
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true)
      toast.success('Link copied!')
      setTimeout(() => setCopied(false), 2000)
    })
  }, [shareUrl])

  const shareToTwitter = useCallback(() => {
    if (!shareUrl) return
    const text = encodeURIComponent('Check out my AI tool stack! 🤖')
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(shareUrl)}`, '_blank')
  }, [shareUrl])

  const shareToLinkedIn = useCallback(() => {
    if (!shareUrl) return
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank')
  }, [shareUrl])

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleShare}
        disabled={sharing}
        className="gap-1.5"
      >
        <Share2 className="h-3.5 w-3.5" />
        {sharing ? 'Generating...' : 'Share My Stack'}
      </Button>

      {/* Share modal */}
      {showModal && shareUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div
            className="bg-background border border-foreground/[0.06] rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Share Your Stack</h3>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-sm text-muted-foreground">
              Anyone with this link can see your AI tool stack.
            </p>

            {/* URL display */}
            <div className="flex items-center gap-2 rounded-lg border border-foreground/[0.06] bg-muted/30 p-3">
              <span className="flex-1 text-sm truncate">{shareUrl}</span>
              <button onClick={copyUrl} className="shrink-0 text-muted-foreground hover:text-foreground transition-colors">
                {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={copyUrl} className="flex-1 gap-1.5" size="sm">
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied!' : 'Copy Link'}
              </Button>
              <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => window.open(shareUrl, '_blank')}>
                <ExternalLink className="h-3.5 w-3.5" />
                Preview
              </Button>
            </div>

            {/* Social share */}
            <div className="flex items-center gap-2 pt-2 border-t border-foreground/[0.06]">
              <span className="text-xs text-muted-foreground">Share on:</span>
              <button
                onClick={shareToTwitter}
                className="rounded-lg border border-foreground/[0.06] px-3 py-1.5 text-xs hover:bg-muted/50 transition-colors"
              >
                𝕏 Twitter
              </button>
              <button
                onClick={shareToLinkedIn}
                className="rounded-lg border border-foreground/[0.06] px-3 py-1.5 text-xs hover:bg-muted/50 transition-colors"
              >
                LinkedIn
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
