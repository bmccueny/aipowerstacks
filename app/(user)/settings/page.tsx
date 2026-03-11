'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useRouter } from 'next/navigation'
import { Linkedin, Github, ShieldCheck, ExternalLink, Twitter, Youtube, Instagram, Globe, Plus, X, Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'
import { useLiquidGlass } from '@/hooks/useLiquidGlass'

type SocialLink = { platform: string; url: string }

const PLATFORMS = [
  { id: 'twitter',   label: 'Twitter / X', icon: Twitter,   placeholder: 'https://twitter.com/username' },
  { id: 'linkedin',  label: 'LinkedIn',     icon: Linkedin,  placeholder: 'https://linkedin.com/in/username' },
  { id: 'github',    label: 'GitHub',       icon: Github,    placeholder: 'https://github.com/username' },
  { id: 'youtube',   label: 'YouTube',      icon: Youtube,   placeholder: 'https://youtube.com/@username' },
  { id: 'instagram', label: 'Instagram',    icon: Instagram, placeholder: 'https://instagram.com/username' },
  { id: 'website',   label: 'Website',      icon: Globe,     placeholder: 'https://yourwebsite.com' },
] as const

export default function SettingsPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const { theme, setTheme } = useTheme()

  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [githubUrl, setGithubUrl] = useState('')
  const [isVerified, setIsVerified] = useState(false)
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([])
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
        .select('display_name, username, avatar_url, linkedin_url, github_url, is_identity_verified, social_links')
        .eq('id', data.user.id)
        .maybeSingle()
        .then(({ data: row }) => {
          const profile = row as any
          if (profile) {
            setDisplayName(profile.display_name ?? '')
            setUsername(profile.username ?? '')
            setAvatarUrl(profile.avatar_url ?? null)
            setLinkedinUrl(profile.linkedin_url ?? '')
            setGithubUrl(profile.github_url ?? '')
            setIsVerified(profile.is_identity_verified ?? false)
            setSocialLinks(Array.isArray(profile.social_links) ? profile.social_links : [])
          }
        })
    })
  }, [])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploading(true)
    setMessage('')
    setError('')

    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `${user.id}/avatar.${ext}`

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
    setMessage('Photo uploaded. Click Save Changes to persist it.')
    setUploading(false)
  }

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    setMessage('')
    setError('')

    if (username && !/^[a-z0-9_]+$/.test(username)) {
      setError('Username can only contain lowercase letters, numbers, and underscores.')
      setSaving(false)
      return
    }

    const supabase = createClient()
    const { error: updateError } = await supabase
      .from('profiles')
      .upsert(
        { 
          id: user.id, 
          display_name: displayName || null, 
          username: username.toLowerCase() || null,
          avatar_url: avatarUrl,
          linkedin_url: linkedinUrl || null,
          github_url: githubUrl || null,
          social_links: socialLinks.filter((l) => l.url.trim()),
          updated_at: new Date().toISOString()
        },
        { onConflict: 'id' }
      )

    if (updateError) {
      if (updateError.code === '23505') {
        setError('This username is already taken. Please choose another one.')
      } else {
        setError(updateError.message)
      }
    } else {
      setMessage('Settings saved.')
      window.dispatchEvent(new Event('profile-updated'))
      router.refresh()
    }
    setSaving(false)
  }

  const glassRef = useLiquidGlass<HTMLDivElement>({ radius: 12 })

  if (!user) return null

  const initials = (displayName || user.email || '?')[0].toUpperCase()

  return (
    <div className="max-w-lg">
      <h1 className="text-3xl font-bold mb-8">Account Settings</h1>

      <div ref={glassRef} className="liquid-glass glass-card rounded-xl p-6 space-y-6 border border-white/15">
        <div>
          <p className="text-sm font-medium mb-3">Profile Photo</p>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={avatarUrl ?? undefined} className="object-cover" />
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
          <label className="text-sm font-medium mb-1.5 block">Username</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              placeholder="username"
              className="bg-white/5 border-white/10 pl-7"
              maxLength={20}
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">Unique handle for your public profile. Alphanumeric and underscores only.</p>
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

        <div className="pt-4 border-t border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold">Social Links</h2>
            <span className="text-xs text-muted-foreground">{socialLinks.length}/5</span>
          </div>
          <div className="space-y-2">
            {socialLinks.map((link, i) => {
              const platform = PLATFORMS.find((p) => p.id === link.platform) ?? PLATFORMS[0]
              const Icon = platform.icon
              return (
                <div key={i} className="flex items-center gap-2">
                  <div className="flex items-center gap-2 flex-1 bg-white/5 border border-white/10 rounded-md px-3 h-10 min-w-0">
                    <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <select
                      value={link.platform}
                      onChange={(e) => {
                        const updated = [...socialLinks]
                        updated[i] = { ...updated[i], platform: e.target.value }
                        setSocialLinks(updated)
                      }}
                      className="bg-transparent text-xs text-muted-foreground border-none outline-none shrink-0"
                    >
                      {PLATFORMS.map((p) => (
                        <option key={p.id} value={p.id}>{p.label}</option>
                      ))}
                    </select>
                    <div className="w-px h-4 bg-white/10 shrink-0" />
                    <input
                      type="url"
                      value={link.url}
                      onChange={(e) => {
                        const updated = [...socialLinks]
                        updated[i] = { ...updated[i], url: e.target.value }
                        setSocialLinks(updated)
                      }}
                      placeholder={platform.placeholder}
                      className="flex-1 bg-transparent text-sm outline-none min-w-0"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setSocialLinks(socialLinks.filter((_, j) => j !== i))}
                    className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )
            })}
          </div>
          {socialLinks.length < 5 && (
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setSocialLinks([...socialLinks, { platform: 'twitter', url: '' }])}
              className="border-white/10 text-xs"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Social
            </Button>
          )}
        </div>

        <div className="pt-4 border-t border-white/10 space-y-4">
          <h2 className="text-base font-bold flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" /> Professional Identity
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Linking your professional profiles adds weight to your reviews and stacks. Verified pros get a special badge.
          </p>
          
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block">LinkedIn Profile</label>
              <div className="relative">
                <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                  className="bg-white/5 border-white/10 pl-10 h-10 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block">GitHub Profile</label>
              <div className="relative">
                <Github className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/username"
                  className="bg-white/5 border-white/10 pl-10 h-10 text-sm"
                />
              </div>
            </div>
          </div>

          {!isVerified ? (
            <div className="bg-primary/5 border border-primary/20 rounded-md p-4">
              <p className="text-xs font-bold text-primary mb-1">Request Verification</p>
              <p className="text-[11px] text-muted-foreground mb-3">Once your profiles are linked, our team will review your identity.</p>
              <Button variant="outline" size="sm" className="h-8 text-[10px] uppercase font-black tracking-wider border-primary/30 text-primary hover:bg-primary/10">
                Apply for Verified Badge
              </Button>
            </div>
          ) : (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-md p-3 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span className="text-xs font-bold text-emerald-500">Identity Verified</span>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-white/10 space-y-4">
          <h2 className="text-base font-bold">Appearance</h2>
          <p className="text-xs text-muted-foreground">
            Choose your preferred color theme. System will follow your device setting.
          </p>
          <div className="grid grid-cols-3 gap-2">
            {([
              { value: 'light', label: 'Light', icon: Sun },
              { value: 'dark',  label: 'Dark',  icon: Moon },
              { value: 'system', label: 'System', icon: Monitor },
            ] as const).map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setTheme(value)}
                className={`flex flex-col items-center gap-2 p-3 rounded-md border text-sm font-medium transition-colors
                  ${theme === value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-white/10 bg-white/5 text-muted-foreground hover:border-white/20 hover:text-foreground'
                  }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
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
