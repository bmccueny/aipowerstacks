import type { Metadata } from 'next'
import { Sparkles, ShieldCheck, Zap, TrendingUp } from 'lucide-react'

export const metadata: Metadata = {
  title: 'About AIPowerStacks',
  description: 'Learn about AIPowerStacks and our mission to help you discover and compare the best AI tools on the market.',
}

export default function AboutPage() {
  return (
    <div className="page-shell max-w-4xl mx-auto">
      <div className="page-hero text-center mb-12">
        <h1 className="text-4xl font-black mb-4">Our Mission</h1>
        <p className="text-lg text-muted-foreground">
          Helping you cut through the noise and find the right AI tools for your workflow in under 60 seconds.
        </p>
      </div>

      <div className="prose dark:prose-invert max-w-none mb-16">
        <h2 className="text-2xl font-bold mb-4">What is AIPowerStacks?</h2>
        <p className="text-muted-foreground leading-relaxed mb-6">
          AIPowerStacks is the most comprehensive and up-to-date AI tools directory on the web. We track 5,000+ AI tools across writing, coding, image generation, video, productivity, and more.
        </p>
        <p className="text-muted-foreground leading-relaxed mb-6">
          The AI landscape is moving at breakneck speed. Every day, dozens of new tools are launched. Most are noise; some are transformative. Our goal is to help you identify the transformative ones quickly, so you can focus on building and creating.
        </p>

        <h2 className="text-2xl font-bold mt-12 mb-6">Why Trust Us?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 not-prose">
          {[
            {
              icon: ShieldCheck,
              title: 'Verified Listings',
              description: 'Our editorial team manually reviews and verifies the core features and pricing models of the top tools.'
            },
            {
              icon: Zap,
              title: 'Updated Daily',
              description: 'We track the latest launches and updates every single day to ensure you have the freshest data.'
            },
            {
              icon: TrendingUp,
              title: 'Unbiased Reviews',
              description: 'Our review system is community-driven, giving you authentic feedback from real users.'
            },
            {
              icon: Sparkles,
              title: 'Built for Productivity',
              description: 'Every feature, from comparison to bookmarking, is designed to save you time.'
            }
          ].map((feature, i) => (
            <div key={i} className="glass-card rounded-[4px] p-6 border-[1px] border-foreground">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="gum-card rounded-[4px] border-[1px] border-foreground p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Building an AI tool?</h2>
        <p className="text-muted-foreground mb-6">
          Get your tool in front of thousands of founders, developers, and creators. We prioritize quality listings that provide real value to our community.
        </p>
        <a href="/submit">
          <button className="btn-hover bg-foreground text-background px-8 py-3 rounded-[4px] font-bold uppercase tracking-wider">
            Submit Your Tool
          </button>
        </a>
      </div>
    </div>
  )
}
