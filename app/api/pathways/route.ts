import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createPathway, getPathwaysByUserId } from "@/lib/db-utils"
import { validateAuthToken } from "@/lib/auth-utils"

export async function GET(request: NextRequest) {
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
    const searchParams = request.nextUrl.searchParams
    const creatorId = searchParams.get("creator_id")

    // Use the authenticated user's ID if no creator_id specified
    const targetUserId = creatorId || userId

    // Get pathways for the user
    const pathways = await getPathwaysByUserId(targetUserId)

    return NextResponse.json(pathways)
  } catch (error) {
    console.error("Error fetching pathways:", error)
    return NextResponse.json(
      { error: "Internal server error" },
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