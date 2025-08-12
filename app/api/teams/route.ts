import { NextResponse } from "next/server"
import { Client } from "pg"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        message: "User ID is required" 
      }, { status: 400 })
    }

    const client = new Client({
      connectionString: process.env.DATABASE_URL
    })

    try {
      await client.connect()

      // Get teams where user is a member
      const memberTeamsResult = await client.query(`
        SELECT 
          tm.role,
          t.id,
          t.name,
          t.description,
          t.created_at,
          t.owner_id
        FROM team_members tm
        JOIN teams t ON tm.team_id = t.id
        WHERE tm.user_id = $1
      `, [userId])

      // Get teams owned by user
      const ownedTeamsResult = await client.query(`
        SELECT * FROM teams WHERE owner_id = $1
      `, [userId])

      // Combine and format teams
      const teams = [
        ...ownedTeamsResult.rows.map(team => ({
          ...team,
          role: "owner"
        })),
        ...memberTeamsResult.rows
      ]

      console.log("✅ [TEAMS] Fetched from PostgreSQL:", teams.length)

      return NextResponse.json({
        success: true,
        teams
      })
    } finally {
      await client.end()
    }

  } catch (error: any) {
    console.error("[TEAMS] Error:", error)
    return NextResponse.json({ 
      success: false, 
      message: error.message 
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, description, ownerId } = body

    if (!name || !ownerId) {
      return NextResponse.json({ 
        success: false, 
        message: "Team name and owner ID are required" 
      }, { status: 400 })
    }

    const client = new Client({
      connectionString: process.env.DATABASE_URL
    })

    try {
      await client.connect()

      const result = await client.query(`
        INSERT INTO teams (name, description, owner_id)
        VALUES ($1, $2, $3)
        RETURNING *
      `, [name, description, ownerId])

      const team = result.rows[0]

      console.log("✅ [TEAMS] Created team in PostgreSQL:", team.id)

      return NextResponse.json({
        success: true,
        team
      })
    } finally {
      await client.end()
    }

  } catch (error: any) {
    console.error("[TEAMS] POST Error:", error)
    return NextResponse.json({ 
      success: false, 
      message: error.message 
    }, { status: 500 })
  }
}