import { pipeline } from '@xenova/transformers'

type Extractor = (text: string, options: { pooling: string; normalize: boolean }) => Promise<{ data: ArrayLike<number> }>
let extractor: Extractor | null = null

export async function getQueryEmbedding(text: string): Promise<number[]> {
  if (!extractor) {
    extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2') as unknown as Extractor
  }

  const output = await extractor(text, { pooling: 'mean', normalize: true })
  return Array.from(output.data)
}
