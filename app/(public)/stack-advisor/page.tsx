import type { Metadata } from 'next'
import { StackAdvisorClient } from '@/components/home/StackAdvisorClient'

export const metadata: Metadata = {
  title: 'AI Stack Advisor | Get Your Perfect AI Tool Stack',
  description: 'Tell us your role and budget — our AI recommends the optimal tool stack with zero overlap and maximum value.',
}

export default function StackAdvisorPage() {
  return (
    <main className="min-h-[100dvh] pt-24 pb-20 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-10">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary mb-3">AI-Powered</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-[-0.02em] leading-tight">
            Stack Advisor
          </h1>
          <p className="mt-3 text-base text-muted-foreground leading-relaxed max-w-md">
            Tell us your role and budget. Our AI builds your optimal tool stack — no overlap, maximum value.
          </p>
        </div>
        <StackAdvisorClient />
      </div>
    </main>
  )
}
