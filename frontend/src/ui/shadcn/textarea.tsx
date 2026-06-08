import { cn } from '@/lib/utils.ts'
import React from "react";

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      className={cn(
        'flex min-h-15 w-full rounded-md border bg-card/50 px-3 py-2 text-sm shadow-xs outline-none',
        'placeholder:text-muted-foreground',
        'focus-visible:ring-[3px] focus-visible:ring-ring/50',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
