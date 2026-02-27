'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login'); return }
      setUser(data.user)
      supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('id', data.user.id)
        .single()
        .then(({ data: row }) => {
          const profile = row as { display_name: string | null; avatar_url: string | null } | null
          if (profile) {
            setDisplayName(profile.display_name ?? '')
            setAvatarUrl(profile.avatar_url ?? null)
          }
        })
    })
  }, [])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploading(true)
    setError('')

    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `avatars/${user.id}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true })

    if (uploadError) {
      setError(uploadError.message)
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
    setAvatarUrl(publicUrl)
    setUploading(false)
  }

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    setMessage('')
    setError('')

    const supabase = createClient()
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ display_name: displayName || null, avatar_url: avatarUrl })
      .eq('id', user.id)

    if (updateError) {
      setError(updateError.message)
    } else {
      setMessage('Settings saved.')
    }
    setSaving(false)
  }

  if (!user) return null

  const initials = (displayName || user.email || '?')[0].toUpperCase()

  return (
    <div className="max-w-lg">
      <h1 className="text-3xl font-bold mb-8">Account Settings</h1>

      <div className="glass-card rounded-xl p-6 space-y-6">
        <div>
          <p className="text-sm font-medium mb-3">Profile Photo</p>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={avatarUrl ?? undefined} />
              <AvatarFallback className="bg-primary/20 text-primary text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="border-white/10"
              >
                {uploading ? 'Uploading...' : 'Change Photo'}
              </Button>
              <p className="text-xs text-muted-foreground mt-1">JPG, PNG or WebP. Max 2MB.</p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-1.5 block">Display Name</label>
          <Input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
            className="bg-white/5 border-white/10"
            maxLength={60}
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-1.5 block">Email</label>
          <Input
            value={user.email ?? ''}
            disabled
            className="bg-white/5 border-white/10 opacity-60"
          />
          <p className="text-xs text-muted-foreground mt-1">Email cannot be changed here.</p>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {message && <p className="text-sm text-emerald-400">{message}</p>}

        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  )
}
