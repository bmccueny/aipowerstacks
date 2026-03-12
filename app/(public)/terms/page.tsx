import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'The legal agreement governing your use of AIPowerStacks.',
  alternates: { canonical: '/terms' },
}

export default function TermsPage() {
  const date = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })

  return (
    <div className="page-shell max-w-4xl mx-auto">
      <div className="page-hero text-center mb-12">
        <h1 className="text-4xl font-black mb-4 uppercase tracking-tighter">Terms of Service</h1>
        <p className="text-muted-foreground">Last updated: {date}</p>
      </div>

      <div className="prose dark:prose-invert max-w-none space-y-8">
        <section>
          <h2 className="text-2xl font-bold mb-4">1. Acceptable Use</h2>
          <p className="text-muted-foreground leading-relaxed">
            By using AIPowerStacks, you agree to use the site only for its intended purpose: discovering and reviewing AI tools. You may not:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2">
            <li>Submit false or misleading information in reviews or tool listings</li>
            <li>Use automated systems to scrape or harvest data from our directory</li>
            <li>Impersonate other users or tool founders</li>
            <li>Post spam or irrelevant promotional content</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">2. User Submissions</h2>
          <p className="text-muted-foreground leading-relaxed">
            When you submit a tool or write a review, you grant AIPowerStacks a non-exclusive, royalty-free, perpetual license to use, display, and distribute that content across our platform and marketing materials.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            We reserve the right to edit or remove any content at our sole discretion for any reason, including content that violates our community standards.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">3. Intellectual Property</h2>
          <p className="text-muted-foreground leading-relaxed">
            The AIPowerStacks brand, logo, design, and software are the intellectual property of AIPowerStacks. All tool logos and trademarks featured in the directory belong to their respective owners.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">4. Limitation of Liability</h2>
          <p className="text-muted-foreground leading-relaxed">
            AIPowerStacks provides a directory for informational purposes only. We do not guarantee the accuracy, safety, or effectiveness of any third-party tools listed. You use these tools at your own risk.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">5. Modifications</h2>
          <p className="text-muted-foreground leading-relaxed">
            We reserve the right to modify these terms at any time. Your continued use of the site after such modifications constitutes your acceptance of the updated terms.
          </p>
        </section>

        <div className="p-6 glass-card rounded-[4px] border-[1px] border-foreground mt-12">
          <h3 className="font-bold text-lg mb-2">Contact Us</h3>
          <p className="text-sm text-muted-foreground">
            If you have any questions about these Terms of Service, please contact us at hello@aipowerstacks.com
          </p>
        </div>
      </div>
    </div>
  )
}
