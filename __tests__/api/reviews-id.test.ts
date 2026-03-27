import { vi, describe, it, expect, beforeEach } from 'vitest'
import { makeChain, makeSupabaseMock } from '../helpers/supabase'

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))

import { createClient } from '@/lib/supabase/server'
import { PATCH, DELETE } from '@/app/api/reviews/[id]/route'

const mockCreateClient = vi.mocked(createClient)
const REVIEW_ID = 'rev-00000000-0000-0000-0000-000000000001'
const USER_ID = 'user-abc'

function makeParams(id = REVIEW_ID) {
  return { params: Promise.resolve({ id }) }
}

describe('PATCH /api/reviews/[id]', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns 401 when unauthenticated', async () => {
    mockCreateClient.mockResolvedValue(makeSupabaseMock({ user: null }) as any)
    const req = new Request('http://localhost/api/reviews/rev-1', {
      method: 'PATCH',
      body: JSON.stringify({ rating: 4 }),
    })
    const res = await PATCH(req, makeParams())
    expect(res.status).toBe(401)
  })

  it('returns 400 for a rating above 5', async () => {
    mockCreateClient.mockResolvedValue(makeSupabaseMock({ user: { id: USER_ID } }) as any)
    const req = new Request('http://localhost/api/reviews/rev-1', {
      method: 'PATCH',
      body: JSON.stringify({ rating: 10 }),
    })
    const res = await PATCH(req, makeParams())
    expect(res.status).toBe(400)
  })

  it('returns 200 and updated review on success', async () => {
    const updated = { id: REVIEW_ID, rating: 4, status: 'pending' }
    const reviewChain = makeChain({ data: updated, error: null })
    mockCreateClient.mockResolvedValue(makeSupabaseMock({
      user: { id: USER_ID },
      tables: { reviews: reviewChain },
    }) as any)

    const req = new Request('http://localhost/api/reviews/rev-1', {
      method: 'PATCH',
      body: JSON.stringify({ rating: 4, title: 'Updated title' }),
    })
    const res = await PATCH(req, makeParams())
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.review).toEqual(updated)
    expect(body.message).toContain('moderation')
  })

  it('scopes the update to the authenticated user', async () => {
    const reviewChain = makeChain({ data: { id: REVIEW_ID }, error: null })
    mockCreateClient.mockResolvedValue(makeSupabaseMock({
      user: { id: USER_ID },
      tables: { reviews: reviewChain },
    }) as any)

    const req = new Request('http://localhost/api/reviews/rev-1', {
      method: 'PATCH',
      body: JSON.stringify({ rating: 5 }),
    })
    await PATCH(req, makeParams())

    // Should filter by both review id and user_id (ownership check)
    const eqCalls = reviewChain.eq.mock.calls
    expect(eqCalls).toContainEqual(['id', REVIEW_ID])
    expect(eqCalls).toContainEqual(['user_id', USER_ID])
  })
})

describe('DELETE /api/reviews/[id]', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns 401 when unauthenticated', async () => {
    mockCreateClient.mockResolvedValue(makeSupabaseMock({ user: null }) as any)
    const req = new Request('http://localhost/api/reviews/rev-1', { method: 'DELETE' })
    const res = await DELETE(req, makeParams())
    expect(res.status).toBe(401)
  })

  it('returns 200 on successful deletion', async () => {
    const reviewChain = makeChain({ error: null })
    mockCreateClient.mockResolvedValue(makeSupabaseMock({
      user: { id: USER_ID },
      tables: { reviews: reviewChain },
    }) as any)

    const req = new Request('http://localhost/api/reviews/rev-1', { method: 'DELETE' })
    const res = await DELETE(req, makeParams())
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.message).toContain('deleted')
  })

  it('scopes the delete to the authenticated user', async () => {
    const reviewChain = makeChain({ error: null })
    mockCreateClient.mockResolvedValue(makeSupabaseMock({
      user: { id: USER_ID },
      tables: { reviews: reviewChain },
    }) as any)

    const req = new Request('http://localhost/api/reviews/rev-1', { method: 'DELETE' })
    await DELETE(req, makeParams())

    const eqCalls = reviewChain.eq.mock.calls
    expect(eqCalls).toContainEqual(['id', REVIEW_ID])
    expect(eqCalls).toContainEqual(['user_id', USER_ID])
  })

  it('returns 400 on database error', async () => {
    const reviewChain = makeChain({ error: { message: 'DB error' } })
    mockCreateClient.mockResolvedValue(makeSupabaseMock({
      user: { id: USER_ID },
      tables: { reviews: reviewChain },
    }) as any)

    const req = new Request('http://localhost/api/reviews/rev-1', { method: 'DELETE' })
    const res = await DELETE(req, makeParams())
    expect(res.status).toBe(400)
  })
})
