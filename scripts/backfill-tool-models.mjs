import { createClient } from '@supabase/supabase-js'

const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim().replace(/\n/g, '')
const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim().replace(/\n/g, '')

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(url, key)

const rows = [
  // ChatGPT
  { tool_id: 'c8138cb5-988a-4831-86be-a819d92b2ef9', model_name: 'GPT-4o', model_provider: 'OpenAI', is_primary: true, use_cases: ['chat','writing','coding','research'], strength_score: 9, notes: 'Default model for Plus' },
  { tool_id: 'c8138cb5-988a-4831-86be-a819d92b2ef9', model_name: 'GPT-4o mini', model_provider: 'OpenAI', is_primary: false, use_cases: ['chat','writing'], strength_score: 7, notes: 'Lighter, faster model' },
  { tool_id: 'c8138cb5-988a-4831-86be-a819d92b2ef9', model_name: 'o3', model_provider: 'OpenAI', is_primary: false, use_cases: ['coding','research','math'], strength_score: 10, notes: 'Advanced reasoning' },
  { tool_id: 'c8138cb5-988a-4831-86be-a819d92b2ef9', model_name: 'o3-mini', model_provider: 'OpenAI', is_primary: false, use_cases: ['coding','math'], strength_score: 8, notes: 'Fast reasoning' },
  { tool_id: 'c8138cb5-988a-4831-86be-a819d92b2ef9', model_name: 'DALL-E 3', model_provider: 'OpenAI', is_primary: false, use_cases: ['image_generation'], strength_score: 8, notes: 'Image generation' },
  { tool_id: 'c8138cb5-988a-4831-86be-a819d92b2ef9', model_name: 'GPT-4.5', model_provider: 'OpenAI', is_primary: false, use_cases: ['chat','writing','coding'], strength_score: 9, notes: 'Latest flagship' },

  // Claude Code
  { tool_id: '196d3d54-78cd-43fa-b2e3-4c82b56e0613', model_name: 'Claude Sonnet 4', model_provider: 'Anthropic', is_primary: true, use_cases: ['coding','chat','writing','research'], strength_score: 10, notes: 'Primary coding model' },
  { tool_id: '196d3d54-78cd-43fa-b2e3-4c82b56e0613', model_name: 'Claude Opus 4', model_provider: 'Anthropic', is_primary: false, use_cases: ['coding','research','writing'], strength_score: 10, notes: 'Most capable' },
  { tool_id: '196d3d54-78cd-43fa-b2e3-4c82b56e0613', model_name: 'Claude Haiku 3.5', model_provider: 'Anthropic', is_primary: false, use_cases: ['chat','coding'], strength_score: 7, notes: 'Fast and cheap' },

  // Cursor Editor
  { tool_id: 'e2e7c761-f873-4a84-945b-06205a24f59a', model_name: 'Claude Sonnet 4', model_provider: 'Anthropic', is_primary: true, use_cases: ['coding'], strength_score: 10, notes: 'Default for agent mode' },
  { tool_id: 'e2e7c761-f873-4a84-945b-06205a24f59a', model_name: 'GPT-4o', model_provider: 'OpenAI', is_primary: false, use_cases: ['coding','chat'], strength_score: 8, notes: 'Available in chat' },
  { tool_id: 'e2e7c761-f873-4a84-945b-06205a24f59a', model_name: 'Gemini 2.5 Pro', model_provider: 'Google', is_primary: false, use_cases: ['coding','research'], strength_score: 9, notes: 'Available with Pro+' },
  { tool_id: 'e2e7c761-f873-4a84-945b-06205a24f59a', model_name: 'o3', model_provider: 'OpenAI', is_primary: false, use_cases: ['coding'], strength_score: 9, notes: 'Available for agent mode' },

  // GitHub Copilot
  { tool_id: '58c97bed-bc58-432a-934e-2da995c93ac8', model_name: 'GPT-4o', model_provider: 'OpenAI', is_primary: true, use_cases: ['coding'], strength_score: 8, notes: 'Default completions' },
  { tool_id: '58c97bed-bc58-432a-934e-2da995c93ac8', model_name: 'Claude Sonnet 4', model_provider: 'Anthropic', is_primary: false, use_cases: ['coding'], strength_score: 9, notes: 'Available with Pro+' },
  { tool_id: '58c97bed-bc58-432a-934e-2da995c93ac8', model_name: 'Gemini 2.5 Pro', model_provider: 'Google', is_primary: false, use_cases: ['coding'], strength_score: 8, notes: 'Available with Pro+' },
  { tool_id: '58c97bed-bc58-432a-934e-2da995c93ac8', model_name: 'o3', model_provider: 'OpenAI', is_primary: false, use_cases: ['coding'], strength_score: 9, notes: 'Agent mode' },

  // Gemini
  { tool_id: '2478d332-550f-4a82-8762-2ce2fe8d33e7', model_name: 'Gemini 2.5 Pro', model_provider: 'Google', is_primary: true, use_cases: ['chat','research','coding','writing'], strength_score: 9, notes: 'Primary model' },
  { tool_id: '2478d332-550f-4a82-8762-2ce2fe8d33e7', model_name: 'Gemini 2.5 Flash', model_provider: 'Google', is_primary: false, use_cases: ['chat','writing'], strength_score: 7, notes: 'Free tier model' },
  { tool_id: '2478d332-550f-4a82-8762-2ce2fe8d33e7', model_name: 'Imagen 3', model_provider: 'Google', is_primary: false, use_cases: ['image_generation'], strength_score: 8, notes: 'Image generation' },

  // Perplexity AI
  { tool_id: '74d42b9e-fbd5-43c6-a070-1b375be87380', model_name: 'Sonar Pro', model_provider: 'Perplexity', is_primary: true, use_cases: ['research','chat'], strength_score: 9, notes: 'Primary search model' },
  { tool_id: '74d42b9e-fbd5-43c6-a070-1b375be87380', model_name: 'Claude Sonnet 4', model_provider: 'Anthropic', is_primary: false, use_cases: ['research','writing'], strength_score: 9, notes: 'Available for Pro' },
  { tool_id: '74d42b9e-fbd5-43c6-a070-1b375be87380', model_name: 'GPT-4o', model_provider: 'OpenAI', is_primary: false, use_cases: ['research','chat'], strength_score: 8, notes: 'Available for Pro' },

  // Midjourney
  { tool_id: '56cd2538-f723-4589-93ba-8cc9c4913ebf', model_name: 'Midjourney v6.1', model_provider: 'Midjourney', is_primary: true, use_cases: ['image_generation'], strength_score: 10, notes: 'Latest model' },
  { tool_id: '56cd2538-f723-4589-93ba-8cc9c4913ebf', model_name: 'Niji 6', model_provider: 'Midjourney', is_primary: false, use_cases: ['image_generation'], strength_score: 9, notes: 'Anime-style' },

  // ElevenLabs
  { tool_id: 'ddb0b6ad-0aca-4d58-9474-d28c2a0c2670', model_name: 'Eleven Turbo v3', model_provider: 'ElevenLabs', is_primary: true, use_cases: ['audio','voice'], strength_score: 9, notes: 'Low-latency TTS' },
  { tool_id: 'ddb0b6ad-0aca-4d58-9474-d28c2a0c2670', model_name: 'Eleven Multilingual v2', model_provider: 'ElevenLabs', is_primary: false, use_cases: ['audio','voice'], strength_score: 9, notes: '29 languages' },

  // Notion AI
  { tool_id: '8bbfa11c-0fc5-40fd-87a3-13fcb153f6f6', model_name: 'Claude Sonnet 4', model_provider: 'Anthropic', is_primary: true, use_cases: ['writing','research','chat'], strength_score: 8, notes: 'Writing and Q&A' },
  { tool_id: '8bbfa11c-0fc5-40fd-87a3-13fcb153f6f6', model_name: 'GPT-4o', model_provider: 'OpenAI', is_primary: false, use_cases: ['writing','chat'], strength_score: 8, notes: 'Also used' },

  // Grok
  { tool_id: '2eb8fe4a-f493-4e7c-adea-c1a9fc1123c1', model_name: 'Grok 3', model_provider: 'xAI', is_primary: true, use_cases: ['chat','research','coding'], strength_score: 9, notes: 'Primary model' },
  { tool_id: '2eb8fe4a-f493-4e7c-adea-c1a9fc1123c1', model_name: 'Grok 3 Mini', model_provider: 'xAI', is_primary: false, use_cases: ['chat'], strength_score: 7, notes: 'Lighter model' },

  // Canva
  { tool_id: '4b7f1375-7c45-4c8a-9e04-f9bf93ffe939', model_name: 'Magic Studio', model_provider: 'Canva', is_primary: true, use_cases: ['image_generation','design'], strength_score: 8, notes: 'Built-in AI' },
  { tool_id: '4b7f1375-7c45-4c8a-9e04-f9bf93ffe939', model_name: 'DALL-E 3', model_provider: 'OpenAI', is_primary: false, use_cases: ['image_generation'], strength_score: 7, notes: 'Text-to-image' },

  // Descript
  { tool_id: '32addbf7-8583-4cea-b5bc-4f5b364f5e01', model_name: 'Underlord', model_provider: 'Descript', is_primary: true, use_cases: ['audio','video'], strength_score: 8, notes: 'AI video co-editor' },
  { tool_id: '32addbf7-8583-4cea-b5bc-4f5b364f5e01', model_name: 'Whisper', model_provider: 'OpenAI', is_primary: false, use_cases: ['audio'], strength_score: 9, notes: 'Transcription' },

  // Obsidian AI
  { tool_id: 'c9d6f2f2-028d-4b98-8027-11435af5fcf0', model_name: 'Various via plugins', model_provider: 'Community', is_primary: true, use_cases: ['writing','research'], strength_score: 6, notes: 'Plugin-dependent' },
]

const { data, error } = await supabase
  .from('tool_models')
  .upsert(rows, { onConflict: 'tool_id,model_name' })
  .select('id')

if (error) {
  console.error('Upsert failed:', error.message)
  process.exit(1)
}

console.log(`✓ Upserted ${data?.length ?? 0} tool_models rows`)
