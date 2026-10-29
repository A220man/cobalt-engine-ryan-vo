# Changelog

## 1.1.0 — work-in-progress checkpoint

Partial code published for continued development. Known issues: STATUS.md.

## 1.0.0 — work-in-progress checkpoint

Partial code published for continued development. Known issues: STATUS.md.

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project skeleton with FastAPI backend and React frontend
- SQLite persistence for agents and workspaces
- Health check endpoint
- Basic agent CRUD API
- Frontend agent dashboard
- Agent workspace file operations with sandbox isolation (Issue #1160)
  - File read, write, list, delete operations
  - Path traversal protection
  - Cross-workspace access prevention
## [1.0.0] - 2026-10-22

### Added
- Project initialization
- Core architecture: FastAPI + React + TypeScript + Vite
- Docker compose with backend, frontend, Keycloak
- OIDC authentication foundation