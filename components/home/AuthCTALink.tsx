'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function AuthCTALink({
  authHref,
  fallbackHref,
  className,
  children,
}: {
  authHref: string
  fallbackHref: string
  className?: string
  children: React.ReactNode
}) {
  const [href, setHref] = useState(fallbackHref)

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      if (data.user) setHref(authHref)
    })
  }, [authHref, fallbackHref])

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  )
}
