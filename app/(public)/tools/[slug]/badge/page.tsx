import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { SITE_URL } from '@/lib/constants/site'
import { BadgeSnippets } from '@/components/tools/BadgeSnippets'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return {
    title: `Embed Badge | AIPowerStacks`,
    robots: { index: false, follow: false },
  }
}

export default async function BadgePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = createAdminClient()

  const { data: tool } = await supabase
    .from('tools')
    .select('name, slug')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (!tool) notFound()

  const badgeUrl = `${SITE_URL}/api/badge/${tool.slug}`
  const toolUrl = `${SITE_URL}/tools/${tool.slug}`

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-24 px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-2">Embed Badge for {tool.name}</h1>
          <p className="text-muted-foreground mb-8">Add this badge to your README, website, or blog to show your listing on AIPowerStacks.</p>

          {/* Preview */}
          <div className="glass-card rounded-xl p-8 flex items-center justify-center mb-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <a href={toolUrl} target="_blank" rel="noopener noreferrer">
              <img src={badgeUrl} alt={`${tool.name} on AIPowerStacks`} />
            </a>
          </div>

          <BadgeSnippets badgeUrl={badgeUrl} toolUrl={toolUrl} toolName={tool.name} />
        </div>
      </main>
      <Footer />
    </>
  )
}
