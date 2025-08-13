import { NextResponse, NextRequest } from "next/server"
import { db } from "@/lib/replit-db-server"
import * as jwt from "jsonwebtoken"
import { cookies } from "next/headers"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

// Placeholder for getUserFromRequest - replace with actual implementation
async function getUserFromRequest(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      return null
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any
    const user = await db.get(`user:${decoded.email}`)

    if (!user) {
      return null
    }

    // Ensure we return the UUID from database, not the test ID
    const userData = {
      id: user.id, // This should be the UUID from database
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      company: user.company,
      role: user.role,
      phone_number: user.phone_number, // Assuming phone_number is the correct key in db
      password_hash: user.passwordHash, // Assuming passwordHash is the correct key in db
      created_at: user.createdAt, // Assuming createdAt is the correct key in db
      updatedAt: user.updatedAt, // Assuming updatedAt is the correct key in db
      last_login: user.lastLogin // Assuming lastLogin is the correct key in db
    }
    return userData
  } catch (error) {
    console.error("[getUserFromRequest] Error:", error)
    return null
  }
}

export async function GET(req: NextRequest) {
  try {
    console.log("🔍 [AUTH-ME] Processing auth check...")

    const user = await getUserFromRequest(req)
    if (!user) {
      console.log("❌ [AUTH-ME] No user found")
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    console.log("🔍 [AUTH-ME] Found user:", { id: user.id, email: user.email })

    // Ensure we return consistent user data structure
    const userData = {
      id: user.id,
      email: user.email,
      firstName: user.firstName || 'User',
      lastName: user.lastName || '',
      company: user.company || '',
      role: user.role || 'user',
      phoneNumber: user.phoneNumber || user.phone_number || '',
      createdAt: user.createdAt || user.created_at,
      updatedAt: user.updatedAt || user.updated_at,
      lastLogin: user.lastLogin || user.last_login
    }

    return NextResponse.json({ 
      user: { 
        ok: true, 
        value: userData 
      } 
    })
  } catch (error) {
    console.error("Error in /api/auth/me:", error)
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 })
  }
}