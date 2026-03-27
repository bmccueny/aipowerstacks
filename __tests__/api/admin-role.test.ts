import { vi, describe, it, expect, beforeEach } from 'vitest'
import { makeChain, makeSupabaseMock } from '../helpers/supabase'

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: vi.fn() }))

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { PUT } from '@/app/api/admin/users/[id]/role/route'

const mockCreateClient = vi.mocked(createClient)
const mockCreateAdminClient = vi.mocked(createAdminClient)

const ADMIN_ID = 'admin-user-id'
const TARGET_ID = 'target-user-id'

function makeParams(id = TARGET_ID) {
  return { params: Promise.resolve({ id }) }
}

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/admin/users/target/role', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function mockAdminUser() {
  const profileChain = makeChain({ data: { role: 'admin' }, error: null })
  mockCreateClient.mockResolvedValue(makeSupabaseMock({
    user: { id: ADMIN_ID },
    tables: { profiles: profileChain },
  }) as any)
}

describe('PUT /api/admin/users/[id]/role', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns 403 when unauthenticated', async () => {
    mockCreateClient.mockResolvedValue(makeSupabaseMock({ user: null }) as any)
    const res = await PUT(makeRequest({ role: 'editor' }), makeParams())
    expect(res.status).toBe(403)
  })

  it('returns 403 when caller is not an admin', async () => {
    const profileChain = makeChain({ data: { role: 'user' }, error: null })
    mockCreateClient.mockResolvedValue(makeSupabaseMock({
      user: { id: ADMIN_ID },
      tables: { profiles: profileChain },
    }) as any)

    const res = await PUT(makeRequest({ role: 'editor' }), makeParams())
    expect(res.status).toBe(403)
  })

  it('returns 400 for an invalid role value', async () => {
    mockAdminUser()
    const res = await PUT(makeRequest({ role: 'superuser' }), makeParams())
    expect(res.status).toBe(400)
  })

  it('returns 400 when admin tries to remove their own admin role', async () => {
    mockAdminUser()
    // Pass the admin's own ID as the target
    const res = await PUT(makeRequest({ role: 'editor' }), makeParams(ADMIN_ID))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('cannot remove your own admin role')
  })

  it('returns 200 with updated profile on success', async () => {
    mockAdminUser()

    const updatedProfile = { id: TARGET_ID, role: 'editor' }
    const adminProfileChain = makeChain({ data: updatedProfile, error: null })
    mockCreateAdminClient.mockReturnValue({
      from: vi.fn().mockReturnValue(adminProfileChain),
    } as any)

    const res = await PUT(makeRequest({ role: 'editor' }), makeParams())
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.profile).toEqual(updatedProfile)
  })

  it('allows an admin to assign the editor role to another user', async () => {
    mockAdminUser()

    const adminProfileChain = makeChain({ data: { id: TARGET_ID, role: 'editor' }, error: null })
    mockCreateAdminClient.mockReturnValue({
      from: vi.fn().mockReturnValue(adminProfileChain),
    } as any)

    const res = await PUT(makeRequest({ role: 'editor' }), makeParams())
    expect(res.status).toBe(200)
  })

  it('allows an admin to promote another user to admin', async () => {
    mockAdminUser()

    const adminProfileChain = makeChain({ data: { id: TARGET_ID, role: 'admin' }, error: null })
    mockCreateAdminClient.mockReturnValue({
      from: vi.fn().mockReturnValue(adminProfileChain),
    } as any)

    const res = await PUT(makeRequest({ role: 'admin' }), makeParams())
    expect(res.status).toBe(200)
  })
})
