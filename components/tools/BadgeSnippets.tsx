'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function BadgeSnippets({ badgeUrl, toolUrl, toolName }: { badgeUrl: string; toolUrl: string; toolName: string }) {
  const [copied, setCopied] = useState<string | null>(null)

  const snippets = [
    {
      label: 'Markdown',
      code: `[![${toolName} on AIPowerStacks](${badgeUrl})](${toolUrl})`,
    },
    {
      label: 'HTML',
      code: `<a href="${toolUrl}" target="_blank" rel="noopener noreferrer"><img src="${badgeUrl}" alt="${toolName} on AIPowerStacks" /></a>`,
    },
    {
      label: 'Image URL',
      code: badgeUrl,
    },
  ]

  const handleCopy = async (code: string, label: string) => {
    await navigator.clipboard.writeText(code)
    setCopied(label)
    toast.success(`${label} snippet copied!`)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="space-y-4">
      {snippets.map(({ label, code }) => (
        <div key={label}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-bold">{label}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-xs"
              onClick={() => handleCopy(code, label)}
            >
              {copied === label ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied === label ? 'Copied' : 'Copy'}
            </Button>
          </div>
          <div className="bg-muted rounded-lg p-3 text-xs font-mono break-all text-muted-foreground border border-border">
            {code}
          </div>
        </div>
      ))}
    </div>
  )
}
