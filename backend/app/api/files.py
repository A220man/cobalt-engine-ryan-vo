import os
from pathlib import Path
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.api.deps import get_current_user, require_operator_or_admin
from app.api.schemas import (
    FileOperationResponse,
    FileRequest,
    FileResponse,
    FileListResponse,
    FileOperation,
)
from app.core.database import get_db
from app.models import Agent, Workspace, User, UserRole as ModelUserRole

router = APIRouter(prefix="/agents/{agent_id}/files", tags=["files"])


def _resolve_workspace_path(workspace_path: str, requested_path: str) -> Path:
    """Resolve and validate that the requested path is within the workspace directory."""
    workspace_root = Path(workspace_path).resolve()
    requested = (workspace_root / requested_path).resolve()

    # Ensure the requested path is within the workspace root
    try:
        requested.relative_to(workspace_root)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: path is outside workspace directory",
        )

    return requested


@router.post("", response_model=FileOperationResponse, status_code=status.HTTP_200_OK)
def file_operation(
    agent_id: int,
    request: FileRequest,
    operation: FileOperation,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_operator_or_admin),
):
    # Get agent and verify access
    agent = db.query(Agent).join(Workspace).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    if current_user.role != ModelUserRole.ADMIN and agent.workspace.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized for this agent's workspace")

    workspace_path = agent.workspace.path
    target_path = _resolve_workspace_path(workspace_path, request.path)

    if operation == FileOperation.READ:
        if not target_path.exists():
            raise HTTPException(status_code=404, detail="File not found")
        if target_path.is_dir():
            raise HTTPException(status_code=400, detail="Path is a directory, use LIST operation")

        content = target_path.read_text(encoding="utf-8")
        stat = target_path.stat()
        return FileResponse(
            path=request.path,
            content=content,
            is_directory=False,
            size=stat.st_size,
            modified_at=datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc),
        )

    elif operation == FileOperation.WRITE:
        if request.content is None:
            raise HTTPException(status_code=400, detail="Content required for write operation")

        # Create parent directories if needed
        target_path.parent.mkdir(parents=True, exist_ok=True)
        target_path.write_text(request.content, encoding="utf-8")
        stat = target_path.stat()
        return FileResponse(
            path=request.path,
            content=request.content,
            is_directory=False,
            size=stat.st_size,
            modified_at=datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc),
        )

    elif operation == FileOperation.LIST:
        if not target_path.exists():
            raise HTTPException(status_code=404, detail="Path not found")
        if not target_path.is_dir():
            raise HTTPException(status_code=400, detail="Path is not a directory")

        files = []
        for entry in target_path.iterdir():
            stat = entry.stat()
            files.append(
                FileResponse(
                    path=entry.name,
                    is_directory=entry.is_dir(),
                    size=stat.st_size if entry.is_file() else None,
                    modified_at=datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc),
                )
            )
        return FileListResponse(files=files, path=request.path)

    elif operation == FileOperation.DELETE:
        if not target_path.exists():
            raise HTTPException(status_code=404, detail="File not found")

        if target_path.is_dir():
            # Only allow deleting empty directories for safety
            if any(target_path.iterdir()):
                raise HTTPException(status_code=400, detail="Directory not empty")
            target_path.rmdir()
        else:
            target_path.unlink()

        return FileResponse(path=request.path, is_directory=target_path.is_dir())

    else:
        raise HTTPException(status_code=400, detail="Invalid operation")
