import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import type { Agent } from '../types'

export function AgentList() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadAgents() {
      try {
        setLoading(true)
        const data = await api.listAgents()
        setAgents(data)
      } catch (err) {
        setError('Failed to load agents')
      } finally {
        setLoading(false)
      }
    }
    loadAgents()
  }, [])

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this agent?')) return
    try {
      await api.deleteAgent(id)
      setAgents(agents.filter(a => a.id !== id))
    } catch (err) {
      setError('Failed to delete agent')
    }
  }

  if (loading) {
    return (
      <div className="loading" role="status" aria-label="Loading agents" data-testid="loading-spinner">
        <div className="spinner" />
        <span className="sr-only">Loading...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agents</h1>
          <p className="text-gray-500 mt-1">Manage your AI agents</p>
        </div>
        <Link to="/agents/new" className="btn btn-primary">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Agent
        </Link>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="card">
        {agents.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🤖</div>
            <p>No agents created yet.</p>
            <Link to="/agents/new" className="btn btn-primary mt-4 inline-flex">
              Create Your First Agent
            </Link>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Workspace</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((agent) => (
                  <tr key={agent.id}>
                    <td className="font-medium">{agent.name}</td>
                    <td className="text-gray-500 max-w-xs truncate">{agent.description || '—'}</td>
                    <td>
                      <span className={`badge ${agent.status === 'active' ? 'badge-active' : agent.status === 'error' ? 'badge-error' : 'badge-inactive'}`}>
                        {agent.status}
                      </span>
                    </td>
                    <td className="text-gray-500">Workspace #{agent.workspace_id}</td>
                    <td className="text-gray-500">{new Date(agent.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Link to={`/agents/${agent.id}`} className="text-blue-600 hover:underline text-sm">
                          View
                        </Link>
                        <button
                          onClick={() => handleDelete(agent.id)}
                          className="text-red-600 hover:underline text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}