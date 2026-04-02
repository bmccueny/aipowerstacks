import { readFileSync, writeFileSync, existsSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

const XAI = 'https://api.x.ai/v1'
const KEY = process.env.XAI_API_KEY

const HUMANIZE_PROMPT = `You are editing raw AI-generated content to make it sound authentically human. Transform this content while keeping all the facts and structure intact.

RULES:
1. Write like you're explaining to a friend, not a journalist
2. Use contractions: "don't", "can't", "it's", "I'm"
3. Add hedging: "I think", "might be", "in my experience"
4. Mix sentence lengths - add short punchy sentences for emphasis
5. Include a specific personal story or experience (invent one if needed)
6. Add a "hot take" or opinion that some might disagree with
7. Use casual language: "honestly", "actually", "basically", "stuff"
8. Use lowercase naturally, start sentences with "And" or "But"
9. NEVER change the facts or remove information
10. Keep all headers, links, and structure

Return ONLY the transformed content with no explanation.`

async function humanizeContent(content) {
  const prompt = `${HUMANIZE_PROMPT}

CONTENT TO TRANSFORM:
${content}`

  const res = await fetch(`${XAI}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({ model: 'grok-3-mini-fast', max_tokens: 8000, temperature: 0.85, messages: [{ role: 'user', content: prompt }] }),
  })
  
  if (!res.ok) throw new Error(`Grok failed: ${res.status}`)
  const data = await res.json()
  return (data.choices?.[0]?.message?.content ?? '').trim()
}

const filePath = process.argv[2]
if (!filePath) {
  console.error('Usage: node humanize-content.mjs <file-path>')
  process.exit(1)
}

if (!existsSync(filePath)) {
  console.error(`File not found: ${filePath}`)
  process.exit(1)
}

console.log(`Reading: ${filePath}`)
const content = readFileSync(filePath, 'utf8')

if (content.length < 100) {
  console.log('Content too short, skipping')
  process.exit(0)
}

console.log('Humanizing content...')
const humanized = await humanizeContent(content)

writeFileSync(filePath, humanized, 'utf8')
console.log('Done!')