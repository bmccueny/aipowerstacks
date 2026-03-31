export function BrandMark({ className, variant = 'color' }: { className?: string; variant?: 'color' | 'dark' | 'white' }) {
  const bg = variant === 'dark' ? '#000' : variant === 'white' ? '#fff' : 'oklch(0.62 0.23 22)'
  // Bars: white on color/dark backgrounds, semi-transparent dark on white background
  const bars = variant === 'white' ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.90)'
  return (
    <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="28" height="28" rx="7" fill={bg} />
      <rect x="5" y="7" width="18" height="3.5" rx="1.75" fill={bars} />
      <rect x="5" y="12.25" width="13" height="3.5" rx="1.75" fill={bars} />
      <rect x="5" y="17.5" width="8" height="3.5" rx="1.75" fill={bars} />
    </svg>
  )
}
