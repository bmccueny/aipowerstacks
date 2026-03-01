'use client'

import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const supabase = createClient()
    
    const fetchNotifications = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await (supabase as any)
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)
      
      setNotifications(data ?? [])
      setUnreadCount(data?.filter((n: any) => !n.is_read).length || 0)
    }

    fetchNotifications()

    // Real-time subscription
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => {
        fetchNotifications()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const markAsRead = async () => {
    if (unreadCount === 0) return
    const supabase = createClient()
    await (supabase as any)
      .from('notifications')
      .update({ is_read: true })
      .eq('is_read', false)
    
    setUnreadCount(0)
  }

  return (
    <DropdownMenu onOpenChange={(open) => open && markAsRead()}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="relative flex h-9 w-9 items-center justify-center rounded-full border border-transparent text-foreground hover:border-foreground transition-all duration-200 dark:text-white dark:hover:border-white/60 focus-visible:outline-none"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-xs text-muted-foreground">
            No notifications yet
          </div>
        ) : (
          <div className="max-h-64 overflow-y-auto">
            {notifications.map((n) => (
              <DropdownMenuItem key={n.id} className="flex flex-col items-start gap-1 p-3 cursor-default">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary shrink-0" style={{ opacity: n.is_read ? 0 : 1 }} />
                  <span className="text-[13px] font-medium leading-tight">{n.message}</span>
                </div>
                <span className="text-[10px] text-muted-foreground ml-4">
                  {new Date(n.created_at).toLocaleDateString()}
                </span>
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
