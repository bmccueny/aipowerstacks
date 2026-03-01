import Link from 'next/link'
import { getAllCategories } from '@/lib/supabase/queries/categories'
import { SubmitToolForm } from '@/components/tools/SubmitToolForm'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import { Sparkles } from 'lucide-react'

export const metadata: Metadata = { title: 'Submit Your AI Tool for Free | AIPowerStacks' }

export default async function SubmitPage({
  searchParams,
}: {
  searchParams: Promise<{
    mode?: string
    name?: string
    website_url?: string
  }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const mode = params.mode === 'claim' || params.mode === 'suggest-edit' ? params.mode : 'submit'

  const intro = mode === 'claim'
    ? `Claim the listing for ${params.name ?? 'your tool'} and keep details current.`
    : mode === 'suggest-edit'
      ? `Suggest an edit for ${params.name ?? 'this tool'} and our editors will review it.`
      : `Found an AI tool we haven't listed yet? Submit it below — approved tools go live within 24 hours.`

  const submitParams = new URLSearchParams()
  if (mode !== 'submit') submitParams.set('mode', mode)
  if (params.name) submitParams.set('name', params.name)
  if (params.website_url) submitParams.set('website_url', params.website_url)
  const submitPath = `/submit${submitParams.toString() ? `?${submitParams.toString()}` : ''}`
  const loginHref = `/login?redirectTo=${encodeURIComponent(submitPath)}`

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="glass-card rounded-md p-6 sm:p-8 mb-8">
          <div className="inline-flex items-center gap-2 gum-pill px-3 py-1 text-xs font-semibold uppercase tracking-wide mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            Creator Onboarding
          </div>
          <h1 className="text-3xl sm:text-4xl font-black mb-2">Sign In to List Your AI Tool</h1>
          <p className="text-muted-foreground">
            A free account keeps listings spam-free and lets you manage, claim, or edit your tool anytime.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Link href={loginHref} className="flex-1">
              <Button className="w-full">Log In</Button>
            </Link>
            <Link href="/register" className="flex-1">
              <Button variant="outline" className="w-full">Create Account</Button>
            </Link>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            After login, you&apos;ll return here automatically.
          </p>
        </div>
      </div>
    )
  }

  const categories = await getAllCategories()

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="glass-card rounded-md p-6 sm:p-8 mb-8">
        <div className="inline-flex items-center gap-2 gum-pill px-3 py-1 text-xs font-semibold uppercase tracking-wide mb-4">
          <Sparkles className="h-3.5 w-3.5" />
          Creator Onboarding
        </div>
        <h1 className="text-3xl sm:text-4xl font-black mb-2">Submit an AI Tool for Free</h1>
        <p className="text-muted-foreground">
          {intro}
        </p>
      </div>
      <SubmitToolForm
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        mode={mode}
        initialValues={{
          name: params.name ?? '',
          website_url: params.website_url ?? '',
          submitter_email: user.email ?? '',
          notes: mode === 'claim'
            ? 'Claim request: I represent this tool and would like ownership verification.'
            : mode === 'suggest-edit'
              ? 'Suggested edit: Please update inaccurate listing details.'
              : '',
        }}
      />
    </div>
  )
}
