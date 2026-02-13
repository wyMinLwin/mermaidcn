"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface MermaidEditorProps {
  value: string
  onChange: (value: string) => void
  className?: string
  placeholder?: string
}

export function MermaidEditor({
  value,
  onChange,
  className,
  placeholder = "Enter your Mermaid diagram here...",
}: MermaidEditorProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const lineCountRef = React.useRef<HTMLDivElement>(null)

  const lineCount = value.split("\n").length

  const handleScroll = () => {
    if (textareaRef.current && lineCountRef.current) {
      lineCountRef.current.scrollTop = textareaRef.current.scrollTop
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault()
      const target = e.currentTarget
      const start = target.selectionStart
      const end = target.selectionEnd
      const newValue = value.substring(0, start) + "  " + value.substring(end)
      onChange(newValue)
      requestAnimationFrame(() => {
        target.selectionStart = target.selectionEnd = start + 2
      })
    }
  }

  return (
    <div
      className={cn(
        "bg-card relative flex h-full min-h-0 overflow-hidden font-mono text-sm",
        className
      )}
    >
      <div
        ref={lineCountRef}
        className="text-muted-foreground/50 border-border/50 flex w-12 shrink-0 flex-col items-end overflow-hidden border-r px-2 py-3 text-xs leading-[1.625rem] select-none"
        aria-hidden="true"
      >
        {Array.from({ length: lineCount }, (_, i) => (
          <span key={i + 1}>{i + 1}</span>
        ))}
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        spellCheck={false}
        className={cn(
          "text-foreground placeholder:text-muted-foreground/40 h-full w-full resize-none bg-transparent p-3 leading-[1.625rem] outline-none",
          "scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border"
        )}
      />
    </div>
  )
}
