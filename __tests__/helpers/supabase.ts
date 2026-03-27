import { vi } from 'vitest'

/**
 * Creates a chainable Supabase query mock.
 * All builder methods return `this` for chaining.
 * Terminal methods (.single, .maybeSingle) resolve with `result`.
 * The chain itself is also directly awaitable via .then().
 */
export function makeChain(result: { data?: any; error?: any; count?: number | null } = {}) {
  const chain: any = {}
  const builderMethods = [
    'select', 'insert', 'update', 'upsert', 'delete',
    'eq', 'neq', 'or', 'in', 'not', 'order', 'limit', 'range',
    'filter', 'ilike', 'contains', 'is', 'gt', 'gte', 'lt', 'lte', 'head',
  ]
  builderMethods.forEach((m) => { chain[m] = vi.fn().mockReturnValue(chain) })
  chain.single = vi.fn().mockResolvedValue(result)
  chain.maybeSingle = vi.fn().mockResolvedValue(result)
  // Allow direct await on the chain (no terminal method)
  chain.then = (resolve: (v: any) => any, reject?: (r?: any) => any) =>
    Promise.resolve(result).then(resolve, reject)
  chain.catch = (reject: (r?: any) => any) => Promise.resolve(result).catch(reject)
  return chain
}

/**
 * Creates a mock Supabase client with auth.getUser() and from() stubs.
 * Pass `user` to simulate an authenticated user (null = unauthenticated).
 * Pass `tables` to configure per-table chain results.
 */
export function makeSupabaseMock({
  user = null as any,
  tables = {} as Record<string, ReturnType<typeof makeChain>>,
} = {}) {
  const defaultChain = makeChain({ data: null, error: null })
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user } }),
    },
    from: vi.fn().mockImplementation((table: string) => tables[table] ?? defaultChain),
  }
}
