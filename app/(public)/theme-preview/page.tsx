import { BrandMark } from '@/components/common/BrandMark'
import { ArrowRight } from 'lucide-react'

const themes = [
  {
    name: 'Coral Red',
    label: 'Current direction — punched up',
    primary: 'oklch(0.68 0.22 20)',
    note: 'Stays distinctive, reads more confident and bold. No one in AI dir space owns this.',
  },
  {
    name: 'Keep Pink',
    label: 'Current',
    primary: 'oklch(0.68 0.22 20)',
    note: 'Memorable and unconventional. Can read soft depending on context.',
  },
  {
    name: 'Electric Violet',
    label: 'Safe AI pick',
    primary: 'oklch(0.60 0.25 280)',
    note: 'Premium, techy. Lots of competition here — OpenAI, Perplexity, etc.',
  },
  {
    name: 'Amber Orange',
    label: 'Builder energy',
    primary: 'oklch(0.75 0.18 55)',
    note: 'Bold, energetic, warm. Strong for a "power" brand targeting founders and devs.',
  },
  {
    name: 'Emerald',
    label: 'Trust + data',
    primary: 'oklch(0.65 0.18 155)',
    note: 'Clean, trusted, data-forward. Strong secondary palette potential.',
  },
  {
    name: 'Electric Blue',
    label: 'Classic tech',
    primary: 'oklch(0.60 0.22 240)',
    note: 'Safe and trusted. Saturated blue feels modern vs corporate navy.',
  },
]

function ThemeCard({ theme }: { theme: typeof themes[0] }) {
  const p = theme.primary
  return (
    <div className="rounded-xl border border-black/10 overflow-hidden bg-white shadow-sm">
      <div className="p-6" style={{ background: `color-mix(in oklch, ${p} 8%, white)` }}>
        <div className="flex items-center gap-2.5 mb-6">
          <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ background: p }}>
            <svg viewBox="0 0 28 28" fill="none" className="h-full w-full">
              <rect x="5" y="7" width="18" height="3.5" rx="1.75" fill="white" />
              <rect x="5" y="12.25" width="13" height="3.5" rx="1.75" fill="white" />
              <rect x="5" y="17.5" width="8" height="3.5" rx="1.75" fill="white" />
            </svg>
          </div>
          <span className="font-black text-[1.3rem] tracking-[-0.03em]" style={{ fontFamily: 'var(--font-display, sans-serif)' }}>
            <span style={{ color: p }}>AI</span>PowerStacks
          </span>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <button
            className="px-4 py-2 rounded-lg text-sm font-bold text-white"
            style={{ background: p }}
          >
            Get Listed Free <ArrowRight className="inline h-3.5 w-3.5 ml-1" />
          </button>
          <button
            className="px-4 py-2 rounded-lg text-sm font-bold border-2"
            style={{ borderColor: p, color: p }}
          >
            Browse Tools
          </button>
        </div>

        <div className="rounded-lg border p-4 bg-white text-sm">
          <div
            className="text-[10px] font-bold uppercase tracking-widest mb-1"
            style={{ color: p }}
          >
            Featured
          </div>
          <div className="font-semibold text-gray-900 text-[14px]">ChatGPT</div>
          <div className="text-gray-500 text-[12px] mt-0.5">AI assistant for writing, coding & research</div>
          <div className="mt-2 flex items-center gap-2">
            <span
              className="text-[11px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: `color-mix(in oklch, ${p} 12%, white)`, color: p }}
            >
              Freemium
            </span>
          </div>
        </div>
      </div>

      <div className="px-5 py-4 border-t border-black/8 bg-white">
        <div className="flex items-center justify-between mb-1">
          <p className="font-black text-[15px]">{theme.name}</p>
          <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-black/5 text-black/50">
            {theme.label}
          </span>
        </div>
        <p className="text-[12px] text-gray-500 leading-relaxed">{theme.note}</p>
        <code className="text-[11px] text-gray-400 mt-1 block">{theme.primary}</code>
      </div>
    </div>
  )
}

export default function ThemePreviewPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Internal Preview</p>
          <h1 className="text-3xl font-black tracking-tight text-gray-900">Color Theme Options</h1>
          <p className="text-gray-500 mt-2 text-sm">Pick your favorite — tell Claude which one and it'll update the theme globally.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {themes.map((theme) => (
            <ThemeCard key={theme.name} theme={theme} />
          ))}
        </div>
      </div>
    </div>
  )
}
