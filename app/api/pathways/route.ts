import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createPathway, getPathwaysByUserId } from "@/lib/db-utils"
import { validateAuthToken } from "@/lib/auth-utils"
import { Client } from "pg"
import { getUserFromRequest } from "@/lib/auth-utils"

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 [PATHWAYS-API] Processing request...')

    const user = await getUserFromRequest(request)
    if (!user) {
      console.log('❌ [PATHWAYS-API] No authenticated user')
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log('✅ [PATHWAYS-API] Authenticated user:', user.id, user.email)

    const client = new Client({
      connectionString: process.env.DATABASE_URL
    })

    try {
      await client.connect()

      // Get pathways for this user - include team pathways and personal pathways
      const result = await client.query(`
        SELECT DISTINCT p.*, pn.phone_number, pn.id as phone_number_id
        FROM pathways p
        LEFT JOIN phone_numbers pn ON pn.pathway_id = p.id
        WHERE p.creator_id = $1 
           OR p.team_id IN (
             SELECT team_id FROM team_members WHERE user_id = $1
           )
           OR p.team_id IN (
             SELECT id FROM teams WHERE owner_id = $1
           )
        ORDER BY p.updated_at DESC
      `, [user.id])

      console.log('✅ [PATHWAYS-API] Found pathways:', result.rows.length)

      return NextResponse.json({
        success: true,
        pathways: result.rows
      })

    } catch (dbError: any) {
      console.error("❌ [PATHWAYS-API] Database error:", dbError)

      // If there's a UUID error, it means we have a user ID mismatch
      if (dbError.message?.includes('invalid input syntax for type uuid')) {
        console.log('🔧 [PATHWAYS-API] UUID error detected, user ID format issue')
        return NextResponse.json({
          success: false,
          error: "User authentication issue - please log in again",
          code: "AUTH_ID_FORMAT_ERROR"
        }, { status: 401 })
      }

      throw dbError
    } finally {
      await client.end()
    }

  } catch (error: any) {
    console.error("❌ [PATHWAYS-API] Error:", error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get auth token from cookies
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify the token
    const authResult = await validateAuthToken(token)
    if (!authResult.isValid || !authResult.user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const userId = authResult.user.id
    const body = await request.json()

    // Create new pathway
    const { data: pathway, error: pathwayError } = await createPathway({
      ...body,
      creator_id: authResult.user.id,
    })

    return NextResponse.json(pathway)
  } catch (error) {
    console.error("Error creating pathway:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}