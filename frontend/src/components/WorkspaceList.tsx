import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import type { Workspace } from '../types'

export function WorkspaceList() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadWorkspaces() {
      try {
        setLoading(true)
        const data = await api.listWorkspaces()
        setWorkspaces(data)
      } catch (err) {
        setError('Failed to load workspaces')
      } finally {
        setLoading(false)
      }
    }
    loadWorkspaces()
  }, [])

  if (loading) {
    return <div className="loading"><div className="spinner" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workspaces</h1>
          <p className="text-gray-500 mt-1">Manage agent workspaces</p>
        </div>
        <Link to="/workspaces/new" className="btn btn-primary">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Workspace
        </Link>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="card">
        {workspaces.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📁</div>
            <p>No workspaces created yet.</p>
            <Link to="/workspaces/new" className="btn btn-primary mt-4 inline-flex">
              Create Your First Workspace
            </Link>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Path</th>
                  <th>Description</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {workspaces.map((ws) => (
                  <tr key={ws.id}>
                    <td className="font-medium">{ws.name}</td>
                    <td className="font-mono text-sm text-gray-500">{ws.path}</td>
                    <td className="text-gray-500 max-w-xs truncate">{ws.description || '—'}</td>
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