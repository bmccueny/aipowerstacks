import type { Metadata } from 'next'
import Link from 'next/link'
import { BadgeCheck, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'You\'re Featured!',
  description: 'Your AI tool is now featured on AIPowerStacks.',
  robots: { index: false, follow: false },
}

export default function AdvertiseSuccessPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-24 text-center">
      <div className="gum-card rounded-3xl p-10">
        <div className="h-16 w-16 rounded-full border-2 border-black bg-primary/15 flex items-center justify-center mx-auto mb-6">
          <BadgeCheck className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl font-black mb-3">You&apos;re featured!</h1>
        <p className="text-muted-foreground mb-8">
          Payment confirmed. Your tool now has a Featured badge and top placement in its category.
          It may take up to 5 minutes to appear across the site.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/tools">
            <Button className="gap-2 w-full sm:w-auto">
              Browse directory <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/submit">
            <Button variant="outline" className="w-full sm:w-auto">Submit another tool</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
