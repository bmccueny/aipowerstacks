import { vi, describe, it, expect, beforeEach } from 'vitest'
import { makeChain, makeSupabaseMock } from '../helpers/supabase'

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: vi.fn() }))

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { POST } from '@/app/api/admin/submissions/[id]/route'

const mockCreateClient = vi.mocked(createClient)
const mockCreateAdminClient = vi.mocked(createAdminClient)

const ADMIN_ID = 'admin-user-id'
const SUBMISSION_ID = 'submission-id'

function makeParams(id = SUBMISSION_ID) {
  return { params: Promise.resolve({ id }) }
}

const validSubmission = {
  name: 'My AI Tool',
  tagline: 'The best tool',
  description: 'A fantastic AI tool that does everything.',
  website_url: 'https://mytool.com',
  category_id: null,
  pricing_model: 'free',
}

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/admin/submissions/sub-1', {
    method: 'POST',
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

describe('POST /api/admin/submissions/[id]', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns 401 when unauthenticated', async () => {
    mockCreateClient.mockResolvedValue(makeSupabaseMock({ user: null }) as any)
    const res = await POST(makeRequest({ action: 'approve', submission: validSubmission }), makeParams())
    expect(res.status).toBe(401)
  })

  it('returns 403 when caller is not an admin', async () => {
    const profileChain = makeChain({ data: { role: 'user' }, error: null })
    mockCreateClient.mockResolvedValue(makeSupabaseMock({
      user: { id: ADMIN_ID },
      tables: { profiles: profileChain },
    }) as any)

    const res = await POST(makeRequest({ action: 'approve', submission: validSubmission }), makeParams())
    expect(res.status).toBe(403)
  })

  it('returns 400 for an invalid action', async () => {
    mockAdminUser()
    mockCreateAdminClient.mockReturnValue({ from: vi.fn() } as any)

    const res = await POST(makeRequest({ action: 'publish', submission: validSubmission }), makeParams())
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('Invalid action')
  })

  describe('approve action', () => {
    it('returns 200 and creates a published tool', async () => {
      mockAdminUser()

      const toolInsertChain = makeChain({ data: { id: 'new-tool-id' }, error: null })
      const submissionUpdateChain = makeChain({ error: null })

      mockCreateAdminClient.mockReturnValue({
        from: vi.fn()
          .mockReturnValueOnce(toolInsertChain)       // insert into tools
          .mockReturnValueOnce(submissionUpdateChain) // update submission status
      } as any)

      const res = await POST(makeRequest({ action: 'approve', submission: validSubmission }), makeParams())
      const body = await res.json()
      expect(res.status).toBe(200)
      expect(body.success).toBe(true)
      expect(body.tool_id).toBe('new-tool-id')
    })

    it('generates a slug from the tool name', async () => {
      mockAdminUser()

      const toolInsertChain = makeChain({ data: { id: 'new-tool-id' }, error: null })
      const submissionUpdateChain = makeChain({ error: null })
      mockCreateAdminClient.mockReturnValue({
        from: vi.fn()
          .mockReturnValueOnce(toolInsertChain)
          .mockReturnValueOnce(submissionUpdateChain)
      } as any)

      await POST(
        makeRequest({ action: 'approve', submission: { ...validSubmission, name: 'My AI Tool!' } }),
        makeParams()
      )
      expect(toolInsertChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({ slug: 'my-ai-tool', status: 'published' })
      )
    })

    it('marks the submission as approved', async () => {
      mockAdminUser()

      const toolInsertChain = makeChain({ data: { id: 'new-tool-id' }, error: null })
      const submissionUpdateChain = makeChain({ error: null })
      mockCreateAdminClient.mockReturnValue({
        from: vi.fn()
          .mockReturnValueOnce(toolInsertChain)
          .mockReturnValueOnce(submissionUpdateChain)
      } as any)

      await POST(makeRequest({ action: 'approve', submission: validSubmission }), makeParams())
      expect(submissionUpdateChain.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'approved', reviewed_by: ADMIN_ID })
      )
    })
  })

  describe('reject action', () => {
    it('returns 200 on successful rejection', async () => {
      mockAdminUser()

      const submissionUpdateChain = makeChain({ error: null })
      mockCreateAdminClient.mockReturnValue({
        from: vi.fn().mockReturnValue(submissionUpdateChain)
      } as any)

      const res = await POST(
        makeRequest({ action: 'reject', submission: validSubmission, rejection_reason: 'Duplicate tool' }),
        makeParams()
      )
      const body = await res.json()
      expect(res.status).toBe(200)
      expect(body.success).toBe(true)
    })

    it('stores the rejection reason', async () => {
      mockAdminUser()

      const submissionUpdateChain = makeChain({ error: null })
      mockCreateAdminClient.mockReturnValue({
        from: vi.fn().mockReturnValue(submissionUpdateChain)
      } as any)

      await POST(
        makeRequest({ action: 'reject', submission: validSubmission, rejection_reason: 'Duplicate tool' }),
        makeParams()
      )
      expect(submissionUpdateChain.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'rejected', rejection_reason: 'Duplicate tool' })
      )
    })

    it('stores null rejection_reason when not provided', async () => {
      mockAdminUser()

      const submissionUpdateChain = makeChain({ error: null })
      mockCreateAdminClient.mockReturnValue({
        from: vi.fn().mockReturnValue(submissionUpdateChain)
      } as any)

      await POST(makeRequest({ action: 'reject', submission: validSubmission }), makeParams())
      expect(submissionUpdateChain.update).toHaveBeenCalledWith(
        expect.objectContaining({ rejection_reason: null })
      )
    })
  })
})
