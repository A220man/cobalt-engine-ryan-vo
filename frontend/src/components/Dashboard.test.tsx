import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { Dashboard } from './Dashboard'
import { api } from '../api/client'

vi.mock('../api/client', () => ({
  api: {
    health: vi.fn(),
    listAgents: vi.fn(),
    listWorkspaces: vi.fn(),
  },
}))

const renderWithRouter = (component: React.ReactNode) => {
  return render(<BrowserRouter>{component}</BrowserRouter>)
}

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })


  it('displays system status when healthy', async () => {
    vi.mocked(api.health).mockResolvedValue({ status: 'ok', version: '1.0.0' })
    vi.mocked(api.listAgents).mockResolvedValue([])
    vi.mocked(api.listWorkspaces).mockResolvedValue([])

    await act(async () => {
      renderWithRouter(<Dashboard />)
    })

    await waitFor(() => {
      expect(screen.getByText('Backend Healthy')).toBeInTheDocument()
      expect(screen.getByText('Version: 1.0.0')).toBeInTheDocument()
    })
  })

  it('displays agent and workspace counts', async () => {
    vi.mocked(api.health).mockResolvedValue({ status: 'ok', version: '1.0.0' })
    vi.mocked(api.listAgents).mockResolvedValue([
      { id: 1, name: 'Agent 1', status: 'active', workspace_id: 1, owner_id: 1, created_at: '2024-01-01', updated_at: '2024-01-01', description: null, system_prompt: null },
      { id: 2, name: 'Agent 2', status: 'inactive', workspace_id: 1, owner_id: 1, created_at: '2024-01-01', updated_at: '2024-01-01', description: null, system_prompt: null },
    ])
    vi.mocked(api.listWorkspaces).mockResolvedValue([
      { id: 1, name: 'Workspace 1', path: '/ws1', owner_id: 1, created_at: '2024-01-01', updated_at: '2024-01-01', description: null },
    ])

    await act(async () => {
      renderWithRouter(<Dashboard />)
    })

    await waitFor(() => {
      const totalAgents = screen.getByText('Total Agents')
      expect(totalAgents.parentElement).toHaveTextContent('2')
      const activeAgents = screen.getByText('Active Agents')
      expect(activeAgents.parentElement).toHaveTextContent('1')
      const workspaces = screen.getByText('Workspaces')
      expect(workspaces.parentElement).toHaveTextContent('1')
    })
  })

  it('shows empty state when no agents', async () => {
    vi.mocked(api.health).mockResolvedValue({ status: 'ok', version: '1.0.0' })
    vi.mocked(api.listAgents).mockResolvedValue([])
    vi.mocked(api.listWorkspaces).mockResolvedValue([])

    await act(async () => {
      renderWithRouter(<Dashboard />)
    })

    await waitFor(() => {
      expect(screen.getByText('No agents yet. Create your first agent to get started.')).toBeInTheDocument()
    })
  })
})