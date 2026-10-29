from datetime import datetime
from typing import Optional, Union
from pydantic import BaseModel, ConfigDict
from enum import Enum

class UserRole(str, Enum):
    VIEWER = "viewer"
    OPERATOR = "operator"
    ADMIN = "admin"


class AgentStatus(str, Enum):
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
    description: Optional[str] = None


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
    description: Optional[str] = None
    system_prompt: Optional[str] = None


class AgentCreate(AgentBase):
    workspace_id: int


class AgentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    system_prompt: Optional[str] = None
    status: Optional[AgentStatus] = None


class AgentRead(AgentBase):
    id: int
    status: AgentStatus
    owner_id: int
    workspace_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
class FileOperation(str, Enum):
    READ = "read"
    WRITE = "write"
    LIST = "list"
    DELETE = "delete"


class FileRequest(BaseModel):
    path: str
    content: Optional[str] = None


class FileResponse(BaseModel):
    path: str
    content: Optional[str] = None
    is_directory: bool = False
    size: Optional[int] = None
    modified_at: Optional[datetime] = None


class FileListResponse(BaseModel):
    files: list[FileResponse]
    path: str

from typing import Union

FileOperationResponse = Union[FileResponse, FileListResponse]
class HealthResponse(BaseModel):
    status: str
    version: str = "1.0.0"


class ErrorResponse(BaseModel):
    detail: str