/**
 * Shared Anthropic (Claude) API helper for cron jobs.
 * Drop-in replacement for xAI/Grok calls.
 */

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const DEFAULT_MODEL = 'claude-sonnet-4-20250514'

interface AnthropicMessage {
  role: 'user' | 'assistant'
  content: string
}

interface AnthropicOptions {
  messages: AnthropicMessage[]
  maxTokens?: number
  temperature?: number
  model?: string
}

interface AnthropicResponse {
  content: string
}

export async function callClaude(opts: AnthropicOptions): Promise<AnthropicResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set')

  const res = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: opts.model ?? DEFAULT_MODEL,
      max_tokens: opts.maxTokens ?? 1024,
      temperature: opts.temperature ?? 0.8,
      messages: opts.messages,
    }),
    signal: AbortSignal.timeout(60_000),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`${res.status} ${errText.slice(0, 300)}`)
  }

  const data = await res.json()
  const text = data.content?.[0]?.text ?? ''
  return { content: text.trim() }
}
