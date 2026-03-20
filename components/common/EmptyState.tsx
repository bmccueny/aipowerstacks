import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: { label: string; href: string } | { label: string; onClick: () => void }
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="glass-card flex flex-col items-center justify-center gap-4 rounded-2xl px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {action && (
        'href' in action ? (
          <Link href={action.href} className="btn-primary px-4 py-2 text-sm">
            {action.label}
          </Link>
        ) : (
          <button onClick={action.onClick} className="btn-primary px-4 py-2 text-sm">
            {action.label}
          </button>
        )
      )}
    </div>
  )
}
