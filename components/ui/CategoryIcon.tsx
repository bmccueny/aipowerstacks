'use client'

import React from 'react'
import {
  PenLine,
  Image as ImageIcon,
  Code2,
  Video,
  Mic2,
  Cpu,
  TrendingUp,
  Search,
  MessageSquare,
  BarChart3,
  Terminal,
  BrainCircuit,
  Globe,
  Zap,
  Smartphone,
  Mail,
  Scale,
  DollarSign,
  HeartPulse,
  Users,
  Headphones,
  Languages,
  FileText,
  Box,
  UserCircle,
  Presentation,
  ShoppingCart,
  Sparkles,
  Star,
  Gift,
  Palette,
  BookOpen,
  Wand2,
  Layers,
} from 'lucide-react'

// Each entry: [icon, bg color, icon color] — colors use Tailwind arbitrary values tied to the theme
const ICON_MAP: Record<string, [React.ReactNode, string, string]> = {
  // Crimson / primary — creative & content
  'writing':             [<PenLine className="h-5 w-5" />,        'bg-[oklch(0.95_0.04_22)]',   'text-[oklch(0.55_0.23_22)]'],
  'ai-chat':             [<MessageSquare className="h-5 w-5" />,   'bg-[oklch(0.95_0.04_22)]',   'text-[oklch(0.55_0.23_22)]'],
  'chatbot':             [<MessageSquare className="h-5 w-5" />,   'bg-[oklch(0.95_0.04_22)]',   'text-[oklch(0.55_0.23_22)]'],
  'summarization':       [<FileText className="h-5 w-5" />,        'bg-[oklch(0.95_0.04_22)]',   'text-[oklch(0.55_0.23_22)]'],
  'translation':         [<Languages className="h-5 w-5" />,       'bg-[oklch(0.95_0.04_22)]',   'text-[oklch(0.55_0.23_22)]'],
  'presentations':       [<Presentation className="h-5 w-5" />,    'bg-[oklch(0.95_0.04_22)]',   'text-[oklch(0.55_0.23_22)]'],

  // Electric blue — tech & dev
  'coding':              [<Code2 className="h-5 w-5" />,           'bg-[oklch(0.94_0.06_200)]',  'text-[oklch(0.50_0.22_200)]'],
  'developer-tools':     [<Terminal className="h-5 w-5" />,        'bg-[oklch(0.94_0.06_200)]',  'text-[oklch(0.50_0.22_200)]'],
  'automation':          [<Zap className="h-5 w-5" />,             'bg-[oklch(0.94_0.06_200)]',  'text-[oklch(0.50_0.22_200)]'],
  'productivity':        [<Cpu className="h-5 w-5" />,             'bg-[oklch(0.94_0.06_200)]',  'text-[oklch(0.50_0.22_200)]'],
  'search':              [<Search className="h-5 w-5" />,          'bg-[oklch(0.94_0.06_200)]',  'text-[oklch(0.50_0.22_200)]'],

  // Plasma purple — AI & intelligence
  'research':            [<BrainCircuit className="h-5 w-5" />,    'bg-[oklch(0.94_0.06_280)]',  'text-[oklch(0.52_0.22_280)]'],
  'analytics':           [<BarChart3 className="h-5 w-5" />,       'bg-[oklch(0.94_0.06_280)]',  'text-[oklch(0.52_0.22_280)]'],
  'data-analytics':      [<BarChart3 className="h-5 w-5" />,       'bg-[oklch(0.94_0.06_280)]',  'text-[oklch(0.52_0.22_280)]'],
  'ai-supertools':       [<Sparkles className="h-5 w-5" />,        'bg-[oklch(0.94_0.06_280)]',  'text-[oklch(0.52_0.22_280)]'],
  'life-assistant':      [<Star className="h-5 w-5" />,            'bg-[oklch(0.94_0.06_280)]',  'text-[oklch(0.52_0.22_280)]'],

  // Neon green — media & creative
  'image-generation':    [<ImageIcon className="h-5 w-5" />,       'bg-[oklch(0.94_0.07_120)]',  'text-[oklch(0.45_0.20_120)]'],
  'video':               [<Video className="h-5 w-5" />,           'bg-[oklch(0.94_0.07_120)]',  'text-[oklch(0.45_0.20_120)]'],
  'audio':               [<Mic2 className="h-5 w-5" />,            'bg-[oklch(0.94_0.07_120)]',  'text-[oklch(0.45_0.20_120)]'],
  'voice':               [<Headphones className="h-5 w-5" />,      'bg-[oklch(0.94_0.07_120)]',  'text-[oklch(0.45_0.20_120)]'],
  'design':              [<Palette className="h-5 w-5" />,         'bg-[oklch(0.94_0.07_120)]',  'text-[oklch(0.45_0.20_120)]'],
  '3d-animation':        [<Box className="h-5 w-5" />,             'bg-[oklch(0.94_0.07_120)]',  'text-[oklch(0.45_0.20_120)]'],
  'avatars':             [<UserCircle className="h-5 w-5" />,      'bg-[oklch(0.94_0.07_120)]',  'text-[oklch(0.45_0.20_120)]'],

  // Sunset orange — business & growth
  'marketing':           [<TrendingUp className="h-5 w-5" />,      'bg-[oklch(0.95_0.06_45)]',   'text-[oklch(0.52_0.22_45)]'],
  'business':            [<Layers className="h-5 w-5" />,          'bg-[oklch(0.95_0.06_45)]',   'text-[oklch(0.52_0.22_45)]'],
  'seo':                 [<Globe className="h-5 w-5" />,           'bg-[oklch(0.95_0.06_45)]',   'text-[oklch(0.52_0.22_45)]'],
  'social-media':        [<Smartphone className="h-5 w-5" />,      'bg-[oklch(0.95_0.06_45)]',   'text-[oklch(0.52_0.22_45)]'],
  'email':               [<Mail className="h-5 w-5" />,            'bg-[oklch(0.95_0.06_45)]',   'text-[oklch(0.52_0.22_45)]'],
  'ecommerce':           [<ShoppingCart className="h-5 w-5" />,    'bg-[oklch(0.95_0.06_45)]',   'text-[oklch(0.52_0.22_45)]'],
  'sales':               [<DollarSign className="h-5 w-5" />,      'bg-[oklch(0.95_0.06_45)]',   'text-[oklch(0.52_0.22_45)]'],

  // Neutral — professional / utility
  'legal':               [<Scale className="h-5 w-5" />,           'bg-[oklch(0.93_0.01_240)]',  'text-[oklch(0.40_0.04_240)]'],
  'finance':             [<DollarSign className="h-5 w-5" />,      'bg-[oklch(0.93_0.01_240)]',  'text-[oklch(0.40_0.04_240)]'],
  'healthcare':          [<HeartPulse className="h-5 w-5" />,      'bg-[oklch(0.93_0.01_240)]',  'text-[oklch(0.40_0.04_240)]'],
  'hr':                  [<Users className="h-5 w-5" />,           'bg-[oklch(0.93_0.01_240)]',  'text-[oklch(0.40_0.04_240)]'],
  'customer-support':    [<Headphones className="h-5 w-5" />,      'bg-[oklch(0.93_0.01_240)]',  'text-[oklch(0.40_0.04_240)]'],
  'education':           [<BookOpen className="h-5 w-5" />,        'bg-[oklch(0.93_0.01_240)]',  'text-[oklch(0.40_0.04_240)]'],
  'verified':            [<Wand2 className="h-5 w-5" />,           'bg-[oklch(0.93_0.01_240)]',  'text-[oklch(0.40_0.04_240)]'],
  'free-tools':          [<Gift className="h-5 w-5" />,            'bg-[oklch(0.93_0.01_240)]',  'text-[oklch(0.40_0.04_240)]'],
}

