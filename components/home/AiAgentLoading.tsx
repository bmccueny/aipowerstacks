'use client'

import { useState, useEffect } from 'react'
import { Cpu, Database, Search, Sparkles, CheckCircle2, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

const STATUS_MESSAGES = [
  "Initializing neural pathways...",
  "Scanning AI tools database...",
  "Analyzing technical specifications...",
  "Cross-referencing pricing and API latency...",
  "Filtering for developer-grade capabilities...",
  "Optimizing for your specific use case...",
  "Verifying model training policies...",
  "Calculating compatibility scores...",
  "Finalizing your high-power stack...",
  "Matches found! Deploying results..."
]

export function AiAgentLoading() {
  const [messageIndex, setMessageIndex] = useState(0)
  const [isFinishing, setIsFinishing] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => {
        // If we are at the last message, don't advance anymore to keep success state visible
        if (prev >= STATUS_MESSAGES.length - 1) return prev;
        
        if (prev >= STATUS_MESSAGES.length - 3) {
          setIsFinishing(true)
        }
        return prev + 1
      })
    }, 500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center min-h-[450px]">
      {/* The Brain Container */}
      <div className="relative w-32 h-32 mb-10 pointer-events-none">
        {/* Intense background glow that ramps up */}
        <div className={cn(
          "absolute inset-0 bg-primary/20 rounded-full blur-2xl transition-all duration-1000",
          isFinishing ? "scale-150 bg-primary/40 opacity-100" : "animate-pulse opacity-60"
        )} />
        
        <div className={cn(
          "relative z-10 w-full h-full flex items-center justify-center bg-background border-2 rounded-full transition-all duration-500",
          isFinishing ? "border-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.4)]" : "border-primary shadow-[0_0_30px_rgba(var(--primary),0.3)]"
        )}>
          {isFinishing ? (
            <div className="animate-in zoom-in duration-300">
              <CheckCircle2 className="w-16 h-16 text-emerald-500" />
            </div>
          ) : (
            <svg viewBox="0 0 100 100" className="w-16 h-16 text-primary fill-none stroke-current stroke-[1.5]">
              <circle cx="50" cy="20" r="3" className="node-flash" />
              <circle cx="80" cy="50" r="3" className="node-flash delay-200" />
              <circle cx="50" cy="80" r="3" className="node-flash delay-400" />
              <circle cx="20" cy="50" r="3" className="node-flash delay-600" />
              <circle cx="50" cy="50" r="6" className="node-flash" />
              <path d="M50 20 L50 44" className="line-flow" />
              <path d="M50 80 L50 56" className="line-flow delay-500" />
              <path d="M20 50 L44 50" className="line-flow delay-1000" />
              <path d="M80 50 L56 50" className="line-flow delay-1500" />
            </svg>
          )}
          
          {!isFinishing && (
            <>
              <Sparkles className="absolute -top-2 -right-2 h-6 w-6 text-amber-400 floating" />
              <Cpu className="absolute -bottom-4 -left-4 h-8 w-8 text-primary/40 pulse-slow" />
            </>
          )}
        </div>

        {/* Breaking Point Burst Effect */}
        {isFinishing && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-1 h-1 bg-white rounded-full animate-ping scale-[20] opacity-0" />
          </div>
        )}
      </div>

      {/* Terminal logic container */}
      <div className={cn(
        "max-w-md w-full glass-card rounded-xl p-6 border transition-all duration-500 pointer-events-none",
        isFinishing ? "border-emerald-500/30 bg-emerald-500/5" : "border-primary/20 bg-primary/5"
      )}>
        <div className="flex items-center justify-between mb-4 border-b border-foreground/5 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="h-2 w-2 rounded-full bg-red-500/50" />
              <div className="h-2 w-2 rounded-full bg-amber-500/50" />
              <div className="h-2 w-2 rounded-full bg-emerald-500/50" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-2">Matchmaker Engine</span>
          </div>
          {isFinishing && <Zap className="h-3 w-3 text-amber-500 animate-pulse" />}
        </div>
        
        <div className="space-y-2 text-left font-mono">
          <div className="flex items-start gap-3 h-8">
            <div className={cn(
              "h-5 w-5 shrink-0 rounded flex items-center justify-center transition-colors",
              isFinishing ? "bg-emerald-500/20" : "bg-primary/10"
            )}>
              {isFinishing ? <CheckCircle2 className="h-3 w-3 text-emerald-500" /> : <Search className="h-3 w-3 text-primary" />}
            </div>
            <p className={cn(
              "text-xs font-bold leading-tight transition-all duration-300",
              isFinishing ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"
            )}>
              {STATUS_MESSAGES[messageIndex]}
            </p>
          </div>
        </div>

        {/* Progress Bar that finishes with a snap */}
        <div className="mt-6 h-1.5 w-full bg-foreground/5 rounded-full overflow-hidden">
          <div className={cn(
            "h-full transition-all ease-in-out",
            isFinishing ? "bg-emerald-500 w-full duration-300" : "bg-primary w-[85%] animate-pulse"
          )} />
        </div>
      </div>

      <style jsx>{`
        .node-flash {
          animation: flash 1.5s ease-in-out infinite;
        }
        .line-flow {
          stroke-dasharray: 20;
          stroke-dashoffset: 20;
          animation: flow 2s linear infinite;
          opacity: 0.3;
        }
        .floating {
          animation: float 2s ease-in-out infinite;
        }
        .pulse-slow {
          animation: pulse 3s ease-in-out infinite;
        }
        @keyframes flash {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1); }
        }
        @keyframes flow {
          to { stroke-dashoffset: 0; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-5px) rotate(10deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.1); }
        }
      `}</style>
    </div>
  )
}
