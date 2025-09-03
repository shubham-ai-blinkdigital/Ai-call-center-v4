import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripeClient'
import { getCurrentUser } from '@/lib/auth-utils'

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const amount = Number(body?.amount);

    if (!amount || isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const amountCents = Math.round(amount * 100);
    const origin = new URL(req.url).origin; // robust on Replit

    // Get authenticated user
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = user.id

    console.log('Creating Stripe session with:', {
      amount: amountCents,
      origin,
      userId
    });

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: 'Wallet Top-up' },
          unit_amount: amountCents
        },
        quantity: 1
      }],
      success_url: `${origin}/billing?success=1`,
      cancel_url:  `${origin}/billing?canceled=1`,
      metadata: { user_id: userId }
    });

    console.log('Stripe session created:', {
      id: session.id,
      url: session.url,
      mode: session.mode,
      status: session.status
    });

    if (!session.url) {
      console.error('No URL returned from Stripe session');
      return NextResponse.json({ error: 'No checkout URL generated' }, { status: 500 });
    }

    return NextResponse.json({ url: session.url, id: session.id }, { status: 200 });
  } catch (err: any) {
    console.error('create-checkout-session error:', err?.message || err);
    return NextResponse.json(
      { error: err?.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}