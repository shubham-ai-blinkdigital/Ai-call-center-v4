
import { NextRequest, NextResponse } from "next/server"
import { getUserFromRequest } from "@/lib/auth-utils"
import { executeQuery } from "@/lib/db-utils"

export async function POST(request: NextRequest) {
  try {
    console.log("[SAVE-FLOWCHART] API called")

    // Get user from request
    const user = await getUserFromRequest()
    if (!user?.id) {
      console.log("[SAVE-FLOWCHART] No user found")
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const userId = user.id
    console.log("[SAVE-FLOWCHART] User ID:", userId)

    // Parse request body
    const body = await request.json()
    const { phoneNumber, name, description, flowchartData } = body

    console.log("[SAVE-FLOWCHART] Request data:", { phoneNumber, name, description, hasFlowchartData: !!flowchartData })

    if (!phoneNumber) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 })
    }

    if (!name) {
      return NextResponse.json({ error: "Pathway name is required" }, { status: 400 })
    }

    if (!flowchartData) {
      return NextResponse.json({ error: "Flowchart data is required" }, { status: 400 })
    }

    // Format phone number consistently (remove any formatting, ensure +1 prefix)
    let formattedPhone = phoneNumber.replace(/\D/g, '') // Remove all non-digits
    if (!formattedPhone.startsWith('1') && formattedPhone.length === 10) {
      formattedPhone = '1' + formattedPhone
    }
    formattedPhone = '+' + formattedPhone

    console.log("[SAVE-FLOWCHART] Formatted phone:", formattedPhone)

    // Check if phone number exists and is owned by user
    const phoneNumberRecord = await executeQuery(`
      SELECT id, phone_number, pathway_id FROM phone_numbers 
      WHERE phone_number = $1 AND user_id = $2
    `, [formattedPhone, userId])

    console.log("[SAVE-FLOWCHART] Phone number query result:", phoneNumberRecord)

    if (phoneNumberRecord.length === 0) {
      console.log("[SAVE-FLOWCHART] Phone number not found for user, creating it")
      
      // Create the phone number record for this user
      const createPhoneResult = await executeQuery(`
        INSERT INTO phone_numbers (phone_number, user_id, created_at, updated_at)
        VALUES ($1, $2, NOW(), NOW())
        RETURNING id, phone_number, pathway_id
      `, [formattedPhone, userId])

      if (createPhoneResult.length === 0) {
        return NextResponse.json({ 
          error: "Failed to create phone number record" 
        }, { status: 500 })
      }

      phoneRecord = createPhoneResult[0]
      console.log("[SAVE-FLOWCHART] Created phone record:", phoneRecord)
    } else {
      phoneRecord = phoneNumberRecord[0]
    }

    let phoneRecord

    // Check if a pathway already exists for this phone number
    let existingPathway = []
    
    // First, check if there's a pathway_id in the phone_numbers table
    if (phoneRecord.pathway_id) {
      existingPathway = await executeQuery(`
        SELECT id FROM pathways 
        WHERE id = $1 AND creator_id = $2
      `, [phoneRecord.pathway_id, userId])
    }

    // If no pathway found via phone_numbers.pathway_id, check via pathways.phone_number_id
    if (existingPathway.length === 0) {
      existingPathway = await executeQuery(`
        SELECT id FROM pathways 
        WHERE phone_number_id = $1 AND creator_id = $2
      `, [phoneRecord.id, userId])
    }

    console.log("[SAVE-FLOWCHART] Existing pathway:", existingPathway)

    let result

    if (existingPathway.length > 0) {
      // Update existing pathway
      console.log("[SAVE-FLOWCHART] Updating existing pathway:", existingPathway[0].id)
      
      result = await executeQuery(`
        UPDATE pathways 
        SET name = $1, description = $2, data = $3, updated_at = NOW()
        WHERE id = $4 AND creator_id = $5
        RETURNING *
      `, [name, description, JSON.stringify(flowchartData), existingPathway[0].id, userId])

      // Ensure phone_numbers.pathway_id is set
      await executeQuery(`
        UPDATE phone_numbers 
        SET pathway_id = $1 
        WHERE id = $2 AND user_id = $3
      `, [existingPathway[0].id, phoneRecord.id, userId])

    } else {
      // Create new pathway
      console.log("[SAVE-FLOWCHART] Creating new pathway")
      
      result = await executeQuery(`
        INSERT INTO pathways (name, description, creator_id, phone_number_id, data, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        RETURNING *
      `, [name, description, userId, phoneRecord.id, JSON.stringify(flowchartData)])

      // Update phone_numbers.pathway_id to maintain backward compatibility
      if (result.length > 0) {
        await executeQuery(`
          UPDATE phone_numbers 
          SET pathway_id = $1 
          WHERE id = $2 AND user_id = $3
        `, [result[0].id, phoneRecord.id, userId])
      }
    }

    console.log("[SAVE-FLOWCHART] Final result:", result)

    if (result.length === 0) {
      return NextResponse.json({ error: "Failed to save pathway" }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      pathway: result[0],
      action: existingPathway.length > 0 ? 'updated' : 'created'
    })

  } catch (error) {
    console.error("[SAVE-FLOWCHART] Error:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
