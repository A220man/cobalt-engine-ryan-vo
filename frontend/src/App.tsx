import { Layout } from './components/Layout'
import { Dashboard } from './components/Dashboard'
import { AgentList } from './components/AgentList'
import { AgentDetail } from './components/AgentDetail'
import { WorkspaceList } from './components/WorkspaceList'
import { Routes, Route } from 'react-router-dom'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/agents" element={<AgentList />} />
        <Route path="/agents/:id" element={<AgentDetail />} />
        <Route path="/workspaces" element={<WorkspaceList />} />
      </Routes>
    </Layout>
  )
}

export default App