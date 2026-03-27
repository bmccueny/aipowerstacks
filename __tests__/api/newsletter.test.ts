import { vi, describe, it, expect, beforeEach } from 'vitest'
import { makeChain, makeSupabaseMock } from '../helpers/supabase'

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))

import { createClient } from '@/lib/supabase/server'
import { POST } from '@/app/api/newsletter/route'

const mockCreateClient = vi.mocked(createClient)

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/newsletter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/newsletter', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns 400 for an invalid email', async () => {
    const res = await POST(makeRequest({ email: 'not-an-email' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for a missing email', async () => {
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(400)
  })

  it('returns 400 for an empty email string', async () => {
    const res = await POST(makeRequest({ email: '' }))
    expect(res.status).toBe(400)
  })

  it('returns 200 on successful subscription', async () => {
    const insertChain = makeChain({ error: null })
    mockCreateClient.mockResolvedValue(makeSupabaseMock({
      tables: { newsletter_subscribers: insertChain },
    }) as any)

    const res = await POST(makeRequest({ email: 'user@example.com' }))
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
  })

  it('returns 200 (not an error) for a duplicate email', async () => {
    const insertChain = makeChain({ error: { code: '23505' } })
    mockCreateClient.mockResolvedValue(makeSupabaseMock({
      tables: { newsletter_subscribers: insertChain },
    }) as any)

    const res = await POST(makeRequest({ email: 'existing@example.com' }))
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
  })

  it('returns 400 for a generic database error', async () => {
    const insertChain = makeChain({ error: { code: 'XXXXX', message: 'DB failure' } })
    mockCreateClient.mockResolvedValue(makeSupabaseMock({
      tables: { newsletter_subscribers: insertChain },
    }) as any)

    const res = await POST(makeRequest({ email: 'user@example.com' }))
    expect(res.status).toBe(400)
  })

  it('passes the source field to the database', async () => {
    const insertChain = makeChain({ error: null })
    mockCreateClient.mockResolvedValue(makeSupabaseMock({
      tables: { newsletter_subscribers: insertChain },
    }) as any)

    await POST(makeRequest({ email: 'user@example.com', source: 'homepage' }))
    expect(insertChain.insert).toHaveBeenCalledWith({
      email: 'user@example.com',
      source: 'homepage',
    })
  })

  it('stores null when source is omitted', async () => {
    const insertChain = makeChain({ error: null })
    mockCreateClient.mockResolvedValue(makeSupabaseMock({
      tables: { newsletter_subscribers: insertChain },
    }) as any)

    await POST(makeRequest({ email: 'user@example.com' }))
    expect(insertChain.insert).toHaveBeenCalledWith({ email: 'user@example.com', source: null })
  })
})
