import pkg from 'pg';
const { Client } = pkg;

const connectionString = 'postgresql://postgres:rockyou12!BBB@db.bynjsccnclkvcqulukij.supabase.co:5432/postgres';

const newTools = [
  { name: 'Norton Neo Browser', url: 'https://neobrowser.ai', tagline: 'The first safe AI-native browser designed for secure web browsing.' },
  { name: 'Echo Now AI', url: 'https://echonow.ai', tagline: 'Intelligent Slack summaries designed to help users reclaim their day.' },
  { name: 'NBot AI', url: 'https://nbot.ai', tagline: 'A personal AI radar that surfaces important news and research updates.' },
  { name: 'DailyScope AI', url: 'https://dailyscope.ai', tagline: 'Automatically analyzes global news patterns and themes.' },
  { name: 'TuckMeIn', url: 'https://tuckmein.app', tagline: "Generates personalized children's bedtime stories starring your child." },
  { name: 'Muses AI', url: 'https://www.muses.my', tagline: 'An intelligent AI writing agent for creating various types of content.' },
  { name: 'WP Now', url: 'https://www.worldpulsenow.com', tagline: 'Provides real-time global news summaries and headlines.' },
  { name: 'TIMIO News', url: 'https://timio.news', tagline: 'An AI tool specifically designed to identify and spot fake news.' },
  { name: 'StockNewsAI', url: 'https://stocknews.ai', tagline: 'Analyzes stock market news to provide actionable insights.' },
  { name: 'Resolution Builder', url: 'https://new-years-resolutions.base44.app', tagline: 'Helps users build personalized apps to track resolutions.' },
  { name: 'Sherlocks AI', url: 'https://www.sherlocks.ai', tagline: 'AI Site Reliability Engineering (SRE) teammates that monitor systems 24/7.' },
  { name: 'New Dialogue', url: 'https://www.newdialogue.com', tagline: 'Private AI assistance designed to improve teamwork within enterprises.' },
  { name: 'Mavis AI', url: 'https://www.heymavis.ai', tagline: 'Generates SEO-friendly news articles and content in minutes.' },
  { name: 'ReadPartner', url: 'https://readpartner.com', tagline: 'A media intelligence suite designed for businesses to track trends.' },
  { name: 'Vectara', url: 'https://vectara.com', tagline: 'Conversational search platform for smarter data queries.' },
  { name: 'Neus AI', url: 'https://neus.ai', tagline: 'Personalized and interactive AI-powered news summarization.' },
  { name: 'I Doubt News', url: 'https://idoubtnews.com', tagline: 'An AI-powered news analysis and fact-checking platform.' },
  { name: 'Boring Report', url: 'https://boringreport.org', tagline: 'Removes sensationalism from news to provide information without the noise.' },
  { name: 'NewsGPT', url: 'https://newsgpt.ai', tagline: 'An AI-generated news platform claiming to be reliable.' },
  { name: 'ClarityPage', url: 'https://claritypage.com', tagline: 'Delivers breaking news summaries designed to be free from media bias.' }
];

async function main() {
  const client = new Client({ connectionString });
  await client.connect();

  for (const t of newTools) {
    try {
      const urlObj = new URL(t.url);
      const slug = t.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const logo_url = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=128`;
      
      const res = await client.query(
        "INSERT INTO public.tools (name, website_url, tagline, logo_url, slug, status, category_id, description) VALUES ($1, $2, $3, $4, $5, 'pending', '6d289a7f-ea6b-4e85-ad69-099f2bfb5439', $3) ON CONFLICT (slug) DO NOTHING",
        [t.name, t.url, t.tagline, logo_url, slug]
      );
      
      if (res.rowCount > 0) {
        console.log(`Inserted: ${t.name}`);
      } else {
        console.log(`Skipped (Exists): ${t.name}`);
      }
    } catch (e) {
      console.error(`Error with ${t.name}:`, e.message);
    }
  }

  await client.end();
}

main().catch(console.error);
