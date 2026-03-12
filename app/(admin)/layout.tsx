import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  LayoutDashboard, Wrench, InboxIcon, FolderOpen,
  FileText, Users, Sparkles, Star, Trophy, MessageSquare
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { AdminMobileNav } from '@/components/admin/AdminMobileNav'

const adminNavItems = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/control-center', label: 'Control Center', icon: LayoutDashboard },
  { href: '/admin/tools', label: 'Tools', icon: Wrench },
  { href: '/admin/submissions', label: 'Submissions', icon: InboxIcon },
  { href: '/admin/reviews', label: 'Reviews', icon: Star },
  { href: '/admin/categories', label: 'Categories', icon: FolderOpen },
  { href: '/admin/blog', label: 'Blog', icon: FileText },
  { href: '/admin/challenges', label: 'Challenges', icon: Trophy },
  { href: '/admin/social', label: 'Social', icon: MessageSquare },
  { href: '/admin/users', label: 'Users', icon: Users },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  let user = null
  let profile = null

  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    user = data?.user ?? null

    if (user) {
      const { data: p } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      profile = p
    }
  } catch {
    // Corrupted auth cookie or session recovery failure
  }

  if (!user) redirect('/login')
  if (!profile || profile.role !== 'admin') redirect('/')

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-56 shrink-0 border-r border-border/50 bg-background flex-col">
        <div className="h-14 flex items-center px-4 border-b border-border/50 shrink-0">
          <Link href="/admin" className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-semibold text-sm">AIPowerStacks</span>
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto py-2 px-2">
          {adminNavItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="px-2 py-3 border-t border-border/50 shrink-0">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            ← Back to site
          </Link>
        </div>
      </aside>

      {/* Mobile navigation */}
      <AdminMobileNav items={adminNavItems.map(({ href, label }) => ({ href, label }))} />

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <main className="p-4 pt-18 lg:p-8 lg:pt-8">
          {children}
        </main>
      </div>
    </div>
  )
}
