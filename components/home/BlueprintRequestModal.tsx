'use client'

import { useState } from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sparkles, Send, CheckCircle2 } from 'lucide-react'

export function BlueprintRequestModal({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [email, setEmail] = useState('')
  const [goal, setGoal] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const res = await fetch('/api/blueprints/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, goal })
      })

      if (!res.ok) throw new Error('Failed to send')
      
      setSubmitted(true)
      setTimeout(() => {
        setOpen(false)
        setSubmitted(false)
        setEmail('')
        setGoal('')
      }, 3000)
    } catch (err) {
      console.error(err)
      alert('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-[4px] border-[1px] border-foreground">
        {!submitted ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-black flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Request a Blueprint
              </DialogTitle>
              <DialogDescription className="text-muted-foreground pt-2">
                Can&apos;t find the right stack? Tell us what you&apos;re building and we&apos;ll curate a custom blueprint for you.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">What are you building?</label>
                <textarea 
                  required
                  placeholder="e.g. A faceless YouTube channel for AI news..."
                  className="w-full min-h-[100px] rounded-[4px] border-[1px] border-foreground bg-background p-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-all"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Your Email</label>
                <Input 
                  required
                  type="email" 
                  placeholder="notifications@yourbrand.com"
                  className="!rounded-[4px] border-foreground"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full font-black uppercase tracking-tighter" disabled={loading}>
                {loading ? 'Sending Request...' : 'Send Request'}
                <Send className="h-4 w-4 ml-2" />
              </Button>
              <p className="text-[10px] text-center text-muted-foreground italic">
                We&apos;ll notify you as soon as our editorial team curates your stack.
              </p>
            </form>
          </>
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-300">
            <div className="h-16 w-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h3 className="text-xl font-bold mb-2">Request Received!</h3>
            <p className="text-sm text-muted-foreground">
              Our experts are on it. Keep an eye on your inbox.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
