
import { NextResponse } from 'next/server'

export async function GET() {
  const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY

  if (!publishableKey) {
    return NextResponse.json(
      { error: 'Stripe publishable key not configured' },
      { status: 500 }
    )
  }

  return NextResponse.json({ publishableKey })
}
