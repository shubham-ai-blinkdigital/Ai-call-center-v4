
import { useState } from 'react'
import { Button } from './ui/button'
import { loadStripe } from '@stripe/stripe-js'

export default function TopUpStripeButton({ amount = 50 }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleTopUp = async () => {
    try {
      setLoading(true)
      setError(null)

      alert(`Initiating Stripe payment for $${amount}`)

      // Create checkout session
      const response = await fetch('/api/payments/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ amount })
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(`API ${response.status}: ${text}`)
      }

      const { url, id } = await response.json()

      // Preferred: direct URL redirect
      if (url) {
        window.location.assign(url)
        return
      }

      // Fallback: redirect using sessionId
      if (id) {
        const configResponse = await fetch('/api/stripe/config')
        const { publishableKey } = await configResponse.json()
        const stripe = await loadStripe(publishableKey)
        const { error } = await stripe.redirectToCheckout({ sessionId: id })
        if (error) throw error
        return
      }

      throw new Error('No url or session id returned from server.')

    } catch (err) {
      console.error('Stripe checkout error:', err)
      setError(err.message || 'Payment failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (error) {
    return (
      <div className="space-y-2">
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded">
          {error}
        </div>
        <Button 
          onClick={() => setError(null)} 
          variant="outline" 
          size="sm"
        >
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <Button 
      onClick={handleTopUp}
      disabled={loading}
      className="w-full"
    >
      {loading ? (
        <>
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent" />
          Processing...
        </>
      ) : (
        `Add $${amount} via Stripe`
      )}
    </Button>
  )
}
