import * as React from "react"
import { cn } from "../../lib/utils"


interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "outline"
}

const Badge = ({ className, variant = "default", ...props }: BadgeProps) => {
  const variantClasses = {
    default: "bg-gray-200 text-gray-800",
    outline: "border border-gray-400 text-gray-700 bg-transparent",
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  )
}

export { Badge }
