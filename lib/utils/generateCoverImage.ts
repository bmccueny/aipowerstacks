const XAI_BASE_URL = 'https://api.x.ai/v1'

export async function generateCoverImage(
  title: string,
  topic: string,
  excerpt: string,
  photorealistic = false
): Promise<string | null> {
  try {
    // Step 1: Have Grok write a unique image prompt for this specific article
    const metaRes = await fetch(`${XAI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.XAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'grok-3-mini-fast',
        max_tokens: 300,
        temperature: 1.0,
        messages: [{
          role: 'user',
          content: `You are an art director creating a cover image for a blog post.

ARTICLE TITLE: "${title}"
TOPIC: ${topic}
SUMMARY: ${excerpt}

Write a single image generation prompt (2-3 sentences) for this specific article. The image should:
- Directly illustrate the core concept of THIS article, not generic AI imagery
- Use a distinct visual style (pick ONE: ${photorealistic ? 'photorealistic photography, studio lighting, high detail, 8K resolution, professional photography' : 'editorial illustration, isometric 3D, retro pixel art, watercolor, paper cutout collage, neon cyberpunk, studio photograph with dramatic lighting, vintage poster, flat vector, or ink sketch'})
- Include specific scene details, objects, and composition that relate to the article content
- Feature people with clear, expressive emotions where relevant
- If a specific brand or company is mentioned in the title (e.g. Nvidia, OpenAI, Google, Meta), incorporate recognizable visual references to that brand: their signature colors, iconic product designs, or well-known logos rendered as physical objects in the scene. Make the brand identity unmistakable.
- Be visually distinct from other tech blog headers

RULES:
- No text, words, or letters in the image
- Format: widescreen 16:9 blog header
- Be specific and concrete, not abstract or vague
- Do NOT mention "cartoon" or "playful"

Reply with ONLY the image prompt, nothing else.`,
        }],
      }),
    })

    if (!metaRes.ok) {
      console.error(`Image prompt generation failed: ${metaRes.status}`)
      return null
    }

    const metaData = await metaRes.json()
    const imagePrompt = (metaData.choices?.[0]?.message?.content ?? '').trim()

    if (!imagePrompt || imagePrompt.length < 20) {
      console.error('Empty image prompt from Grok')
      return null
    }

    // Step 2: Generate the image with the custom prompt
    const res = await fetch(`${XAI_BASE_URL}/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.XAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'grok-imagine-image',
        prompt: imagePrompt,
        aspect_ratio: '16:9',
      }),
    })

    if (!res.ok) {
      console.error(`Image generation failed: ${res.status}`)
      return null
    }

    const data = await res.json()
    return data?.data?.[0]?.url ?? null
  } catch (err) {
    console.error('Image generation error:', err)
    return null
  }
}