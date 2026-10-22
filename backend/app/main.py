from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import api_router
from app.core.config import get_settings
from app.core.database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    settings = get_settings()
    if settings.app_env == "development":
        init_db()
    yield
    # Shutdown (if needed)


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title="Cobalt Engine",
        description="A smarter, self-hosted AI assistant — multi-user, multi-agent",
        version="1.0.0",
        lifespan=lifespan,
        docs_url="/docs" if settings.app_env == "development" else None,
        redoc_url="/redoc" if settings.app_env == "development" else None,
    )

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(api_router)

    return app


app = create_app()