import { useState, useEffect, useCallback } from 'react'
import { api } from '../api/client'
import type { FileResponse } from '../types'

interface FileBrowserProps {
  agentId: number
  initialPath?: string
}

export function FileBrowser({ agentId, initialPath = '' }: FileBrowserProps) {
  const [currentPath, setCurrentPath] = useState(initialPath)
  const [files, setFiles] = useState<FileResponse[]>([])
  const [error, setError] = useState<string | null>(null)
  const [showNewFile, setShowNewFile] = useState(false)
  const [newFileName, setNewFileName] = useState('')
  const [newFileContent, setNewFileContent] = useState('')
  const [editingFile, setEditingFile] = useState<FileResponse | null>(null)
  const [editContent, setEditContent] = useState('')

  const loadFiles = useCallback(async () => {
    setError(null)
    try {
      const result = await api.listFiles(agentId, currentPath)
      setFiles(result.files)
    } catch (err) {
      setError('Failed to load files')
      console.error(err)
    }
  }, [agentId, currentPath])

  useEffect(() => {
    loadFiles()
  }, [loadFiles])

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
    if (file.is_directory) return
    setError(null)
    try {
      const content = await api.readFile(agentId, `${currentPath}/${file.path}`.replace(/^\//, ''))
      setEditingFile(file)
      setEditContent(content.content || '')
      setShowNewFile(true)
    } catch (err) {
      setError('Failed to read file')
      console.error(err)
    }
  }

  const handleSaveEdit = async () => {
    if (!editingFile) return
    setError(null)
    try {
      await api.writeFile(agentId, `${currentPath}/${editingFile.path}`.replace(/^\//, ''), editContent)
      setEditingFile(null)
      setEditContent('')
      setShowNewFile(false)
      loadFiles()
    } catch (err) {
      setError('Failed to save file')
      console.error(err)
    }
  }

  const handleDelete = async (file: FileResponse) => {
    if (!window.confirm(`Delete ${file.path}?`)) return
    setError(null)
    try {
      await api.deleteFile(agentId, `${currentPath}/${file.path}`.replace(/^\//, ''))
      loadFiles()
    } catch (err) {
      setError('Failed to delete file')
      console.error(err)
    }
  }

  const formatSize = (size: number | null) => {
    if (size === null) return '-'
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
    return `${(size / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleString()
  }

  return (
    <div className="file-browser">
      <div className="file-browser-header">
        <div className="flex items-center gap-2">
          <button onClick={handleGoUp} disabled={!currentPath} className="btn btn-sm btn-ghost">
            ← Up
          </button>
          <span className="font-mono text-sm text-gray-600">/{currentPath}</span>
        </div>
        <button onClick={() => setShowNewFile(true)} className="btn btn-primary btn-sm">
          + New File
        </button>
      </div>

      {error && (
        <div className="error-banner" role="alert">
          {error}
          <button onClick={() => setError(null)} className="btn btn-ghost btn-xs ml-2">×</button>
        </div>
      )}

      {showNewFile && !editingFile && (
        <div className="file-form">
          <h4 className="mb-2">Create New File</h4>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="filename.txt"
              className="input input-sm flex-1"
            />
            <select
              value={newFileContent ? 'file' : 'dir'}
              onChange={(e) => {
                if (e.target.value === 'dir') {
                  setNewFileContent('')
                }
              }}
              className="input input-sm"
            >
              <option value="file">File</option>
              <option value="dir">Directory</option>
            </select>
          </div>
          {newFileContent !== undefined && newFileContent !== '' && (
            <textarea
              value={newFileContent}
              onChange={(e) => setNewFileContent(e.target.value)}
              placeholder="File content..."
              className="input input-sm font-mono text-sm mb-2"
              rows={4}
            />
          )}
          <div className="flex gap-2">
            <button onClick={newFileContent === undefined ? handleCreateDirectory : handleCreateFile} className="btn btn-primary btn-sm">
              {newFileContent === undefined ? 'Create Directory' : 'Create File'}
            </button>
            <button onClick={() => { setShowNewFile(false); setNewFileName(''); setNewFileContent(''); }} className="btn btn-ghost btn-sm">Cancel</button>
          </div>
        </div>
      )}

      {editingFile && (
        <div className="file-form">
          <h4 className="mb-2">Edit {editingFile.path}</h4>
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="input input-sm font-mono text-sm mb-2"
            rows={10}
          />
          <div className="flex gap-2">
            <button onClick={handleSaveEdit} className="btn btn-primary btn-sm">Save</button>
            <button onClick={() => { setEditingFile(null); setEditContent(''); setShowNewFile(false); }} className="btn btn-ghost btn-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="file-list" role="list">
        {files.length === 0 ? (
          <div className="empty-state">No files in this directory</div>
        ) : (
          <ul>
            {files.map((file) => (
              <li key={file.path} className="file-item">
                <div className="flex items-center gap-3">
                  <span className={file.is_directory ? 'text-blue-600' : 'text-gray-600'}>
                    {file.is_directory ? '📁' : '📄'}
                  </span>
                  <span className="font-mono text-sm flex-1 truncate" onClick={() => handleNavigate(file)} style={{ cursor: file.is_directory ? 'pointer' : 'default' }}>
                    {file.path}
                  </span>
                  <span className="text-gray-400 text-xs font-mono whitespace-nowrap">
                    {formatSize(file.size)}
                  </span>
                  <span className="text-gray-400 text-xs whitespace-nowrap">
                    {formatDate(file.modified_at)}
                  </span>
                  {!file.is_directory && (
                    <>
                      <button onClick={() => handleEditFile(file)} className="btn btn-ghost btn-xs" title="Edit">✏️</button>
                      <button onClick={() => handleDelete(file)} className="btn btn-ghost btn-xs text-red-600 hover:text-red-700" title="Delete">🗑️</button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
