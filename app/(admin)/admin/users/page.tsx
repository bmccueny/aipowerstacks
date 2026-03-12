import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import { Badge } from '@/components/ui/badge'
import { UserRoleActions } from '@/components/admin/UserRoleActions'
import { DeleteUserButton } from '@/components/admin/DeleteUserButton'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

export const metadata: Metadata = { title: 'Manage Users' }

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('id, display_name, username, role, avatar_url, created_at')
    .order('created_at', { ascending: false })
    .limit(50)

  const users = (data ?? []) as {
    id: string
    display_name: string | null
    username: string | null
    role: 'user' | 'editor' | 'admin'
    avatar_url: string | null
    created_at: string
  }[]

  const roleColors: Record<string, string> = {
    admin: 'bg-red-500/20 text-red-400 border-red-500/30',
    editor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    user: 'bg-white/10 text-muted-foreground border-white/20',
  }

  return (
    <div>
      <h1 className="text-2xl lg:text-3xl font-semibold mb-6">Users ({users.length})</h1>

      <div className="bg-card/50 border border-border/50 rounded-lg overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Username</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Role</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Change Role</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Joined</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                <td className="px-4 py-3 font-medium">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 border border-border/50 shrink-0">
                      <AvatarImage src={u.avatar_url ?? undefined} />
                      <AvatarFallback className="text-[10px] font-black">
                        {(u.display_name || u.username || 'U')[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate">{u.display_name ?? 'Anonymous'}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{u.username ?? '—'}</td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className={`text-xs ${roleColors[u.role] ?? ''}`}>{u.role}</Badge>
                </td>
                <td className="px-4 py-3">
                  <UserRoleActions userId={u.id} currentRole={u.role} />
                </td>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{new Date(u.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-right">
                  <DeleteUserButton userId={u.id} userName={u.display_name || u.username || 'User'} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && <div className="p-8 text-center text-muted-foreground">No users yet.</div>}
      </div>
    </div>
  )
}
