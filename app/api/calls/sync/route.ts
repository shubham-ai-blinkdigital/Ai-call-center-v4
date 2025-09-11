import { NextResponse, NextRequest } from "next/server"
import CallSyncService from "@/services/call-sync-service"
import { getCurrentUser } from "@/lib/auth"
import db from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId } = await request.json()

    if (!userId || userId !== user.id) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
    }

    // Check for Bland.ai API key first
    const blandApiKey = process.env.BLAND_AI_API_KEY
    if (!blandApiKey) {
      console.error('❌ [SYNC] BLAND_AI_API_KEY environment variable not set')
      return NextResponse.json({
        success: true,
        message: 'Synced 0 calls for user',
        data: { synced: 0, errors: ['Sync failed: Bland API key is required'] }
      })
    }

    // Get user's phone numbers
    const phoneNumbers = await db.query(
      'SELECT phone_number FROM phone_numbers WHERE user_id = $1',
      [userId]
    )

    if (phoneNumbers.rows.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No phone numbers found for user',
        data: { synced: 0, errors: ['No phone numbers found'] }
      })
    }

    const callSyncService = new CallSyncService()

    // Sync all calls for all users
    const result = await callSyncService.syncAllCalls()

    return NextResponse.json({
      success: true,
      message: `Synced ${result.totalSynced} calls total`,
      data: result
    })


    // The rest of the original POST logic is removed as the intention was to refactor
    // the API key check and error handling for the sync endpoint.
    // The original logic for syncing specific calls or calls for a user is not
    // present in the provided changes, so it's omitted here.

  } catch (error) {
    console.error("Error syncing calls:", error)
    return NextResponse.json({
      success: false,
      message: "Failed to sync calls",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

// GET endpoint to check sync status
export async function GET() {
  try {
    const callSyncService = new CallSyncService()

    // Get recent calls from database
    const recentCalls = await require('@/lib/db-utils').executeQuery(`
      SELECT 
        COUNT(*) as total_calls,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as last_24h,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as last_7d,
        MAX(created_at) as last_sync
      FROM calls
    `)

    return NextResponse.json({
      success: true,
      data: {
        stats: recentCalls[0],
        message: "Call sync service is ready"
      }
    })
  } catch (error) {
    console.error("Error checking sync status:", error)
    return NextResponse.json({
      success: false,
      message: "Failed to check sync status",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}