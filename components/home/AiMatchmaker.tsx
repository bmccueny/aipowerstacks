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
  Lock,
  MessageSquare,
  Send,
  Wand2,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ToolCard } from '@/components/tools/ToolCard'
import { AiAgentLoading } from './AiAgentLoading'
import type { ToolSearchResult } from '@/lib/types'
import { cn } from '@/lib/utils'

type Step = 'goal' | 'requirements' | 'budget' | 'persona' | 'results'
type Mode = 'wizard' | 'chat'

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
  const [mode, setMode] = useState<Mode>('chat')
  const [step, setStep] = useState<Step>('goal')
  const [chatMessage, setChatMessage] = useState('')
  const [chatExplanation, setChatExplanation] = useState('')
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
    else if (step === 'persona') fetchWizardResults(value)
  }

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatMessage.trim()) return
    
    setLoading(true)
    setStep('results')
    
    try {
      const [res] = await Promise.all([
        fetch('/api/matchmaker', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: chatMessage })
        }),
        new Promise(resolve => setTimeout(resolve, 6500)) // Deep simulation delay
      ])
      const data = await res.json()
      setResults(data.tools)
      setChatExplanation(data.explanation)
    } catch (err) {
      console.error('Chat matchmaker failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchWizardResults = async (finalPersona: string) => {
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
      
      const [res] = await Promise.all([
        fetch(`/api/matchmaker?${params.toString()}`),
        new Promise(resolve => setTimeout(resolve, 6500)) // Deep simulation delay
      ])
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
    setChatMessage('')
    setChatExplanation('')
  }

  const progress = step === 'results' ? 100 : mode === 'chat' ? 50 : (step === 'goal' ? 20 : step === 'requirements' ? 40 : step === 'budget' ? 60 : 80)

  return (
    <div className="w-full">
      <div className="gum-card rounded-xl border-[1px] border-foreground overflow-hidden">
        <div className="h-1 bg-muted">
          <div 
            className="h-full bg-primary transition-all duration-500 ease-out" 
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="p-6 sm:p-10">
          {step !== 'results' && (
            <div className="flex items-center gap-2 mb-8 bg-muted/30 p-1 rounded-md w-fit mx-auto">
              <button
                onClick={() => setMode('chat')}
                className={cn(
                  "flex items-center gap-2 px-4 py-1.5 text-xs font-bold uppercase tracking-tight rounded transition-all",
                  mode === 'chat' ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Wand2 className="h-3.5 w-3.5" /> AI Agent
              </button>
              <button
                onClick={() => setMode('wizard')}
                className={cn(
                  "flex items-center gap-2 px-4 py-1.5 text-xs font-bold uppercase tracking-tight rounded transition-all",
                  mode === 'wizard' ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Zap className="h-3.5 w-3.5" /> Guided Wizard
              </button>
            </div>
          )}

          {step === 'goal' && mode === 'chat' && (
            <div className="animate-in-stagger text-center max-w-xl mx-auto py-4">
              <h2 className="text-3xl font-black mb-3 uppercase tracking-tight">How can I help you build?</h2>
              <p className="text-muted-foreground mb-10 text-sm sm:text-base leading-relaxed">
                Describe your project in plain English (e.g. &quot;I want to build a mobile app for dentists&quot;) and I&quot;ll find the perfect stack for you.
              </p>
              
              <form onSubmit={handleChatSubmit} className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <MessageSquare className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                </div>
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Tell me your goal..."
                  className="w-full bg-background border-2 border-foreground rounded-md h-14 pl-12 pr-32 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-bold text-sm sm:text-base"
                  autoFocus
                />
                <div className="absolute inset-y-0 right-2 flex items-center">
                  <Button type="submit" disabled={!chatMessage.trim() || loading} className="h-10 px-6 gap-2">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    <span>Match Me</span>
                  </Button>
                </div>
              </form>
              
              <div className="mt-8 flex flex-wrap justify-center gap-2">
                <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground w-full mb-1">Try these:</span>
                {[
                  "Build an iOS app for fitness",
                  "Launch a viral TikTok brand",
                  "Secure enterprise AI for data",
                  "Open source code assistant"
                ].map(suggestion => (
                  <button 
                    key={suggestion}
                    onClick={() => setChatMessage(suggestion)}
                    className="text-[11px] font-bold px-3 py-1.5 rounded-full border border-foreground/10 hover:border-primary/30 hover:bg-primary/5 transition-all"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 'goal' && mode === 'wizard' && (
            <div className="animate-in-stagger">
              <h2 className="text-2xl font-bold mb-2 uppercase tracking-tight">1. What are you building?</h2>
              <p className="text-muted-foreground mb-8 text-sm sm:text-base">We&apos;ll find the tools that match your specific workflow.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {GOALS.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => handleGoalSelect(g.id)}
                    className="glass-card flex items-center gap-4 p-4 text-left hover:border-primary transition-colors group rounded-md"
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
                        "glass-card flex flex-col items-center p-4 text-center transition-all group rounded-md",
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
                    className="glass-card flex flex-col items-center p-6 text-center hover:border-primary transition-colors group rounded-md"
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
                    className="glass-card flex flex-col items-center p-6 text-center hover:border-primary transition-colors group rounded-md"
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
              <div className="flex items-center justify-between mb-10 flex-wrap gap-4">
                <div className="max-w-3xl">
                  <h2 className="text-2xl sm:text-3xl font-black mb-6 uppercase tracking-tight flex items-center gap-3">
                    <Sparkles className="h-6 w-6 text-primary" />
                    Strategic Product Stack
                  </h2>
                  
                  {chatExplanation ? (
                    <div className="glass-card border-primary/20 bg-primary/5 rounded-2xl p-6 sm:p-8 mb-4">
                      <div className="space-y-6">
                        {chatExplanation.split('\n\n').map((paragraph, idx) => {
                          const [title, content] = paragraph.split(': ')
                          
                          if (content) {
                            return (
                              <div key={idx} className="flex gap-4 items-start group">
                                <div className="mt-1.5 h-2.5 w-2.5 rounded-full bg-primary shrink-0 group-hover:scale-125 transition-transform shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
                                <p className="text-sm sm:text-base leading-relaxed text-foreground/90">
                                  <span className="font-black uppercase tracking-wider text-[10px] sm:text-[11px] text-primary block mb-1">{title}</span>
                                  {content.replace(/\*\*/g, '')}
                                </p>
                              </div>
                            )
                          }
                          return (
                            <p key={idx} className="text-base sm:text-lg font-bold text-foreground leading-snug border-b border-foreground/10 pb-4 mb-6 italic">
                              &quot;{paragraph.replace(/\*\*/g, '')}&quot;
                            </p>
                          )
                        })}
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">Based on your specific project goals.</p>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={reset} className="gap-2 text-primary border-primary/20 hover:bg-primary hover:text-primary-foreground font-black uppercase tracking-widest text-[10px] h-10 px-4">
                  <RotateCcw className="h-3.5 w-3.5" /> Start Over
                </Button>
              </div>

              {loading ? (
                <AiAgentLoading />
              ) : results.length > 0 ? (
                <div className={cn(
                  "grid gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700",
                  results.length > 3 ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1 sm:grid-cols-2"
                )}>
                  {results.map((tool) => (
                    <ToolCard 
                      key={tool.id} 
                      tool={tool as any} 
                      cardStyle="home" 
                      compact={results.length > 3} 
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 glass-card rounded-md border-dashed">
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
