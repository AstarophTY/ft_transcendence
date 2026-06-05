import { HexColorPicker } from 'react-colorful'

import { cn } from '@/lib/utils'
import { Input } from '@/components/shadcn/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/shadcn/popover'

interface ColorPickerProps {
  /** Current hex color (e.g. "#7f77dd"). */
  value: string
  onChange: (value: string) => void
  className?: string
}

const normalizeHex = (raw: string): string => {
  let hex = raw.trim()
  if (hex && !hex.startsWith('#')) hex = `#${hex}`
  return hex.slice(0, 7)
}

/** A swatch button that opens a shadcn-style popover with a hex color picker. */
export function ColorPicker({ value, onChange, className }: ColorPickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Pick a color"
          className={cn(
            'flex h-9 w-full items-center gap-2 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm',
            className,
          )}
        >
          <span
            className="size-5 rounded border"
            style={{ backgroundColor: value }}
          />
          <span className="font-mono uppercase text-muted-foreground">
            {value}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="flex w-auto flex-col gap-3">
        <HexColorPicker color={value} onChange={onChange} />
        <Input
          value={value}
          onChange={(e) => onChange(normalizeHex(e.target.value))}
          className="font-mono uppercase"
          maxLength={7}
        />
      </PopoverContent>
    </Popover>
  )
}

export default ColorPicker
