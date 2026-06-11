import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'

import { cn } from '@/lib/utils'
import { Button } from '@/ui/shadcn/button'
import { Calendar } from '@/ui/shadcn/calendar'
import { Input } from '@/ui/shadcn/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/ui/shadcn/popover'

const pad = (n: number) => String(n).padStart(2, '0')

/** Local `YYYY-MM-DDTHH:mm` string (same shape as an <input type="datetime-local">). */
function toLocalString(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

interface DateTimePickerProps {
  id?: string
  /** Local datetime string, e.g. "2026-06-10T14:30" (empty when unset). */
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

/**
 * shadcn date+time picker: a Calendar in a Popover plus a time field. Emits the
 * same local `YYYY-MM-DDTHH:mm` string an `<input type="datetime-local">` would,
 * so callers keep parsing it with `new Date(value)`.
 */
export function DateTimePicker({ id, value, onChange, placeholder }: DateTimePickerProps) {
  const parsed = value ? new Date(value) : null
  const date = parsed && !Number.isNaN(parsed.getTime()) ? parsed : null
  const time = date ? `${pad(date.getHours())}:${pad(date.getMinutes())}` : '00:00'

  const setDatePart = (picked: Date | undefined) => {
    if (!picked) return
    const base = date ? new Date(date) : new Date(new Date().setHours(0, 0, 0, 0))
    base.setFullYear(picked.getFullYear(), picked.getMonth(), picked.getDate())
    onChange(toLocalString(base))
  }

  const setTimePart = (next: string) => {
    const [h, m] = next.split(':').map(Number)
    const base = date ? new Date(date) : new Date()
    base.setHours(h || 0, m || 0, 0, 0)
    onChange(toLocalString(base))
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          className={cn(
            'justify-start gap-2 font-normal',
            !date && 'text-muted-foreground',
          )}
        >
          <CalendarIcon className="size-4" />
          {date ? format(date, 'd MMM yyyy, HH:mm') : (placeholder ?? 'Pick a date')}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date ?? undefined}
          onSelect={setDatePart}
          defaultMonth={date ?? undefined}
          autoFocus
        />
        <div className="border-t p-3">
          <Input
            type="time"
            value={time}
            onChange={(e) => setTimePart(e.target.value)}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
