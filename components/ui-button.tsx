import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    const variants = {
      primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200",
      secondary: "bg-white/80 text-slate-700 hover:bg-white shadow-sm border border-white/40",
      ghost: "bg-transparent hover:bg-slate-100 text-slate-600",
      danger: "bg-red-500 text-white hover:bg-red-600 shadow-red-100",
    }
    
    const sizes = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-5 py-2.5 text-base",
      lg: "px-8 py-4 text-lg",
    }

    return (
      <Comp
        className={cn(
          "inline-flex items-center justify-center rounded-2xl font-semibold transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:pointer-events-none backdrop-blur-sm",
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
