
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    message: 'Test webhook endpoint is working',
    timestamp: new Date().toISOString(),
    method: 'GET'
  })
}

export async function POST(req: Request) {
  console.log('🧪 [TEST-WEBHOOK] Test webhook called!')
  console.log('🧪 [TEST-WEBHOOK] Headers:', Object.fromEntries(req.headers.entries()))
  
  try {
    const body = await req.text()
    console.log('🧪 [TEST-WEBHOOK] Body:', body)
    
    return NextResponse.json({
      message: 'Test webhook received successfully',
      timestamp: new Date().toISOString(),
      method: 'POST',
      bodyLength: body.length
    })
  } catch (error) {
    console.error('🧪 [TEST-WEBHOOK] Error:', error)
    return NextResponse.json(
      { error: 'Test webhook failed' },
      { status: 500 }
    )
  }
}
