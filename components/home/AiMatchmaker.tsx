'use client'

import { useState } from 'react'
import { 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  Zap, 
  Code2, 
  PenLine, 
  Video, 
  Search, 
  Briefcase,
  DollarSign,
  User,
  Users,
  Building2,
  RotateCcw,
  Cpu,
  Smartphone,
  Github,
  CheckCircle2,
  ShieldCheck,
  Lock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ToolCard } from '@/components/tools/ToolCard'
import type { ToolSearchResult } from '@/lib/types'
import { cn } from '@/lib/utils'

type Step = 'goal' | 'requirements' | 'budget' | 'persona' | 'results'

const GOALS = [
  { id: 'content-creation', label: 'Create Content', icon: PenLine, desc: 'Writing, social media, & blogs' },
  { id: 'coding', label: 'Build Software', icon: Code2, desc: 'Coding, debugging, & shipping' },
  { id: 'video', label: 'Video & Motion', icon: Video, desc: 'Editing, avatars, & animation' },
  { id: 'marketing', label: 'Grow Business', icon: Briefcase, desc: 'SEO, ads, & automation' },
  { id: 'research', label: 'Research & Data', icon: Search, desc: 'Analytics & summarization' },
]

const BUDGETS = [
  { id: 'free', label: 'Free Only', icon: Sparkles, desc: '100% free or open source' },
  { id: 'paid', label: 'Premium', icon: DollarSign, desc: 'Paid tools for power users' },
  { id: 'any', label: 'Any Budget', icon: Zap, desc: 'Show me the best regardless' },
]

const PERSONAS = [
  { id: 'solo-creator', label: 'Solo Creator', icon: User, desc: 'Individual building alone' },
  { id: 'lean-startup', label: 'Startup Team', icon: Users, desc: 'Small, fast-moving teams' },
  { id: 'enterprise-ready', label: 'Enterprise', icon: Building2, desc: 'Large scale & security' },
]

const REQUIREMENTS = [
  { id: 'needsApi', label: 'API Access', icon: Cpu, desc: 'Integration-ready' },
  { id: 'needsPrivacy', label: 'Privacy-First', icon: ShieldCheck, desc: 'No training on data' },
  { id: 'needsSSO', label: 'Enterprise SSO', icon: Lock, desc: 'Okta / SAML support' },
  { id: 'needsMobile', label: 'Mobile App', icon: Smartphone, desc: 'iOS or Android' },
  { id: 'needsOpenSource', label: 'Open Source', icon: Github, desc: 'Community built' },
]

