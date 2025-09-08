
import { NextRequest, NextResponse } from "next/server"
import { CallCostService } from "@/services/call-cost-service"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    console.log("🔔 [BLAND-WEBHOOK] ==================== BLAND WEBHOOK CALLED ====================")
    console.log("🔔 [BLAND-WEBHOOK] Timestamp:", new Date().toISOString())
    
    const body = await request.json()
    console.log("🔔 [BLAND-WEBHOOK] Received webhook:", JSON.stringify(body, null, 2))
    
    // Extract call data from Bland.ai webhook
    const { 
      call_id, 
      c_id, 
      id,
      status,
      call_length,
      duration,
      corrected_duration,
      completed,
      user_id,
      to_number,
      from_number,
      phone_number
    } = body
    
    // Determine the actual call ID (Bland.ai uses different field names)
    const actualCallId = call_id || c_id || id
    
    if (!actualCallId) {
      console.log("⚠️ [BLAND-WEBHOOK] No call ID found in webhook")
      return NextResponse.json({ error: "No call ID provided" }, { status: 400 })
    }
    
    // Check if call is completed
    const isCompleted = completed || status === 'completed' || status === 'ended'
    
    if (!isCompleted) {
      console.log(`⚠️ [BLAND-WEBHOOK] Call ${actualCallId} not completed yet, status: ${status}`)
      return NextResponse.json({ message: "Call not completed yet" })
    }
    
    // Get call duration (Bland.ai uses different field names)
    const durationSeconds = corrected_duration || call_length || duration || 0
    
    if (durationSeconds <= 0) {
      console.log(`⚠️ [BLAND-WEBHOOK] Call ${actualCallId} has no duration, skipping cost calculation`)
      return NextResponse.json({ message: "No duration to bill" })
    }
    
    // Try to extract user ID from webhook or lookup from phone number
    let actualUserId = user_id
    
    if (!actualUserId) {
      // Look up user by phone number
      const phoneToCheck = to_number || from_number || phone_number
      if (phoneToCheck) {
        console.log(`🔍 [BLAND-WEBHOOK] Looking up user by phone: ${phoneToCheck}`)
        
        const { Client } = await import('pg')
        const client = new Client({
          connectionString: process.env.DATABASE_URL
        })
        
        try {
          await client.connect()
          const result = await client.query(
            'SELECT user_id FROM phone_numbers WHERE phone_number = $1 LIMIT 1',
            [phoneToCheck]
          )
          
          if (result.rows.length > 0) {
            actualUserId = result.rows[0].user_id
            console.log(`✅ [BLAND-WEBHOOK] Found user ${actualUserId} for phone ${phoneToCheck}`)
          }
        } finally {
          await client.end()
        }
      }
    }
    
    if (!actualUserId) {
      console.log(`❌ [BLAND-WEBHOOK] Could not determine user for call ${actualCallId}`)
      return NextResponse.json({ error: "Could not determine user for call" }, { status: 400 })
    }
    
    // Process the call cost
    console.log(`💰 [BLAND-WEBHOOK] Processing call cost for:`)
    console.log(`   - Call ID: ${actualCallId}`)
    console.log(`   - User ID: ${actualUserId}`)
    console.log(`   - Duration: ${durationSeconds} seconds`)
    
    const result = await CallCostService.processCallCost({
      callId: actualCallId,
      userId: actualUserId,
      durationSeconds: parseInt(durationSeconds.toString())
    })
    
    if (result.success) {
      console.log(`✅ [BLAND-WEBHOOK] ${result.message}`)
      return NextResponse.json({ 
        success: true, 
        message: result.message,
        callId: actualCallId,
        costCents: result.costCents 
      })
    } else {
      console.log(`❌ [BLAND-WEBHOOK] ${result.message}`)
      return NextResponse.json({ 
        success: false, 
        message: result.message 
      }, { status: 400 })
    }
    
  } catch (error: any) {
    console.error("❌ [BLAND-WEBHOOK] Error processing webhook:", error)
    return NextResponse.json({ 
      error: "Internal server error", 
      message: error.message 
    }, { status: 500 })
  }
}
