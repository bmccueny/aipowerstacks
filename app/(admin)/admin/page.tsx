import { createAdminClient } from '@/lib/supabase/admin'
import type { Metadata } from 'next'
import { AdminOverviewStats } from '@/components/admin/AdminOverviewStats'

export const metadata: Metadata = { title: 'Admin Overview' }

export default async function AdminDashboardPage() {
  const supabase = createAdminClient()

  const [toolsRes, submissionsRes, reviewsRes, usersRes] = await Promise.all([
    supabase.from('tools').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('tool_submissions').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('reviews').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
  ])

  return (
    <div>
      <h1 className="text-2xl lg:text-3xl font-semibold mb-6">Admin Overview</h1>
      <AdminOverviewStats
        tools={toolsRes.count ?? 0}
        submissions={submissionsRes.count ?? 0}
        reviews={reviewsRes.count ?? 0}
        users={usersRes.count ?? 0}
      />
    </div>
  )
}
