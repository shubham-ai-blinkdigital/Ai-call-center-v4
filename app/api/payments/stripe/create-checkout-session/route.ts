
import { NextResponse } from 'next/server'
import { stripe } from '../../../../../lib/stripeClient'

export async function POST(req: Request) {
  try {
    // Parse and validate amount
    const { amount } = await req.json()
    
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount. Must be greater than 0.' },
        { status: 400 }
      )
    }

    // Convert to cents
    const amountCents = Math.round(amount * 100)

    // Determine origin
    const origin = req.headers.get('origin') ?? new URL(req.url).origin

    // TEMP user_id - TODO: integrate with real user authentication
    const userId = '<REPLACE_WITH_AUTH_USER_ID>' // Replace with actual user ID from auth

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Wallet Top-up'
            },
            unit_amount: amountCents
          },
          quantity: 1
        }
      ],
      success_url: `${origin}/billing?success=1`,
      cancel_url: `${origin}/billing?canceled=1`,
      metadata: {
        user_id: userId
      }
    })

    return NextResponse.json({ url: session.url })
    
  } catch (error) {
    console.error('Error creating Stripe checkout session:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