export function AiMatchmaker() {
  const [step, setStep] = useState<Step>('goal')
  const [selections, setSelections] = useState({
    useCase: '',
    pricing: 'any',
    persona: '',
    needsApi: false,
    needsMobile: false,
    needsOpenSource: false,
    needsPrivacy: false,
    needsSSO: false
  })
  const [results, setResults] = useState<ToolSearchResult[]>([])
  const [loading, setLoading] = useState(false)

  const handleGoalSelect = (id: string) => {
    setSelections(prev => ({ ...prev, useCase: id }))
    setStep('requirements')
  }

  const toggleRequirement = (id: string) => {
    setSelections(prev => ({ ...prev, [id]: !prev[id as keyof typeof prev] }))
  }

  const handleSelect = (key: string, value: string) => {
    setSelections(prev => ({ ...prev, [key]: value }))
    
    if (step === 'budget') setStep('persona')
    else if (step === 'persona') fetchResults(value)
  }

  const fetchResults = async (finalPersona: string) => {
    setLoading(true)
    setStep('results')
    
    try {
      const params = new URLSearchParams({
        useCase: selections.useCase,
        pricing: selections.pricing,
        persona: finalPersona,
        needsApi: selections.needsApi.toString(),
        needsMobile: selections.needsMobile.toString(),
        needsOpenSource: selections.needsOpenSource.toString(),
        needsPrivacy: selections.needsPrivacy.toString(),
        needsSSO: selections.needsSSO.toString()
      })
      
      const res = await fetch(`/api/matchmaker?${params.toString()}`)
      const data = await res.json()
      setResults(data)
    } catch (err) {
      console.error('Matchmaker failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setSelections({ 
      useCase: '', 
      pricing: 'any', 
      persona: '', 
      needsApi: false, 
      needsMobile: false, 
      needsOpenSource: false,
      needsPrivacy: false,
      needsSSO: false
    })
    setStep('goal')
    setResults([])
  }

  const progress = step === 'goal' ? 20 : step === 'requirements' ? 40 : step === 'budget' ? 60 : step === 'persona' ? 80 : 100

  return (
    <div className="w-full">
      <div className="gum-card rounded-[4px] border-[1px] border-foreground overflow-hidden">
        <div className="h-1 bg-muted">
          <div 
            className="h-full bg-primary transition-all duration-500 ease-out" 
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="p-6 sm:p-10">
          {step === 'goal' && (
            <div className="animate-in-stagger">
              <h2 className="text-2xl font-bold mb-2 uppercase tracking-tight">1. What are you building?</h2>
              <p className="text-muted-foreground mb-8 text-sm sm:text-base">We&apos;ll find the tools that match your specific workflow.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {GOALS.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => handleGoalSelect(g.id)}
                    className="glass-card flex items-center gap-4 p-4 text-left hover:border-primary transition-colors group rounded-[4px]"
                  >
                    <div className="h-10 w-10 rounded-lg bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                      <g.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">{g.label}</p>
                      <p className="text-xs text-muted-foreground">{g.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 'requirements' && (
            <div className="animate-in-stagger">
              <button onClick={() => setStep('goal')} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary mb-4 transition-colors">
                <ChevronLeft className="h-3 w-3" /> Back
              </button>
              <h2 className="text-2xl font-bold mb-2 uppercase tracking-tight">2. Any must-have features?</h2>
              <p className="text-muted-foreground mb-8 text-sm sm:text-base">Select all that apply. We gathered this data through deep site scans.</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
                {REQUIREMENTS.map((r) => {
                  const isActive = selections[r.id as keyof typeof selections]
                  return (
                    <button
                      key={r.id}
                      onClick={() => toggleRequirement(r.id)}
                      className={cn(
                        "glass-card flex flex-col items-center p-4 text-center transition-all group rounded-[4px]",
                        isActive ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:border-primary/50"
                      )}
                    >
                      <div className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center mb-3 transition-colors",
                        isActive ? "bg-primary text-white" : "bg-primary/5 text-primary group-hover:bg-primary/10"
                      )}>
                        <r.icon className="h-5 w-5" />
                      </div>
                      <p className="font-bold text-[11px] mb-1 leading-tight">{r.label}</p>
                      <p className="text-[10px] text-muted-foreground leading-tight hidden sm:block">{r.desc}</p>
                      {isActive && <CheckCircle2 className="h-3 w-3 text-primary mt-2" />}
                    </button>
                  )
                })}
              </div>
              <div className="flex justify-center">
                <Button onClick={() => setStep('budget')} className="px-12 uppercase font-black tracking-widest text-xs h-12">
                  Continue <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {step === 'budget' && (
            <div className="animate-in-stagger">
              <button onClick={() => setStep('requirements')} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary mb-4 transition-colors">
                <ChevronLeft className="h-3 w-3" /> Back
              </button>
              <h2 className="text-2xl font-bold mb-2 uppercase tracking-tight">3. What is your budget?</h2>
              <p className="text-muted-foreground mb-8 text-sm sm:text-base">AI costs can vary. Choose what works for you.</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {BUDGETS.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => handleSelect('pricing', b.id)}
                    className="glass-card flex flex-col items-center p-6 text-center hover:border-primary transition-colors group rounded-[4px]"
                  >
                    <div className="h-12 w-12 rounded-full bg-primary/5 flex items-center justify-center text-primary mb-4 group-hover:bg-primary group-hover:text-white transition-colors">
                      <b.icon className="h-6 w-6" />
                    </div>
                    <p className="font-bold text-sm mb-1">{b.label}</p>
                    <p className="text-xs text-muted-foreground">{b.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 'persona' && (
            <div className="animate-in-stagger">
              <button onClick={() => setStep('budget')} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary mb-4 transition-colors">
                <ChevronLeft className="h-3 w-3" /> Back
              </button>
              <h2 className="text-2xl font-bold mb-2 uppercase tracking-tight">4. Who is this for?</h2>
              <p className="text-muted-foreground mb-8 text-sm sm:text-base">We&apos;ll tailor recommendations to your team size.</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {PERSONAS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelect('persona', p.id)}
                    className="glass-card flex flex-col items-center p-6 text-center hover:border-primary transition-colors group rounded-[4px]"
                  >
                    <div className="h-12 w-12 rounded-full bg-primary/5 flex items-center justify-center text-primary mb-4 group-hover:bg-primary group-hover:text-white transition-colors">
                      <p.icon className="h-6 w-6" />
                    </div>
                    <p className="font-bold text-sm mb-1">{p.label}</p>
                    <p className="text-xs text-muted-foreground">{p.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 'results' && (
            <div className="animate-in-stagger">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold mb-1 uppercase tracking-tight">Your Perfect AI Stack</h2>
                  <p className="text-muted-foreground text-sm">Based on your goals and technical needs.</p>
                </div>
                <Button variant="ghost" size="sm" onClick={reset} className="gap-2">
                  <RotateCcw className="h-3.5 w-3.5" /> Start Over
                </Button>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="glass-card h-48 animate-pulse rounded-[4px]" />
                  ))}
                </div>
              ) : results.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {results.map((tool) => (
                    <ToolCard key={tool.id} tool={tool as any} cardStyle="home" />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 glass-card rounded-[4px] border-dashed">
                  <p className="text-muted-foreground mb-4">No perfect match found for this specific criteria.</p>
                  <Button onClick={reset}>Try different criteria</Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
