'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { BrandMark } from '@/components/common/BrandMark'
import { Code, Palette, Megaphone, FlaskConical, ArrowRight } from 'lucide-react'

const ROLES = [
  { id: 'developer', label: 'Developer', icon: Code, desc: 'Code, ship, automate' },
  { id: 'creator', label: 'Creator', icon: Palette, desc: 'Write, design, produce' },
  { id: 'marketer', label: 'Marketer', icon: Megaphone, desc: 'Grow, convert, analyze' },
  { id: 'researcher', label: 'Researcher', icon: FlaskConical, desc: 'Explore, analyze, learn' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [role, setRole] = useState('')

  if (step === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-background">
        <div className="w-full max-w-md space-y-8 text-center">
          <BrandMark className="h-10 w-10 mx-auto" />
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-3">Step 1 of 2</p>
            <h1 className="text-2xl font-bold">What kind of work do you do with AI?</h1>
            <p className="text-muted-foreground mt-2">We'll show you the tools most relevant to your setup.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {ROLES.map(r => (
              <button
                key={r.id}
                onClick={() => { setRole(r.id); setStep(2) }}
                className="glass-card rounded-xl p-5 flex flex-col items-center gap-3 hover:border-primary/50 transition-colors text-center"
              >
                <r.icon className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-bold text-sm">{r.label}</p>
                  <p className="text-xs text-muted-foreground">{r.desc}</p>
                </div>
              </button>
            ))}
          </div>
          <button onClick={() => router.push('/tracker')} className="text-xs text-muted-foreground hover:text-foreground">
            Skip for now →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-background">
      <div className="w-full max-w-md space-y-8 text-center">
        <BrandMark className="h-10 w-10 mx-auto" />
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-3">Step 2 of 2</p>
          <h1 className="text-2xl font-bold">Add your AI tools</h1>
          <p className="text-muted-foreground mt-2">Search and tap the tools you pay for. We'll show overlaps and savings instantly.</p>
        </div>
        <Button size="lg" className="w-full h-12 font-bold gap-2" onClick={() => router.push(`/tracker?role=${role}`)}>
          Open My Tracker <ArrowRight className="h-4 w-4" />
        </Button>
        <button onClick={() => router.push('/tracker')} className="text-xs text-muted-foreground hover:text-foreground">
          Skip for now →
        </button>
      </div>
    </div>
  )
}
