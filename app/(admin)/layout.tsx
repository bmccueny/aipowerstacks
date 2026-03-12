import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminSidebar, AdminMobileNav } from '@/components/admin/AdminMobileNav'

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
      <AdminSidebar />
      <AdminMobileNav />
      <div className="flex-1 overflow-auto">
        <main className="p-4 pt-18 lg:p-8 lg:pt-8">
          {children}
        </main>
      </div>
    </div>
  )
}
