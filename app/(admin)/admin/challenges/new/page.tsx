import type { Metadata } from 'next'
import { ChallengeForm } from '@/components/admin/ChallengeForm'

export const metadata: Metadata = { title: 'New Challenge' }

export default function NewChallengePage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">New Stack Challenge</h1>
      <ChallengeForm />
    </div>
  )
}
