import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function loadEnv() {
  try {
    const raw = readFileSync(join(ROOT, '.env.local'), 'utf8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq < 1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      val = val.replace(/\\n/g, '');
      if (!process.env[key]) process.env[key] = val;
    }
  } catch (e) { }
}
loadEnv();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Category slugs → will be resolved to IDs at runtime
const TOOLS = [
  // ═══════════════════════════════════════════════════════
  // AI CODING & DEVELOPMENT
  // ═══════════════════════════════════════════════════════
  { name: 'Tabnine', slug: 'tabnine', url: 'https://tabnine.com', tagline: 'AI code completions that run locally and respect your privacy', description: 'Tabnine is an AI coding assistant that provides context-aware code completions, works with 30+ languages, and offers on-premise deployment for enterprise security requirements.', category: 'ai-code-completion', pricing_model: 'freemium', pricing_details: 'Free tier, Pro $12/mo' },
  { name: 'Codeium', slug: 'codeium', url: 'https://codeium.com', tagline: 'Free AI-powered code acceleration toolkit', description: 'Codeium offers unlimited AI code completions, chat, and search across 70+ languages. Free for individual developers with enterprise options for teams.', category: 'ai-code-completion', pricing_model: 'freemium', pricing_details: 'Free for individuals, Teams $12/user/mo' },
  { name: 'Amazon Q Developer', slug: 'amazon-q-developer', url: 'https://aws.amazon.com/q/developer/', tagline: 'AI assistant for software development on AWS', description: 'Amazon Q Developer helps write, debug, test, and transform code with AI. Includes code generation, bug detection, security scanning, and AWS service integration.', category: 'ai-coding-agents', pricing_model: 'freemium', pricing_details: 'Free tier, Pro $19/user/mo' },
  { name: 'Sourcegraph Cody', slug: 'sourcegraph-cody', url: 'https://sourcegraph.com/cody', tagline: 'AI coding assistant with full codebase context', description: 'Cody by Sourcegraph is an AI coding assistant that understands your entire codebase. It provides context-aware code generation, explanations, and refactoring with support for multiple LLM backends.', category: 'ai-coding-agents', pricing_model: 'freemium', pricing_details: 'Free tier, Pro $9/mo, Enterprise custom' },
  { name: 'Kilo Code', slug: 'kilo-code', url: 'https://kilocode.ai', tagline: 'Structured AI coding agent with tight context handling', description: 'Kilo Code is gaining traction with developers for its structured operational modes and precise context handling, designed to minimize hallucinations in AI-assisted coding workflows.', category: 'ai-coding-agents', pricing_model: 'freemium', pricing_details: 'Free tier available' },
  { name: 'Aider', slug: 'aider', url: 'https://aider.chat', tagline: 'AI pair programming in your terminal', description: 'Aider is an open-source AI pair programming tool that works in your terminal. It connects to GPT-4, Claude, and other LLMs to help you edit code in your local git repo with automatic commits.', category: 'ai-coding-agents', pricing_model: 'free', pricing_details: 'Free, open-source (bring your own API key)' },
  { name: 'OpenAI Codex', slug: 'openai-codex', url: 'https://openai.com/index/introducing-codex/', tagline: 'Cloud-based AI coding agent by OpenAI', description: 'OpenAI Codex is a cloud-based software engineering agent that can handle multiple tasks in parallel — writing features, fixing bugs, running tests, and proposing PRs in sandboxed environments.', category: 'ai-coding-agents', pricing_model: 'paid', pricing_details: 'Included with ChatGPT Pro ($200/mo)' },

  // ═══════════════════════════════════════════════════════
  // AI CHAT & ASSISTANTS
  // ═══════════════════════════════════════════════════════
  { name: 'Microsoft Copilot', slug: 'microsoft-copilot', url: 'https://copilot.microsoft.com', tagline: 'AI companion for Microsoft 365 and Windows', description: 'Microsoft Copilot is an AI assistant integrated across Windows, Edge, and Microsoft 365 apps. It handles drafting emails, summarizing documents, generating images, and answering questions with web access.', category: 'ai-chat', pricing_model: 'freemium', pricing_details: 'Free tier, Pro $20/mo, M365 Copilot $30/user/mo' },
  { name: 'Pi by Inflection', slug: 'pi-inflection', url: 'https://pi.ai', tagline: 'Personal AI designed for empathetic conversation', description: 'Pi is a personal AI assistant focused on emotional intelligence and natural conversation. It provides thoughtful, supportive responses and helps users think through problems with empathy.', category: 'ai-chat', pricing_model: 'free', pricing_details: 'Free' },
  { name: 'Poe', slug: 'poe', url: 'https://poe.com', tagline: 'Access multiple AI models in one platform', description: 'Poe by Quora provides access to ChatGPT, Claude, Gemini, Llama, and dozens of other AI models in a single interface. Create custom bots and compare outputs across models.', category: 'ai-chat', pricing_model: 'freemium', pricing_details: 'Free tier, $19.99/mo for unlimited' },
  { name: 'Character.AI', slug: 'character-ai', url: 'https://character.ai', tagline: 'Chat with AI-powered characters and personas', description: 'Character.AI lets users create and interact with AI characters for entertainment, roleplay, learning, and creative writing. Millions of user-created characters available.', category: 'ai-chat', pricing_model: 'freemium', pricing_details: 'Free tier, c.ai+ $9.99/mo' },
  { name: 'You.com', slug: 'you-com', url: 'https://you.com', tagline: 'AI search engine with personalized results', description: 'You.com is an AI-powered search engine combining web search with AI chat, offering personalized results, code generation, and image creation in one interface.', category: 'search', pricing_model: 'freemium', pricing_details: 'Free, YouPro $15/mo' },

  // ═══════════════════════════════════════════════════════
  // PRODUCTIVITY & WORKSPACE
  // ═══════════════════════════════════════════════════════
  { name: 'Motion', slug: 'motion', url: 'https://usemotion.com', tagline: 'AI-powered project management and calendar scheduling', description: 'Motion uses AI to automatically schedule your tasks, meetings, and projects. It builds the perfect daily plan by considering priorities, deadlines, and dependencies for your entire team.', category: 'productivity', pricing_model: 'paid', pricing_details: 'Individual $19/mo, Team $12/user/mo' },
  { name: 'Reclaim AI', slug: 'reclaim-ai', url: 'https://reclaim.ai', tagline: 'Smart calendar scheduling that protects your focus time', description: 'Reclaim AI automatically finds the best time for your tasks, habits, and meetings. It defends your focus time, syncs across calendars, and adapts to schedule changes in real-time.', category: 'productivity', pricing_model: 'freemium', pricing_details: 'Free tier, Starter $8/user/mo' },
  { name: 'Clockwise', slug: 'clockwise', url: 'https://clockwise.com', tagline: 'AI calendar optimization for teams', description: 'Clockwise uses AI to optimize team calendars, creating Focus Time blocks, resolving scheduling conflicts, and finding the best meeting times that minimize context switching.', category: 'productivity', pricing_model: 'freemium', pricing_details: 'Free tier, Teams $6.75/user/mo' },
  { name: 'Raycast AI', slug: 'raycast-ai', url: 'https://raycast.com', tagline: 'Supercharged productivity launcher with AI built in', description: 'Raycast is a blazingly fast launcher for macOS with built-in AI chat, code generation, translations, and workflow automation. Extensions marketplace with 1000+ integrations.', category: 'productivity', pricing_model: 'freemium', pricing_details: 'Free, Pro $8/mo (includes AI)' },
  { name: 'Taskade', slug: 'taskade', url: 'https://taskade.com', tagline: 'AI-powered workspace for tasks, notes, and collaboration', description: 'Taskade combines AI-generated tasks, notes, mind maps, and workflows in one workspace. Features AI agents that can automate project management and content creation.', category: 'productivity', pricing_model: 'freemium', pricing_details: 'Free tier, Pro $8/mo' },
  { name: 'Craft Docs', slug: 'craft-docs', url: 'https://craft.do', tagline: 'Beautiful AI-powered documents and notes', description: 'Craft is a native document and notes app with AI writing assistance. Features stunning design, real-time collaboration, and powerful organization for teams and individuals.', category: 'productivity', pricing_model: 'freemium', pricing_details: 'Free tier, Pro $5/mo' },

  // ═══════════════════════════════════════════════════════
  // MEETING & TRANSCRIPTION
  // ═══════════════════════════════════════════════════════
  { name: 'Granola', slug: 'granola', url: 'https://granola.ai', tagline: 'AI note-taker that captures audio without joining your call', description: 'Granola captures meeting audio directly from your device — no bot joins the call. It transcribes, summarizes, and organizes meeting notes while preserving privacy and client perception.', category: 'productivity', pricing_model: 'freemium', pricing_details: 'Free tier, Pro $10/mo' },
  { name: 'Fellow', slug: 'fellow', url: 'https://fellow.app', tagline: 'AI meeting management trusted by NYT Wirecutter', description: 'Fellow combines bot-based and botless recording with enterprise-grade security (SOC 2, GDPR, HIPAA). The Ask Fellow AI agent searches all past meetings to generate follow-up emails and CRM updates.', category: 'productivity', pricing_model: 'freemium', pricing_details: 'Free tier, Pro $7/user/mo' },
  { name: 'Krisp', slug: 'krisp', url: 'https://krisp.ai', tagline: 'AI noise cancellation and meeting transcription', description: 'Krisp removes background noise from calls in real-time and provides AI-powered meeting transcription, notes, and summaries. Works with any communication app.', category: 'voice', pricing_model: 'freemium', pricing_details: 'Free tier, Pro $8/mo' },
  { name: 'Tactiq', slug: 'tactiq', url: 'https://tactiq.io', tagline: 'Real-time AI transcription for Google Meet, Zoom, and Teams', description: 'Tactiq provides live transcription and AI summaries for video calls. Generates action items, follow-up emails, and structured notes from any virtual meeting.', category: 'productivity', pricing_model: 'freemium', pricing_details: 'Free tier, Pro $8/mo' },
  { name: 'Read.ai', slug: 'read-ai', url: 'https://read.ai', tagline: 'AI meeting copilot with engagement analytics', description: 'Read.ai provides meeting summaries, transcripts, and real-time engagement metrics. It measures attention, sentiment, and participation to improve meeting effectiveness.', category: 'productivity', pricing_model: 'freemium', pricing_details: 'Free tier, Pro $19.75/mo' },
  { name: 'tl;dv', slug: 'tldv', url: 'https://tldv.io', tagline: 'AI meeting recorder that timestamps key moments', description: 'tl;dv records and transcribes meetings on Google Meet, Zoom, and Teams. AI highlights key moments, generates summaries, and integrates with CRMs and project management tools.', category: 'productivity', pricing_model: 'freemium', pricing_details: 'Free unlimited recording, Pro $18/mo' },

  // ═══════════════════════════════════════════════════════
  // IMAGE GENERATION & DESIGN
  // ═══════════════════════════════════════════════════════
  { name: 'DALL-E 3', slug: 'dall-e-3', url: 'https://openai.com/dall-e-3', tagline: 'OpenAI\'s most capable image generation model', description: 'DALL-E 3 generates highly detailed images from text prompts with superior text rendering and prompt adherence. Integrated into ChatGPT and available via API.', category: 'image-generation', pricing_model: 'paid', pricing_details: 'Via ChatGPT Plus $20/mo or API pricing' },
  { name: 'Adobe Firefly', slug: 'adobe-firefly', url: 'https://firefly.adobe.com', tagline: 'Commercially safe AI image generation by Adobe', description: 'Adobe Firefly generates images trained exclusively on Adobe Stock and licensed content, making it one of the few AI image tools fully safe for commercial use without copyright concerns.', category: 'image-generation', pricing_model: 'freemium', pricing_details: 'Free tier (25 credits/mo), Premium $4.99/mo' },
  { name: 'Figma AI', slug: 'figma-ai', url: 'https://figma.com', tagline: 'AI-powered design tools inside Figma', description: 'Figma AI integrates generative AI directly into the design workflow — generate UI layouts, rename layers, remove backgrounds, and translate designs to code with AI assistance.', category: 'design', pricing_model: 'freemium', pricing_details: 'Free tier, Professional $15/editor/mo' },
  { name: 'Framer AI', slug: 'framer-ai', url: 'https://framer.com', tagline: 'AI website builder with production-quality output', description: 'Framer uses AI to generate complete, responsive websites from text prompts. Features real CMS, animations, and hosting — no code required for professional results.', category: 'design', pricing_model: 'freemium', pricing_details: 'Free tier, Mini $5/mo, Basic $15/mo' },
  { name: 'Photoroom', slug: 'photoroom', url: 'https://photoroom.com', tagline: 'AI photo editor for product and marketing images', description: 'Photoroom uses AI to remove backgrounds, generate product photos, and create marketing visuals instantly. Used by millions of e-commerce sellers and marketers.', category: 'image-generation', pricing_model: 'freemium', pricing_details: 'Free tier, Pro $9.99/mo' },
  { name: 'Topaz Photo AI', slug: 'topaz-photo-ai', url: 'https://topazlabs.com/topaz-photo-ai', tagline: 'AI-powered photo enhancement that runs locally', description: 'Topaz Photo AI uses AI to denoise, sharpen, and upscale images locally on your computer. The Autopilot feature automatically detects and fixes image quality issues.', category: 'image-generation', pricing_model: 'paid', pricing_details: '$199 one-time purchase' },
  { name: 'Krea AI', slug: 'krea-ai', url: 'https://krea.ai', tagline: 'Real-time AI image generation and enhancement', description: 'Krea AI offers real-time image generation that updates as you type or sketch. Features upscaling, style transfer, and a unique canvas-based workflow for iterative creation.', category: 'image-generation', pricing_model: 'freemium', pricing_details: 'Free tier, Pro $24/mo' },
  { name: 'Magnific AI', slug: 'magnific-ai', url: 'https://magnific.ai', tagline: 'AI image upscaler with hallucinated detail generation', description: 'Magnific AI upscales images while generating new realistic details that weren\'t in the original. Creates stunning high-resolution versions of any image with creative enhancement controls.', category: 'image-generation', pricing_model: 'paid', pricing_details: 'Pro $39/mo, Premium $99/mo' },

  // ═══════════════════════════════════════════════════════
  // VIDEO GENERATION
  // ═══════════════════════════════════════════════════════
  { name: 'Google Veo', slug: 'google-veo', url: 'https://deepmind.google/technologies/veo/', tagline: 'Google\'s state-of-the-art video generation model', description: 'Google Veo 3.1 is the best all-rounder for AI video generation with strong prompt adherence, realistic physics, combined video and audio generation, and robust creative tools.', category: 'video', pricing_model: 'freemium', pricing_details: 'Available via Google AI Studio and Vertex AI' },
  { name: 'Runway Gen-4', slug: 'runway-gen-4', url: 'https://runwayml.com', tagline: 'Next-generation AI video synthesis with physics simulation', description: 'Runway Gen-4 leads the market in visual fidelity and physics simulation for AI video generation. Offers text-to-video, image-to-video, and advanced motion controls.', category: 'video', pricing_model: 'freemium', pricing_details: 'Free tier, Standard $12/mo, Pro $28/mo' },
  { name: 'Pika Pro', slug: 'pika-pro', url: 'https://pika.art', tagline: 'Creative AI video generation with unique effects', description: 'Pika Pro generates and edits videos with AI, featuring unique creative effects like inflate, melt, explode, and cake-ify. Strong text-to-video and image-to-video capabilities.', category: 'video', pricing_model: 'freemium', pricing_details: 'Free tier, Standard $8/mo, Pro $28/mo' },
  { name: 'Luma Dream Machine', slug: 'luma-dream-machine-v2', url: 'https://lumalabs.ai/dream-machine', tagline: 'Fast high-quality AI video from text and images', description: 'Luma Dream Machine generates realistic videos from text prompts and images. Known for fast generation times and strong motion quality at an accessible price point.', category: 'video', pricing_model: 'freemium', pricing_details: 'Free tier, Standard $23.99/mo' },
  { name: 'Haiper', slug: 'haiper', url: 'https://haiper.ai', tagline: 'AI video generation with character consistency', description: 'Haiper generates AI videos with strong character consistency and cinematic quality. Features text-to-video, image animation, and video extension capabilities.', category: 'video', pricing_model: 'freemium', pricing_details: 'Free tier, Explorer $8/mo' },
  { name: 'Invideo AI', slug: 'invideo-ai', url: 'https://invideo.io', tagline: 'Generate publish-ready videos from text prompts', description: 'Invideo AI creates full videos with script, footage, voiceover, and music from a single text prompt. Edit with conversational commands and export in minutes.', category: 'video', pricing_model: 'freemium', pricing_details: 'Free tier, Plus $25/mo, Max $50/mo' },
  { name: 'Opus Clip', slug: 'opus-clip', url: 'https://opus.pro', tagline: 'AI tool that turns long videos into viral shorts', description: 'Opus Clip uses AI to analyze long-form videos and extract the most engaging moments as short clips optimized for TikTok, YouTube Shorts, and Instagram Reels.', category: 'video', pricing_model: 'freemium', pricing_details: 'Free tier, Starter $15/mo' },
  { name: 'Captions AI', slug: 'captions-ai', url: 'https://captions.ai', tagline: 'AI-powered video editing with auto captions and eye contact fix', description: 'Captions AI adds animated subtitles, fixes eye contact, removes filler words, and edits videos with AI. Designed for creators who want professional results without technical editing skills.', category: 'video', pricing_model: 'freemium', pricing_details: 'Free tier, Pro $10/mo' },

  // ═══════════════════════════════════════════════════════
  // VOICE & AUDIO
  // ═══════════════════════════════════════════════════════
  { name: 'Resemble AI', slug: 'resemble-ai', url: 'https://resemble.ai', tagline: 'AI voice cloning and speech synthesis', description: 'Resemble AI creates custom AI voices from just minutes of audio. Features real-time voice conversion, emotional speech synthesis, and enterprise-grade voice cloning with watermarking.', category: 'voice', pricing_model: 'paid', pricing_details: 'Pay-per-use, Enterprise custom' },
  { name: 'Play.ht', slug: 'play-ht', url: 'https://play.ht', tagline: 'Ultra-realistic AI text-to-speech and voice cloning', description: 'Play.ht offers 900+ AI voices in 142 languages with instant voice cloning from 30 seconds of audio. Used for podcasts, audiobooks, and enterprise voice applications.', category: 'voice', pricing_model: 'freemium', pricing_details: 'Free tier, Pro $31.20/mo' },
  { name: 'Podcastle', slug: 'podcastle', url: 'https://podcastle.ai', tagline: 'AI-powered podcast creation and editing studio', description: 'Podcastle offers AI-powered podcast recording, editing, and enhancement. Features include AI voice cloning, background noise removal, filler word detection, and text-to-podcast.', category: 'audio', pricing_model: 'freemium', pricing_details: 'Free tier, Storyteller $11.99/mo' },
  { name: 'Eleven Labs Reader', slug: 'elevenlabs-reader', url: 'https://elevenlabs.io/text-reader', tagline: 'Listen to any text with ultra-realistic AI voices', description: 'ElevenLabs Reader converts articles, PDFs, and documents into natural-sounding audio. Choose from hundreds of AI voices or clone your own for personalized listening.', category: 'voice', pricing_model: 'freemium', pricing_details: 'Free tier, Starter $5/mo' },

  // ═══════════════════════════════════════════════════════
  // WRITING & CONTENT
  // ═══════════════════════════════════════════════════════
  { name: 'Jasper AI', slug: 'jasper-ai', url: 'https://jasper.ai', tagline: 'Enterprise AI content platform with brand voice', description: 'Jasper is an enterprise AI platform for marketing teams that learns your brand voice, maintains style consistency, and generates content across channels with built-in collaboration and approval workflows.', category: 'writing', pricing_model: 'paid', pricing_details: 'Creator $49/mo, Pro $69/mo, Business custom' },
  { name: 'Writer', slug: 'writer-ai', url: 'https://writer.com', tagline: 'Enterprise AI writing platform with custom models', description: 'Writer is an enterprise generative AI platform that deploys custom LLMs trained on your company\'s data. Features brand voice enforcement, content governance, and secure deployment.', category: 'writing', pricing_model: 'paid', pricing_details: 'Team $18/user/mo, Enterprise custom' },
  { name: 'Sudowrite', slug: 'sudowrite', url: 'https://sudowrite.com', tagline: 'AI writing partner for fiction and creative writers', description: 'Sudowrite is designed specifically for fiction writers, offering AI-powered story generation, character development, prose enhancement, and plot brainstorming with creative writing guardrails.', category: 'writing', pricing_model: 'paid', pricing_details: 'Hobby $10/mo, Professional $25/mo' },
  { name: 'Wordtune', slug: 'wordtune', url: 'https://wordtune.com', tagline: 'AI writing companion that rewrites and rephrases', description: 'Wordtune helps rewrite sentences for clarity, tone, and style. Features AI summarization, expansion, and tone adjustment for professional communication.', category: 'writing', pricing_model: 'freemium', pricing_details: 'Free tier, Plus $9.99/mo' },
  { name: 'Rytr', slug: 'rytr', url: 'https://rytr.me', tagline: 'Affordable AI writing assistant for content creators', description: 'Rytr generates blog posts, social media content, emails, and ad copy in 30+ languages. Features tone selection, plagiarism checking, and SEO optimization.', category: 'writing', pricing_model: 'freemium', pricing_details: 'Free tier, Unlimited $9/mo' },
  { name: 'Lex', slug: 'lex', url: 'https://lex.page', tagline: 'AI-powered writing editor for long-form content', description: 'Lex is a minimalist writing editor with AI assistance. Features inline AI suggestions, title generation, and smart autocomplete designed for long-form writers and bloggers.', category: 'writing', pricing_model: 'freemium', pricing_details: 'Free tier, Premium $8/mo' },

  // ═══════════════════════════════════════════════════════
  // SEO & MARKETING
  // ═══════════════════════════════════════════════════════
  { name: 'Surfer SEO', slug: 'surfer-seo', url: 'https://surferseo.com', tagline: 'AI-powered content optimization for search rankings', description: 'Surfer SEO provides real-time content optimization with AI visibility tracking. Analyzes top-ranking pages and gives actionable suggestions to improve your content\'s search performance.', category: 'seo', pricing_model: 'paid', pricing_details: 'Essential $89/mo, Scale $129/mo' },
  { name: 'Clearscope', slug: 'clearscope', url: 'https://clearscope.io', tagline: 'AI content optimization platform for SEO teams', description: 'Clearscope uses AI to analyze search intent and provide content optimization recommendations. Integrates with Google Docs and WordPress for seamless SEO workflow.', category: 'seo', pricing_model: 'paid', pricing_details: 'Essentials $189/mo' },
  { name: 'MarketMuse', slug: 'marketmuse', url: 'https://marketmuse.com', tagline: 'AI content planning and optimization at scale', description: 'MarketMuse uses AI to audit your entire content inventory, identify gaps, plan topic clusters, and optimize individual pages for search with competitive intelligence.', category: 'seo', pricing_model: 'freemium', pricing_details: 'Free tier, Standard $149/mo' },
  { name: 'Keyword Insights', slug: 'keyword-insights', url: 'https://keywordinsights.ai', tagline: 'AI keyword clustering and content brief generation', description: 'Keyword Insights transforms keyword lists into organized topic clusters and generates complete content briefs with AI. Helps plan content strategies at scale.', category: 'seo', pricing_model: 'paid', pricing_details: 'Basic $58/mo, Pro $145/mo' },
  { name: 'AdCreative AI', slug: 'adcreative-ai', url: 'https://adcreative.ai', tagline: 'AI-generated ad creatives that convert', description: 'AdCreative AI generates high-converting ad creatives, social media posts, and banners using AI trained on millions of high-performing ads. Scores each creative for predicted performance.', category: 'business', pricing_model: 'paid', pricing_details: 'Starter $29/mo, Premium $59/mo' },
  { name: 'Phrasee', slug: 'phrasee', url: 'https://phrasee.co', tagline: 'AI-powered brand language optimization', description: 'Phrasee uses AI to generate and optimize marketing copy for email subject lines, push notifications, and ads. Tests thousands of variations to find what resonates with your audience.', category: 'business', pricing_model: 'paid', pricing_details: 'Enterprise pricing' },

  // ═══════════════════════════════════════════════════════
  // CUSTOMER SUPPORT
  // ═══════════════════════════════════════════════════════
  { name: 'Intercom Fin', slug: 'intercom-fin', url: 'https://intercom.com/fin', tagline: 'AI customer service agent that resolves issues autonomously', description: 'Fin by Intercom is an AI agent that resolves customer issues end-to-end using your help center and support data. Handles complex multi-step conversations with human-quality responses.', category: 'customer-support', pricing_model: 'paid', pricing_details: '$0.99 per resolution' },
  { name: 'Zendesk AI', slug: 'zendesk-ai', url: 'https://zendesk.com/ai', tagline: 'Enterprise AI agents pre-trained on 18B+ support interactions', description: 'Zendesk AI agents are pre-trained on over 18 billion real customer interactions. They handle complex requests autonomously, understand CX nuances, and integrate with existing Zendesk workflows.', category: 'customer-support', pricing_model: 'paid', pricing_details: 'Included with Suite plans from $55/agent/mo' },
  { name: 'Ada', slug: 'ada-cx', url: 'https://ada.cx', tagline: 'AI-first customer service automation platform', description: 'Ada uses AI to resolve customer inquiries across channels without human intervention. Features reasoning engine, knowledge integration, and enterprise-grade security for automated support.', category: 'customer-support', pricing_model: 'paid', pricing_details: 'Enterprise pricing' },
  { name: 'Tidio', slug: 'tidio', url: 'https://tidio.com', tagline: 'Live chat and AI chatbot for small businesses', description: 'Tidio combines live chat with AI-powered Lyro chatbot that resolves up to 67% of common questions automatically. Most accessible entry point for small teams exploring chatbot automation.', category: 'customer-support', pricing_model: 'freemium', pricing_details: 'Free tier, Starter $29/mo, Lyro AI $39/mo' },
  { name: 'Freshdesk Freddy AI', slug: 'freshdesk-freddy', url: 'https://freshworks.com/freshdesk/', tagline: 'AI-powered customer support suite by Freshworks', description: 'Freddy AI by Freshworks automates ticket routing, suggests responses, summarizes conversations, and resolves common issues. Integrated across Freshdesk support workflows.', category: 'customer-support', pricing_model: 'freemium', pricing_details: 'Free tier, Growth $15/agent/mo' },

  // ═══════════════════════════════════════════════════════
  // AUTOMATION & AGENTS
  // ═══════════════════════════════════════════════════════
  { name: 'Make (Integromat)', slug: 'make', url: 'https://make.com', tagline: 'Visual automation platform connecting 1500+ apps', description: 'Make (formerly Integromat) is a visual automation platform that connects apps and automates workflows without code. Build complex multi-step automations with a drag-and-drop interface.', category: 'automation', pricing_model: 'freemium', pricing_details: 'Free tier, Core $9/mo, Pro $16/mo' },
  { name: 'n8n', slug: 'n8n', url: 'https://n8n.io', tagline: 'Open-source workflow automation with AI capabilities', description: 'n8n is a self-hostable workflow automation tool with 400+ integrations and native AI capabilities. Build complex automations with a visual editor and run them on your own infrastructure.', category: 'automation', pricing_model: 'freemium', pricing_details: 'Free (self-hosted), Cloud from $20/mo' },
  { name: 'Bardeen', slug: 'bardeen', url: 'https://bardeen.ai', tagline: 'AI automation that works inside your browser', description: 'Bardeen automates repetitive tasks directly in your browser — scraping data, filling forms, moving info between apps. Uses AI to understand web pages and create automations from natural language.', category: 'automation', pricing_model: 'freemium', pricing_details: 'Free tier, Pro $10/mo' },
  { name: 'Relevance AI', slug: 'relevance-ai', url: 'https://relevanceai.com', tagline: 'Build and deploy AI agents without code', description: 'Relevance AI is a no-code platform for building AI agents and automations. Create custom AI workers that handle sales, support, research, and operations tasks autonomously.', category: 'automation', pricing_model: 'freemium', pricing_details: 'Free tier, Pro $19/mo' },

  // ═══════════════════════════════════════════════════════
  // RESEARCH & ANALYSIS
  // ═══════════════════════════════════════════════════════
  { name: 'Elicit', slug: 'elicit', url: 'https://elicit.com', tagline: 'AI research assistant for academic papers', description: 'Elicit uses AI to help researchers find, summarize, and extract data from academic papers. Searches across 200M+ papers and provides structured analysis of research findings.', category: 'research', pricing_model: 'freemium', pricing_details: 'Free tier, Plus $10/mo, Pro $42/mo' },
  { name: 'Consensus', slug: 'consensus', url: 'https://consensus.app', tagline: 'AI search engine for scientific research', description: 'Consensus uses AI to search through peer-reviewed scientific papers and extract findings. Get evidence-based answers to research questions with direct citations.', category: 'research', pricing_model: 'freemium', pricing_details: 'Free tier, Premium $8.99/mo' },
  { name: 'Scite.ai', slug: 'scite-ai', url: 'https://scite.ai', tagline: 'Smart citations showing how papers support or contrast claims', description: 'Scite.ai uses AI to analyze citations in context, showing whether papers support, mention, or contrast with cited claims. Helps researchers evaluate the reliability of scientific findings.', category: 'research', pricing_model: 'freemium', pricing_details: 'Free tier, $9.99/mo' },
  { name: 'Semantic Scholar', slug: 'semantic-scholar', url: 'https://semanticscholar.org', tagline: 'AI-powered academic search by Allen Institute', description: 'Semantic Scholar uses AI to analyze and organize 200M+ academic papers. Features include TLDR summaries, citation context, research feeds, and paper recommendations.', category: 'research', pricing_model: 'free', pricing_details: 'Free' },
  { name: 'Julius AI', slug: 'julius-ai', url: 'https://julius.ai', tagline: 'AI data analyst that visualizes and interprets your data', description: 'Julius AI analyzes spreadsheets, CSVs, and databases using natural language. Creates charts, runs statistical analysis, and generates insights without requiring coding knowledge.', category: 'data-analytics', pricing_model: 'freemium', pricing_details: 'Free tier, Pro $20/mo' },

  // ═══════════════════════════════════════════════════════
  // EDUCATION & LEARNING
  // ═══════════════════════════════════════════════════════
  { name: 'Khan Academy Khanmigo', slug: 'khanmigo', url: 'https://khanacademy.org/khan-labs', tagline: 'AI tutor powered by Khan Academy\'s educational expertise', description: 'Khanmigo is an AI tutor by Khan Academy that guides students through problems using the Socratic method. Provides personalized learning, writing help, and coding instruction.', category: 'education', pricing_model: 'freemium', pricing_details: 'Free with Khan Academy, Premium $4/mo' },
  { name: 'Duolingo Max', slug: 'duolingo-max', url: 'https://duolingo.com', tagline: 'AI-powered language learning with conversation practice', description: 'Duolingo Max uses GPT-4 for roleplay conversations and personalized explanations. Practice speaking with AI characters in real-world scenarios across 40+ languages.', category: 'education', pricing_model: 'freemium', pricing_details: 'Free tier, Max $29.99/mo' },
  { name: 'Synthesia', slug: 'synthesia', url: 'https://synthesia.io', tagline: 'AI video generation for training and communication', description: 'Synthesia creates professional videos with AI avatars from text scripts. Used for training, internal communications, and marketing without cameras, actors, or studios.', category: 'video', pricing_model: 'paid', pricing_details: 'Starter $22/mo, Creator $67/mo, Enterprise custom' },

  // ═══════════════════════════════════════════════════════
  // DATA & ANALYTICS
  // ═══════════════════════════════════════════════════════
  { name: 'Hex AI', slug: 'hex-ai', url: 'https://hex.tech', tagline: 'AI-powered data workspace for analytics teams', description: 'Hex combines SQL, Python, and AI in a collaborative notebook. Magic AI generates queries, explains results, and builds visualizations from natural language descriptions.', category: 'data-analytics', pricing_model: 'freemium', pricing_details: 'Free tier, Professional $28/mo' },
  { name: 'ThoughtSpot', slug: 'thoughtspot', url: 'https://thoughtspot.com', tagline: 'AI-powered analytics with natural language search', description: 'ThoughtSpot lets anyone search their data using natural language and get AI-generated answers, charts, and insights. Enterprise analytics made accessible to non-technical users.', category: 'data-analytics', pricing_model: 'paid', pricing_details: 'Enterprise pricing' },

  // ═══════════════════════════════════════════════════════
  // SOCIAL MEDIA
  // ═══════════════════════════════════════════════════════
  { name: 'Buffer AI', slug: 'buffer-ai', url: 'https://buffer.com', tagline: 'AI-powered social media management and scheduling', description: 'Buffer uses AI to generate social media posts, suggest optimal posting times, and repurpose content across platforms. Simple scheduling and analytics for creators and small teams.', category: 'social-media', pricing_model: 'freemium', pricing_details: 'Free tier, Essentials $5/channel/mo' },
  { name: 'Hootsuite AI', slug: 'hootsuite-ai', url: 'https://hootsuite.com', tagline: 'Enterprise social media management with AI content generation', description: 'Hootsuite integrates AI for caption writing, hashtag suggestions, best time to post, and social listening. Enterprise-grade social media management with team collaboration.', category: 'social-media', pricing_model: 'paid', pricing_details: 'Professional $99/mo, Team $249/mo' },
  { name: 'Lately AI', slug: 'lately-ai', url: 'https://lately.ai', tagline: 'AI that turns long-form content into social posts', description: 'Lately AI automatically repurposes blogs, videos, and podcasts into dozens of social media posts. Learns your brand voice and optimizes content for each platform.', category: 'social-media', pricing_model: 'paid', pricing_details: 'Starter $49/mo' },
  { name: 'Predis.ai', slug: 'predis-ai', url: 'https://predis.ai', tagline: 'AI social media content generator with design', description: 'Predis.ai generates complete social media posts including captions, hashtags, and designed graphics. Creates carousel posts, reels scripts, and ads with brand consistency.', category: 'social-media', pricing_model: 'freemium', pricing_details: 'Free tier, Solo $29/mo' },

  // ═══════════════════════════════════════════════════════
  // EMAIL & COMMUNICATION
  // ═══════════════════════════════════════════════════════
  { name: 'Superhuman AI', slug: 'superhuman-ai', url: 'https://superhuman.com', tagline: 'Fastest email experience with AI writing and triage', description: 'Superhuman is a premium email client with AI-powered writing, instant replies, email triage, and scheduling. Designed for professionals who want to spend less time on email.', category: 'email', pricing_model: 'paid', pricing_details: '$25/mo' },
  { name: 'Shortwave', slug: 'shortwave', url: 'https://shortwave.com', tagline: 'AI-powered email client with chat-based inbox', description: 'Shortwave reimagines email with AI — search your inbox with natural language, get AI summaries of threads, draft replies with context, and organize with smart bundles.', category: 'email', pricing_model: 'freemium', pricing_details: 'Free tier, Pro $7/mo, Business $14/mo' },
  { name: 'Lavender', slug: 'lavender', url: 'https://lavender.ai', tagline: 'AI email coach that improves sales outreach', description: 'Lavender scores your sales emails and provides real-time AI coaching to improve reply rates. Analyzes tone, length, personalization, and subject lines for better outreach.', category: 'email', pricing_model: 'freemium', pricing_details: 'Free tier, Starter $27/mo' },

  // ═══════════════════════════════════════════════════════
  // SEARCH & KNOWLEDGE
  // ═══════════════════════════════════════════════════════
  { name: 'Glean', slug: 'glean', url: 'https://glean.com', tagline: 'AI-powered enterprise search across all work apps', description: 'Glean connects to your company\'s apps (Slack, Drive, Confluence, etc.) and provides AI-powered search across all of them. Features include AI answers, knowledge management, and intelligent recommendations.', category: 'search', pricing_model: 'paid', pricing_details: 'Enterprise pricing' },
  { name: 'Phind', slug: 'phind', url: 'https://phind.com', tagline: 'AI search engine built for developers', description: 'Phind is an AI search engine optimized for programming questions. Provides code-aware answers with sources from documentation, Stack Overflow, and technical blogs.', category: 'search', pricing_model: 'freemium', pricing_details: 'Free tier, Pro $17/mo' },

  // ═══════════════════════════════════════════════════════
  // FINANCE & BUSINESS
  // ═══════════════════════════════════════════════════════
  { name: 'Runway Financial', slug: 'runway-financial', url: 'https://runway.com', tagline: 'AI-powered financial planning and modeling', description: 'Runway is a modern FP&A platform that uses AI to build financial models, forecast revenue, and plan budgets. Replaces spreadsheet-based financial planning with collaborative, visual tools.', category: 'finance', pricing_model: 'paid', pricing_details: 'Starter $50/mo, Business custom' },
  { name: 'Vic.ai', slug: 'vic-ai', url: 'https://vic.ai', tagline: 'Autonomous AI for accounts payable', description: 'Vic.ai uses AI to automate invoice processing, coding, and approval routing. Learns from your historical data to achieve 99%+ accuracy in autonomous AP workflows.', category: 'finance', pricing_model: 'paid', pricing_details: 'Enterprise pricing' },

  // ═══════════════════════════════════════════════════════
  // HR & RECRUITMENT
  // ═══════════════════════════════════════════════════════
  { name: 'HireVue', slug: 'hirevue', url: 'https://hirevue.com', tagline: 'AI-powered video interviews and hiring assessments', description: 'HireVue uses AI to conduct and analyze video interviews at scale. Features include structured interviewing, game-based assessments, and automated candidate evaluation.', category: 'hr', pricing_model: 'paid', pricing_details: 'Enterprise pricing' },
  { name: 'Fetcher', slug: 'fetcher', url: 'https://fetcher.ai', tagline: 'AI-powered talent sourcing and outreach', description: 'Fetcher uses AI to find, engage, and nurture candidates automatically. Builds targeted candidate pipelines and sends personalized outreach sequences.', category: 'hr', pricing_model: 'paid', pricing_details: 'From $149/mo' },
];

