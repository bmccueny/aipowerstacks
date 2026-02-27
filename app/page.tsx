import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Sparkles, Zap, Shield, TrendingUp, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { getAllCategories } from '@/lib/supabase/queries/categories'
import { getLatestTools, getSuperTools } from '@/lib/supabase/queries/tools'
import { PRICING_BADGE_COLORS, PRICING_LABELS } from '@/lib/constants'

export const metadata = {
  title: 'AIxplore — Discover the Best AI Tools',
  description: 'Discover 5,000+ AI tools organized by category. Find the perfect AI solution for writing, coding, design, video, and more.',
}

export default async function HomePage() {
  const [categories, latestTools, superTools] = await Promise.all([
    getAllCategories(),
    getLatestTools(8),
    getSuperTools(6),
  ])

  const featuredCategories = categories.filter((c) => c.sort_order > 0).slice(0, 12)

  return (
    <>
      <Navbar />
      <main className="min-h-screen flex flex-col gap-20 pb-24">
        <section className="relative px-4 pt-20 pb-12 text-center max-w-5xl mx-auto w-full">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-sm text-muted-foreground mb-6">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>5,000+ AI Tools Catalogued</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6">
            Discover the Best{' '}
            <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
              AI Tools
            </span>
            <br />for Every Task
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            The most comprehensive directory of AI tools, updated daily. Find the perfect AI solution for writing, coding, design, video, and more.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/tools">
              <Button size="lg" className="gap-2">
                Browse All Tools <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/tools?pricing=free">
              <Button size="lg" variant="outline" className="border-white/20 hover:border-white/40">
                Free Tools Only
              </Button>
            </Link>
          </div>
          <div className="mt-12 grid grid-cols-3 gap-6 max-w-sm mx-auto">
            {[
              { icon: Zap, label: 'Updated Daily' },
              { icon: Shield, label: 'Verified Tools' },
              { icon: TrendingUp, label: 'Community Rated' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-1.5">
                <div className="p-2 rounded-lg glass">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </section>

        {featuredCategories.length > 0 && (
          <section className="px-4 max-w-7xl mx-auto w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Browse Categories</h2>
              <Link href="/categories" className="text-sm text-primary hover:underline flex items-center gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {featuredCategories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/categories/${cat.slug}`}
                  className="glass-card rounded-xl p-4 flex flex-col items-center gap-2 hover:border-primary/40 transition-colors group"
                >
                  <span className="text-2xl">{cat.icon ?? '🤖'}</span>
                  <span className="text-xs font-medium text-center group-hover:text-primary transition-colors">{cat.name}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {superTools.length > 0 && (
          <section className="px-4 max-w-7xl mx-auto w-full">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">AI SuperTools</h2>
                <p className="text-sm text-muted-foreground mt-1">The most powerful AI tools available</p>
              </div>
              <Link href="/tools?sort=rating" className="text-sm text-primary hover:underline flex items-center gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {superTools.map((tool) => {
                const pricingColor = PRICING_BADGE_COLORS[tool.pricing_model] ?? PRICING_BADGE_COLORS.unknown
                const pricingLabel = PRICING_LABELS[tool.pricing_model] ?? 'Unknown'
                return (
                  <Link key={tool.id} href={`/tools/${tool.slug}`} className="block group">
                    <div className="glass-card rounded-xl p-5 flex items-center gap-4 hover:border-primary/30 transition-colors">
                      <div className="h-12 w-12 shrink-0 rounded-xl bg-white/10 overflow-hidden flex items-center justify-center">
                        {tool.logo_url ? (
                          <Image src={tool.logo_url} alt={tool.name} width={48} height={48} className="object-cover" />
                        ) : (
                          <span className="text-2xl font-bold text-primary">{tool.name[0]}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold group-hover:text-primary transition-colors truncate">{tool.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{tool.tagline}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className={`text-xs ${pricingColor}`}>{pricingLabel}</Badge>
                          {tool.avg_rating > 0 && (
                            <div className="flex items-center gap-0.5">
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                              <span className="text-xs text-muted-foreground">{tool.avg_rating.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        <section className="px-4 max-w-7xl mx-auto w-full">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Latest AI Tools</h2>
              <p className="text-sm text-muted-foreground mt-1">Freshly added to the directory</p>
            </div>
            <Link href="/tools?sort=newest" className="text-sm text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {latestTools.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {latestTools.map((tool) => {
                const pricingColor = PRICING_BADGE_COLORS[tool.pricing_model] ?? PRICING_BADGE_COLORS.unknown
                const pricingLabel = PRICING_LABELS[tool.pricing_model] ?? 'Unknown'
                return (
                  <Link key={tool.id} href={`/tools/${tool.slug}`} className="block group">
                    <div className="glass-card rounded-xl p-4 space-y-3 hover:border-primary/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-white/10 overflow-hidden flex items-center justify-center shrink-0">
                          {tool.logo_url ? (
                            <Image src={tool.logo_url} alt={tool.name} width={40} height={40} className="object-cover" />
                          ) : (
                            <span className="text-lg font-bold text-primary">{tool.name[0]}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm group-hover:text-primary transition-colors truncate">{tool.name}</p>
                          <Badge variant="outline" className={`text-xs mt-0.5 ${pricingColor}`}>{pricingLabel}</Badge>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{tool.tagline}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="glass-card rounded-xl p-4 space-y-3 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-white/10 shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-4 bg-white/10 rounded w-3/4" />
                      <div className="h-3 bg-white/5 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="h-3 bg-white/5 rounded" />
                  <div className="h-3 bg-white/5 rounded w-5/6" />
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  )
}
