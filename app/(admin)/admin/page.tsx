import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import { Wrench, InboxIcon, Star, Users } from 'lucide-react'

export const metadata: Metadata = { title: 'Admin Overview' }

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  const [toolsRes, submissionsRes, reviewsRes, usersRes] = await Promise.all([
    supabase.from('tools').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('tool_submissions').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('reviews').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
  ])

  const stats = [
    { label: 'Published Tools', count: toolsRes.count ?? 0, icon: Wrench, color: 'text-blue-400' },
    { label: 'Pending Submissions', count: submissionsRes.count ?? 0, icon: InboxIcon, color: 'text-amber-400' },
    { label: 'Total Reviews', count: reviewsRes.count ?? 0, icon: Star, color: 'text-yellow-400' },
    { label: 'Registered Users', count: usersRes.count ?? 0, icon: Users, color: 'text-emerald-400' },
  ]

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Admin Overview</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map(({ label, count, icon: Icon, color }) => (
          <div key={label} className="glass-card rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground">{label}</p>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <p className="text-3xl font-bold">{count.toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