async function main() {
  console.log('Connecting to Supabase...');

  // Load categories
  const { data: categories, error: catErr } = await supabase.from('categories').select('id, slug');
  if (catErr) { console.error('Failed to load categories:', catErr.message); return; }
  const catMap = Object.fromEntries(categories.map(c => [c.slug, c.id]));

  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const t of TOOLS) {
    const categoryId = catMap[t.category];
    if (!categoryId) {
      console.log(`⚠️  Category "${t.category}" not found, skipping ${t.name}`);
      skipped++;
      continue;
    }

    // Check if tool already exists
    const { data: existing } = await supabase
      .from('tools')
      .select('id')
      .or(`slug.eq.${t.slug},website_url.eq.${t.url}`)
      .limit(1);

    if (existing && existing.length > 0) {
      const { error: updateErr } = await supabase
        .from('tools')
        .update({
          name: t.name,
          tagline: t.tagline,
          description: t.description,
          website_url: t.url,
          category_id: categoryId,
          pricing_model: t.pricing_model,
          pricing_details: t.pricing_details || null,
          status: 'published',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing[0].id);

      if (updateErr) {
        console.log(`❌ Failed to update ${t.name}: ${updateErr.message}`);
      } else {
        updated++;
        console.log(`✏️  Updated: ${t.name}`);
      }
    } else {
      const { error: insertErr } = await supabase
        .from('tools')
        .insert({
          name: t.name,
          slug: t.slug,
          website_url: t.url,
          tagline: t.tagline,
          description: t.description,
          category_id: categoryId,
          pricing_model: t.pricing_model,
          pricing_details: t.pricing_details || null,
          status: 'published',
          published_at: new Date().toISOString(),
        });

      if (insertErr) {
        console.log(`❌ Failed to insert ${t.name}: ${insertErr.message}`);
      } else {
        inserted++;
        console.log(`✅ Inserted: ${t.name}`);
      }
    }
  }

  console.log(`\n═══════════════════════════════`);
  console.log(`Done! Inserted: ${inserted}, Updated: ${updated}, Skipped: ${skipped}`);
  console.log(`Total tools processed: ${TOOLS.length}`);
}

main();
