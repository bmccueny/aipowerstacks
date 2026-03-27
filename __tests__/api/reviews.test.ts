import { vi, describe, it, expect, beforeEach } from 'vitest'
import { makeChain, makeSupabaseMock } from '../helpers/supabase'

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))

import { createClient } from '@/lib/supabase/server'
import { POST } from '@/app/api/reviews/route'

const mockCreateClient = vi.mocked(createClient)
const TOOL_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
const USER_ID = 'user-abc'

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/reviews', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/reviews', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns 401 when unauthenticated', async () => {
    mockCreateClient.mockResolvedValue(makeSupabaseMock({ user: null }) as any)
    const res = await POST(makeRequest({ toolId: TOOL_ID, rating: 5 }))
    expect(res.status).toBe(401)
  })

  it('returns 400 for an invalid toolId (not a UUID)', async () => {
    mockCreateClient.mockResolvedValue(makeSupabaseMock({ user: { id: USER_ID } }) as any)
    const res = await POST(makeRequest({ toolId: 'not-a-uuid', rating: 5 }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for a rating below 1', async () => {
    mockCreateClient.mockResolvedValue(makeSupabaseMock({ user: { id: USER_ID } }) as any)
    const res = await POST(makeRequest({ toolId: TOOL_ID, rating: 0 }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for a rating above 5', async () => {
    mockCreateClient.mockResolvedValue(makeSupabaseMock({ user: { id: USER_ID } }) as any)
    const res = await POST(makeRequest({ toolId: TOOL_ID, rating: 6 }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when title exceeds 100 characters', async () => {
    mockCreateClient.mockResolvedValue(makeSupabaseMock({ user: { id: USER_ID } }) as any)
    const res = await POST(makeRequest({ toolId: TOOL_ID, rating: 4, title: 'x'.repeat(101) }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when body exceeds 1000 characters', async () => {
    mockCreateClient.mockResolvedValue(makeSupabaseMock({ user: { id: USER_ID } }) as any)
    const res = await POST(makeRequest({ toolId: TOOL_ID, rating: 4, body: 'x'.repeat(1001) }))
    expect(res.status).toBe(400)
  })

  it('returns 409 when user already reviewed this tool', async () => {
    const reviewChain = makeChain({ data: null, error: { code: '23505' } })
    mockCreateClient.mockResolvedValue(makeSupabaseMock({
      user: { id: USER_ID },
      tables: { reviews: reviewChain },
    }) as any)

    const res = await POST(makeRequest({ toolId: TOOL_ID, rating: 5 }))
    const body = await res.json()
    expect(res.status).toBe(409)
    expect(body.error).toContain('already reviewed')
  })

  it('returns 200 and the new review on success', async () => {
    const mockReview = { id: 'rev-1', tool_id: TOOL_ID, user_id: USER_ID, rating: 4 }
    const reviewChain = makeChain({ data: mockReview, error: null })
    mockCreateClient.mockResolvedValue(makeSupabaseMock({
      user: { id: USER_ID },
      tables: { reviews: reviewChain },
    }) as any)

    const res = await POST(makeRequest({ toolId: TOOL_ID, rating: 4, title: 'Great tool' }))
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.review).toEqual(mockReview)
    expect(body.message).toContain('moderation')
  })

  it('inserts the review with status: pending', async () => {
    const reviewChain = makeChain({ data: { id: 'rev-1' }, error: null })
    mockCreateClient.mockResolvedValue(makeSupabaseMock({
      user: { id: USER_ID },
      tables: { reviews: reviewChain },
    }) as any)

    await POST(makeRequest({ toolId: TOOL_ID, rating: 3 }))
    expect(reviewChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'pending', user_id: USER_ID })
    )
  })
})
