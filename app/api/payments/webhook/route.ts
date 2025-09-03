
import { NextResponse } from 'next/server'
import { stripe } from '../../../../lib/stripeClient'
import { db } from '../../../../lib/db'
import type StripeType from 'stripe'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    // Read signature
    const sig = req.headers.get('stripe-signature')
    
    if (!sig) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      )
    }

    // Read raw body
    const rawBody = await req.text()

    // Construct event
    let event: StripeType.Event
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!)
    } catch (err: any) {
      return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 })
    }

    // Switch on event type
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as any
        
        // Only handle payment mode sessions
        if (session.mode !== 'payment') {
          break
        }

        const amount = session.amount_total ?? 0 // cents
        const userId = session.metadata?.user_id

        // Validate required data
        if (!userId || !amount) {
          console.error('Missing userId or amount in checkout.session.completed:', { 
            userId, 
            amount, 
            sessionId: session.id,
            metadata: session.metadata 
          })
          break
        }

        console.log('Processing payment for user:', userId, 'amount:', amount)

        try {
          // Insert payment record
          const paymentResponse = await fetch('/api/database/records', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              table: 'payments',
              data: {
                gateway: 'stripe',
                gateway_payment_id: session.id,
                amount_cents: amount,
                status: 'succeeded',
                user_id: userId,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }
            })
          })

          if (!paymentResponse.ok) {
            console.error('Failed to insert payment record:', await paymentResponse.text())
            break
          }

          // Find or create wallet
          const walletResponse = await fetch(`/api/database/records?table=wallets&user_id=${userId}`)
          let walletId

          if (walletResponse.ok) {
            const walletData = await walletResponse.json()
            const existingWallet = walletData.records?.[0]
            
            if (existingWallet) {
              walletId = existingWallet.id
              
              // Update existing wallet balance
              const updateResponse = await fetch('/api/database/records', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  table: 'wallets',
                  id: walletId,
                  data: {
                    balance_cents: existingWallet.balance_cents + amount,
                    updated_at: new Date().toISOString()
                  }
                })
              })

              if (!updateResponse.ok) {
                console.error('Failed to update wallet balance:', await updateResponse.text())
                break
              }
            } else {
              // Create new wallet
              const createWalletResponse = await fetch('/api/database/records', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  table: 'wallets',
                  data: {
                    user_id: userId,
                    balance_cents: amount,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                  }
                })
              })

              if (!createWalletResponse.ok) {
                console.error('Failed to create wallet:', await createWalletResponse.text())
                break
              }

              const newWallet = await createWalletResponse.json()
              walletId = newWallet.record?.id
            }
          }

          // Insert wallet transaction
          if (walletId) {
            const transactionResponse = await fetch('/api/database/records', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                table: 'wallet_transactions',
                data: {
                  wallet_id: walletId,
                  amount_cents: amount,
                  type: 'top_up',
                  gateway: 'stripe',
                  provider_txn_id: session.payment_intent,
                  created_at: new Date().toISOString()
                }
              })
            })

            if (!transactionResponse.ok) {
              console.error('Failed to insert wallet transaction:', await transactionResponse.text())
            }
          }

          console.log(`Successfully processed Stripe payment: ${session.id} for user ${userId}, amount: $${amount / 100}`)

        } catch (error) {
          console.error('Error processing checkout.session.completed:', error)
        }
        break

      default:
        console.log(`Unhandled Stripe event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Error processing Stripe webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
