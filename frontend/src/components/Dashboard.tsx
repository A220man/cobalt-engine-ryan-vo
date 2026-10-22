import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import type { Agent, Workspace, HealthResponse } from '../types'

export function Dashboard() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [agents, setAgents] = useState<Agent[]>([])
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        const [healthRes, agentsRes, workspacesRes] = await Promise.all([
          api.health(),
          api.listAgents(),
          api.listWorkspaces(),
        ])
        setHealth(healthRes)
        setAgents(agentsRes)
        setWorkspaces(workspacesRes)
      } catch (err) {
        setError('Failed to load dashboard data. Make sure the backend is running.')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="loading" role="status" aria-label="Loading dashboard" data-testid="loading-spinner">
        <div className="spinner" />
        <span className="sr-only">Loading...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Overview of your agents and workspaces</p>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* System Status */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">System Status</h2>
        <div className="flex items-center gap-4">
          <div className={`w-3 h-3 rounded-full ${health?.status === 'ok' ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className={health?.status === 'ok' ? 'text-green-700' : 'text-red-700'}>
            {health?.status === 'ok' ? 'Backend Healthy' : 'Backend Unavailable'}
          </span>
          <span className="text-gray-500 ml-auto">Version: {health?.version || 'Unknown'}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="text-3xl font-bold text-blue-600">{agents.length}</div>
          <div className="text-gray-500">Total Agents</div>
        </div>
        <div className="card">
          <div className="text-3xl font-bold text-green-600">
            {agents.filter(a => a.status === 'active').length}
          </div>
          <div className="text-gray-500">Active Agents</div>
        </div>
        <div className="card">
          <div className="text-3xl font-bold text-purple-600">{workspaces.length}</div>
          <div className="text-gray-500">Workspaces</div>
        </div>
        <div className="card">
          <div className="text-3xl font-bold text-orange-600">
            {agents.filter(a => a.status === 'error').length}
          </div>
          <div className="text-gray-500">Agents with Errors</div>
        </div>
      </div>

      {/* Recent Agents */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Agents</h2>
          <Link to="/agents" className="text-sm text-blue-600 hover:underline">
            View All →
          </Link>
        </div>
        {agents.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🤖</div>
            <p>No agents yet. Create your first agent to get started.</p>
            <Link to="/agents" className="btn btn-primary mt-4 inline-flex">
              Create Agent
            </Link>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Workspace</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {agents.slice(0, 5).map((agent) => (
                  <tr key={agent.id}>
                    <td className="font-medium">{agent.name}</td>
                    <td>
                      <span className={`badge ${agent.status === 'active' ? 'badge-active' : agent.status === 'error' ? 'badge-error' : 'badge-inactive'}`}>
                        {agent.status}
                      </span>
                    </td>
                    <td className="text-gray-500">Workspace #{agent.workspace_id}</td>
                    <td className="text-gray-500">{new Date(agent.created_at).toLocaleDateString()}</td>
                    <td>
                      <Link to={`/agents/${agent.id}`} className="text-blue-600 hover:underline text-sm">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Workspaces */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Workspaces</h2>
          <Link to="/workspaces" className="text-sm text-blue-600 hover:underline">
            View All →
          </Link>
        </div>
        {workspaces.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📁</div>
            <p>No workspaces yet. Create a workspace to organize your agents.</p>
            <Link to="/workspaces" className="btn btn-primary mt-4 inline-flex">
              Create Workspace
            </Link>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Path</th>
                  <th>Agents</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {workspaces.slice(0, 5).map((ws) => (
                  <tr key={ws.id}>
                    <td className="font-medium">{ws.name}</td>
                    <td className="text-gray-500 font-mono text-sm">{ws.path}</td>
                    <td>
                      {agents.filter(a => a.workspace_id === ws.id).length}
                    </td>
                    <td className="text-gray-500">{new Date(ws.created_at).toLocaleDateString()}</td>
                    <td>
                      <Link to={`/workspaces/${ws.id}`} className="text-blue-600 hover:underline text-sm">
                        View
                      </Link>
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