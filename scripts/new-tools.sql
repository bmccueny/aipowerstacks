
      INSERT INTO public.tools (name, website_url, tagline, status, slug)
      VALUES 
      ('Sora 2', 'https://openai.com/sora', 'Advanced text-to-video generation', 'draft', 'sora-2'),
      ('Devin Pro', 'https://cognition.ai/devin', 'The first fully autonomous AI software engineer', 'draft', 'devin-pro'),
      ('Midjourney v7', 'https://midjourney.com', 'Hyper-realistic image generation', 'draft', 'midjourney-v7'),
      ('Perplexity Enterprise', 'https://perplexity.ai', 'AI-powered search engine for teams', 'draft', 'perplexity-enterprise'),
      ('Cursor Editor', 'https://cursor.sh', 'The AI-first code editor', 'draft', 'cursor-editor'),
      ('Jasper Brand Voice', 'https://jasper.ai', 'AI copywriter that learns your brand', 'draft', 'jasper-brand-voice'),
      ('Runway Gen-3', 'https://runwayml.com', 'Next-gen video synthesis tools', 'draft', 'runway-gen-3'),
      ('Synthesia Avatar', 'https://synthesia.io', 'AI video generation platform', 'draft', 'synthesia-avatar'),
      ('ElevenLabs Dubbing', 'https://elevenlabs.io', 'AI voice generation and dubbing', 'draft', 'elevenlabs-dubbing'),
      ('Gamma App', 'https://gamma.app', 'AI for generating presentations and webs', 'draft', 'gamma-app'),
      ('Beautiful.ai', 'https://beautiful.ai', 'Generative presentation software', 'draft', 'beautiful-ai'),
      ('Tome', 'https://tome.app', 'AI-powered storytelling format', 'draft', 'tome'),
      ('Copy.ai', 'https://copy.ai', 'AI powered copywriting for marketing', 'draft', 'copy-ai'),
      ('Writesonic', 'https://writesonic.com', 'AI writer for SEO blogs and articles', 'draft', 'writesonic'),
      ('Otter.ai', 'https://otter.ai', 'AI meeting notes and transcription', 'draft', 'otter-ai'),
      ('Fireflies.ai', 'https://fireflies.ai', 'Automate meeting notes', 'draft', 'fireflies-ai'),
      ('Descript', 'https://descript.com', 'All-in-one video and audio editing', 'draft', 'descript'),
      ('Murf.ai', 'https://murf.ai', 'AI voice generator', 'draft', 'murf-ai'),
      ('Lovo.ai', 'https://lovo.ai', 'AI voiceover and text to speech', 'draft', 'lovo-ai'),
      ('Speechify', 'https://speechify.com', 'Text to speech reader', 'draft', 'speechify')
      ON CONFLICT (website_url) DO NOTHING;
    