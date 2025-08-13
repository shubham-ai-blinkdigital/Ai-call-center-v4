
import { NextResponse } from "next/server"
import { Client } from "pg"
import * as jwt from "jsonwebtoken"
import { cookies } from "next/headers"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function POST(request: Request) {
  try {
    const { email, password, name, company, phoneNumber } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json({ 
        success: false, 
        message: "Email, password, and name are required" 
      }, { status: 400 })
    }

    console.log("[AUTH/SIGNUP] Attempting external signup for:", email)

    // Split name into firstName and lastName
    const nameParts = name.trim().split(' ')
    const firstName = nameParts[0] || name
    const lastName = nameParts.slice(1).join(' ') || ''

    // Call external API for signup
    const externalApiUrl = process.env.FOREX_URL || process.env.EXTERNAL_API_URL
    if (!externalApiUrl) {
      console.error("[AUTH/SIGNUP] External API URL not configured")
      return NextResponse.json({
        success: false,
        message: "External API configuration missing"
      }, { status: 500 })
    }

    const externalSignupData = {
      firstName,
      lastName,
      email,
      password,
      phoneNumber: phoneNumber || '',
      platform: "AI Call"
    }

    console.log("[AUTH/SIGNUP] Calling external API:", `${externalApiUrl}api/accounts/signup`)
    
    const externalResponse = await fetch(`${externalApiUrl}api/accounts/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(externalSignupData)
    })

    const externalResult = await externalResponse.json()

    if (!externalResponse.ok) {
      console.error("[AUTH/SIGNUP] External API error:", externalResult)
      return NextResponse.json({
        success: false,
        message: externalResult.message || "External signup failed"
      }, { status: externalResponse.status })
    }

    console.log("[AUTH/SIGNUP] External signup successful:", externalResult)

    // Store user data locally with unverified status
    const client = new Client({
      connectionString: process.env.DATABASE_URL
    })

    try {
      await client.connect()

      // Check if user already exists in local database
      const existingUser = await client.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      )

      if (existingUser.rows.length > 0) {
        console.log("[AUTH/SIGNUP] User already exists locally:", email)
        return NextResponse.json({
          success: false,
          message: "User already exists"
        }, { status: 400 })
      }

      // Create local user record with external reference
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const insertResult = await client.query(
        `INSERT INTO users (id, email, name, company, phone_number, role, created_at, updated_at, external_id, external_token, is_verified, platform)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW(), $7, $8, $9, $10)
         RETURNING *`,
        [
          userId,
          email,
          name,
          company || '',
          phoneNumber || '',
          'user',
          externalResult._id || externalResult.id,
          externalResult.token,
          false, // Not verified until email verification
          'AI Call'
        ]
      )

      const localUser = insertResult.rows[0]
      console.log("[AUTH/SIGNUP] Local user record created:", localUser.id)

      // Return success with verification required message
      return NextResponse.json({
        success: true,
        message: "Account created successfully. Please check your email for verification.",
        user: {
          id: localUser.id,
          email: localUser.email,
          name: localUser.name,
          company: localUser.company,
          phoneNumber: localUser.phone_number,
          isVerified: false,
          requiresVerification: true
        }
      })

    } finally {
      await client.end()
    }

  } catch (error: any) {
    console.error("[AUTH/SIGNUP] Error:", error)
    
    // Handle specific external API errors
    if (error.message?.includes('fetch')) {
      return NextResponse.json({
        success: false,
        message: "Unable to connect to signup service. Please try again later."
      }, { status: 503 })
    }

    return NextResponse.json({ 
      success: false, 
      message: "Internal server error" 
    }, { status: 500 })
  }
}
