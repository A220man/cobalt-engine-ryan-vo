from fastapi import APIRouter

from app.api import health, workspaces, agents, users


api_router = APIRouter(prefix="/api")

api_router.include_router(health.router)
api_router.include_router(workspaces.router)
api_router.include_router(agents.router)
api_router.include_router(users.router)