import Link from 'next/link'
import type { Metadata } from 'next'
import { Check, ArrowRight, Sparkles, FileText, Bell, Users, Code } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'AIPowerStacks Pro | Premium AI Stack Intelligence',
  description: 'Export reports, get price alerts, manage team budgets, and access the API. $9/month for serious AI tool managers.',
}

const PRO_FEATURES = [
  { icon: FileText, title: 'PDF expense reports', desc: 'Export your AI spend as formatted PDF for finance teams and expense claims' },
  { icon: Bell, title: 'Price change alerts', desc: 'Get notified instantly when tools in your stack change pricing' },
  { icon: Users, title: 'Team budgets', desc: 'Set spending limits per team member and track org-wide AI costs' },
  { icon: Code, title: 'API access', desc: 'Query our 700+ tool database programmatically for your own apps' },
  { icon: Sparkles, title: 'Priority AI advisor', desc: 'Stack Advisor uses Claude Opus instead of Haiku — deeper analysis, better picks' },
]

const FREE_VS_PRO = [
  { feature: 'Track subscriptions', free: true, pro: true },
  { feature: 'Compare tools', free: true, pro: true },
  { feature: 'Basic overlap detection', free: true, pro: true },
  { feature: 'CSV export', free: true, pro: true },
  { feature: 'AI Stack Advisor', free: true, pro: true },
  { feature: 'PDF expense reports', free: false, pro: true },
  { feature: 'Price change alerts', free: false, pro: true },
  { feature: 'Team budgets (5 members)', free: false, pro: true },
  { feature: 'API access (1000 req/day)', free: false, pro: true },
  { feature: 'Priority AI (Opus model)', free: false, pro: true },
  { feature: 'Smart overlap (AI-powered)', free: false, pro: true },
  { feature: 'Slack notifications', free: false, pro: true },
]

export default function ProPage() {
  return (
    <main className="min-h-[100dvh] pt-24 pb-20 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Hero */}
        <div className="max-w-xl mb-16">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary mb-4 flex items-center gap-2">
            <span className="w-5 h-px bg-primary/60" /> Pro Plan
          </p>
          <h1 className="text-[clamp(2rem,5vw,3.5rem)] font-extrabold tracking-[-0.03em] leading-[1.05]">
            Serious about your
            <br />AI spend?
          </h1>
          <p className="mt-5 text-lg text-muted-foreground leading-relaxed">
            Pro gives you the tools to manage AI subscriptions like a real line item — reports, alerts, team controls, and API access.
          </p>
        </div>

        {/* Pricing card */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-12 mb-20">
          <div className="space-y-6">
            {PRO_FEATURES.map(f => (
              <div key={f.title} className="flex gap-4">
                <div className="shrink-0 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <f.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{f.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:sticky lg:top-28 self-start rounded-2xl border-2 border-primary/20 p-8 bg-primary/[0.02] w-full lg:w-[300px]">
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Pro Plan</p>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-4xl font-black">$9</span>
              <span className="text-sm text-muted-foreground">/month</span>
            </div>
            <p className="text-xs text-muted-foreground mb-6">Cancel anytime. No contracts.</p>
            <Link href="/api/stripe/checkout?plan=pro">
              <Button className="w-full font-bold gap-2 h-12 text-base">
                Upgrade to Pro <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <p className="text-[10px] text-muted-foreground text-center mt-3">7-day free trial included</p>
          </div>
        </div>

        {/* Comparison table */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-6">Free vs Pro</h2>
          <div className="rounded-xl border border-foreground/[0.06] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-foreground/[0.06] bg-foreground/[0.02]">
                  <th className="text-left p-3 font-semibold text-xs">Feature</th>
                  <th className="text-center p-3 font-semibold text-xs w-20">Free</th>
                  <th className="text-center p-3 font-bold text-xs text-primary w-20">Pro</th>
                </tr>
              </thead>
              <tbody>
                {FREE_VS_PRO.map(row => (
                  <tr key={row.feature} className="border-b border-foreground/[0.04] last:border-0">
                    <td className="p-3 text-xs">{row.feature}</td>
                    <td className="text-center p-3">
                      {row.free ? <Check className="h-3.5 w-3.5 text-foreground mx-auto" /> : <span className="text-muted-foreground/30">—</span>}
                    </td>
                    <td className="text-center p-3">
                      {row.pro ? <Check className="h-3.5 w-3.5 text-primary mx-auto" /> : <span className="text-muted-foreground/30">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  )
}
