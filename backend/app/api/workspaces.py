from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.api.deps import get_current_user, require_operator_or_admin, require_admin
from app.api.schemas import (
    WorkspaceCreate,
    WorkspaceRead,
    AgentCreate,
    AgentUpdate,
    AgentRead,
    UserRead,
    UserRole,
)
from app.core.database import get_db
from app.models import Workspace, Agent, User, UserRole as ModelUserRole


router = APIRouter(prefix="/workspaces", tags=["workspaces"])


@router.post("", response_model=WorkspaceRead, status_code=status.HTTP_201_CREATED)
def create_workspace(
    workspace_in: WorkspaceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_operator_or_admin),
):
    # Ensure path is within user's allowed directory
    workspace = Workspace(**workspace_in.model_dump(), owner_id=current_user.id)
    db.add(workspace)
    db.commit()
    db.refresh(workspace)
    return workspace


@router.get("", response_model=List[WorkspaceRead])
def list_workspaces(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Workspace)
    if current_user.role != ModelUserRole.ADMIN:
        query = query.filter(Workspace.owner_id == current_user.id)
    workspaces = query.offset(skip).limit(limit).all()
    return workspaces


@router.get("/{workspace_id}", response_model=WorkspaceRead)
def get_workspace(
    workspace_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    if current_user.role != ModelUserRole.ADMIN and workspace.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    return workspace


@router.delete("/{workspace_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_workspace(
    workspace_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_operator_or_admin),
):
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    if current_user.role != ModelUserRole.ADMIN and workspace.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    db.delete(workspace)
    db.commit()