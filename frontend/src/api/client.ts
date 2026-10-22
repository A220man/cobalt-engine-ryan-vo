import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import type { Agent, Workspace, User, HealthResponse } from '../types'

declare global {
  interface ImportMetaEnv {
    readonly VITE_API_URL: string
  }
  interface ImportMeta {
    readonly env: ImportMetaEnv
  }
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

class ApiClient {
  private client: AxiosInstance
  private accessToken: string | null = null

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    })

    this.client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
      if (this.accessToken) {
        config.headers.Authorization = `Bearer ${this.accessToken}`
      }
      return config
    })

    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          this.clearToken()
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }
    )
  }

  setToken(token: string) {
    this.accessToken = token
  }

  clearToken() {
    this.accessToken = null
  }

  // Health
  async health(): Promise<HealthResponse> {
    const response = await this.client.get<HealthResponse>('/api/health')
    return response.data
  }

  // Workspaces
  async listWorkspaces(): Promise<Workspace[]> {
    const response = await this.client.get<Workspace[]>('/api/workspaces')
    return response.data
  }

  async createWorkspace(data: { name: string; path: string; description?: string }): Promise<Workspace> {
    const response = await this.client.post<Workspace>('/api/workspaces', data)
    return response.data
  }

  async getWorkspace(id: number): Promise<Workspace> {
    const response = await this.client.get<Workspace>(`/api/workspaces/${id}`)
    return response.data
  }

  async deleteWorkspace(id: number): Promise<void> {
    await this.client.delete(`/api/workspaces/${id}`)
  }

  // Agents
  async listAgents(workspaceId?: number): Promise<Agent[]> {
    const params = workspaceId ? { workspace_id: workspaceId } : {}
    const response = await this.client.get<Agent[]>('/api/agents', { params })
    return response.data
  }

  async createAgent(data: { name: string; workspace_id: number; description?: string; system_prompt?: string }): Promise<Agent> {
    const response = await this.client.post<Agent>('/api/agents', data)
    return response.data
  }

  async getAgent(id: number): Promise<Agent> {
    const response = await this.client.get<Agent>(`/api/agents/${id}`)
    return response.data
  }

  async updateAgent(id: number, data: Partial<Agent>): Promise<Agent> {
    const response = await this.client.patch<Agent>(`/api/agents/${id}`, data)
    return response.data
  }

  async deleteAgent(id: number): Promise<void> {
    await this.client.delete(`/api/agents/${id}`)
  }

  // Users
  async getCurrentUser(): Promise<User> {
    const response = await this.client.get<User>('/api/users/me')
    return response.data
  }
}

export const api = new ApiClient()