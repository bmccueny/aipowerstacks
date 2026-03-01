'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog,
  DialogTrigger,
  DialogPortal,
} from '@/components/ui/dialog'
import { Dialog as DialogPrimitive } from 'radix-ui'
import { Button } from '@/components/ui/button'
import { MessageSquare, Send, Loader2, X as XIcon } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

interface DirectMessageDialogProps {
  receiverId: string
  receiverName: string
  receiverUsername: string
  receiverAvatar?: string | null
  currentUserId?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function DirectMessageDialog({
  receiverId,
  receiverName,
  receiverUsername,
  receiverAvatar,
  currentUserId,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
}: DirectMessageDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  
  const open = externalOpen !== undefined ? externalOpen : internalOpen
  const setOpen = (val: boolean) => {
    if (externalOnOpenChange) {
      externalOnOpenChange(val)
    } else {
      setInternalOpen(val)
    }
  }

  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [messages, setMessages] = useState<any[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)

  const supabase = createClient()

  const fetchMessages = async () => {
    if (!currentUserId) return
    setFetching(true)
    const { data, error } = await supabase
      .from('direct_messages')
      .select('*')
      .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${currentUserId})`)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching messages:', error)
    } else {
      setMessages(data || [])
      // Mark as read
      const unreadIds = (data as any[] || [])
        .filter(m => m.receiver_id === currentUserId && !m.is_read)
        .map(m => m.id as string)
      
      if (unreadIds.length > 0) {
        await supabase
          .from('direct_messages')
          .update({ is_read: true })
          .in('id', unreadIds)
      }
    }
    setFetching(false)
  }

  useEffect(() => {
    if (open && currentUserId) {
      fetchMessages()

      // Subscribe to new messages
      const channel = supabase
        .channel(`dm_${currentUserId}_${receiverId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'direct_messages',
            filter: `receiver_id=eq.${currentUserId}`,
          },
          (payload) => {
            if (payload.new.sender_id === receiverId) {
              setMessages((prev) => [...prev, payload.new])
            }
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [open, currentUserId, receiverId])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!content.trim() || !currentUserId) return

    setLoading(true)
    const newMessage = {
      sender_id: currentUserId,
      receiver_id: receiverId,
      content: content.trim(),
    }

    const { data, error } = await supabase
      .from('direct_messages')
      .insert(newMessage)
      .select()
      .single()

    if (error) {
      toast.error('Failed to send message')
    } else {
      setMessages((prev) => [...prev, data])
      setContent('')
    }
    setLoading(false)
  }

  if (!currentUserId) {
    return (
      <Button variant="outline" className="w-full gap-2" onClick={() => toast.error('Please log in to send messages')}>
        <MessageSquare className="h-4 w-4" /> Message
      </Button>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen} modal={false}>
      {externalOpen === undefined && (
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full gap-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5">
            <MessageSquare className="h-4 w-4 text-primary" /> Message
          </Button>
        </DialogTrigger>
      )}
      <DialogPortal>
        <DialogPrimitive.Content 
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          className="fixed bottom-0 right-0 sm:bottom-4 sm:right-4 z-50 w-full sm:max-w-[400px] bg-background border border-foreground/10 shadow-2xl flex flex-col h-[500px] sm:h-[600px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:slide-in-from-bottom-full data-[state=closed]:slide-out-to-bottom-full duration-300 rounded-t-2xl sm:rounded-2xl outline-none"
        >
          <div className="p-4 border-b border-foreground/10 bg-muted/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border border-primary/20">
                <AvatarImage src={receiverAvatar ?? undefined} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                  {receiverName[0]}
                </AvatarFallback>
              </Avatar>
              <div className="text-left">
                <DialogPrimitive.Title asChild>
                  <h2 className="text-base font-black leading-none">{receiverName}</h2>
                </DialogPrimitive.Title>
                <p className="text-xs text-muted-foreground mt-1">@{receiverUsername}</p>
              </div>
            </div>
            <DialogPrimitive.Close asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <XIcon className="h-4 w-4" />
              </Button>
            </DialogPrimitive.Close>
          </div>

          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/50"
          >
            {fetching && messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-primary/40" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="h-12 w-12 rounded-full bg-primary/5 flex items-center justify-center mb-3">
                  <MessageSquare className="h-6 w-6 text-primary/40" />
                </div>
                <p className="text-sm font-medium text-foreground/60">No messages yet</p>
                <p className="text-xs text-muted-foreground mt-1">Start a conversation with {receiverName}</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMine = msg.sender_id === currentUserId
                return (
                  <div 
                    key={msg.id}
                    className={cn(
                      "flex flex-col max-w-[80%]",
                      isMine ? "ml-auto items-end" : "mr-auto items-start"
                    )}
                  >
                    <div 
                      className={cn(
                        "px-4 py-2 rounded-2xl text-sm",
                        isMine 
                          ? "bg-primary text-primary-foreground rounded-tr-none shadow-sm" 
                          : "bg-muted text-foreground rounded-tl-none border border-foreground/5"
                      )}
                    >
                      {msg.content}
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-1 px-1">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )
              })
            )}
          </div>

          <form 
            onSubmit={handleSend}
            className="p-4 border-t border-foreground/10 bg-background flex items-center gap-2"
          >
            <input
              placeholder="Type a message..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="flex-1 bg-muted/50 border-none rounded-full px-4 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
              disabled={loading}
            />
            <Button 
              type="submit" 
              size="icon" 
              className="rounded-full shrink-0 h-9 w-9"
              disabled={loading || !content.trim()}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  )
}
