
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import * as jwt from "jsonwebtoken"
import { Client } from "pg"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"
const EXTERNAL_API_URL = process.env.FOREX_URL || process.env.EXTERNAL_API_URL

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({
        success: false,
        message: "No token provided"
      }, { status: 400 })
    }

    console.log("[VALIDATE-TOKEN] Validating external token...")

    if (!EXTERNAL_API_URL) {
      console.error("[VALIDATE-TOKEN] External API URL not configured")
      return NextResponse.json({
        success: false,
        message: "External API not configured"
      }, { status: 500 })
    }

    // Validate token with external API - try multiple endpoints
    let externalUserData: any
    try {
      // Try different possible endpoints for user profile
      const endpoints = [
        `${EXTERNAL_API_URL}/api/accounts/profile`,
        `${EXTERNAL_API_URL}/api/accounts/me`,
        `${EXTERNAL_API_URL}/api/user/profile`,
        `${EXTERNAL_API_URL}/api/user/me`
      ]

      let response: Response | null = null
      let lastError: string = ""

      for (const endpoint of endpoints) {
        try {
          console.log(`[VALIDATE-TOKEN] Trying endpoint: ${endpoint}`)
          response = await fetch(endpoint, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })

          if (response.ok) {
            console.log(`[VALIDATE-TOKEN] Success with endpoint: ${endpoint}`)
            break
          } else {
            lastError = `${endpoint}: ${response.status}`
            console.log(`[VALIDATE-TOKEN] Failed with ${endpoint}: ${response.status}`)
            response = null
          }
        } catch (endpointError: any) {
          lastError = `${endpoint}: ${endpointError.message}`
          console.log(`[VALIDATE-TOKEN] Error with ${endpoint}:`, endpointError.message)
          continue
        }
      }

      if (!response || !response.ok) {
        console.log("[VALIDATE-TOKEN] All external API endpoints failed. Last error:", lastError)
        return NextResponse.json({
          success: false,
          message: "Invalid or expired token"
        }, { status: 401 })
      }

      externalUserData = await response.json()
      console.log("[VALIDATE-TOKEN] External API validation successful for user:", externalUserData.email)

    } catch (externalError: any) {
      console.error("[VALIDATE-TOKEN] External API error:", externalError.message)
      return NextResponse.json({
        success: false,
        message: "Failed to validate token with external service"
      }, { status: 500 })
    }

    // Extract user information from external API response
    const userEmail = externalUserData.email
    const externalId = externalUserData.id || externalUserData._id

    if (!userEmail) {
      console.log("[VALIDATE-TOKEN] No email found in external user data")
      return NextResponse.json({
        success: false,
        message: "Invalid user data from external service"
      }, { status: 401 })
    }

    // Get or sync user in local database
    const client = new Client({
      connectionString: process.env.DATABASE_URL
    })

    let user: any
    try {
      await client.connect()

      // Try to find user by email first
      let result = await client.query(
        'SELECT * FROM users WHERE email = $1',
        [userEmail]
      )

      if (result.rows.length === 0) {
        // User doesn't exist, create new user
        console.log("[VALIDATE-TOKEN] Creating new user:", userEmail)
        
        result = await client.query(
          `INSERT INTO users (
            email, 
            first_name, 
            last_name, 
            company, 
            phone_number, 
            role, 
            external_id, 
            external_token,
            is_verified,
            platform,
            created_at,
            updated_at,
            last_login
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW(), NOW()) 
          RETURNING *`,
          [
            userEmail,
            externalUserData.firstName || externalUserData.first_name || 'User',
            externalUserData.lastName || externalUserData.last_name || '',
            externalUserData.company || '',
            externalUserData.phoneNumber || externalUserData.phone_number || '',
            externalUserData.role || 'client',
            externalId,
            token,
            externalUserData.verified || false,
            externalUserData.platform || 'AI Call'
          ]
        )
      } else {
        // User exists, update their information and token
        console.log("[VALIDATE-TOKEN] Updating existing user:", userEmail)
        
        result = await client.query(
          `UPDATE users SET 
            first_name = $2,
            last_name = $3,
            company = $4,
            phone_number = $5,
            role = $6,
            external_id = $7,
            external_token = $8,
            is_verified = $9,
            updated_at = NOW(),
            last_login = NOW()
          WHERE email = $1 
          RETURNING *`,
          [
            userEmail,
            externalUserData.firstName || externalUserData.first_name || 'User',
            externalUserData.lastName || externalUserData.last_name || '',
            externalUserData.company || '',
            externalUserData.phoneNumber || externalUserData.phone_number || '',
            externalUserData.role || 'client',
            externalId,
            token,
            externalUserData.verified || false
          ]
        )
      }

      user = result.rows[0]
      console.log("[VALIDATE-TOKEN] User synced:", user.email)

    } finally {
      await client.end()
    }

    // Create a new local session token for the user
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

    console.log("[VALIDATE-TOKEN] Local session cookie set successfully")

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

  } catch (error: any) {
    console.error("[VALIDATE-TOKEN] Error:", error)
    return NextResponse.json({
      success: false,
      message: "Internal server error"
    }, { status: 500 })
  }
}
