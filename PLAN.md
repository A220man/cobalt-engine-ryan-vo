# Product development plan

Each round completes one feature or repair. Future items are planned, not implemented claims.

## Current round

agent-workspace-isolation

## Roadmap

### project-skeleton — Project skeleton with FastAPI backend and React frontend

Status: done

Acceptance:
- Backend FastAPI app runs at /api/health
- Frontend Vite+React+TS builds and serves
- Docker compose brings up both services
- SQLite persistence works
- Basic tests pass

Implementation: `backend/app/main.py`, `backend/app/api/health.py`, `backend/app/api/workspaces.py`, `backend/app/api/agents.py`, `backend/app/api/users.py`, `backend/app/api/schemas.py`, `backend/app/api/deps.py`, `backend/app/core/config.py`, `backend/app/core/database.py`, `backend/app/models/__init__.py`, `backend/app/core/keycloak-realm.json`, `backend/Dockerfile`, `backend/requirements.txt`, `frontend/src/main.tsx`, `frontend/src/App.tsx`, `frontend/src/components/Layout.tsx`, `frontend/src/components/Dashboard.tsx`, `frontend/src/components/AgentList.tsx`, `frontend/src/components/AgentDetail.tsx`, `frontend/src/components/WorkspaceList.tsx`, `frontend/src/api/client.ts`, `frontend/src/types/index.ts`, `frontend/src/index.css`, `frontend/package.json`

Tests: `backend/tests/test_health.py`, `backend/tests/test_workspaces.py`, `backend/tests/test_agents.py`, `backend/tests/conftest.py`, `frontend/src/components/Dashboard.test.tsx`, `frontend/src/components/AgentList.test.tsx`, `frontend/vitest.config.ts`, `frontend/vitest.setup.ts`

### agent-workspace-isolation — Agent workspace sandbox isolation (Issue #1160)

Status: in_progress

Acceptance:
- Each agent confined to its workspace directory
- Cross-workspace file access returns permission error
- File operations validated before execution

Implementation: `backend/app/api/files.py`, `backend/app/api/schemas.py`, `backend/app/api/__init__.py`

Tests: `backend/tests/test_files.py`

### mcp-server-exposure — MCP server exposure for memory system (Issue #322)

Status: planned

Acceptance:
- MCP server runs and exposes tools
- External AI can connect and use memory tools
- Tools: read_memory, write_memory, search_memory

### multi-user-isolation — Multi-user data/workspace isolation (Issue #2207)

Status: planned

Acceptance:
- Users only see their own agents/workspaces
- Admin can pre-configure specialist agents
- No cross-user data leakage

### oidc-keycloak-auth — OIDC/Keycloak authentication with SAML broker

Status: planned

Acceptance:
- Keycloak realm import provided
- Login/logout works with PKCE
- Role-based access (viewer/operator/admin)
- Demo mode explicitly opt-in only

