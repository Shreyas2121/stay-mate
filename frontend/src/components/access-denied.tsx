import { AlertCircle, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AccessDeniedProps {
  title: string
  description: string
  actionLabel: string
  onAction: () => void
}

export function AccessDenied({
  title,
  description,
  actionLabel,
  onAction,
}: AccessDeniedProps) {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
      <div className="mx-auto max-w-md text-center">
        <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-destructive/10 text-destructive mb-6">
          <AlertCircle className="size-8" />
        </div>
        <h1 className="text-headline-lg text-foreground">{title}</h1>
        <p className="mt-3 text-body-md text-muted-foreground">{description}</p>
        <Button onClick={onAction} className="mt-8 gap-1.5">
          <ArrowLeft className="size-4" />
          {actionLabel}
        </Button>
      </div>
    </div>
  )
}
