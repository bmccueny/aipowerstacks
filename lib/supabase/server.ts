import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/types/database'
import type { User } from '@supabase/supabase-js'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch (error) {
            // Cookie setting can fail in Server Components (read-only context).
            // This is expected for middleware/page reads — only log in dev.
            if (process.env.NODE_ENV === 'development') {
              console.warn('Supabase cookie setAll failed (read-only context):', error)
            }
          }
        },
      },
    }
  )
}

/**
 * Safe wrapper for getUser() that handles corrupted auth cookies
 * instead of crashing the server component.
 */
export async function getSafeUser(): Promise<User | null> {
  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    return data?.user ?? null
  } catch {
    return null
  }
}