interface CategoryIconProps {
  slug: string
  emoji?: string | null
  className?: string
  /** 'sm' renders a bare icon at 16px for pill layouts; default renders the full padded box */
  size?: 'default' | 'sm'
}

export function CategoryIcon({ slug, emoji, className, size = 'default' }: CategoryIconProps) {
  const normalized =
    ICON_MAP[slug] ??
    ICON_MAP[slug.replace('-tools', '')] ??
    ICON_MAP[slug.replace('ai-', '')] ??
    null

  if (normalized) {
    const [icon, bg, color] = normalized

    // Small variant: bare icon for pill layouts (no background box)
    if (size === 'sm') {
      return (
        <span className={[color, 'flex-shrink-0 transition-colors duration-200 [&>svg]:h-4 [&>svg]:w-4', className].filter(Boolean).join(' ')}>
          {icon}
        </span>
      )
    }

    return (
      <div className={[
        'p-2 rounded-lg transition-all duration-300',
        '',
        bg,
        color,
        // On hover, flip to primary bg + white icon
        'group-hover:bg-primary group-hover:text-white',
        className,
      ].filter(Boolean).join(' ')}>
        {icon}
      </div>
    )
  }

  // Fallback to emoji
  if (size === 'sm') {
    return (
      <span className={`text-sm leading-none flex-shrink-0 ${className ?? ''}`}>
        {emoji || '🤖'}
      </span>
    )
  }

  return (
    <div className={`text-2xl leading-none grayscale group-hover:grayscale-0 transition-all duration-300 ${className ?? ''}`}>
      {emoji || '🤖'}
    </div>
  )
}
