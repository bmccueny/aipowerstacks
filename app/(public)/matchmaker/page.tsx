import type { Metadata } from 'next'
import { Sparkles } from 'lucide-react'
import { AiMatchmaker } from '@/components/home/AiMatchmaker'

export const metadata: Metadata = {
  title: 'AI Tool Matchmaker - Find the Right Tool for Your Need',
  description: 'Describe what you need in plain English and our AI will match you with the best tools for the job.',
  alternates: { canonical: '/matchmaker' },
}

interface MatchmakerPageProps {
  searchParams: Promise<{ q?: string }>
}

export default async function MatchmakerPage({ searchParams }: MatchmakerPageProps) {
  const { q } = await searchParams

  return (
    <div className="page-shell space-y-8">
      <section className="page-hero text-center">
        <div className="inline-flex items-center gap-2 gum-pill px-3 py-1 text-xs font-semibold uppercase tracking-wide mb-4">
          <Sparkles className="h-3.5 w-3.5" />
          AI Matchmaker
        </div>
        <h1 className="text-3xl sm:text-4xl font-black mb-2">
          {q ? 'Finding your tools...' : 'Tell us what you need'}
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Describe your goal in plain English — our AI will match you with the best tools for the job.
        </p>
      </section>

      <AiMatchmaker initialQuery={q} />
    </div>
  )
}
