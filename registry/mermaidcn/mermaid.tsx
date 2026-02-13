"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import {
  mermaidThemes,
  type MermaidCustomTheme,
} from "@/lib/mermaid-themes"

/** Built-in mermaid themes */
export type MermaidBuiltinTheme = "default" | "dark" | "forest" | "neutral" | "base"

/** All supported theme names: built-in + custom presets */
export type MermaidTheme = MermaidBuiltinTheme | MermaidCustomTheme

const BUILTIN_THEMES = new Set<string>(["default", "dark", "forest", "neutral", "base"])

export interface MermaidConfig {
  theme?: MermaidTheme
  look?: "classic" | "handdrawn"
  themeVariables?: Record<string, string>
  flowchart?: {
    curve?: "linear" | "cardinal"
    padding?: number
    htmlLabels?: boolean
  }
  sequence?: {
    diagramMarginX?: number
    diagramMarginY?: number
    actorMargin?: number
    width?: number
    height?: number
    boxMargin?: number
    useMaxWidth?: boolean
  }
  fontFamily?: string
  fontSize?: number
  logLevel?: "trace" | "debug" | "info" | "warn" | "error" | "fatal"
}

export interface MermaidProps {
  chart: string
  config?: MermaidConfig
  className?: string
  onError?: (error: string) => void
  onSuccess?: (svg: string) => void
}

let renderCounter = 0

export function Mermaid({
  chart,
  config,
  className,
  onError,
  onSuccess,
}: MermaidProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [status, setStatus] = React.useState<
    "idle" | "loading" | "success" | "error"
  >("loading")
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  const configKey = JSON.stringify(config ?? {})

  const onSuccessRef = React.useRef(onSuccess)
  onSuccessRef.current = onSuccess
  const onErrorRef = React.useRef(onError)
  onErrorRef.current = onError

  React.useEffect(() => {
    const container = containerRef.current
    if (!container) return

    if (!chart.trim()) {
      container.replaceChildren()
      setErrorMessage(null)
      setStatus("idle")
      return
    }

    let cancelled = false

    const renderDiagram = async () => {
      setStatus("loading")
      setErrorMessage(null)

      try {
        const mermaid = (await import("mermaid")).default

        // Clean up orphaned render containers from prior failed renders
        document
          .querySelectorAll("[id^='dmermaid-']")
          .forEach((el) => el.remove())

        const parsedConfig = JSON.parse(configKey)

        // Resolve custom theme presets
        const isCustomTheme =
          parsedConfig.theme && !BUILTIN_THEMES.has(parsedConfig.theme)
        const resolvedThemeVars = isCustomTheme
          ? {
              ...mermaidThemes[parsedConfig.theme as MermaidCustomTheme],
              ...parsedConfig.themeVariables,
            }
          : parsedConfig.themeVariables

        mermaid.initialize({
          startOnLoad: false,
          theme: isCustomTheme ? "base" : (parsedConfig.theme ?? "default"),
          themeVariables: resolvedThemeVars,
          look: parsedConfig.look ?? "classic",
          flowchart: {
            htmlLabels: parsedConfig.flowchart?.htmlLabels ?? true,
            ...(parsedConfig.flowchart?.padding != null
              ? { padding: parsedConfig.flowchart.padding }
              : {}),
          },
          sequence: parsedConfig.sequence,
          fontFamily: parsedConfig.fontFamily ?? "Inter, sans-serif",
          fontSize: parsedConfig.fontSize ?? 14,
          logLevel: parsedConfig.logLevel ?? "error",
          securityLevel: "loose",
        })

        const id = `mermaid-${Date.now()}-${renderCounter++}`
        const { svg } = await mermaid.render(id, chart.trim())

        if (cancelled) return

        // Parse the SVG string and inject via ref instead of dangerouslySetInnerHTML
        const parser = new DOMParser()
        const doc = parser.parseFromString(svg, "image/svg+xml")
        const svgEl = doc.documentElement

        container.replaceChildren(svgEl)
        setErrorMessage(null)
        setStatus("success")
        onSuccessRef.current?.(svg)
      } catch (err) {
        if (cancelled) return
        const msg =
          err instanceof Error ? err.message : "Failed to render diagram"
        setErrorMessage(msg)
        setStatus("error")
        onErrorRef.current?.(msg)
      }
    }

    const timer = setTimeout(renderDiagram, 300)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [chart, configKey])

  return (
    <div className={cn("relative", className)}>
      {/* SVG render target -- always in the DOM so the ref is stable */}
      <div
        ref={containerRef}
        className={cn(
          "flex items-center justify-center overflow-auto [&_svg]:max-w-full",
          status !== "success" && "hidden"
        )}
      />

      {status === "loading" && (
        <div className="flex items-center justify-center p-8">
          <div className="flex flex-col items-center gap-3">
            <div className="border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
            <span className="text-muted-foreground text-sm">
              Rendering diagram...
            </span>
          </div>
        </div>
      )}

      {status === "error" && errorMessage && (
        <div className="flex items-center justify-center p-8">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="bg-destructive/10 text-destructive rounded-md px-3 py-1.5 text-xs font-medium">
              Syntax Error
            </div>
            <p className="text-muted-foreground max-w-md text-xs leading-relaxed">
              {errorMessage.length > 200
                ? errorMessage.slice(0, 200) + "..."
                : errorMessage}
            </p>
          </div>
        </div>
      )}

      {status === "idle" && (
        <div className="flex items-center justify-center p-8">
          <p className="text-muted-foreground text-sm">
            Enter a Mermaid diagram to see the preview
          </p>
        </div>
      )}
    </div>
  )
}
