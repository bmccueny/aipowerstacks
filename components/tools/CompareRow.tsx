import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

const CELL_CN = 'min-w-[140px] sm:min-w-[180px] px-3 py-2.5 sm:px-4 sm:py-3 border-r border-foreground/[0.06] last:border-r-0'

/* ── Boolean check/x indicator ── */
export function BoolVal({ val }: { val: boolean }) {
  return val ? (
    <span className="inline-flex items-center justify-center h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-emerald-500/10 text-emerald-600">
      <svg className="h-3 w-3 sm:h-3.5 sm:w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
    </span>
  ) : (
    <span className="inline-flex items-center justify-center h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-foreground/[0.03] text-foreground/20">
      <X className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
    </span>
  )
}

/* ── Section header row ── */
export function SectionHeader({ label, maxTools }: { label: string; maxTools: number }) {
  return (
    <tr>
      <td
        colSpan={maxTools + 1}
        className="px-3 sm:px-4 py-2 bg-foreground/[0.04] dark:bg-foreground/[0.06] border-y border-foreground/[0.08] sticky left-0"
      >
        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] text-foreground/40">{label}</span>
      </td>
    </tr>
  )
}

/* ── Single comparison row (label + value cells) ── */
interface CompareRowProps {
  label: string
  children: React.ReactNode[]
  emptySlots: number
  stripe?: boolean
  diff?: boolean
}

export function CompareRow({ label, children, emptySlots, stripe = false, diff = false }: CompareRowProps) {
  return (
    <tr className={cn(
      'border-b border-foreground/[0.05]',
      stripe && 'bg-foreground/[0.015] dark:bg-foreground/[0.03]'
    )}>
      {/* Sticky label cell */}
      <td className={cn(
        'w-[110px] min-w-[110px] sm:w-[170px] sm:min-w-[170px]',
        'px-3 py-2.5 sm:px-4 sm:py-3',
        'text-[10px] sm:text-xs font-bold uppercase tracking-wide text-muted-foreground',
        'border-r border-foreground/[0.06]',
        'sticky left-0 z-10',
        stripe
          ? 'bg-foreground/[0.015] dark:bg-foreground/[0.03]'
          : 'bg-background',
        diff && 'text-primary'
      )}>
        {label}
        {diff && <span className="inline-block h-1 w-1 rounded-full bg-amber-400 ml-1 align-super" />}
      </td>
      {children}
      {/* Empty slot placeholders */}
      {Array.from({ length: emptySlots }).map((_, i) => (
        <td key={`e-${i}`} className={cn(
          CELL_CN
        )} />
      ))}
    </tr>
  )
}

export { CELL_CN }
