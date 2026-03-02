'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, ExternalLink } from 'lucide-react'
import { VerifiedBadge } from '@/components/ui/VerifiedBadge'
import { Badge } from '@/components/ui/badge'
import { RemoveFromStackButton } from '@/components/stacks/RemoveFromStackButton'
import { ToolNoteButton } from '@/components/stacks/ToolNoteButton'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { PRICING_BADGE_COLORS, PRICING_LABELS } from '@/lib/constants'

interface Tool {
  id: string
  name: string
  slug: string
  tagline: string
  website_url: string
  logo_url: string | null
  pricing_model: string
  is_verified: boolean
  _note?: string | null
}

interface Props {
  tools: Tool[]
  collectionId: string
}

function SortableToolRow({ tool, index, collectionId, onRemove }: {
  tool: Tool;
  index: number;
  collectionId: string;
  onRemove: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: tool.id })
  const pricingColor = PRICING_BADGE_COLORS[tool.pricing_model] ?? PRICING_BADGE_COLORS.unknown
  const pricingLabel = PRICING_LABELS[tool.pricing_model] ?? 'Unknown'

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`glass-card rounded-md group ${isDragging ? 'opacity-50 shadow-2xl z-50' : ''}`}
    >
      <div className="flex items-start gap-4 p-5">
        <button
          {...attributes}
          {...listeners}
          className="text-muted-foreground/30 hover:text-muted-foreground cursor-grab active:cursor-grabbing mt-1 touch-none"
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <span className="text-xs font-black text-muted-foreground/30 w-5 shrink-0 pt-2 text-right tabular-nums select-none">
          {index + 1}
        </span>

        <div className="h-12 w-12 shrink-0 rounded-xl bg-muted border border-foreground/10 overflow-hidden flex items-center justify-center">
          {tool.logo_url ? (
            <Image src={tool.logo_url} alt={tool.name} width={48} height={48} className="object-contain" />
          ) : (
            <span className="font-black text-primary text-lg">{tool.name[0]}</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Link href={`/tools/${tool.slug}`} className="font-bold text-[17px] leading-snug hover:text-primary transition-colors">
                  {tool.name}
                </Link>
                {tool.is_verified && <VerifiedBadge size="md" />}
              </div>
              <p className="text-muted-foreground text-sm mt-1 leading-relaxed line-clamp-2">{tool.tagline}</p>
              <ToolNoteButton collectionId={collectionId} toolId={tool.id} initialNote={tool._note} />
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <a
                href={tool.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-primary border border-primary/30 bg-primary/5 hover:bg-primary/15 px-3 py-1.5 rounded-lg transition-colors"
              >
                Visit <ExternalLink className="h-3 w-3" />
              </a>
              <RemoveFromStackButton
                collectionId={collectionId}
                toolId={tool.id}
                toolName={tool.name}
                onSuccess={() => onRemove(tool.id)}
              />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-foreground/5">
            <Badge variant="outline" className={`text-[11px] ${pricingColor}`}>{pricingLabel}</Badge>
          </div>
        </div>
      </div>
    </div>
  )
}

export function SortableToolList({ tools: initialTools, collectionId }: Props) {
  const [tools, setTools] = useState(initialTools)

  useEffect(() => {
    setTools(initialTools)
  }, [initialTools])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = tools.findIndex(t => t.id === active.id)
    const newIndex = tools.findIndex(t => t.id === over.id)
    const reordered = arrayMove(tools, oldIndex, newIndex)
    setTools(reordered)

    const supabase = createClient()
    const updates = reordered.map((tool, i) =>
      supabase.from('collection_items')
        .update({ sort_order: i })
        .eq('collection_id', collectionId)
        .eq('tool_id', tool.id)
    )
    const results = await Promise.all(updates)
    const failed = results.find(r => r.error)
    if (failed?.error) toast.error('Failed to save order')
  }

  const handleRemove = (id: string) => {
    setTools(prev => prev.filter(t => t.id !== id))
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={tools.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {tools.map((tool, i) => (
            <SortableToolRow
              key={tool.id}
              tool={tool}
              index={i}
              collectionId={collectionId}
              onRemove={handleRemove}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
