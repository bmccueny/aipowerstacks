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
      <h1 className="text-3xl font-bold mb-8">Users ({users.length})</h1>

      <div className="glass-card rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left p-3 font-medium text-muted-foreground">Name</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Username</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Role</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Change Role</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Joined</th>
              <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                <td className="p-3 font-medium">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 border border-white/10">
                      <AvatarImage src={u.avatar_url ?? undefined} />
                      <AvatarFallback className="text-[10px] font-black">
                        {(u.display_name || u.username || 'U')[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span>{u.display_name ?? 'Anonymous'}</span>
                  </div>
                </td>
                <td className="p-3 text-muted-foreground">{u.username ?? '—'}</td>
                <td className="p-3">
                  <Badge variant="outline" className={`text-xs ${roleColors[u.role] ?? ''}`}>{u.role}</Badge>
                </td>
                <td className="p-3">
                  <UserRoleActions userId={u.id} currentRole={u.role} />
                </td>
                <td className="p-3 text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
                <td className="p-3 text-right">
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
