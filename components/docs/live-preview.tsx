import { cn } from "@/lib/utils"

interface LivePreviewProps {
  children: React.ReactNode
  className?: string
  label?: string
}

export function LivePreview({ children, className, label }: LivePreviewProps) {
  return (
    <div
      className={cn(
        "border-border overflow-hidden rounded-lg border",
        className
      )}
    >
      {label && (
        <div className="border-border bg-muted/50 border-b px-4 py-2">
          <span className="text-muted-foreground text-xs font-medium">
            {label}
          </span>
        </div>
      )}
      <div className="bg-background p-4">{children}</div>
    </div>
  )
}
