'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

type UserRole = 'user' | 'editor' | 'admin'

interface UserRoleActionsProps {
  userId: string
  currentRole: UserRole
}

export function UserRoleActions({ userId, currentRole }: UserRoleActionsProps) {
  const [role, setRole] = useState<UserRole>(currentRole)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const hasChanges = role !== currentRole
  const getErrorMessage = (value: unknown) => {
    if (typeof value === 'string') return value
    return 'Failed to update role'
  }

  const handleSave = async () => {
    if (!hasChanges) return
    setLoading(true)
    setError('')
    setSaved(false)

    const res = await fetch(`/api/admin/users/${userId}/role`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(getErrorMessage(data.error))
      setLoading(false)
      return
    }

    setSaved(true)
    setLoading(false)
    setTimeout(() => setSaved(false), 1400)
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={role}
        onChange={(e) => setRole(e.target.value as UserRole)}
        className="glass-card border border-border/30 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
      >
        <option value="user">user</option>
        <option value="editor">editor</option>
        <option value="admin">admin</option>
      </select>
      <Button size="sm" variant="outline" onClick={handleSave} disabled={!hasChanges || loading}>
        {loading ? 'Saving...' : saved ? 'Saved' : 'Save'}
      </Button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  )
}
