import { vi, describe, it, expect, beforeEach } from 'vitest'
import { makeChain, makeSupabaseMock } from '../helpers/supabase'

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))

import { createClient } from '@/lib/supabase/server'
import { POST } from '@/app/api/submit/route'

const mockCreateClient = vi.mocked(createClient)
const USER_ID = 'user-abc'

const validPayload = {
  name: 'My Tool',
  website_url: 'https://example.com',
  tagline: 'The best tool ever',
  description: 'A long enough description that goes past twenty characters.',
}

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/submit', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns 401 when unauthenticated', async () => {
    mockCreateClient.mockResolvedValue(makeSupabaseMock({ user: null }) as any)
    const res = await POST(makeRequest(validPayload))
    expect(res.status).toBe(401)
  })

  it('returns 400 when name is missing', async () => {
    mockCreateClient.mockResolvedValue(makeSupabaseMock({ user: { id: USER_ID } }) as any)
    const { name: _, ...withoutName } = validPayload
    const res = await POST(makeRequest(withoutName))
    expect(res.status).toBe(400)
  })

  it('returns 400 for an invalid website_url', async () => {
    mockCreateClient.mockResolvedValue(makeSupabaseMock({ user: { id: USER_ID } }) as any)
    const res = await POST(makeRequest({ ...validPayload, website_url: 'not-a-url' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when tagline is missing', async () => {
    mockCreateClient.mockResolvedValue(makeSupabaseMock({ user: { id: USER_ID } }) as any)
    const { tagline: _, ...withoutTagline } = validPayload
    const res = await POST(makeRequest(withoutTagline))
    expect(res.status).toBe(400)
  })

  it('returns 400 when description is too short (< 20 chars)', async () => {
    mockCreateClient.mockResolvedValue(makeSupabaseMock({ user: { id: USER_ID } }) as any)
    const res = await POST(makeRequest({ ...validPayload, description: 'Too short' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when name exceeds 100 characters', async () => {
    mockCreateClient.mockResolvedValue(makeSupabaseMock({ user: { id: USER_ID } }) as any)
    const res = await POST(makeRequest({ ...validPayload, name: 'x'.repeat(101) }))
    expect(res.status).toBe(400)
  })

  it('returns 200 on successful submission', async () => {
    const submissionChain = makeChain({ error: null })
    mockCreateClient.mockResolvedValue(makeSupabaseMock({
      user: { id: USER_ID },
      tables: { tool_submissions: submissionChain },
    }) as any)

    const res = await POST(makeRequest(validPayload))
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
  })

  it('records the submitting user ID', async () => {
    const submissionChain = makeChain({ error: null })
    mockCreateClient.mockResolvedValue(makeSupabaseMock({
      user: { id: USER_ID },
      tables: { tool_submissions: submissionChain },
    }) as any)

    await POST(makeRequest(validPayload))
    expect(submissionChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ submitted_by: USER_ID })
    )
  })

  it('stores empty optional fields as null', async () => {
    const submissionChain = makeChain({ error: null })
    mockCreateClient.mockResolvedValue(makeSupabaseMock({
      user: { id: USER_ID },
      tables: { tool_submissions: submissionChain },
    }) as any)

    await POST(makeRequest({ ...validPayload, category_id: '', logo_url: '', submitter_email: '' }))
    expect(submissionChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ category_id: null, logo_url: null, submitter_email: null })
    )
  })
})
