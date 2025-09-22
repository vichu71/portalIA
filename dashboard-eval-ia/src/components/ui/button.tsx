import * as React from "react"
import { cn } from "../../lib/utils"

export type ButtonVariant = "default" | "destructive" | "outline"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

const variantClasses: Record<ButtonVariant, string> = {
  default: "bg-blue-600 text-white hover:bg-blue-700",
  destructive: "bg-red-600 text-white hover:bg-red-700",
  outline: "border border-gray-300 text-gray-700 hover:bg-gray-100",
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center px-4 py-2 rounded-md transition",
          variantClasses[variant],
          className
        )}
        {...props}
      />
    )
  }
)

Button.displayName = "Button"

export { Button }
