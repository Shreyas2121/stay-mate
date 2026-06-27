import * as React from 'react'
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: PaginationProps) {
  if (totalPages <= 0) return null

  // Generate page numbers to show
  // Always show first, last, and pages around current
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const showMax = 5 // Maximum number of buttons to show

    if (totalPages <= showMax) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
      return pages
    }

    pages.push(1)

    if (currentPage > 3) {
      pages.push('...')
    }

    const start = Math.max(2, currentPage - 1)
    const end = Math.min(totalPages - 1, currentPage + 1)

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    if (currentPage < totalPages - 2) {
      pages.push('...')
    }

    pages.push(totalPages)

    return pages
  }

  const pages = getPageNumbers()

  return (
    <nav
      role="navigation"
      aria-label="pagination"
      className={cn('flex justify-center items-center gap-1', className)}
    >
      <Button
        variant="ghost"
        size="icon"
        className="size-9 rounded-full"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        aria-label="Go to previous page"
      >
        <ChevronLeft className="size-4" />
      </Button>

      <div className="flex items-center gap-1">
        {pages.map((page, i) => {
          if (page === '...') {
            return (
              <span
                key={`ellipsis-${i}`}
                className="flex size-9 items-center justify-center"
              >
                <MoreHorizontal className="size-4 text-slate-500" />
              </span>
            )
          }

          const pageNum = page as number
          const isCurrent = pageNum === currentPage

          return (
            <Button
              key={pageNum}
              variant={isCurrent ? 'default' : 'ghost'}
              size="icon"
              className={cn(
                'size-9 rounded-full font-medium text-sm',
                isCurrent
                  ? 'bg-slate-900 text-white hover:bg-slate-800'
                  : 'text-slate-600',
              )}
              onClick={() => onPageChange(pageNum)}
              aria-label={`Go to page ${pageNum}`}
              aria-current={isCurrent ? 'page' : undefined}
            >
              {pageNum}
            </Button>
          )
        })}
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="size-9 rounded-full"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        aria-label="Go to next page"
      >
        <ChevronRight className="size-4" />
      </Button>
    </nav>
  )
}
