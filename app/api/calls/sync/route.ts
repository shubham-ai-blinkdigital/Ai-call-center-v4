
import { NextResponse } from "next/server"
import { getUserFromRequest } from "@/lib/auth-utils"
import { CallDatabaseService } from "@/services/call-database-service"

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest()
    if (!user.ok) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { calls: blandApiCalls } = await request.json()

    if (!Array.isArray(blandApiCalls)) {
      return NextResponse.json({ 
        error: "Invalid data format. Expected array of calls." 
      }, { status: 400 })
    }

    // Sync calls to database
    const syncCount = await CallDatabaseService.syncCallsForUser(
      user.value.id, 
      blandApiCalls
    )

    return NextResponse.json({
      success: true,
      syncedCalls: syncCount,
      message: `Successfully synced ${syncCount} calls`
    })

  } catch (error) {
    console.error("Error syncing calls:", error)
    return NextResponse.json({ 
      error: "Failed to sync calls",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

// GET endpoint to trigger a sync from Bland.ai API
export async function GET() {
  try {
    const user = await getUserFromRequest()
    if (!user.ok) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's phone numbers
    const phoneNumbersQuery = `
      SELECT phone_number FROM phone_numbers 
      WHERE user_id = $1 AND status = 'active'
    `
    
    const { db } = await import("@/lib/db")
    const phoneResult = await db.query(phoneNumbersQuery, [user.value.id])
    const phoneNumbers = phoneResult.rows.map(row => row.phone_number)

    if (phoneNumbers.length === 0) {
      return NextResponse.json({
        success: true,
        syncedCalls: 0,
        message: "No phone numbers found for user"
      })
    }

    // Fetch calls from Bland.ai API for each phone number
    const allCalls = []
    
    for (const phoneNumber of phoneNumbers) {
      try {
        const response = await fetch(`https://api.bland.ai/v1/calls`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.BLAND_API_KEY}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const data = await response.json()
          if (data.calls && Array.isArray(data.calls)) {
            // Filter calls for this phone number
            const phoneCalls = data.calls.filter(call => 
              call.to === phoneNumber || call.from === phoneNumber ||
              call.to_number === phoneNumber || call.from_number === phoneNumber
            )
            allCalls.push(...phoneCalls)
          }
        }
      } catch (error) {
        console.error(`Error fetching calls for ${phoneNumber}:`, error)
      }
    }

    // Remove duplicates based on call ID
    const uniqueCalls = allCalls.filter((call, index, self) => 
      index === self.findIndex(c => (c.c_id || c.id) === (call.c_id || call.id))
    )

    // Sync to database
    const syncCount = await CallDatabaseService.syncCallsForUser(
      user.value.id, 
      uniqueCalls
    )

    return NextResponse.json({
      success: true,
      syncedCalls: syncCount,
      totalFetched: uniqueCalls.length,
      message: `Successfully synced ${syncCount} calls from ${phoneNumbers.length} phone numbers`
    })

  } catch (error) {
    console.error("Error during call sync:", error)
    return NextResponse.json({ 
      error: "Failed to sync calls from Bland.ai",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
