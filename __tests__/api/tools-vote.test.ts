import { vi, describe, it, expect, beforeEach } from 'vitest'
import { makeChain } from '../helpers/supabase'

vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: vi.fn() }))

import { createAdminClient } from '@/lib/supabase/admin'
import { POST } from '@/app/api/tools/[id]/vote/route'

const mockCreateAdminClient = vi.mocked(createAdminClient)
const TOOL_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'

function makeParams(id = TOOL_ID) {
  return { params: Promise.resolve({ id }) }
}

function makeRequest(opts: { cookies?: string } = {}) {
  return new Request(`http://localhost/api/tools/${TOOL_ID}/vote`, {
    method: 'POST',
    headers: opts.cookies ? { cookie: opts.cookies } : {},
  })
}

function makeAdminMock({
  toolData = { data: { id: TOOL_ID }, error: null },
  voteInsertError = null as any,
  voteCount = 5,
} = {}) {
  const toolChain = makeChain(toolData)
  const voteInsertChain = makeChain({ error: voteInsertError })
  const voteCountChain = makeChain({ count: voteCount, data: null, error: null })
  const toolUpdateChain = makeChain({ error: null })

  const admin = {
    from: vi.fn()
      .mockReturnValueOnce(toolChain)       // check tool exists
      .mockReturnValueOnce(voteInsertChain) // insert vote
      .mockReturnValueOnce(voteCountChain)  // count votes
      .mockReturnValueOnce(toolUpdateChain) // update upvote_count
  }
  return admin
}

describe('POST /api/tools/[id]/vote', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns 400 for an invalid tool ID (not UUID)', async () => {
    const admin = makeAdminMock()
    mockCreateAdminClient.mockReturnValue(admin as any)

    const req = makeRequest()
    const res = await POST(req, { params: Promise.resolve({ id: 'not-a-uuid' }) })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('Invalid tool id')
  })

  it('returns 404 when tool does not exist', async () => {
    const admin = {
      from: vi.fn().mockReturnValue(makeChain({ data: null, error: null }))
    }
    mockCreateAdminClient.mockReturnValue(admin as any)

    const res = await POST(makeRequest(), makeParams())
    expect(res.status).toBe(404)
  })

  it('returns 200 with upvote count on a new vote', async () => {
    mockCreateAdminClient.mockReturnValue(makeAdminMock({ voteCount: 10 }) as any)

    const res = await POST(makeRequest(), makeParams())
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.upvoteCount).toBe(10)
    expect(body.voted).toBe(true)
    expect(body.alreadyVoted).toBe(false)
  })

  it('returns 200 with alreadyVoted:true for duplicate vote', async () => {
    const admin = makeAdminMock({ voteInsertError: { code: '23505' }, voteCount: 5 })
    mockCreateAdminClient.mockReturnValue(admin as any)

    const res = await POST(makeRequest(), makeParams())
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.alreadyVoted).toBe(true)
  })

  it('sets a visitor_id cookie for a new visitor', async () => {
    mockCreateAdminClient.mockReturnValue(makeAdminMock() as any)

    // No cookie in request = new visitor
    const res = await POST(makeRequest(), makeParams())
    expect(res.status).toBe(200)
    const setCookie = res.headers.get('set-cookie')
    expect(setCookie).toContain('visitor_id=')
  })

  it('does not set a visitor_id cookie for a returning visitor', async () => {
    mockCreateAdminClient.mockReturnValue(makeAdminMock() as any)

    const res = await POST(
      makeRequest({ cookies: 'visitor_id=existing-visitor-uuid' }),
      makeParams()
    )
    expect(res.status).toBe(200)
    // Cookie should not be re-set for existing visitors
    const setCookie = res.headers.get('set-cookie')
    expect(setCookie).toBeNull()
  })
})
