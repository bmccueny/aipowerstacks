import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Learn how AIPowerStacks collects, uses, and protects your data.',
}

export default function PrivacyPage() {
  const date = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })

  return (
    <div className="page-shell max-w-4xl mx-auto">
      <div className="page-hero text-center mb-12">
        <h1 className="text-4xl font-black mb-4 uppercase tracking-tighter">Privacy Policy</h1>
        <p className="text-muted-foreground">Last updated: {date}</p>
      </div>

      <div className="prose dark:prose-invert max-w-none space-y-8">
        <section>
          <h2 className="text-2xl font-bold mb-4">1. Information We Collect</h2>
          <p className="text-muted-foreground leading-relaxed">
            When you use AIPowerStacks, we collect information you provide directly, such as when you create an account, submit a tool, or write a review. This may include:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2">
            <li>Email address (for authentication via Supabase)</li>
            <li>Username and display name</li>
            <li>Profile information (avatar, bio, website)</li>
            <li>Public content you create (reviews, tool submissions, bookmarks)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">2. Usage of Your Data</h2>
          <p className="text-muted-foreground leading-relaxed">
            We use the information we collect to provide, maintain, and improve our services. Specifically:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2">
            <li>To manage your account and authentication</li>
            <li>To personalize your experience and display your reviews</li>
            <li>To process and verify your tool submissions</li>
            <li>To communicate with you about your account or tool listings</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">3. Data Security & Storage</h2>
          <p className="text-muted-foreground leading-relaxed">
            We use industry-standard security measures, including Supabase for authentication and database management, to protect your personal information. However, no method of transmission or storage is 100% secure, and we cannot guarantee absolute security.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">4. Third-Party Services</h2>
          <p className="text-muted-foreground leading-relaxed">
            We may use third-party analytics (like Google Analytics) or service providers to help us understand how users interact with our site. These providers have their own privacy policies.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">5. Your Rights</h2>
          <p className="text-muted-foreground leading-relaxed">
            You have the right to access, correct, or delete your personal data. You can manage your profile settings in your dashboard or contact us for assistance with data deletion.
          </p>
        </section>

        <div className="p-6 glass-card rounded-[4px] border-[1px] border-foreground mt-12">
          <h3 className="font-bold text-lg mb-2">Questions?</h3>
          <p className="text-sm text-muted-foreground">
            If you have any questions about this Privacy Policy, please contact us at privacy@aipowerstacks.com
          </p>
        </div>
      </div>
    </div>
  )
}
