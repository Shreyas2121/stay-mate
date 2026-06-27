import { format, startOfToday } from 'date-fns'
import type { DateRange } from 'react-day-picker'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { CalendarIcon, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DateSearchFieldProps {
  dateRange?: DateRange
  onDateRangeChange: (dateRange: DateRange | undefined) => void
  className?: string
  buttonClassName?: string
  numberOfMonths?: number
}

const today = startOfToday()

export function DateSearchField({
  dateRange,
  onDateRangeChange,
  className,
  buttonClassName,
  numberOfMonths = 2,
}: DateSearchFieldProps) {
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDateRangeChange(undefined)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div
          role="button"
          tabIndex={0}
          className={cn(
            'flex items-center gap-3 px-4 py-2 hover:bg-slate-100 rounded-full transition-colors cursor-pointer text-left relative',
            !dateRange && 'text-muted-foreground',
            className,
            buttonClassName
          )}
        >
          <CalendarIcon className="w-4 h-4 shrink-0 text-slate-700" />
          <span className="text-sm font-medium text-slate-900 truncate flex-1 pr-6">
            {dateRange?.from ? (
              dateRange.to ? (
                `${format(dateRange.from, 'LLL dd')} - ${format(dateRange.to, 'LLL dd')}`
              ) : (
                format(dateRange.from, 'LLL dd')
              )
            ) : (
              'Any week'
            )}
          </span>
          {dateRange?.from && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 p-0.5 rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0"
        align="center"
        avoidCollisions={false}
      >
        <Calendar
          mode="range"
          defaultMonth={dateRange?.from}
          selected={dateRange}
          onSelect={onDateRangeChange}
          numberOfMonths={numberOfMonths}
          disabled={(date) => date < today}
        />
      </PopoverContent>
    </Popover>
  )
}
