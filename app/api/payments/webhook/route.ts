
import { NextResponse } from 'next/server'
import { stripe } from '../../../../lib/stripeClient'
import { db } from '../../../../lib/db'
import type StripeType from 'stripe'

export const runtime = 'nodejs'

export async function GET() {
  console.log('🔔 [WEBHOOK] GET request to webhook endpoint')
  return NextResponse.json({ 
    message: 'Webhook endpoint is working',
    timestamp: new Date().toISOString(),
    url: process.env.VERCEL_URL || 'localhost',
    environment: process.env.NODE_ENV,
    hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET
  })
}

export async function POST(req: Request) {
  console.log('🔔 [WEBHOOK] ==================== WEBHOOK CALLED ====================')
  console.log('🔔 [WEBHOOK] Timestamp:', new Date().toISOString())
  console.log('🔔 [WEBHOOK] Request URL:', req.url)
  console.log('🔔 [WEBHOOK] Request method:', req.method)
  console.log('🔔 [WEBHOOK] Headers:', Object.fromEntries(req.headers.entries()))
  
  try {
    // Read signature
    const sig = req.headers.get('stripe-signature')
    
    if (!sig) {
      console.error('❌ [WEBHOOK] Missing stripe-signature header')
      console.error('❌ [WEBHOOK] Available headers:', Object.fromEntries(req.headers.entries()))
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      )
    }

    // Read raw body as buffer first, then convert to string
    const buf = await req.arrayBuffer()
    const rawBody = Buffer.from(buf).toString('utf8')

    console.log('🔔 [WEBHOOK] Webhook signature received:', sig.substring(0, 20) + '...')
    console.log('🔔 [WEBHOOK] STRIPE_WEBHOOK_SECRET exists:', !!process.env.STRIPE_WEBHOOK_SECRET)
    console.log('🔔 [WEBHOOK] Raw body length:', rawBody.length)
    console.log('🔔 [WEBHOOK] Raw body preview:', rawBody.substring(0, 200) + '...')
    
    // Construct event
    let event: StripeType.Event
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!)
      console.log('✅ [WEBHOOK] Webhook signature verified successfully')
      console.log('🔔 [WEBHOOK] Event type:', event.type)
      console.log('🔔 [WEBHOOK] Event ID:', event.id)
      console.log('🔔 [WEBHOOK] Event created:', new Date(event.created * 1000).toISOString())
    } catch (err: any) {
      console.error('❌ [WEBHOOK] Webhook signature verification failed:', err.message)
      console.error('❌ [WEBHOOK] Full error:', err)
      return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 })
    }

    console.log('🔔 [WEBHOOK] Processing event:', event.type)

    // Switch on event type
    switch (event.type) {
      case 'checkout.session.completed':
        console.log('🔔 [WEBHOOK] Processing checkout.session.completed')
        const session = event.data.object as any
        
        console.log('🔔 [WEBHOOK] Session mode:', session.mode)
        console.log('🔔 [WEBHOOK] Session ID:', session.id)
        console.log('🔔 [WEBHOOK] Session metadata:', session.metadata)
        
        // Only handle payment mode sessions
        if (session.mode !== 'payment') {
          console.log('🔔 [WEBHOOK] Skipping non-payment session')
          break
        }

        const amount = session.amount_total ?? 0 // cents
        const userId = session.metadata?.user_id
        const stripeCustomerId = session.customer

        console.log('🔔 [WEBHOOK] Extracted data:', {
          amount,
          userId,
          stripeCustomerId,
          sessionId: session.id
        })

        // Validate required data
        if (!userId || !amount) {
          console.error('❌ [WEBHOOK] Missing userId or amount in checkout.session.completed:', { 
            userId, 
            amount, 
            sessionId: session.id,
            metadata: session.metadata,
            customer: stripeCustomerId
          })
          break
        }

        // Additional validation: verify the customer belongs to the user
        if (stripeCustomerId) {
          try {
            console.log('🔔 [WEBHOOK] Validating customer ID...')
            const userResult = await db.query(
              'SELECT stripe_customer_id FROM users WHERE id = $1',
              [userId]
            )
            
            if (userResult.rows.length > 0) {
              const userStripeCustomerId = userResult.rows[0].stripe_customer_id
              if (userStripeCustomerId && userStripeCustomerId !== stripeCustomerId) {
                console.error('❌ [WEBHOOK] Customer ID mismatch:', {
                  sessionCustomer: stripeCustomerId,
                  userCustomer: userStripeCustomerId,
                  userId
                })
                break
              }
              console.log('✅ [WEBHOOK] Customer ID validated')
            }
          } catch (error) {
            console.error('❌ [WEBHOOK] Error validating customer:', error)
          }
        }

        console.log('🔔 [WEBHOOK] Processing payment for user:', userId, 'amount:', amount)

        try {
          // Insert payment record using direct database query
          console.log('🔔 [WEBHOOK] Creating payment record...')
          const paymentResult = await db.query(`
            INSERT INTO payments (gateway, gateway_payment_id, amount_cents, status, user_id, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id
          `, [
            'stripe',
            session.id,
            amount,
            'succeeded',
            userId,
            new Date().toISOString(),
            new Date().toISOString()
          ])

          console.log('✅ [WEBHOOK] Payment record created:', paymentResult.rows[0]?.id)

          // Find or create wallet using direct database query
          console.log('🔔 [WEBHOOK] Finding/creating wallet...')
          const existingWallet = await db.query(
            'SELECT id, balance_cents FROM wallets WHERE user_id = $1',
            [userId]
          )

          let walletId
          let newBalance

          if (existingWallet.rows.length > 0) {
            // Update existing wallet balance
            walletId = existingWallet.rows[0].id
            const currentBalance = existingWallet.rows[0].balance_cents || 0
            newBalance = currentBalance + amount

            console.log('🔔 [WEBHOOK] Updating existing wallet:', walletId, 'from', currentBalance, 'to', newBalance)

            await db.query(`
              UPDATE wallets 
              SET balance_cents = $1, updated_at = $2 
              WHERE id = $3
            `, [newBalance, new Date().toISOString(), walletId])

            console.log('✅ [WEBHOOK] Updated wallet balance:', walletId, 'new balance:', newBalance)
          } else {
            // Create new wallet
            console.log('🔔 [WEBHOOK] Creating new wallet for user:', userId)
            const newWalletResult = await db.query(`
              INSERT INTO wallets (user_id, balance_cents, created_at, updated_at)
              VALUES ($1, $2, $3, $4)
              RETURNING id
            `, [
              userId,
              amount,
              new Date().toISOString(),
              new Date().toISOString()
            ])

            walletId = newWalletResult.rows[0].id
            newBalance = amount
            console.log('✅ [WEBHOOK] Created new wallet:', walletId, 'balance:', newBalance)
          }

          // Insert wallet transaction using direct database query
          if (walletId) {
            console.log('🔔 [WEBHOOK] Creating wallet transaction...')
            const transactionResult = await db.query(`
              INSERT INTO wallet_transactions (wallet_id, amount_cents, type, gateway, provider_txn_id, created_at)
              VALUES ($1, $2, $3, $4, $5, $6)
              RETURNING id
            `, [
              walletId,
              amount,
              'top_up',
              'stripe',
              session.payment_intent,
              new Date().toISOString()
            ])

            console.log('✅ [WEBHOOK] Wallet transaction created:', transactionResult.rows[0]?.id)
          }

          console.log(`✅ [WEBHOOK] Successfully processed Stripe payment: ${session.id} for user ${userId}, amount: $${amount / 100}`)

        } catch (error) {
          console.error('❌ [WEBHOOK] Error processing checkout.session.completed:', error)
          // Don't throw here, we want to return 200 to Stripe even if our processing fails
        }
        break

      default:
        console.log(`🔔 [WEBHOOK] Unhandled Stripe event type: ${event.type}`)
    }

    console.log('✅ [WEBHOOK] Webhook processing completed successfully')
    return NextResponse.json({ received: true, eventType: event.type, eventId: event.id })

  } catch (error) {
    console.error('❌ [WEBHOOK] Error processing Stripe webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
