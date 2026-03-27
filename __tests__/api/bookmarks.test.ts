import { vi, describe, it, expect, beforeEach } from 'vitest'
import { makeChain, makeSupabaseMock } from '../helpers/supabase'

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))

import { createClient } from '@/lib/supabase/server'
import { GET, POST, DELETE } from '@/app/api/bookmarks/route'

const mockCreateClient = vi.mocked(createClient)
const USER_ID = 'user-abc'
const TOOL_ID = 'tool-xyz'

describe('GET /api/bookmarks', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns empty array when unauthenticated', async () => {
    mockCreateClient.mockResolvedValue(makeSupabaseMock({ user: null }) as any)
    const req = new Request('http://localhost/api/bookmarks')
    const res = await GET()
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.bookmarks).toEqual([])
  })

  it('returns bookmark tool IDs for authenticated user', async () => {
    const bookmarkChain = makeChain({ data: [{ tool_id: 'tool-1' }, { tool_id: 'tool-2' }] })
    mockCreateClient.mockResolvedValue(makeSupabaseMock({
      user: { id: USER_ID },
      tables: { bookmarks: bookmarkChain },
    }) as any)

    const res = await GET()
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.bookmarks).toEqual(['tool-1', 'tool-2'])
  })
})

describe('POST /api/bookmarks', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns 401 when unauthenticated', async () => {
    mockCreateClient.mockResolvedValue(makeSupabaseMock({ user: null }) as any)
    const req = new Request('http://localhost/api/bookmarks', {
      method: 'POST',
      body: JSON.stringify({ toolId: TOOL_ID }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 400 when toolId is missing', async () => {
    mockCreateClient.mockResolvedValue(makeSupabaseMock({ user: { id: USER_ID } }) as any)
    const req = new Request('http://localhost/api/bookmarks', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 200 on success', async () => {
    const bookmarkChain = makeChain({ error: null })
    mockCreateClient.mockResolvedValue(makeSupabaseMock({
      user: { id: USER_ID },
      tables: { bookmarks: bookmarkChain },
    }) as any)

    const req = new Request('http://localhost/api/bookmarks', {
      method: 'POST',
      body: JSON.stringify({ toolId: TOOL_ID }),
    })
    const res = await POST(req)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
  })

  it('inserts with the authenticated user ID', async () => {
    const bookmarkChain = makeChain({ error: null })
    mockCreateClient.mockResolvedValue(makeSupabaseMock({
      user: { id: USER_ID },
      tables: { bookmarks: bookmarkChain },
    }) as any)

    const req = new Request('http://localhost/api/bookmarks', {
      method: 'POST',
      body: JSON.stringify({ toolId: TOOL_ID }),
    })
    await POST(req)
    expect(bookmarkChain.insert).toHaveBeenCalledWith({ user_id: USER_ID, tool_id: TOOL_ID })
  })
})

describe('DELETE /api/bookmarks', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns 401 when unauthenticated', async () => {
    mockCreateClient.mockResolvedValue(makeSupabaseMock({ user: null }) as any)
    const req = new Request(`http://localhost/api/bookmarks?toolId=${TOOL_ID}`, { method: 'DELETE' })
    const res = await DELETE(req)
    expect(res.status).toBe(401)
  })

  it('returns 400 when toolId query param is missing', async () => {
    mockCreateClient.mockResolvedValue(makeSupabaseMock({ user: { id: USER_ID } }) as any)
    const req = new Request('http://localhost/api/bookmarks', { method: 'DELETE' })
    const res = await DELETE(req)
    expect(res.status).toBe(400)
  })

  it('returns 200 on successful deletion', async () => {
    const bookmarkChain = makeChain({ error: null })
    mockCreateClient.mockResolvedValue(makeSupabaseMock({
      user: { id: USER_ID },
      tables: { bookmarks: bookmarkChain },
    }) as any)

    const req = new Request(`http://localhost/api/bookmarks?toolId=${TOOL_ID}`, { method: 'DELETE' })
    const res = await DELETE(req)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
  })

  it('scopes the delete to the authenticated user', async () => {
    const bookmarkChain = makeChain({ error: null })
    mockCreateClient.mockResolvedValue(makeSupabaseMock({
      user: { id: USER_ID },
      tables: { bookmarks: bookmarkChain },
    }) as any)

    const req = new Request(`http://localhost/api/bookmarks?toolId=${TOOL_ID}`, { method: 'DELETE' })
    await DELETE(req)

    const eqCalls = bookmarkChain.eq.mock.calls
    expect(eqCalls).toContainEqual(['user_id', USER_ID])
    expect(eqCalls).toContainEqual(['tool_id', TOOL_ID])
  })
})
