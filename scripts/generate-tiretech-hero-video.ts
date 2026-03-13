import { config } from 'dotenv'
import { generateCoverImage } from '@/lib/utils/generateCoverImage'
import * as fs from 'fs'
import * as path from 'path'

// Load environment variables
config({ path: '.env.local' })

// Check if required env vars are loaded
if (!process.env.XAI_API_KEY) {
  console.error('XAI_API_KEY not found in environment variables')
  process.exit(1)
}

interface HeroVideoScene {
  sceneNumber: number
  duration: number // in seconds
  prompt: string
  transition: string
}

// Hero video script for TireTech & Auto
const HERO_VIDEO_SCRIPT: HeroVideoScene[] = [
  {
    sceneNumber: 1,
    duration: 3,
    prompt: 'Wide shot of TireTech & Auto shop exterior at golden hour, professional signage, customer parking with cars, welcoming atmosphere, photorealistic, 8K resolution',
    transition: 'fade_in'
  },
  {
    sceneNumber: 2,
    duration: 4,
    prompt: 'Dynamic interior view of service bay with technicians working on vehicles, professional equipment visible, bright lighting, organized workspace, photorealistic',
    transition: 'pan_right'
  },
  {
    sceneNumber: 3,
    duration: 3,
    prompt: 'Close-up of premium tire brands display - Michelin, BFGoodrich, Uniroyal logos prominently featured on tires, showroom lighting, photorealistic product shot',
    transition: 'zoom_in'
  },
  {
    sceneNumber: 4,
    duration: 4,
    prompt: 'Tire technician in professional uniform mounting large truck tire on rim, using specialized equipment, focused work, photorealistic, high detail',
    transition: 'slow_motion'
  },
  {
    sceneNumber: 5,
    duration: 3,
    prompt: 'Happy customer shaking hands with tire technician, both smiling, professional consultation complete, welcoming atmosphere, photorealistic',
    transition: 'fade_transition'
  },
  {
    sceneNumber: 6,
    duration: 3,
    prompt: 'TireTech & Auto logo with tagline "Your Trusted Tire & Auto Experts", professional branding, clean design, photorealistic, high resolution',
    transition: 'fade_out'
  }
]

async function generateHeroVideoScenes(): Promise<void> {
  const videoDir = path.join(process.cwd(), 'generated-videos', 'tiretechandauto', 'hero-scenes')

  // Create directory if it doesn't exist
  if (!fs.existsSync(videoDir)) {
    fs.mkdirSync(videoDir, { recursive: true })
  }

  console.log('🎬 Generating hero video scenes for TireTech & Auto...')

  let totalGenerated = 0

  for (const scene of HERO_VIDEO_SCRIPT) {
    try {
      console.log(`\n🎭 Generating Scene ${scene.sceneNumber}/${HERO_VIDEO_SCRIPT.length}`)
      console.log(`Duration: ${scene.duration}s, Transition: ${scene.transition}`)
      console.log(`Prompt: ${scene.prompt.substring(0, 80)}...`)

      // Generate the scene image
      const imageUrl = await generateCoverImage(
        `TireTech Hero Scene ${scene.sceneNumber}`,
        'hero-video',
        scene.prompt,
        true // photorealistic
      )

      if (imageUrl) {
        const filename = `hero_scene_${scene.sceneNumber}_${Date.now()}.jpeg`
        const sceneData = {
          sceneNumber: scene.sceneNumber,
          duration: scene.duration,
          transition: scene.transition,
          prompt: scene.prompt,
          generatedAt: new Date().toISOString(),
          imageUrl: imageUrl,
          filename: filename,
          videoNotes: `Use ${scene.transition} transition, ${scene.duration} second duration`
        }

        const metadataPath = path.join(videoDir, `scene_${scene.sceneNumber}.json`)
        fs.writeFileSync(metadataPath, JSON.stringify(sceneData, null, 2))

        console.log(`✅ Generated scene ${scene.sceneNumber}: ${filename}`)
        totalGenerated++
      } else {
        console.error(`❌ Failed to generate scene ${scene.sceneNumber}`)
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 3000))
    } catch (error) {
      console.error(`Error generating scene ${scene.sceneNumber}:`, error)
    }
  }

  // Create video production notes
  const productionNotes = {
    generatedAt: new Date().toISOString(),
    totalScenes: totalGenerated,
    totalDuration: HERO_VIDEO_SCRIPT.reduce((sum, scene) => sum + scene.duration, 0),
    recommendedSpecs: {
      resolution: '1920x1080 (Full HD)',
      frameRate: '30fps',
      format: 'MP4',
      audio: 'Upbeat professional music, 15-20 seconds',
      textOverlays: [
        'Scene 1: "Welcome to TireTech & Auto"',
        'Scene 6: "Your Trusted Tire & Auto Experts" with contact info'
      ]
    },
    editingInstructions: HERO_VIDEO_SCRIPT.map(scene => ({
      scene: scene.sceneNumber,
      duration: `${scene.duration} seconds`,
      transition: scene.transition,
      notes: scene.transition === 'slow_motion' ? '0.5x speed for dramatic effect' : 'Normal speed'
    })),
    outputDirectory: videoDir
  }

  const notesPath = path.join(videoDir, 'video-production-notes.json')
  fs.writeFileSync(notesPath, JSON.stringify(productionNotes, null, 2))

  console.log(`\n🎥 Generated ${totalGenerated} hero video scenes!`)
  console.log(`📂 Scenes and metadata saved to: ${videoDir}`)
  console.log(`📋 Production notes: ${notesPath}`)

  console.log(`\n🎬 VIDEO SPECIFICATIONS:`)
  console.log(`   Total Duration: ${productionNotes.totalDuration} seconds`)
  console.log(`   Resolution: ${productionNotes.recommendedSpecs.resolution}`)
  console.log(`   Frame Rate: ${productionNotes.recommendedSpecs.frameRate}`)
  console.log(`   Transitions: ${HERO_VIDEO_SCRIPT.map(s => s.transition).join(' → ')}`)
}

generateHeroVideoScenes().catch(console.error)