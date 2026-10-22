import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AgentList } from './AgentList'
import { api } from '../api/client'

vi.mock('../api/client', () => ({
  api: {
    listAgents: vi.fn(),
    deleteAgent: vi.fn(),
  },
}))

const renderWithRouter = (component: React.ReactNode) => {
  return render(<BrowserRouter>{component}</BrowserRouter>)
}

describe('AgentList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })


  it('displays list of agents', async () => {
    vi.mocked(api.listAgents).mockResolvedValue([
      { id: 1, name: 'Test Agent', status: 'active', workspace_id: 1, owner_id: 1, created_at: '2024-01-01', updated_at: '2024-01-01', description: 'A test agent', system_prompt: null },
    ])

    await act(async () => {
      renderWithRouter(<AgentList />)
    })

    await waitFor(() => {
      expect(screen.getByText('Test Agent')).toBeInTheDocument()
      expect(screen.getByText('active')).toBeInTheDocument()
    })
  })

  it('shows empty state when no agents', async () => {
    vi.mocked(api.listAgents).mockResolvedValue([])

    await act(async () => {
      renderWithRouter(<AgentList />)
    })

    await waitFor(() => {
      expect(screen.getByText('No agents created yet.')).toBeInTheDocument()
    })
  })
})