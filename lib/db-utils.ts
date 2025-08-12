import { Client } from "pg"

export async function connectToDatabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  })

  await client.connect()
  return client
}

export async function executeQuery(query: string, params: any[] = []) {
  const client = await connectToDatabase()

  try {
    const result = await client.query(query, params)
    return result.rows
  } finally {
    await client.end()
  }
}

export async function getUserById(id: string) {
  return executeQuery(
    "SELECT id, email, name, company, role, phone_number, created_at, updated_at FROM users WHERE id = $1",
    [id]
  )
}

export async function getUserByEmail(email: string) {
  return executeQuery(
    "SELECT * FROM users WHERE email = $1",
    [email]
  )
}

export async function createUser(userData: {
  email: string
  name: string
  company?: string
  role?: string
  phone_number?: string
  passwordHash: string
}) {
  return executeQuery(`
    INSERT INTO users (email, name, company, role, phone_number, password_hash, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
    RETURNING id, email, name, company, role, phone_number, created_at, updated_at
  `, [
    userData.email,
    userData.name,
    userData.company || null,
    userData.role || 'user',
    userData.phone_number || null,
    userData.passwordHash
  ])
}

export async function updateUser(id: string, userData: Partial<{
  name: string
  company: string
  role: string
  phone_number: string
  last_login: Date
}>) {
  const updates = Object.keys(userData).map((key, index) => `${key} = $${index + 2}`).join(', ')
  const values = Object.values(userData)

  return executeQuery(`
    UPDATE users 
    SET ${updates}, updated_at = NOW()
    WHERE id = $1
    RETURNING id, email, name, company, role, phone_number, created_at, updated_at
  `, [id, ...values])
}

export async function getPathwaysByUserId(userId: string) {
  return executeQuery(
    "SELECT * FROM pathways WHERE creator_id = $1 ORDER BY created_at DESC",
    [userId]
  )
}

export async function createPathway(pathwayData: {
  name: string
  description?: string
  creator_id: string
  phone_number?: string
  bland_id?: string
  team_id?: string
}) {
  try {
    const result = await executeQuery(`
      INSERT INTO pathways (name, description, creator_id, phone_number, bland_id, team_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING *
    `, [
      pathwayData.name,
      pathwayData.description || null,
      pathwayData.creator_id,
      pathwayData.phone_number || null,
      pathwayData.bland_id || null,
      pathwayData.team_id || null
    ])

    return { data: result[0], error: null }
  } catch (error) {
    console.error("Error creating pathway:", error)
    return { data: null, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function getPathwayById(id: string) {
  return executeQuery(
    "SELECT * FROM pathways WHERE id = $1",
    [id]
  )
}

export async function updatePathway(id: string, pathwayData: Partial<{
  name: string
  description: string
  phone_number: string
  bland_id: string
  team_id: string
}>) {
  const updates = Object.keys(pathwayData).map((key, index) => `${key} = $${index + 2}`).join(', ')
  const values = Object.values(pathwayData)

  return executeQuery(`
    UPDATE pathways 
    SET ${updates}, updated_at = NOW()
    WHERE id = $1
    RETURNING *
  `, [id, ...values])
}

export async function deletePathway(id: string) {
  return executeQuery(
    "DELETE FROM pathways WHERE id = $1 RETURNING *",
    [id]
  )
}

export async function getPathwayByPhoneNumber(phoneNumber: string, userId: string) {
  return executeQuery(
    "SELECT * FROM pathways WHERE phone_number = $1 AND creator_id = $2 ORDER BY updated_at DESC LIMIT 1",
    [phoneNumber, userId]
  )
}