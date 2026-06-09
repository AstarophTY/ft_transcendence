import * as React from 'react'

import { cn } from '@/lib/utils.ts'

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          'flex h-9 w-full min-w-0 rounded-md border bg-card/50 px-3 py-1 text-sm shadow-xs transition-colors outline-none',
          'placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground',
          'focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring',
          'aria-invalid:border-destructive aria-invalid:ring-destructive/30',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...props}
      />
    )
  },
)
Input.displayName = 'Input'

export { Input }
