
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import * as jwt from "jsonwebtoken"
import { Client } from "pg"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({
        success: false,
        message: "No token provided"
      }, { status: 400 })
    }

    console.log("[VALIDATE-TOKEN] Validating token...")

    // Verify JWT token
    let decoded: any
    try {
      decoded = jwt.verify(token, JWT_SECRET) as any
    } catch (jwtError: any) {
      console.log("[VALIDATE-TOKEN] JWT verification failed:", jwtError.message)
      return NextResponse.json({
        success: false,
        message: "Invalid or expired token"
      }, { status: 401 })
    }

    // Extract user ID from the token
    const userId = decoded.id || decoded.userId

    if (!userId) {
      console.log("[VALIDATE-TOKEN] No user ID found in token")
      return NextResponse.json({
        success: false,
        message: "Invalid token payload"
      }, { status: 401 })
    }

    console.log("[VALIDATE-TOKEN] Token valid for user:", userId)

    // Get user from database
    const client = new Client({
      connectionString: process.env.DATABASE_URL
    })

    try {
      await client.connect()

      const result = await client.query(
        'SELECT * FROM users WHERE id = $1',
        [userId]
      )

      if (result.rows.length === 0) {
        console.log("[VALIDATE-TOKEN] User not found in database:", userId)
        return NextResponse.json({
          success: false,
          message: "User not found"
        }, { status: 404 })
      }

      const user = result.rows[0]
      console.log("[VALIDATE-TOKEN] User found:", user.email)

      // Create a new session token for the user
      const sessionToken = jwt.sign(
        { 
          userId: user.id,
          email: user.email 
        },
        JWT_SECRET,
        { expiresIn: "7d" }
      )

      // Set HTTP-only cookie
      const cookieStore = cookies()
      cookieStore.set("auth-token", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: "/"
      })

      console.log("[VALIDATE-TOKEN] Session cookie set successfully")

      // Update last login timestamp
      await client.query(
        'UPDATE users SET last_login = NOW() WHERE id = $1',
        [user.id]
      )

      return NextResponse.json({
        success: true,
        message: "Authentication successful",
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name || user.firstName || "User",
          lastName: user.last_name || user.lastName || "",
          company: user.company || "",
          role: user.role || "client",
          phoneNumber: user.phone_number || user.phoneNumber || "",
          verified: user.verified || user.is_verified || false,
          platforms: user.platforms || []
        }
      })

    } finally {
      await client.end()
    }

  } catch (error: any) {
    console.error("[VALIDATE-TOKEN] Error:", error)
    return NextResponse.json({
      success: false,
      message: "Internal server error"
    }, { status: 500 })
  }
}
