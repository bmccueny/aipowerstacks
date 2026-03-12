import { createAdminClient } from '@/lib/supabase/admin'
import type { Metadata } from 'next'
import { Badge } from '@/components/ui/badge'
import { SubmissionActions } from '@/components/admin/SubmissionActions'

export const metadata: Metadata = { title: 'Tool Submissions' }

export default async function AdminSubmissionsPage() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('tool_submissions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  const submissions = (data ?? []) as {
    id: string; name: string; website_url: string; tagline: string; description: string
    pricing_model: string | null; status: string; submitter_email: string | null; created_at: string
    notes: string | null; category_id: string | null
  }[]

  const statusColors: Record<string, string> = {
    pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    approved: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
  }

  return (
    <div>
      <h1 className="text-2xl lg:text-3xl font-semibold mb-6">Tool Submissions</h1>

      {submissions.length === 0 ? (
        <div className="bg-card/50 border border-border/50 rounded-lg p-8 text-center text-sm text-muted-foreground">No submissions yet.</div>
      ) : (
        <div className="space-y-4">
          {submissions.map((sub) => (
            <div key={sub.id} className="bg-card/50 border border-border/50 rounded-lg p-4 sm:p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <h3 className="font-semibold">{sub.name}</h3>
                    <Badge variant="outline" className={`text-xs ${statusColors[sub.status] ?? ''}`}>{sub.status}</Badge>
                  </div>
                  <a href={sub.website_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline mb-2 block truncate">{sub.website_url}</a>
                  <p className="text-sm text-muted-foreground mb-1">{sub.tagline}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{sub.description}</p>
                  {sub.notes && <p className="text-xs text-muted-foreground mt-1 italic">Notes: {sub.notes}</p>}
                  <p className="text-xs text-muted-foreground mt-2">
                    {sub.submitter_email && <span className="mr-3">From: {sub.submitter_email}</span>}
                    {new Date(sub.created_at).toLocaleDateString()}
                  </p>
                </div>
                {sub.status === 'pending' && (
                  <SubmissionActions
                    submissionId={sub.id}
                    submission={{
                      name: sub.name,
                      website_url: sub.website_url,
                      tagline: sub.tagline,
                      description: sub.description,
                      pricing_model: sub.pricing_model,
                      category_id: sub.category_id,
                    }}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
