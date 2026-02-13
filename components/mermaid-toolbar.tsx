"use client"

import * as React from "react"
import type { MermaidTheme } from "@/components/mermaid"
import { diagramTemplates } from "@/lib/diagram-templates"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  CodeIcon,
  EyeIcon,
  RotateCcwIcon,
  MaximizeIcon,
  MinimizeIcon,
  PaletteIcon,
  LayoutTemplateIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

const themes: { value: MermaidTheme; label: string }[] = [
  { value: "default", label: "Default" },
  { value: "dark", label: "Dark" },
  { value: "forest", label: "Forest" },
  { value: "neutral", label: "Neutral" },
  { value: "base", label: "Base" },
]

export type ActivePanel = "editor" | "preview" | "both"

export interface MermaidToolbarProps {
  theme: MermaidTheme
  onThemeChange: (theme: MermaidTheme) => void
  curve: "linear" | "cardinal"
  onCurveChange: (curve: "linear" | "cardinal") => void
  fontSize: number
  onFontSizeChange: (size: number) => void
  activePanel: ActivePanel
  onActivePanelChange: (panel: ActivePanel) => void
  isFullscreen: boolean
  onFullscreenToggle: () => void
  onLoadTemplate: (templateId: string) => void
  onReset: () => void
  className?: string
}

export function MermaidToolbar({
  theme,
  onThemeChange,
  curve,
  onCurveChange,
  fontSize,
  onFontSizeChange,
  activePanel,
  onActivePanelChange,
  isFullscreen,
  onFullscreenToggle,
  onLoadTemplate,
  onReset,
  className,
}: MermaidToolbarProps) {
  return (
    <div
      className={cn(
        "bg-card border-border flex flex-wrap items-center gap-2 border-b px-3 py-2",
        className
      )}
    >
      {/* Template Selector */}
      <Select onValueChange={onLoadTemplate}>
        <SelectTrigger className="h-8 w-44 text-xs">
          <LayoutTemplateIcon className="mr-1.5 h-3.5 w-3.5 shrink-0 opacity-50" />
          <SelectValue placeholder="Load template" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {diagramTemplates.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                <span className="text-xs">{t.name}</span>
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <div className="bg-border h-5 w-px" />

      {/* Theme Selector */}
      <Select
        value={theme}
        onValueChange={(v) => onThemeChange(v as MermaidTheme)}
      >
        <SelectTrigger className="h-8 w-32 text-xs">
          <PaletteIcon className="mr-1.5 h-3.5 w-3.5 shrink-0 opacity-50" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {themes.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                <span className="text-xs">{t.label}</span>
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      {/* Curve */}
      <Select
        value={curve}
        onValueChange={(v) =>
          onCurveChange(v as "linear" | "cardinal")
        }
      >
        <SelectTrigger className="h-8 w-28 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="linear">
              <span className="text-xs">Linear</span>
            </SelectItem>
            <SelectItem value="cardinal">
              <span className="text-xs">Cardinal</span>
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>

      {/* Font Size */}
      <Select
        value={String(fontSize)}
        onValueChange={(v) => onFontSizeChange(Number(v))}
      >
        <SelectTrigger className="h-8 w-20 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {[10, 12, 14, 16, 18, 20].map((size) => (
              <SelectItem key={size} value={String(size)}>
                <span className="text-xs">{size}px</span>
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <div className="flex-1" />

      {/* View toggle */}
      <div className="bg-muted hidden items-center rounded-md p-0.5 sm:flex">
        <button
          onClick={() => onActivePanelChange("editor")}
          className={cn(
            "rounded-sm px-2 py-1 text-xs font-medium transition-colors",
            activePanel === "editor"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <CodeIcon className="mr-1 inline-block h-3 w-3" />
          Code
        </button>
        <button
          onClick={() => onActivePanelChange("both")}
          className={cn(
            "rounded-sm px-2 py-1 text-xs font-medium transition-colors",
            activePanel === "both"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Split
        </button>
        <button
          onClick={() => onActivePanelChange("preview")}
          className={cn(
            "rounded-sm px-2 py-1 text-xs font-medium transition-colors",
            activePanel === "preview"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <EyeIcon className="mr-1 inline-block h-3 w-3" />
          Preview
        </button>
      </div>

      <div className="bg-border hidden h-5 w-px sm:block" />

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={onReset}
        title="Reset"
      >
        <RotateCcwIcon className="h-3.5 w-3.5" />
        <span className="sr-only">Reset</span>
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={onFullscreenToggle}
        title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
      >
        {isFullscreen ? (
          <MinimizeIcon className="h-3.5 w-3.5" />
        ) : (
          <MaximizeIcon className="h-3.5 w-3.5" />
        )}
        <span className="sr-only">
          {isFullscreen ? "Exit fullscreen" : "Fullscreen"}
        </span>
      </Button>
    </div>
  )
}
