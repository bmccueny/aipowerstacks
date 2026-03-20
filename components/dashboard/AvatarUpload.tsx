'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Upload, Link as LinkIcon, Check, X, LayoutGrid } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { PIXEL_AVATARS } from '@/lib/constants/avatars'
import { cn } from '@/lib/utils'

interface AvatarUploadProps {
  userId: string
  displayName?: string | null
  username?: string | null
  initialAvatarUrl?: string | null
  onSuccess?: (url: string) => void
}

export function AvatarUpload({ userId, displayName, username, initialAvatarUrl, onSuccess }: AvatarUploadProps) {
  const [url, setUrl] = useState(initialAvatarUrl || '')
  const [linkInput, setLinkInput] = useState('')
  const [uploading, setUploading] = useState(false)
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [showGallery, setShowGallery] = useState(false)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const supabase = createClient()

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)
      const file = e.target.files?.[0]
      if (!file) return

      const fileExt = file.name.split('.').pop()
      const filePath = `${userId}/${Math.random()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
      const publicUrl = data.publicUrl

      await updateProfile(publicUrl)
      setUrl(publicUrl)
      toast.success('Avatar updated successfully!')
      onSuccess?.(publicUrl)
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Error uploading avatar')
    } finally {
      setUploading(false)
    }
  }

  const handleLinkSubmit = async () => {
    if (!linkInput.trim()) return
    try {
      setSaving(true)
      await updateProfile(linkInput.trim())
      setUrl(linkInput.trim())
      setShowLinkInput(false)
      setLinkInput('')
      toast.success('Avatar updated successfully!')
      onSuccess?.(linkInput.trim())
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Error updating avatar')
    } finally {
      setSaving(false)
    }
  }

  const handleGallerySelect = async (avatarUrl: string) => {
    try {
      setSaving(true)
      await updateProfile(avatarUrl)
      setUrl(avatarUrl)
      setShowGallery(false)
      toast.success('Avatar updated successfully!')
      onSuccess?.(avatarUrl)
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Error updating avatar')
    } finally {
      setSaving(false)
    }
  }

  const updateProfile = async (avatarUrl: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('id', userId)

    if (error) throw error
    // Refresh the page to show changes globally
    window.location.reload()
  }

  const initials = (displayName || username || 'U')[0].toUpperCase()

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-6">
        <div className="relative shrink-0">
          <Avatar className="h-24 w-24 border-[3px] border-primary/20 shadow-md">
            <AvatarImage src={url} className="object-cover" />
            <AvatarFallback className="bg-primary/10 text-primary text-3xl font-black">
              {initials}
            </AvatarFallback>
          </Avatar>
          
          {(uploading || saving) && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-background/60 backdrop-blur-sm z-20">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
        </div>

        {!isEditing ? (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsEditing(true)}
            className="font-bold border-foreground/20"
          >
            Edit Profile
          </Button>
        ) : (
          <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-left-2">
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                className="relative cursor-pointer font-bold"
                disabled={uploading || saving}
                asChild
              >
                <label>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={uploading || saving}
                  />
                </label>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="font-bold"
                onClick={() => {
                  setShowGallery(!showGallery)
                  setShowLinkInput(false)
                }}
                disabled={uploading || saving}
              >
                <LayoutGrid className="mr-2 h-4 w-4" />
                Gallery
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="font-bold"
                onClick={() => {
                  setShowLinkInput(!showLinkInput)
                  setShowGallery(false)
                }}
                disabled={uploading || saving}
              >
                <LinkIcon className="mr-2 h-4 w-4" />
                Link
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setIsEditing(false)
                  setShowLinkInput(false)
                  setShowGallery(false)
                }}
                disabled={uploading || saving}
              >
                Cancel
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
              JPG, PNG or SVG. Max 2MB.
            </p>
          </div>
        )}
      </div>

      {isEditing && (
        <div className="space-y-4">
          {showGallery && (
            <div className="p-4 glass rounded-xl border border-primary/10 animate-in fade-in slide-in-from-top-2">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Choose a pixel companion</p>
              <div className="grid grid-cols-5 gap-3">
                {PIXEL_AVATARS.map((avatar, i) => (
                  <button
                    key={i}
                    onClick={() => handleGallerySelect(avatar)}
                    className={cn(
                      "relative h-12 w-12 rounded-lg overflow-hidden border-2 transition-all hover:scale-110 active:scale-95",
                      url === avatar ? "border-primary shadow-[0_0_10px_oklch(0.79_0.17_355_/_0.3)]" : "border-transparent hover:border-primary/40"
                    )}
                  >
                    <img src={avatar} alt={`Avatar option ${i + 1}`} className="object-cover" />
                    {url === avatar && (
                      <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                        <Check className="h-4 w-4 text-primary" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {showLinkInput && (
            <div className="flex animate-in fade-in slide-in-from-top-2 gap-2 max-w-sm">
              <Input
                placeholder="Paste image URL (https://...)"
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                className="h-9 text-sm"
                onKeyDown={(e) => e.key === 'Enter' && handleLinkSubmit()}
              />
              <Button size="sm" onClick={handleLinkSubmit} disabled={saving || !linkInput.trim()}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowLinkInput(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
