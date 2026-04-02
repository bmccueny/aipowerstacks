export function BrandMark({ className, variant = 'color' }: { className?: string; variant?: 'color' | 'dark' | 'white' }) {
  const bg = variant === 'dark' ? '#1a1512' : variant === 'white' ? '#ffffff' : '#d4402b'
  const bars = variant === 'color' ? '#1a1512' : variant === 'dark' ? '#ffffff' : 'rgba(0,0,0,0.15)'
  return (
    <svg viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="512" height="512" rx="114" fill={bg} />
      <rect x="91" y="128" width="330" height="64" rx="32" fill={bars} />
      <rect x="91" y="224" width="238" height="64" rx="32" fill={bars} />
      <rect x="91" y="320" width="146" height="64" rx="32" fill={bars} />
    </svg>
  )
}
