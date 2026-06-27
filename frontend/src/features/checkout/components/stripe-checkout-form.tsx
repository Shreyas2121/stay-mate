import { useMemo } from 'react'
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from '@stripe/react-stripe-js'
import { stripePromise } from '@/lib/stripe'

interface Props {
  clientSecret: string
}

export function StripeCheckoutForm({ clientSecret }: Props) {
  const options = useMemo(() => ({ clientSecret }), [clientSecret])

  return (
    <EmbeddedCheckoutProvider stripe={stripePromise} options={options}>
      <EmbeddedCheckout />
    </EmbeddedCheckoutProvider>
  )
}
