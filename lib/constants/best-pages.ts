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
}

export function getAllBestPageSlugs(): string[] {
  return Object.keys(BEST_PAGE_CONFIGS)
}
