import Link from 'next/link'
import {
  LayoutDashboard, Wrench, InboxIcon, FolderOpen,
  FileText, Users, Sparkles, Star
} from 'lucide-react'

const adminNavItems = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/control-center', label: 'Control Center', icon: LayoutDashboard },
  { href: '/admin/tools', label: 'Tools', icon: Wrench },
  { href: '/admin/submissions', label: 'Submissions', icon: InboxIcon },
  { href: '/admin/reviews', label: 'Reviews', icon: Star },
  { href: '/admin/categories', label: 'Categories', icon: FolderOpen },
  { href: '/admin/blog', label: 'Blog', icon: FileText },
  { href: '/admin/users', label: 'Users', icon: Users },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 shrink-0 border-r border-white/10 glass flex flex-col">
        <div className="p-4 border-b border-white/10">
          <Link href="/admin" className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-bold">AIPowerStacks Admin</span>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {adminNavItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10">
          <Link href="/" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Back to site
          </Link>
        </div>
      </aside>
      <div className="flex-1 overflow-auto">
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
