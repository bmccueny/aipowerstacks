'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import StarterKit from '@tiptap/starter-kit'
import ImageExt from '@tiptap/extension-image'
import LinkExt from '@tiptap/extension-link'
import Youtube from '@tiptap/extension-youtube'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight'
import { createLowlight, common } from 'lowlight'
import { useEffect, useRef, useState } from 'react'
import {
  AlignCenter, AlignLeft, AlignRight, Bold, Code, Code2,
  Heading1, Heading2, Heading3, Image as ImageIcon, Italic, Link2,
  List, ListOrdered, Minus, Quote, Redo, Strikethrough,
  Underline as UnderlineIcon, Undo, X, Youtube as YoutubeIcon,
} from 'lucide-react'

const lowlight = createLowlight(common)

interface TiptapEditorProps {
  content: string
  onChange: (html: string) => void
  onWordCount?: (count: number) => void
}

function Sep() {
  return <span className="w-px h-5 bg-black/15 mx-0.5 shrink-0 inline-block" />
}

function InlineDialog({
  placeholder,
  onConfirm,
  onClose,
}: {
  placeholder: string
  onConfirm: (v: string) => void
  onClose: () => void
}) {
  const [val, setVal] = useState('')
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => { ref.current?.focus() }, [])

  return (
    <div className="flex items-center gap-2 bg-foreground text-background rounded-lg shadow-xl px-3 py-2 min-w-[280px]">
      <input
        ref={ref}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder={placeholder}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); onConfirm(val) }
          if (e.key === 'Escape') onClose()
        }}
        className="flex-1 bg-transparent text-sm text-background placeholder:text-background/50 outline-none"
      />
      <button
        type="button"
        onClick={() => onConfirm(val)}
        className="text-xs font-bold uppercase tracking-wide text-primary shrink-0"
      >
        Insert
      </button>
      <button type="button" onClick={onClose} className="shrink-0 text-background/60 hover:text-background transition-colors">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

