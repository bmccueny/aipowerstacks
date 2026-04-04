import { generateCoverImage } from '../lib/utils/generateCoverImage'

async function main() {
  console.log('Generating cover for: Run Local LLMs Docker 2026: Free Creative Guide!')
  
  const result = await generateCoverImage(
    'Run Local LLMs Docker 2026: Free Creative Guide!',
    'Local AI & Open Source Models',
    'Learn how to run powerful AI models on your own machine using Docker. No cloud costs, complete privacy, total control.',
    'cyberpunk-anime'
  )
  
  console.log('Result:', result)
}

main().catch(console.error)