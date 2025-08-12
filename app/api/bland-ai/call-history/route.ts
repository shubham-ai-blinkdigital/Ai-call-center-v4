import { NextResponse } from "next/server"
import { getUserFromRequest } from "@/lib/auth-utils"
import { Client } from "pg"

export async function GET() {
  try {
    const user = await getUserFromRequest()
    if (!user.ok) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = new Client({
      connectionString: process.env.DATABASE_URL
    })

    await client.connect()

    // Get call history for user's phone numbers
    const result = await client.query(`
      SELECT ch.*, pn.phone_number 
      FROM call_history ch 
      JOIN phone_numbers pn ON ch.phone_number_id = pn.id 
      WHERE pn.user_id = $1 
      ORDER BY ch.created_at DESC
    `, [user.value.id])

    await client.end()

    return NextResponse.json({ 
      success: true, 
      callHistory: result.rows 
    })
  } catch (error) {
    console.error("Error fetching call history:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}