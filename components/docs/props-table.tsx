import { cn } from "@/lib/utils"

interface Prop {
  name: string
  type: string
  default?: string
  description: string
  required?: boolean
}

interface PropsTableProps {
  props: Prop[]
  className?: string
}

export function PropsTable({ props, className }: PropsTableProps) {
  return (
    <div
      className={cn(
        "border-border overflow-hidden rounded-lg border",
        className
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-border border-b">
              <th className="text-muted-foreground px-4 py-2.5 text-left text-xs font-medium">
                Prop
              </th>
              <th className="text-muted-foreground px-4 py-2.5 text-left text-xs font-medium">
                Type
              </th>
              <th className="text-muted-foreground px-4 py-2.5 text-left text-xs font-medium">
                Default
              </th>
              <th className="text-muted-foreground px-4 py-2.5 text-left text-xs font-medium">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            {props.map((prop, i) => (
              <tr
                key={prop.name}
                className={cn(
                  "border-border border-b last:border-b-0",
                  i % 2 === 0 ? "bg-background" : "bg-muted/20"
                )}
              >
                <td className="px-4 py-2.5">
                  <code className="text-foreground font-mono text-xs font-medium">
                    {prop.name}
                    {prop.required && (
                      <span className="text-destructive ml-0.5">*</span>
                    )}
                  </code>
                </td>
                <td className="px-4 py-2.5">
                  <code className="text-muted-foreground bg-muted rounded px-1.5 py-0.5 font-mono text-[11px]">
                    {prop.type}
                  </code>
                </td>
                <td className="px-4 py-2.5">
                  {prop.default ? (
                    <code className="text-muted-foreground font-mono text-xs">
                      {prop.default}
                    </code>
                  ) : (
                    <span className="text-muted-foreground text-xs">-</span>
                  )}
                </td>
                <td className="text-muted-foreground px-4 py-2.5 text-xs leading-relaxed">
                  {prop.description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
