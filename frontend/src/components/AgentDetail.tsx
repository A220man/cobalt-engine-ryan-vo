import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api/client'
import type { Agent } from '../types'

export function AgentDetail() {
  const { id } = useParams<{ id: string }>()
  const [agent, setAgent] = useState<Agent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadAgent() {
      try {
        setLoading(true)
        const data = await api.getAgent(parseInt(id!))
        setAgent(data)
      } catch (err) {
        setError('Failed to load agent')
      } finally {
        setLoading(false)
      }
    }
    if (id) loadAgent()
  }, [id])

  if (loading) {
    return <div className="loading"><div className="spinner" /></div>
  }

  if (error || !agent) {
    return (
      <div className="error-message">
        {error || 'Agent not found'}
        <div className="mt-4">
          <Link to="/agents" className="btn btn-primary">
            Back to Agents
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/agents" className="text-blue-600 hover:underline text-sm mb-2 inline-block">
            \u2190 Back to Agents
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{agent.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className={`badge ${agent.status === 'active' ? 'badge-active' : agent.status === 'error' ? 'badge-error' : 'badge-inactive'}`}>
            {agent.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Description</h2>
            <p className="text-gray-600 whitespace-pre-wrap">{agent.description || 'No description provided'}</p>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold mb-4">System Prompt</h2>
            <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-x-auto whitespace-pre-wrap font-mono">
              {agent.system_prompt || 'No system prompt configured'}
            </pre>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Details</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">ID</dt>
                <dd className="font-mono font-medium">{agent.id}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Workspace</dt>
                <dd>Workspace #{agent.workspace_id}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Owner</dt>
                <dd>User #{agent.owner_id}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Created</dt>
                <dd>{new Date(agent.created_at).toLocaleString()}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Updated</dt>
                <dd>{new Date(agent.updated_at).toLocaleString()}</dd>
              </div>
            </dl>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Actions</h2>
            <div className="space-y-2">
              <Link to={`/agents/${agent.id}/edit`} className="btn btn-secondary w-full justify-start">
                Edit Agent
              </Link>
              <button className="btn btn-danger w-full justify-start">
                Delete Agent
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}