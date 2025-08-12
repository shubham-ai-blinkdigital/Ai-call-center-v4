import { NextResponse } from "next/server"
import { getUserById, getAllUsers, updateUserRecord } from "@/lib/init-replit-database"

export async function GET() {
  try {
    console.log("🔍 [DEBUG/USERS] Fetching all users...")

    const users = await getAllUsers()

    console.log("📊 [DEBUG/USERS] Found users:", users.length)

    return NextResponse.json({
      success: true,
      count: users.length,
      users: users.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        company: user.company,
        phone_number: user.phoneNumber,
        created_at: user.createdAt,
        updated_at: user.updatedAt
      }))
    })

  } catch (error: any) {
    console.error("❌ [DEBUG/USERS] Error:", error)
    return NextResponse.json({ 
      success: false, 
      message: error.message 
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { action, userId, role } = await request.json()

    if (action === 'update_role' && userId && role) {
      console.log(`🔧 [DEBUG/USERS] Updating user ${userId} role to ${role}`)

      const result = await updateUserRecord(userId, { role })

      return NextResponse.json({
        success: true,
        message: `User role updated to ${role}`,
        user: result
      })
    }

    return NextResponse.json({
      success: false,
      message: "Invalid action or missing parameters"
    }, { status: 400 })

  } catch (error: any) {
    console.error("❌ [DEBUG/USERS] Error updating user:", error)
    return NextResponse.json({ 
      success: false, 
      message: error.message 
    }, { status: 500 })
  }
}