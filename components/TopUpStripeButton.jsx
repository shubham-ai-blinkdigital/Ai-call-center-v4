
import { useState } from 'react'
import { Button } from './ui/button'

export default function TopUpStripeButton({ amount = 50 }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleTopUp = async () => {
    try {
      setLoading(true)
      setError(null)

      // Optional: Check if Stripe is configured
      const configResponse = await fetch('/api/stripe/config')
      const configData = await configResponse.json()
      
      if (!configResponse.ok || configData.error) {
        throw new Error(configData.error || 'Stripe is not configured')
      }

      // Create checkout session
      const response = await fetch('/api/payments/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ amount })
      })

      const data = await response.json()

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      if (!data.url) {
        throw new Error('No checkout URL returned')
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url

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
