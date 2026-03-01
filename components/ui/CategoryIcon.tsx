'use client'

import React from 'react'
import {
  PenLine,
  Image as ImageIcon,
  Code2,
  Video,
  Mic2,
  Cpu,
  Mail,
  Search,
  MessageSquare,
  BarChart3,
  Bot,
  BrainCircuit
} from 'lucide-react'

const ICON_MAP: Record<string, React.ReactNode> = {
  'writing': <PenLine className="h-6 w-6" />,
  'image-generation': <ImageIcon className="h-6 w-6" />,
  'coding': <Code2 className="h-6 w-6" />,
  'video': <Video className="h-6 w-6" />,
  'audio': <Mic2 className="h-6 w-6" />,
  'marketing': <Mail className="h-6 w-6" />,
  'search': <Search className="h-6 w-6" />,
  'chatbot': <MessageSquare className="h-6 w-6" />,
  'analytics': <BarChart3 className="h-6 w-6" />,
  'productivity': <Cpu className="h-6 w-6" />,
  'developer-tools': <Bot className="h-6 w-6" />,
  'research': <BrainCircuit className="h-6 w-6" />,
}

interface CategoryIconProps {
  slug: string
  emoji?: string | null
  className?: string
}

export function CategoryIcon({ slug, emoji, className }: CategoryIconProps) {
  // Try to find a specific SVG icon for the slug
  const icon = ICON_MAP[slug] || ICON_MAP[slug.replace('-tools', '')] || ICON_MAP[slug.replace('ai-', '')]

  if (icon) {
    return (
      <div className={`p-2 rounded-md bg-primary/5 text-primary group-hover:bg-primary group-hover:text-background group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300 ${className}`}>
        {icon}
      </div>
    )
  }

  // Fallback to emoji if no icon found, but style it nicely
  return (
    <div className={`text-2xl leading-none grayscale group-hover:grayscale-0 group-hover:scale-125 group-hover:rotate-12 transition-all duration-300 ${className}`}>
      {emoji || '🤖'}
    </div>
  )
}
