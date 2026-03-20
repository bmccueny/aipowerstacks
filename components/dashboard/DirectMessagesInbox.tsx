'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { MessageSquare, Loader2 } from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { DirectMessageDialog } from '@/components/curators/DirectMessageDialog'

type ConversationUser = {
  id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
}

type DirectMessage = {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  is_read: boolean
  created_at: string
  sender: ConversationUser | null
  receiver: ConversationUser | null
}

type Conversation = {
  user: ConversationUser
  lastMessage: DirectMessage
  unreadCount: number
}

export function DirectMessagesInbox({ currentUserId }: { currentUserId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedChat, setSelectedChat] = useState<ConversationUser | null>(null)
  const [chatOpen, setChatOpen] = useState(false)

  const supabase = createClient()

  const fetchConversations = async () => {
    if (!currentUserId) return
    setLoading(true)
    
    const { data, error } = await supabase
      .from('direct_messages')
      .select(`
        *,
        sender:sender_id(id, username, display_name, avatar_url),
        receiver:receiver_id(id, username, display_name, avatar_url)
      `)
      .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching conversations:', error)
    } else {
      const groups: Record<string, Conversation> = {}
      ;(data as unknown as DirectMessage[])?.forEach((msg) => {
        const otherUser = msg.sender_id === currentUserId ? msg.receiver : msg.sender
        if (!otherUser) return
        if (!groups[otherUser.id]) {
          groups[otherUser.id] = {
            user: otherUser,
            lastMessage: msg,
            unreadCount: (msg.receiver_id === currentUserId && !msg.is_read) ? 1 : 0
          }
        } else if (msg.receiver_id === currentUserId && !msg.is_read) {
          groups[otherUser.id].unreadCount += 1
        }
      })
      setConversations(Object.values(groups))
    }
    setLoading(false)
  }

  useEffect(() => {
    if (open) {
      fetchConversations()
      
      const channel = supabase
        .channel('inbox_updates')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'direct_messages' }, () => {
          fetchConversations()
        })
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [open, currentUserId])

  const handleOpenChat = (user: ConversationUser) => {
    setSelectedChat(user)
    setChatOpen(true)
    // We keep the inbox sheet open or close it? 
    // Usually closing the inbox sheet is better to focus on the chat.
    setOpen(false)
  }

  const totalUnread = conversations.reduce((acc, conv) => acc + conv.unreadCount, 0)

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" className="relative gap-2 font-bold border-primary/20 hover:border-primary/40 hover:bg-primary/5">
            <MessageSquare className="h-4 w-4 text-primary" />
            Messages
            {totalUnread > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-black animate-in zoom-in">
                {totalUnread}
              </span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col gap-0">
          <SheetHeader className="p-6 border-b border-foreground/10 bg-muted/30">
            <SheetTitle className="text-xl font-black flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" /> Direct Messages
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto">
            {loading && conversations.length === 0 ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-6 w-6 animate-spin text-primary/40" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center p-8">
                <div className="h-16 w-12 rounded-2xl border-2 border-dashed border-foreground/10 flex items-center justify-center mb-4">
                  <MessageSquare className="h-6 w-6 text-muted-foreground/40" />
                </div>
                <p className="text-base font-bold text-foreground/60">Your inbox is empty</p>
                <p className="text-sm text-muted-foreground mt-1">Messages from curators you connect with will appear here.</p>
              </div>
            ) : (
              <div className="divide-y divide-foreground/5">
                {conversations.map((conv) => (
                  <button
                    key={conv.user.id}
                    onClick={() => handleOpenChat(conv.user)}
                    className="w-full p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors text-left group"
                  >
                    <div className="relative shrink-0">
                      <Avatar className="h-12 w-12 border border-primary/10">
                        <AvatarImage src={conv.user.avatar_url ?? undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">
                          {conv.user.display_name?.[0] || conv.user.username?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      {conv.unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-primary border-2 border-background" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <p className="font-bold text-sm truncate group-hover:text-primary transition-colors">
                          {conv.user.display_name || conv.user.username}
                        </p>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {new Date(conv.lastMessage.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className={cn(
                        "text-xs truncate",
                        conv.unreadCount > 0 ? "text-foreground font-semibold" : "text-muted-foreground"
                      )}>
                        {conv.lastMessage.sender_id === currentUserId ? 'You: ' : ''}
                        {conv.lastMessage.content}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {selectedChat && (
        <DirectMessageDialog
          receiverId={selectedChat.id}
          receiverName={selectedChat.display_name || selectedChat.username || 'User'}
          receiverUsername={selectedChat.username || ''}
          receiverAvatar={selectedChat.avatar_url ?? undefined}
          currentUserId={currentUserId}
          open={chatOpen}
          onOpenChange={(val) => {
            setChatOpen(val)
            if (!val) setSelectedChat(null)
          }}
        />
      )}
    </>
  )
}
