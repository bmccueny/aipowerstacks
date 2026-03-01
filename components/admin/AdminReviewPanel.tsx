'use client'

import { useState } from 'react'
import { ShieldCheck, Video, FileText, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Props {
  toolId: string
  initialVerified: boolean
  initialVideoUrl: string | null
  initialNotes: string | null
}

export function AdminReviewPanel({ toolId, initialVerified, initialVideoUrl, initialNotes }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [verified, setVerified] = useState(initialVerified)
  const [videoUrl, setVideoUrl] = useState(initialVideoUrl || '')
  const [notes, setNotes] = useState(initialNotes || '')

  const handleSave = async () => {
    setLoading(true)
    const supabase = createClient()
    
    const { error } = await (supabase as any)
      .from('tools')
      .update({
        verified_by_admin: verified,
        admin_review_video_url: videoUrl || null,
        admin_review_notes: notes || null,
        admin_review_at: new Date().toISOString()
      })
      .eq('id', toolId)

    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Admin review updated')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="glass-card rounded-md border-primary/30 bg-primary/5 p-6 mt-8">
      <div className="flex items-center gap-2 mb-6">
        <ShieldCheck className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-black uppercase tracking-tight">Admin Review Panel</h2>
      </div>

      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input 
              type="checkbox" 
              checked={verified} 
              onChange={(e) => setVerified(e.target.checked)}
              className="h-4 w-4 rounded border-foreground/20 text-primary focus:ring-primary"
            />
            <span className="text-sm font-bold group-hover:text-primary transition-colors">Mark as Expert Verified</span>
          </label>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <Video className="h-3 w-3" /> Video Review URL
          </label>
          <Input 
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
            className="bg-background border-foreground/10"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <FileText className="h-3 w-3" /> Internal Review Notes
          </label>
          <textarea 
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes about the tool performance, quirks, etc..."
            className="w-full bg-background border border-foreground/10 rounded-md px-3 py-2 text-sm min-h-[100px] focus:outline-none focus:border-primary/30"
          />
        </div>

        <Button onClick={handleSave} disabled={loading} className="w-full gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Save Expert Verification
        </Button>
      </div>
    </div>
  )
}
