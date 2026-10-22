from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.api.deps import get_current_user, require_operator_or_admin, require_admin
from app.api.schemas import (
    AgentCreate,
    AgentUpdate,
    AgentRead,
    AgentStatus,
    UserRole as SchemaUserRole,
)
from app.core.database import get_db
from app.models import Agent, User, Workspace, UserRole as ModelUserRole


router = APIRouter(prefix="/agents", tags=["agents"])


@router.post("", response_model=AgentRead, status_code=status.HTTP_201_CREATED)
def create_agent(
    agent_in: AgentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_operator_or_admin),
):
    # Verify workspace exists and user has access
    workspace = db.query(Workspace).filter(Workspace.id == agent_in.workspace_id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    if current_user.role != ModelUserRole.ADMIN and workspace.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized for this workspace")

    agent = Agent(**agent_in.model_dump(), owner_id=current_user.id)
    db.add(agent)
    db.commit()
    db.refresh(agent)
    return agent


@router.get("", response_model=List[AgentRead])
def list_agents(
    skip: int = 0,
    limit: int = 100,
    workspace_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Agent).join(Workspace)
    if current_user.role != ModelUserRole.ADMIN:
        query = query.filter(Workspace.owner_id == current_user.id)
    if workspace_id:
        query = query.filter(Agent.workspace_id == workspace_id)
    agents = query.offset(skip).limit(limit).all()
    return agents


@router.get("/{agent_id}", response_model=AgentRead)
def get_agent(
    agent_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    agent = db.query(Agent).join(Workspace).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    if current_user.role != ModelUserRole.ADMIN and agent.workspace.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    return agent


@router.patch("/{agent_id}", response_model=AgentRead)
def update_agent(
    agent_id: int,
    agent_in: AgentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_operator_or_admin),
):
    agent = db.query(Agent).join(Workspace).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    if current_user.role != ModelUserRole.ADMIN and agent.workspace.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    update_data = agent_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(agent, field, value)
    db.commit()
    db.refresh(agent)
    return agent


@router.delete("/{agent_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_agent(
    agent_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_operator_or_admin),
):
    agent = db.query(Agent).join(Workspace).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    if current_user.role != ModelUserRole.ADMIN and agent.workspace.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    db.delete(agent)
    db.commit()