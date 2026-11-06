import { useState, useEffect } from 'react'
import { api } from '../api/client'
import type { FileResponse } from '../types'

interface FileBrowserProps {
  agentId: number
  initialPath?: string
}

export function FileBrowser({ agentId, initialPath = '' }: FileBrowserProps) {
  const [currentPath, setCurrentPath] = useState(initialPath)
  const [files, setFiles] = useState<FileResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showNewFile, setShowNewFile] = useState(false)
  const [newFileName, setNewFileName] = useState('')
  const [newFileContent, setNewFileContent] = useState('')
  const [editingFile, setEditingFile] = useState<FileResponse | null>(null)
  const [editContent, setEditContent] = useState('')

  const loadFiles = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await api.listFiles(agentId, currentPath)
      setFiles(result.files)
    } catch (err) {
      setError('Failed to load files')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFiles()
  }, [agentId, currentPath])

  const handleNavigate = (file: FileResponse) => {
    if (file.is_directory) {
      setCurrentPath(file.path)
    }
  }

  const handleGoUp = () => {
    if (currentPath) {
      const parentPath = currentPath.split('/').slice(0, -1).join('/')
      setCurrentPath(parentPath)
    }
  }

  const handleCreateFile = async () => {
    if (!newFileName.trim()) return
    setError(null)
    try {
      await api.writeFile(agentId, `${currentPath}/${newFileName}`.replace(/^\//, ''), newFileContent)
      setShowNewFile(false)
      setNewFileName('')
      setNewFileContent('')
      loadFiles()
    } catch (err) {
      setError('Failed to create file')
      console.error(err)
    }
  }

  const handleCreateDirectory = async () => {
    if (!newFileName.trim()) return
    setError(null)
    try {
      // Create a directory by writing a .keep file
      await api.writeFile(agentId, `${currentPath}/${newFileName}/.keep`.replace(/^\//, ''), '')
      setShowNewFile(false)
      setNewFileName('')
      setNewFileContent('')
      loadFiles()
    } catch (err) {
      setError('Failed to create directory')
      console.error(err)
    }
  }

  const handleEditFile = async (file: FileResponse) => {
    setError(null)
    try {
      const result = await api.readFile(agentId, file.path)
      setEditingFile(file)
      setEditContent(result.content || '')
    } catch (err) {
      setError('Failed to read file')
      console.error(err)
    }
  }

  const handleSaveEdit = async () => {
    if (!editingFile) return
    setError(null)
    try {
      await api.writeFile(agentId, editingFile.path, editContent)
      setEditingFile(null)
      setEditContent('')
      loadFiles()
    } catch (err) {
      setError('Failed to save file')
      console.error(err)
    }
  }

  const handleDelete = async (file: FileResponse) => {
    if (!confirm(`Delete ${file.path}?`)) return
    setError(null)
    try {
      await api.deleteFile(agentId, file.path)
      loadFiles()
    } catch (err) {
      setError('Failed to delete file')
      console.error(err)
    }
  }

  const formatSize = (size: number | null) => {
    if (size === null) return ''
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
    return `${(size / 1024 / 1024).toFixed(1)} MB`
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleString()
  }

  return (
    <div className="file-browser">
      <div className="file-browser-header flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {currentPath && (
            <button
              onClick={handleGoUp}
              className="text-sm text-gray-500 hover:text-gray-700"
              title="Go up"
            >
              ↑ Up
            </button>
          )}
          <span className="font-mono text-sm text-gray-600">
            /{currentPath || 'workspace'}
          </span>
        </div>
        <button
          onClick={() => setShowNewFile(true)}
          className="btn btn-primary text-sm"
        >
          New File
        </button>
      </div>

      {error && (
        <div className="error-message mb-4 p-3 bg-red-50 text-red-700 rounded">
          {error}
        </div>
      )}

      {showNewFile && (
        <div className="mb-4 p-4 border rounded bg-gray-50">
          <h4 className="mb-2">Create New File</h4>
          <div className="mb-2">
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="filename.txt or dirname/"
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="mb-2">
            <textarea
              value={newFileContent}
              onChange={(e) => setNewFileContent(e.target.value)}
              placeholder="File content (leave empty for directory)"
              rows={4}
              className="w-full p-2 border rounded font-mono text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreateFile} className="btn btn-primary">
              Create File
            </button>
            <button onClick={handleCreateDirectory} className="btn btn-secondary">
              Create Directory
            </button>
            <button onClick={() => setShowNewFile(false)} className="btn btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      )}

      {editingFile && (
        <div className="mb-4 p-4 border rounded bg-gray-50">
          <h4 className="mb-2">Editing: {editingFile.path}</h4>
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={10}
            className="w-full p-2 border rounded font-mono text-sm"
          />
          <div className="flex gap-2 mt-2">
            <button onClick={handleSaveEdit} className="btn btn-primary">
              Save
            </button>
            <button
              onClick={() => {
                setEditingFile(null)
                setEditContent('')
              }}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="file-list border rounded overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3 font-medium">Name</th>
              <th className="text-left p-3 font-medium">Size</th>
              <th className="text-left p-3 font-medium">Modified</th>
              <th className="text-left p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="p-4 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : files.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-4 text-center text-gray-500">
                  No files in this directory
                </td>
              </tr>
            ) : (
              files.map((file) => (
                <tr key={file.path} className="border-t hover:bg-gray-50">
                  <td className="p-3">
                    <div
                      className="flex items-center gap-2 cursor-pointer"
                      onClick={() => handleNavigate(file)}
                    >
                      <span>{file.is_directory ? '📁' : '📄'}</span>
                      <span className={file.is_directory ? 'font-medium' : 'font-mono text-sm'}>
                        {file.path.split('/').pop() || file.path}
                      </span>
                    </div>
                  </td>
                  <td className="p-3 text-sm text-gray-500 font-mono">
                    {formatSize(file.size)}
                  </td>
                  <td className="p-3 text-sm text-gray-500">
                    {formatDate(file.modified_at)}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {!file.is_directory && (
                        <button
                          onClick={() => handleEditFile(file)}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          Edit
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(file)}
                        className="text-sm text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
