from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, ConfigDict


class UserRole(StrEnum):
    VIEWER = "viewer"
    OPERATOR = "operator"
    ADMIN = "admin"


class AgentStatus(StrEnum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    ERROR = "error"


class UserBase(BaseModel):
    username: str
    email: str
    role: UserRole = UserRole.OPERATOR


class UserCreate(UserBase):
    keycloak_id: str


class UserRead(UserBase):
    id: int
    keycloak_id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class WorkspaceBase(BaseModel):
    name: str
    path: str
    description: str | None = None


class WorkspaceCreate(WorkspaceBase):
    pass


class WorkspaceRead(WorkspaceBase):
    id: int
    owner_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AgentBase(BaseModel):
    name: str
    description: str | None = None
    system_prompt: str | None = None


class AgentCreate(AgentBase):
    workspace_id: int


class AgentUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    system_prompt: str | None = None
    status: AgentStatus | None = None


class AgentRead(AgentBase):
    id: int
    status: AgentStatus
    owner_id: int
    workspace_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
class FileOperation(StrEnum):
    READ = "read"
    WRITE = "write"
    LIST = "list"
    DELETE = "delete"


class FileRequest(BaseModel):
    path: str
    content: str | None = None


class FileResponse(BaseModel):
    path: str
    content: str | None = None
    is_directory: bool = False
    size: int | None = None
    modified_at: datetime | None = None


class FileListResponse(BaseModel):
    files: list[FileResponse]
    path: str


FileOperationResponse = FileResponse | FileListResponse
class HealthResponse(BaseModel):
    status: str
    version: str = "1.0.0"


class ErrorResponse(BaseModel):
    detail: str
