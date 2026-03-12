'use client'

import { Wrench, InboxIcon, Star, Users } from 'lucide-react'

interface Props {
  tools: number
  submissions: number
  reviews: number
  users: number
}

export function AdminOverviewStats({ tools, submissions, reviews, users }: Props) {
  const stats = [
    { label: 'Published Tools', count: tools, icon: Wrench, color: 'text-blue-400' },
    { label: 'Pending Submissions', count: submissions, icon: InboxIcon, color: 'text-amber-400' },
    { label: 'Total Reviews', count: reviews, icon: Star, color: 'text-yellow-400' },
    { label: 'Registered Users', count: users, icon: Users, color: 'text-emerald-400' },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
      {stats.map(({ label, count, icon: Icon, color }) => (
        <div key={label} className="bg-card/50 border border-border/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
            <Icon className={`h-4 w-4 ${color}`} />
          </div>
          <p className="text-2xl lg:text-3xl font-semibold">{count.toLocaleString()}</p>
        </div>
      ))}
    </div>
  )
}
