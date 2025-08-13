import { NextResponse } from "next/server"
import { Client } from "pg"

import * as jwt from "jsonwebtoken"
import { cookies } from "next/headers"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ 
        success: false, 
        message: "Email and password are required" 
      }, { status: 400 })
    }

    console.log("[AUTH/LOGIN] Attempting login for:", email)

    // Verify JWT secret is configured
    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret || jwtSecret === 'your-super-secure-jwt-secret-key-here') {
      console.log("❌ [AUTH] JWT secret not properly configured")
      return NextResponse.json({ error: "JWT secret not properly configured. Please set a secure JWT_SECRET in environment variables." }, { status: 500 })
    }

    // Connect to PostgreSQL
    const client = new Client({
      connectionString: process.env.DATABASE_URL
    })

    let user = null
    try {
      await client.connect()

      // Query user from PostgreSQL
      const result = await client.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      )

      if (result.rows.length === 0) {
        console.log("[AUTH/LOGIN] User not found:", email)
        return NextResponse.json({ 
          success: false, 
          message: "Invalid email or password" 
        }, { status: 401 })
      }

      user = result.rows[0]
      console.log("[AUTH/LOGIN] User found in PostgreSQL:", user.email)

    } finally {
      await client.end()
    }

    // Validate user object structure
    if (!user.email || !user.password_hash) {
      console.log("[AUTH/LOGIN] Invalid user object structure for:", email)
      return NextResponse.json({ 
        success: false, 
        message: "Account not properly configured. Please contact support." 
      }, { status: 401 })
    }

    // Verify password (plain text comparison)
    const isValidPassword = password === user.password_hash
    if (!isValidPassword) {
      console.log("[AUTH/LOGIN] Invalid password for:", email)
      return NextResponse.json({ 
        success: false, 
        message: "Invalid email or password" 
      }, { status: 401 })
    }

    console.log("[AUTH/LOGIN] Login successful for:", email)

    // Update last login in PostgreSQL
    const updateClient = new Client({
      connectionString: process.env.DATABASE_URL
    })

    try {
      await updateClient.connect()
      await updateClient.query(
        'UPDATE users SET last_login = NOW(), updated_at = NOW() WHERE email = $1',
        [email]
      )

      // Get updated user data
      const updatedResult = await updateClient.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      )
      user = updatedResult.rows[0]

    } finally {
      await updateClient.end()
    }

    // Create JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
      },
      JWT_SECRET
    )

    // Set HTTP-only cookie
    const cookieStore = await cookies()
    cookieStore.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 // 7 days
    })

    // Return user data (without password)
    return NextResponse.json({
      success: true,
      user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          company: user.company,
          phoneNumber: user.phone_number,
          role: user.role
        }
    })

  } catch (error: any) {
    console.error("[AUTH/LOGIN] Error:", error)
    return NextResponse.json({ 
      success: false, 
      message: "Internal server error" 
    }, { status: 500 })
  }
}