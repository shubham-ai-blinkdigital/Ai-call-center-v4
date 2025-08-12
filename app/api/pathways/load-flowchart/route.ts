
import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { validateAuthToken } from "@/lib/auth-utils"
import { getPathwayByPhoneNumber } from "@/lib/db-utils"

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
    const phoneNumber = searchParams.get("phoneNumber")

    if (!phoneNumber) {
      return NextResponse.json({ 
        error: "Phone number is required" 
      }, { status: 400 })
    }

    // Format phone number (ensure it starts with +)
    const formattedPhoneNumber = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`

    // Get pathway for this phone number and user
    const pathways = await getPathwayByPhoneNumber(formattedPhoneNumber, userId)

    if (pathways.length === 0) {
      return NextResponse.json({ 
        success: true, 
        pathway: null,
        message: "No pathway found for this phone number"
      })
    }

    const pathway = pathways[0]
    
    return NextResponse.json({ 
      success: true, 
      pathway: {
        id: pathway.id,
        name: pathway.name,
        description: pathway.description,
        phone_number: pathway.phone_number,
        flowchart_data: pathway.flowchart_data,
        created_at: pathway.created_at,
        updated_at: pathway.updated_at
      }
    })

  } catch (error) {
    console.error("Error loading pathway:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
