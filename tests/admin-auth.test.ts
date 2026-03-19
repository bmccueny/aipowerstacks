import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Supabase modules before importing
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    getAll: () => [],
    set: vi.fn(),
  })),
}))

import { requireRole } from '@/lib/supabase/admin-auth'
import { createClient } from '@/lib/supabase/server'

const mockCreateClient = vi.mocked(createClient)

function createMockSupabase(user: { id: string } | null, role: string | null) {
  const mockSingle = vi.fn().mockResolvedValue({
    data: role ? { role } : null,
    error: null,
  })
  const mockEq = vi.fn().mockReturnValue({ single: mockSingle })
  const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
  const mockFrom = vi.fn().mockReturnValue({ select: mockSelect })

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user },
      }),
    },
    from: mockFrom,
  } as any
}

describe('requireRole', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when no user is authenticated', async () => {
    mockCreateClient.mockResolvedValue(createMockSupabase(null, null))

    const result = await requireRole('admin')
    expect(result.error).not.toBeNull()
    const response = result.error!
    expect(response.status).toBe(401)
  })

  it('returns 403 when user is not admin', async () => {
    mockCreateClient.mockResolvedValue(
      createMockSupabase({ id: 'user-1' }, 'user')
    )

    const result = await requireRole('admin')
    expect(result.error).not.toBeNull()
    const response = result.error!
    expect(response.status).toBe(403)
  })

  it('returns user when user is admin', async () => {
    mockCreateClient.mockResolvedValue(
      createMockSupabase({ id: 'admin-1' }, 'admin')
    )

    const result = await requireRole('admin')
    expect(result.error).toBeNull()
    expect(result.user?.id).toBe('admin-1')
  })

  it('allows editor role for editor check', async () => {
    mockCreateClient.mockResolvedValue(
      createMockSupabase({ id: 'editor-1' }, 'editor')
    )

    const result = await requireRole('editor')
    expect(result.error).toBeNull()
    expect(result.user?.id).toBe('editor-1')
  })

  it('allows admin for editor role check', async () => {
    mockCreateClient.mockResolvedValue(
      createMockSupabase({ id: 'admin-1' }, 'admin')
    )

    const result = await requireRole('editor')
    expect(result.error).toBeNull()
  })

  it('rejects user role for editor check', async () => {
    mockCreateClient.mockResolvedValue(
      createMockSupabase({ id: 'user-1' }, 'user')
    )

    const result = await requireRole('editor')
    expect(result.error).not.toBeNull()
    expect(result.error!.status).toBe(403)
  })
})
