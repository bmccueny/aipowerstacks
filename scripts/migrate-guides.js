const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function runGuideMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database. Adding guide column to blueprints...');

    const migrationSql = `
      alter table public.blueprints add column if not exists guide text;

      update public.blueprints 
      set guide = '### Setup Guide
1. **Connect Research**: Use Perplexity to find leads.
2. **Generate Copy**: Feed lead data into Writesonic.
3. **Automate Outreach**: Sync results to WhatsApp sender.'
      where title = 'Automated Lead Outreach';

      update public.blueprints 
      set guide = '### Setup Guide
1. **Script to Video**: Generate your base clips in Runway.
2. **Voiceover**: Upload script to ElevenLabs for dubbing.
3. **Cleanup**: Use AVCLabs to blur any sensitive background info.
4. **Final Sync**: Run the Lip Sync tool for perfect dialogue matching.'
      where title = 'Professional AI Film Studio';

      update public.blueprints 
      set guide = '### Setup Guide
1. **CLI Agent**: Initialize Claude Code in your root directory.
2. **Coding**: Use Cursor as your primary IDE for multi-file edits.
3. **Optimization**: Set up Nexos.ai to handle model switching for cost savings.'
      where title = 'Agentic Developer Flow';
    `;

    await client.query(migrationSql);
    console.log('Blueprint guides added successfully!');

  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    await client.end();
  }
}

runGuideMigration();
