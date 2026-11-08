from app.api import agents, files, health, users, workspaces
from fastapi import APIRouter

api_router = APIRouter(prefix="/api")

api_router.include_router(health.router)
api_router.include_router(workspaces.router)
api_router.include_router(agents.router)
api_router.include_router(users.router)
api_router.include_router(files.router)
