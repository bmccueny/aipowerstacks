export type BestPageConfig = {
  title: string
  description: string
  heading: string
  categorySlug?: string
  pricingFilter?: string
  faq: { q: string; a: string }[]
}

export const BEST_PAGE_CONFIGS: Record<string, BestPageConfig> = {
  'free-ai-writing-tools': {
    title: 'Best Free AI Writing Tools',
    description: 'Discover the best free AI writing tools for blog posts, copywriting, and content creation. Compare features and find the perfect writing assistant.',
    heading: 'Best Free AI Writing Tools',
    categorySlug: 'ai-writing',
    pricingFilter: 'free',
    faq: [
      { q: 'Are free AI writing tools good enough for professional use?', a: 'Many free AI writing tools offer impressive quality for blog posts, social media, and basic copywriting. For high-volume or specialized content, paid tiers typically offer more features and higher limits.' },
      { q: 'What should I look for in a free AI writing tool?', a: 'Consider output quality, word limits, supported content types (blog, email, ads), tone customization, and whether the free tier includes plagiarism checking.' },
      { q: 'Can free AI writers replace human editors?', a: 'AI writing tools are best used as assistants rather than replacements. They excel at drafting and brainstorming but human review is recommended for accuracy, brand voice, and nuance.' },
    ],
  },
  'ai-image-generators': {
    title: 'Best AI Image Generators',
    description: 'Find the best AI image generators for creating stunning artwork, photos, and designs. Compare Midjourney, DALL-E, Stable Diffusion and more.',
    heading: 'Best AI Image Generators',
    categorySlug: 'ai-image-generation',
    faq: [
      { q: 'Which AI image generator produces the most realistic images?', a: 'Midjourney and DALL-E 3 are currently considered top-tier for photorealism. Stable Diffusion offers comparable results with more control when fine-tuned.' },
      { q: 'Are AI-generated images free to use commercially?', a: 'It depends on the tool. Most paid plans include commercial usage rights, but always check the specific license terms. Some free tiers restrict commercial use.' },
      { q: 'Can I train an AI image generator on my own style?', a: 'Yes, tools like Stable Diffusion support fine-tuning with custom datasets. Some commercial tools like Midjourney offer style references as well.' },
    ],
  },
  'ai-coding-assistants': {
    title: 'Best AI Coding Assistants',
    description: 'Compare the top AI coding assistants including GitHub Copilot, Cursor, and more. Find the best AI pair programmer for your workflow.',
    heading: 'Best AI Coding Assistants',
    categorySlug: 'ai-coding',
    faq: [
      { q: 'Which AI coding assistant is best for beginners?', a: 'GitHub Copilot and Cursor are both beginner-friendly with IDE integration. They provide inline suggestions and can explain code, making them great learning tools.' },
      { q: 'Do AI coding assistants support all programming languages?', a: 'Most support popular languages like Python, JavaScript, TypeScript, Go, and Rust. Coverage varies for niche languages — check each tool\'s documentation.' },
      { q: 'Are AI coding assistants secure for enterprise use?', a: 'Enterprise plans typically offer data privacy guarantees, SOC 2 compliance, and options to prevent code from being used for training. Always review the security documentation.' },
    ],
  },
  'free-ai-tools': {
    title: 'Best Free AI Tools',
    description: 'Discover the best free AI tools across all categories. From writing to coding to image generation — find powerful AI tools that won\'t cost a dime.',
    heading: 'Best Free AI Tools',
    pricingFilter: 'free',
    faq: [
      { q: 'What are the best completely free AI tools?', a: 'Many top AI tools offer generous free tiers, including ChatGPT, Google Gemini, Stable Diffusion (open source), and various open-source coding assistants.' },
      { q: 'Are free AI tools safe to use?', a: 'Most reputable free AI tools are safe, but always review privacy policies. Some free tiers may use your data for training. Open-source tools give you more control.' },
      { q: 'Why do companies offer free AI tools?', a: 'Free tiers help companies build user bases and demonstrate value. They typically monetize through premium features, higher usage limits, or enterprise plans.' },
    ],
  },
  'ai-tools-for-marketing': {
    title: 'Best AI Tools for Marketing',
    description: 'Find the best AI marketing tools for SEO, content creation, social media, email campaigns, and more. Boost your marketing with AI.',
    heading: 'Best AI Tools for Marketing',
    categorySlug: 'ai-marketing',
    faq: [
      { q: 'How can AI tools improve my marketing?', a: 'AI tools can automate content creation, optimize ad targeting, personalize email campaigns, analyze competitor strategies, and generate SEO-optimized content at scale.' },
      { q: 'Which AI marketing tool has the best ROI?', a: 'ROI varies by use case. AI writing tools often show quick wins for content marketing, while AI analytics tools provide long-term strategic advantages.' },
      { q: 'Can AI replace my marketing team?', a: 'AI tools augment rather than replace marketing teams. They handle repetitive tasks and data analysis, freeing your team to focus on strategy and creativity.' },
    ],
  },
  'ai-video-generators': {
    title: 'Best AI Video Generators',
    description: 'Compare the top AI video generators for creating professional videos, animations, and visual content. From text-to-video to editing tools.',
    heading: 'Best AI Video Generators',
    categorySlug: 'ai-video',
    faq: [
      { q: 'Can AI generate full-length videos?', a: 'Current AI video tools can generate short clips (typically 5-60 seconds). They\'re great for social media, ads, and B-roll. Full-length video still requires traditional production with AI assistance.' },
      { q: 'What quality can I expect from AI video generators?', a: 'Quality has improved dramatically. Tools like Runway, Pika, and Sora can produce near-professional quality for short clips, though longer content may have consistency issues.' },
      { q: 'Are AI-generated videos suitable for commercial use?', a: 'Most paid AI video tools include commercial usage rights. Always verify the license terms, especially for content featuring AI-generated human likenesses.' },
    ],
  },
  'ai-chatbots': {
    title: 'Best AI Chatbots',
    description: 'Compare the best AI chatbots for customer support, personal assistance, and business automation. Find the right conversational AI for your needs.',
    heading: 'Best AI Chatbots',
    categorySlug: 'ai-chatbots',
    faq: [
      { q: 'Which AI chatbot is the smartest?', a: 'ChatGPT (GPT-4), Claude, and Gemini are among the most capable general-purpose chatbots. The "best" depends on your specific use case — some excel at coding, others at creative writing or analysis.' },
      { q: 'Can I build a custom AI chatbot for my business?', a: 'Yes, many platforms offer no-code chatbot builders that can be trained on your business data. Options range from simple FAQ bots to sophisticated conversational AI.' },
      { q: 'How much do AI chatbots cost?', a: 'Pricing varies widely. Many offer free tiers with usage limits. Business plans typically range from $20-500/month depending on features and volume.' },
    ],
  },
  'ai-productivity-tools': {
    title: 'Best AI Productivity Tools',
    description: 'Find the best AI productivity tools to automate tasks, manage projects, and save hours every week. Compare features and pricing across top tools.',
    heading: 'Best AI Productivity Tools',
    categorySlug: 'ai-productivity',
    faq: [
      { q: 'Which AI productivity tool saves the most time?', a: 'Tools like Notion AI and Zapier AI automate repetitive tasks. Most users report saving 5-10 hours per week on administrative work with the right AI productivity stack.' },
      { q: 'Are AI productivity tools worth the subscription cost?', a: 'If you value your time at $30+/hour, even a $20/month AI tool that saves 2 hours/week delivers 12x ROI. The key is picking tools that automate YOUR specific bottlenecks.' },
      { q: 'Can AI productivity tools integrate with existing workflows?', a: 'Most modern AI productivity tools offer integrations with popular platforms like Slack, Google Workspace, Microsoft 365, and Notion. Check each tool\'s integration list before committing.' },
    ],
  },
  'ai-research-tools': {
    title: 'Best AI Research Tools',
    description: 'Compare the top AI research tools for academic research, market analysis, and data synthesis. Find AI assistants that help you research faster.',
    heading: 'Best AI Research Tools',
    categorySlug: 'ai-research',
    faq: [
      { q: 'Which AI research tool is best for academic papers?', a: 'Perplexity AI and Elicit are popular for academic research. They can find papers, summarize findings, and help with literature reviews. Always verify AI-found citations independently.' },
      { q: 'Can AI research tools replace Google Scholar?', a: 'AI research tools complement rather than replace traditional search. They excel at synthesizing information across sources and finding connections, while Google Scholar remains better for comprehensive citation tracking.' },
      { q: 'Are AI research tools accurate?', a: 'AI research tools can occasionally produce inaccurate or fabricated information. Always cross-reference key findings with primary sources. The best tools like Perplexity show their sources inline.' },
    ],
  },
  'ai-marketing-tools': {
    title: 'Best AI Marketing Tools',
    description: 'Discover the best AI marketing tools for content creation, SEO, social media, and ad optimization. Compare top AI marketing assistants side by side.',
    heading: 'Best AI Marketing Tools',
    categorySlug: 'ai-marketing',
    faq: [
      { q: 'Which AI marketing tool is best for small businesses?', a: 'Jasper AI and Copy.ai are popular choices for small businesses needing AI copywriting. For social media, tools like Buffer AI and Hootsuite AI offer affordable automation.' },
      { q: 'Can AI replace a marketing team?', a: 'AI marketing tools augment rather than replace human marketers. They excel at generating drafts, analyzing data, and automating repetitive tasks, but strategy and brand voice still require human judgment.' },
      { q: 'How much do AI marketing tools cost?', a: 'Most AI marketing tools range from $20-200/month for individual plans. Enterprise plans with team features and higher limits typically cost $200-1000/month.' },
    ],
  },
  'ai-audio-tools': {
    title: 'Best AI Audio & Voice Tools',
    description: 'Compare top AI audio tools for voice cloning, text to speech, podcast editing, and music generation. Find the best AI voice tools for your needs.',
    heading: 'Best AI Audio & Voice Tools',
    categorySlug: 'ai-audio',
    faq: [
      { q: 'Which AI voice tool sounds the most natural?', a: 'ElevenLabs is widely considered the leader in natural-sounding AI voices, with support for multiple languages and voice cloning. Google and Amazon also offer strong text-to-speech APIs.' },
      { q: 'Can I clone my own voice with AI?', a: 'Yes, several tools like ElevenLabs and Resemble AI offer voice cloning from short audio samples. Most require consent verification and have usage policies for cloned voices.' },
      { q: 'Are AI-generated voices legal to use commercially?', a: 'AI-generated voices from licensed platforms are generally legal for commercial use. However, cloning real people\'s voices without consent may violate laws in some jurisdictions.' },
    ],
  },
  'ai-design-tools': {
    title: 'Best AI Design Tools',
    description: 'Find the best AI design tools for graphic design, UI/UX, logo creation, and visual content. Compare Canva AI, Figma AI, and other top design assistants.',
    heading: 'Best AI Design Tools',
    categorySlug: 'ai-design',
    faq: [
      { q: 'Can AI design tools replace graphic designers?', a: 'AI design tools are excellent for quick iterations, concept generation, and template-based design. Professional graphic design for branding and complex layouts still benefits from human expertise.' },
      { q: 'Which AI design tool is best for non-designers?', a: 'Canva AI is the most beginner-friendly option with AI-powered templates and design suggestions. It requires no design experience and produces professional results quickly.' },
      { q: 'Do AI design tools support brand guidelines?', a: 'Most enterprise AI design tools support brand kits with custom colors, fonts, and logo placement. Canva, Figma, and Adobe all offer brand management features in their paid plans.' },
    ],
  },
  'ai-customer-support-tools': {
    title: 'Best AI Customer Support Tools',
    description: 'Compare top AI customer support tools for chatbots, ticket routing, and automated responses. Find the best AI help desk solution for your business.',
    heading: 'Best AI Customer Support Tools',
    categorySlug: 'ai-customer-support',
    faq: [
      { q: 'Can AI handle customer support without human agents?', a: 'AI can resolve 60-80% of common support queries autonomously. Complex, emotional, or edge-case issues still require human agents. The best approach is AI-first triage with human escalation.' },
      { q: 'How quickly can I deploy an AI customer support bot?', a: 'Most modern AI support tools can be set up in hours, not weeks. They learn from your existing knowledge base and FAQ documents. Fine-tuning for accuracy typically takes 1-2 weeks of monitoring.' },
      { q: 'What ROI can I expect from AI customer support?', a: 'Companies typically see 30-50% reduction in support ticket volume and faster response times. At scale, AI support can reduce support costs by $5-15 per resolved ticket.' },
    ],
  },
  'ai-tools-under-20': {
    title: 'Best AI Tools Under $20/Month',
    description: 'Find powerful AI tools that cost less than $20 per month. Budget-friendly AI for coding, writing, image generation, and productivity.',
    heading: 'Best AI Tools Under $20/Month',
    pricingFilter: 'budget',
    faq: [
      { q: 'What can I get for under $20/month in AI tools?', a: 'Surprisingly a lot. ChatGPT Plus ($20), GitHub Copilot ($10), and Perplexity Pro ($20) are all under this threshold. Many image generators and writing tools also have plans in this range.' },
      { q: 'Are cheap AI tools less capable?', a: 'Not necessarily. Many budget AI tools use the same underlying models as expensive enterprise solutions. The difference is usually in usage limits, team features, and support — not core AI capability.' },
      { q: 'How many AI subscriptions should I have?', a: 'Most individuals need 2-3 AI tools. Use our AI Subscription Tracker to find overlaps in your current stack and identify which tools you can consolidate.' },
    ],
  },
}

export function getAllBestPageSlugs(): string[] {
  return Object.keys(BEST_PAGE_CONFIGS)
}
