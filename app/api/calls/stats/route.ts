
import { NextResponse } from "next/server"
import { executeQuery } from "@/lib/db-utils"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const timeframe = searchParams.get('timeframe') || '7d' // 1d, 7d, 30d, all

    let timeCondition = ''
    switch (timeframe) {
      case '1d':
        timeCondition = "AND c.created_at >= NOW() - INTERVAL '1 day'"
        break
      case '7d':
        timeCondition = "AND c.created_at >= NOW() - INTERVAL '7 days'"
        break
      case '30d':
        timeCondition = "AND c.created_at >= NOW() - INTERVAL '30 days'"
        break
      default:
        timeCondition = ''
    }

    const userCondition = userId ? 'AND c.user_id = $1' : ''
    const params = userId ? [userId] : []

    // Get call statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_calls,
        COUNT(CASE WHEN c.status = 'completed' THEN 1 END) as completed_calls,
        COUNT(CASE WHEN c.status = 'failed' THEN 1 END) as failed_calls,
        AVG(c.duration_seconds) as avg_duration,
        SUM(c.duration_seconds) as total_duration,
        SUM(c.cost_cents) as total_cost_cents,
        MIN(c.created_at) as first_call,
        MAX(c.created_at) as last_call
      FROM calls c
      WHERE 1=1 ${timeCondition} ${userCondition}
    `

    const stats = await executeQuery(statsQuery, params)

    // Get calls by status
    const statusQuery = `
      SELECT 
        c.status,
        COUNT(*) as count
      FROM calls c
      WHERE 1=1 ${timeCondition} ${userCondition}
      GROUP BY c.status
      ORDER BY count DESC
    `

    const statusBreakdown = await executeQuery(statusQuery, params)

    // Get calls by phone number
    const phoneQuery = `
      SELECT 
        c.from_number,
        pn.phone_number as phone_detail,
        COUNT(*) as call_count,
        AVG(c.duration_seconds) as avg_duration
      FROM calls c
      LEFT JOIN phone_numbers pn ON c.phone_number_id = pn.id
      WHERE 1=1 ${timeCondition} ${userCondition}
      GROUP BY c.from_number, pn.phone_number
      ORDER BY call_count DESC
      LIMIT 10
    `

    const phoneBreakdown = await executeQuery(phoneQuery, params)

    // Get recent calls
    const recentQuery = `
      SELECT 
        c.*,
        pn.phone_number as phone_detail
      FROM calls c
      LEFT JOIN phone_numbers pn ON c.phone_number_id = pn.id
      WHERE 1=1 ${timeCondition} ${userCondition}
      ORDER BY c.created_at DESC
      LIMIT 10
    `

    const recentCalls = await executeQuery(recentQuery, params)

    return NextResponse.json({
      success: true,
      data: {
        summary: stats[0],
        statusBreakdown,
        phoneBreakdown,
        recentCalls,
        timeframe
      }
    })

  } catch (error) {
    console.error("Error fetching call stats:", error)
    return NextResponse.json({
      success: false,
      message: "Failed to fetch call statistics",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
