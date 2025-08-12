import { NextResponse } from "next/server"
import { db } from "@/lib/replit-db-server"
import * as jwt from "jsonwebtoken"
import { cookies } from "next/headers"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function GET() {
  try {
    // Get token from cookies
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ 
        user: null, 
        error: "No token found" 
      }, { status: 401 })
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as any

    // Get user from database
    const user = await db.get(`user:${decoded.email}`)

    console.log(`🔍 [AUTH/ME] Database lookup for user ${decoded.email}:`, {
      found: !!user,
      userType: typeof user,
      userKeys: user ? Object.keys(user) : 'no user'
    })

    if (!user) {
      console.log(`❌ [AUTH/ME] User not found: ${decoded.email}`)
      return NextResponse.json({ 
        error: 'User not found',
        userId: decoded.email,
        debug: 'User lookup failed in database'
      }, { status: 404 })
    }

    // Remove sensitive data
    const { passwordHash: _, ...safeUser } = user

    console.log(`✅ [AUTH/ME] User retrieved: ${user.email}`, {
      id: safeUser.id,
      email: safeUser.email,
      role: safeUser.role,
      keys: Object.keys(safeUser)
    })
    return NextResponse.json({ user: safeUser })

  } catch (error: any) {
    console.error("[AUTH/ME] Error:", error)
    return NextResponse.json({ 
      user: null, 
      error: "Invalid token" 
    }, { status: 401 })
  }
}