export function TiptapEditor({ content, onChange, onWordCount }: TiptapEditorProps) {
  const [dialog, setDialog] = useState<'link' | 'image' | 'youtube' | null>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      ImageExt.configure({ allowBase64: true }),
      LinkExt.configure({ openOnClick: false }),
      Youtube.configure({ controls: true, nocookie: true }),
      Placeholder.configure({ placeholder: 'Start writing your post...' }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      CodeBlockLowlight.configure({ lowlight }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
      if (onWordCount) {
        const text = editor.state.doc.textContent
        onWordCount(text.split(/\s+/).filter(Boolean).length)
      }
    },
    editorProps: {
      attributes: {
        class: 'prose prose-neutral max-w-none min-h-[500px] px-8 py-6 focus:outline-none',
      },
    },
    immediatelyRender: false,
  })

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  if (!editor) return null

  const Btn = ({
    onClick, active, title, children,
  }: { onClick: () => void; active?: boolean; title?: string; children: React.ReactNode }) => (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick() }}
      title={title}
      className={`p-1.5 rounded-md transition-colors shrink-0 ${
        active
          ? 'bg-foreground text-background'
          : 'text-foreground/55 hover:text-foreground hover:bg-black/6'
      }`}
    >
      {children}
    </button>
  )

  const handleLink = (url: string) => {
    if (url) {
      const href = url.startsWith('http') ? url : `https://${url}`
      editor.chain().focus().setLink({ href }).run()
    }
    setDialog(null)
  }

  const handleImage = (url: string) => {
    if (url) editor.chain().focus().setImage({ src: url }).run()
    setDialog(null)
  }

  const handleYoutube = (url: string) => {
    if (url) editor.chain().focus().setYoutubeVideo({ src: url }).run()
    setDialog(null)
  }

  return (
    <div className="border-2 border-black rounded-xl overflow-visible bg-white flex flex-col">
      {editor && (
        <BubbleMenu
          editor={editor}
          className="flex items-center gap-0.5 bg-foreground rounded-lg px-1.5 py-1 shadow-lg"
        >
          {[
            { fn: () => editor.chain().focus().toggleBold().run(), active: editor.isActive('bold'), icon: <Bold className="h-3.5 w-3.5" /> },
            { fn: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive('italic'), icon: <Italic className="h-3.5 w-3.5" /> },
            { fn: () => editor.chain().focus().toggleUnderline().run(), active: editor.isActive('underline'), icon: <UnderlineIcon className="h-3.5 w-3.5" /> },
            { fn: () => editor.chain().focus().toggleStrike().run(), active: editor.isActive('strike'), icon: <Strikethrough className="h-3.5 w-3.5" /> },
            { fn: () => editor.chain().focus().toggleCode().run(), active: editor.isActive('code'), icon: <Code className="h-3.5 w-3.5" /> },
          ].map(({ fn, active, icon }, i) => (
            <button
              key={i}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); fn() }}
              className={`p-1 rounded transition-colors ${active ? 'bg-white/20 text-white' : 'text-white/65 hover:text-white'}`}
            >
              {icon}
            </button>
          ))}
          <span className="w-px h-4 bg-white/25 mx-0.5" />
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); setDialog('link') }}
            className={`p-1 rounded transition-colors ${editor.isActive('link') ? 'bg-white/20 text-white' : 'text-white/65 hover:text-white'}`}
          >
            <Link2 className="h-3.5 w-3.5" />
          </button>
        </BubbleMenu>
      )}

      <div className="flex items-center gap-0.5 p-2 border-b-2 border-black bg-background flex-wrap sticky top-0 z-10">
        <Btn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold"><Bold className="h-4 w-4" /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic"><Italic className="h-4 w-4" /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline"><UnderlineIcon className="h-4 w-4" /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough"><Strikethrough className="h-4 w-4" /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Inline Code"><Code className="h-4 w-4" /></Btn>
        <Sep />
        <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Heading 1"><Heading1 className="h-4 w-4" /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2"><Heading2 className="h-4 w-4" /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3"><Heading3 className="h-4 w-4" /></Btn>
        <Sep />
        <Btn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet List"><List className="h-4 w-4" /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Ordered List"><ListOrdered className="h-4 w-4" /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Blockquote"><Quote className="h-4 w-4" /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code Block"><Code2 className="h-4 w-4" /></Btn>
        <Btn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider"><Minus className="h-4 w-4" /></Btn>
        <Sep />
        <Btn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align Left"><AlignLeft className="h-4 w-4" /></Btn>
        <Btn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Align Centre"><AlignCenter className="h-4 w-4" /></Btn>
        <Btn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Align Right"><AlignRight className="h-4 w-4" /></Btn>
        <Sep />

        <div className="relative">
          <Btn onClick={() => setDialog(dialog === 'link' ? null : 'link')} active={editor.isActive('link') || dialog === 'link'} title="Link"><Link2 className="h-4 w-4" /></Btn>
          {dialog === 'link' && (
            <div className="absolute top-full left-0 mt-2 z-50">
              <InlineDialog placeholder="https://example.com" onConfirm={handleLink} onClose={() => setDialog(null)} />
            </div>
          )}
        </div>
        <div className="relative">
          <Btn onClick={() => setDialog(dialog === 'image' ? null : 'image')} title="Image"><ImageIcon className="h-4 w-4" /></Btn>
          {dialog === 'image' && (
            <div className="absolute top-full left-0 mt-2 z-50">
              <InlineDialog placeholder="https://image-url.jpg" onConfirm={handleImage} onClose={() => setDialog(null)} />
            </div>
          )}
        </div>
        <div className="relative">
          <Btn onClick={() => setDialog(dialog === 'youtube' ? null : 'youtube')} title="YouTube"><YoutubeIcon className="h-4 w-4" /></Btn>
          {dialog === 'youtube' && (
            <div className="absolute top-full left-0 mt-2 z-50">
              <InlineDialog placeholder="https://youtube.com/watch?v=..." onConfirm={handleYoutube} onClose={() => setDialog(null)} />
            </div>
          )}
        </div>

        <div className="ml-auto flex items-center gap-0.5">
          <Sep />
          <Btn onClick={() => editor.chain().focus().undo().run()} title="Undo"><Undo className="h-4 w-4" /></Btn>
          <Btn onClick={() => editor.chain().focus().redo().run()} title="Redo"><Redo className="h-4 w-4" /></Btn>
        </div>
      </div>

      <EditorContent editor={editor} />
    </div>
  )
}
