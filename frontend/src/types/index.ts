export type UserRole = 'viewer' | 'operator' | 'admin'

export type AgentStatus = 'active' | 'inactive' | 'error'

export interface User {
  id: number
  keycloak_id: string
  username: string
  email: string
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Workspace {
  id: number
  name: string
  path: string
  description: string | null
  owner_id: number
  created_at: string
  updated_at: string
}

export interface Agent {
  id: number
  name: string
  description: string | null
  system_prompt: string | null
  status: AgentStatus
  owner_id: number
  workspace_id: number
  created_at: string
  updated_at: string
}

export interface HealthResponse {
  status: string
  version: string
}