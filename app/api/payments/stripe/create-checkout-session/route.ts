import { NextResponse } from 'next/server'
import { stripe } from '../../../../../lib/stripeClient'

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

    // TODO: replace with real authenticated user id
    const userId = 'YOUR_TEST_USER_UUID';

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

    return NextResponse.json({ url: session.url, id: session.id }, { status: 200 });
  } catch (err: any) {
    console.error('create-checkout-session error:', err?.message || err);
    return NextResponse.json(
      { error: err?.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}