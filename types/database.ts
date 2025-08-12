
export interface User {
  id: string
  email: string
  name: string | null
  company: string | null
  role: string
  phone_number: string | null
  created_at: string
  updated_at: string
  last_login: string | null
  password_hash: string
}

export interface Team {
  id: string
  name: string
  description: string | null
  owner_id: string
  created_at: string
  updated_at: string
}

export interface TeamMember {
  id: string
  team_id: string
  user_id: string
  role: string
  joined_at: string
  updated_at: string
}

export interface Pathway {
  id: string
  name: string
  description: string | null
  team_id: string | null
  creator_id: string
  updater_id: string
  created_at: string
  updated_at: string
  data: any
  bland_id: string | null
  phone_number: string | null
}

export interface Activity {
  id: string
  pathway_id: string
  user_id: string
  action: string
  details: any | null
  created_at: string
}

export interface Invitation {
  id: string
  email: string
  team_id: string
  role: string
  token: string
  expires_at: string
  created_at: string
  accepted: boolean
}

export interface PhoneNumber {
  id: string
  user_id: string
  phone_number: string
  pathway_id: string | null
  created_at: string
  updated_at: string
}
