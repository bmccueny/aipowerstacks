import pkg from 'pg';
const { Client } = pkg;
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
      const val = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  } catch (e) { }
}
loadEnv();

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:rockyou12!BBB@db.bynjsccnclkvcqulukij.supabase.co:5432/postgres';

const toolData = [
  { slug: 'beautiful-ai', use_case: 'Presentation design for sales pitches, marketing decks, reports, and team updates. Ideal for businesses creating polished slides quickly without design skills.', pricing: 'paid', details: 'Starts at $12/month; integrates with PowerPoint.' },
  { slug: 'boring-report', use_case: 'News summarization to remove sensationalism and bias, providing factual overviews. Useful for quick, objective news consumption in journalism, research, or daily updates.', pricing: 'free', details: 'AI transforms articles into neutral summaries; focuses on essential info. Free web app.' },
  { slug: 'claritypage', use_case: 'Website analytics and user behavior tracking. Suited for UX optimization, e-commerce, and marketing teams analyzing heatmaps, session replays, and engagement.', pricing: 'freemium', details: 'Free tier available; paid from $10/month. AI-powered insights like rage clicks and heatmaps.' },
  { slug: 'copy-ai', use_case: 'Content marketing, sales emails, social media posts, and SEO-optimized articles. Great for GTM teams scaling output while maintaining quality.', pricing: 'trial', details: 'Free trial; paid from $49/month. Supports prospecting and content engines.' },
  { slug: 'cursor-editor', use_case: 'Code editing, debugging, and software development. Ideal for programmers accelerating workflows with inline suggestions and refactoring.', pricing: 'freemium', details: 'Free tier; paid from $20/month. AI inline code gen and context-aware edits.' },
  { slug: 'dailyscope-ai', use_case: 'Daily productivity boosts like summarizing notes, brainstorming, and task management. Useful for professionals streamlining workflows.', pricing: 'freemium', details: 'Free tier; paid from $10/month. AI as tutor/summarizer/copywriter.' },
  { slug: 'descript-ai', use_case: 'Video/audio editing, podcast production, and content repurposing. Suited for creators automating transcripts, clips, and polish.', pricing: 'freemium', details: 'Free tier; paid from $12/month. AI tools for eye contact, green screen, and summaries.' },
  { slug: 'devin-pro', use_case: 'Software engineering tasks like coding, debugging, and migrations. For dev teams automating workflows and optimizing features.', pricing: 'contact', details: 'Enterprise custom pricing. AI agents for bug triage and code review.' },
  { slug: 'echo-now-ai', use_case: 'Meeting summaries, channel monitoring, and knowledge retrieval in Slack/Teams. Ideal for teams reducing message overload.', pricing: 'freemium', details: 'Free tier; paid from $10/month. AI summaries and Q&A from messages.' },
  { slug: 'elevenlabs-dubbing', use_case: 'Video localization, dubbing for films/TV, and multilingual content. For media production reaching global audiences.', pricing: 'freemium', details: 'Free tier; paid from $5/month. AI voice cloning and dubbing in 100+ languages.' },
  { slug: 'fireflies-ai', use_case: 'Meeting transcription, summaries, and task extraction. For sales, engineering, and teams automating notes.', pricing: 'freemium', details: 'Free tier; paid from $10/month. AI notetaker with CRM integrations.' },
  { slug: 'gamma-app', use_case: 'Presentation creation for pitches, reports, and marketing. For teams needing quick, visual decks.', pricing: 'freemium', details: 'Free tier; paid from $8/month. AI generator for slides/websites.' },
  { slug: 'i-doubt-news', use_case: 'Fake news detection and bias analysis. For journalists, researchers verifying sources.', pricing: 'free', details: 'Free web tool. AI scans for misinformation and summarizes viewpoints.' },
  { slug: 'jasper-brand-voice', use_case: 'Brand-consistent content like emails, ads, and posts. For marketing teams scaling voice.', pricing: 'paid', details: 'Starts at $39/month. AI tunes tone/style and integrates with CRMs.' },
  { slug: 'kling-ai', use_case: 'Video generation for marketing, VFX, and animations. For creators building cinematic content.', pricing: 'freemium', details: 'Free tier; paid from $10/month. Text-to-video with motion control.' },
  { slug: 'lovo-ai', use_case: 'Voiceovers for ads, videos, podcasts, and e-learning. For content creators needing multilingual audio.', pricing: 'freemium', details: 'Free tier; paid from $29/month. AI voices in 100+ languages with emotion tools.' },
  { slug: 'marketmind-ai', use_case: 'Market research, stock analysis, and trend tracking. For investors and analysts monitoring data.', pricing: 'contact', details: 'Custom pricing. AI agents for financial insights.' },
  { slug: 'mavis-ai', use_case: 'Content creation for publishers, newsletters, and affiliates. For media teams automating articles.', pricing: 'freemium', details: 'Free tier; paid from $20/month. AI writer for blogs and social posts.' },
  { slug: 'midjourney-v7', use_case: 'Image generation for art, design, and marketing visuals. For creatives prototyping concepts.', pricing: 'paid', details: '$10/month. Discord-based AI for photorealistic/surreal images.' },
  { slug: 'murf-ai', use_case: 'Voice generation for videos, ads, and IVR. For marketers creating localized audio.', pricing: 'freemium', details: 'Free tier; paid from $19/month. AI dubbing in 35+ languages.' },
  { slug: 'muses-ai', use_case: 'Video hosting/search for teams; knowledge bases. For educators and businesses organizing content.', pricing: 'freemium', details: 'Free tier; paid from $10/month. AI search for speech and text.' },
  { slug: 'nbot-ai', use_case: 'Topic tracking for news, trends, and keywords. For researchers monitoring specific subjects.', pricing: 'freemium', details: 'Free tier; paid from $5/month. AI trackers for daily summaries.' },
  { slug: 'neus-ai', use_case: 'Data analysis and sensitive data governance. For IT/security teams in compliance-heavy sectors.', pricing: 'contact', details: 'Enterprise custom. AI for anomaly detection and audits.' },
  { slug: 'new-dialogue', use_case: 'Customer support chatbots and internal processes. For regulated enterprises automating secure tasks.', pricing: 'contact', details: 'Custom pricing. Sovereign AI agents with compliance focus.' },
  { slug: 'newsgpt', use_case: 'Personalized news summaries and AI-generated reports. For users seeking unbiased updates.', pricing: 'free', details: 'Free tool. AI curation from sources with bias detection.' },
  { slug: 'norton-neo-browser', use_case: 'Secure browsing with AI summaries, tab management, and research. For professionals organizing web content.', pricing: 'paid', details: 'Free with Norton subscription. AI peek/summaries with privacy focus.' },
  { slug: 'otter-ai', use_case: 'Meeting notes, transcription, and collaboration. For teams in sales/HR automating follow-ups.', pricing: 'freemium', details: 'Free tier; paid from $8.33/month. AI summaries with Zoom/Slack integrations.' },
  { slug: 'perplexity-enterprise', use_case: 'Industry-specific research like finance/consulting. For teams needing cited answers from databases.', pricing: 'contact', details: 'Enterprise custom. AI search with knowledge bases.' },
  { slug: 'readpartner', use_case: 'Media monitoring, trend analysis, and competitor tracking. For businesses scanning news/social.', pricing: 'trial', details: 'Free trial; paid from $15/month. AI summaries and reports with alerts.' },
  { slug: 'resolution-builder', use_case: 'Goal setting and resolution drafting. For personal/productivity planning.', pricing: 'free', details: 'Free tool. AI for formal resolutions and templates.' },
  { slug: 'runway-gen-3', use_case: 'Video gen for filmmaking, ads, and VFX. For creators building surreal/cinematic clips.', pricing: 'freemium', details: 'Free tier; paid from $12/month. Text-to-video with 4K outputs.' },
  { slug: 'sherlocks-ai', use_case: 'Incident response, debugging, and security audits. For IT/dev teams in governance.', pricing: 'contact', details: 'Enterprise custom. AI for anomaly detection and security hypotheses.' },
  { slug: 'sora-2', use_case: 'Video creation for marketing, storytelling, and prototypes. For creatives generating from prompts.', pricing: 'paid', details: '$20/month+. AI for realistic scenes and 25s clips.' },
  { slug: 'speechify-ai', use_case: 'Text-to-speech for audiobooks, docs, and accessibility. For educators/content creators.', pricing: 'freemium', details: 'Free tier; paid from $11/month. AI voices with multilingual support.' },
  { slug: 'stocknewsai', use_case: 'Stock market news analysis and insights. For investors tracking trends.', pricing: 'free', details: 'Free tool. AI summaries and sentiment analysis.' },
  { slug: 'super-whisper', use_case: 'Voice-to-text dictation for writing, coding, and notes. For productivity in apps.', pricing: 'freemium', details: 'Free tier; paid from $10/month. AI polishing; works in any text box.' },
  { slug: 'synthesia-avatar', use_case: 'Video avatars for training, ads, and communications. For creators localizing content.', pricing: 'trial', details: 'Free trial; paid from $22/month. AI dubbing and expressive avatars.' },
  { slug: 'timio-news', use_case: 'Bias detection and balanced news summaries. For users spotting misinformation.', pricing: 'free', details: 'Free Chrome extension. AI tools for fake news identification.' },
  { slug: 'tome-ai', use_case: 'Storytelling presentations for sales/marketing. For teams generating narratives.', pricing: 'freemium', details: 'Free tier; paid from $8/month. AI from prompts with Figma integration.' },
  { slug: 'tuckmein', use_case: 'Personalized bedtime stories for kids. For parents/educators creating custom tales.', pricing: 'free', details: 'Free app. AI-generated narratives with audio.' },
  { slug: 'vectara', use_case: 'Semantic search and data governance. For enterprises in legal/medical handling sensitive info.', pricing: 'contact', details: 'Custom pricing. AI for retrieval and bias detection.' },
  { slug: 'whisper-flow', use_case: 'Voice dictation for emails, code, and docs. For developers/writers boosting productivity.', pricing: 'freemium', details: 'Free tier; paid from $10/month. AI polishing and whisper mode.' },
  { slug: 'wp-now', use_case: 'WordPress site building from prompts. For devs automating themes/plugins.', pricing: 'freemium', details: 'Free tier; paid from $10/month. AI for quick prototypes.' },
  { slug: 'writesonic-ai', use_case: 'Content gen for blogs, ads, and emails. For marketers scaling SEO/copy.', pricing: 'freemium', details: 'Free tier; paid from $12/month. AI templates and long-form writer.' }
];

async function main() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('Connected to database');

    for (const tool of toolData) {
      const res = await client.query(
        "UPDATE public.tools SET use_case = $1, pricing_model = $2, pricing_details = $3 WHERE slug = $4",
        [tool.use_case, tool.pricing, tool.details, tool.slug]
      );
      
      if (res.rowCount > 0) {
        console.log(`Updated: ${tool.slug}`);
      } else {
        console.log(`Failed (Not Found): ${tool.slug}`);
      }
    }
    
    console.log('\nBulk metadata update complete.');
  } catch (err) {
    console.error('Error during update:', err);
  } finally {
    await client.end();
  }
}

main();
