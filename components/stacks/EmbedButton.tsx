'use client'

import { useEffect, useState } from 'react'
import { Code2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

export function EmbedButton({ slug, className }: { slug: string; className?: string }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [baseUrl, setBaseUrl] = useState('')

  useEffect(() => {
    setBaseUrl(window.location.origin)
  }, [])

  const embedUrl = `${baseUrl}/stacks/${slug}/embed`
  const snippet = `<iframe src="${embedUrl}" width="480" height="480" frameborder="0" style="border-radius:16px;overflow:hidden;"></iframe>`

  const handleCopy = async () => {
    await navigator.clipboard.writeText(snippet)
    setCopied(true)
    toast.success('Embed code copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <Button variant="outline" size="default" className={`h-10 gap-2 ${className ?? ''}`} onClick={() => setOpen(true)}>
        <Code2 className="h-4 w-4" /> Embed
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Embed this Stack</DialogTitle>
            <DialogDescription>
              Copy and paste this snippet into any website or blog post.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted rounded-md p-3 text-xs font-mono break-all text-muted-foreground border border-border">
            {snippet}
          </div>
          <Button onClick={handleCopy} className="gap-2">
            {copied ? <Check className="h-4 w-4" /> : <Code2 className="h-4 w-4" />}
            {copied ? 'Copied!' : 'Copy Embed Code'}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  )
}
