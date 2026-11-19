from datetime import UTC, datetime
from typing import Any, Dict

from app.api.deps import require_operator_or_admin
from app.core.config import get_settings
from app.models import User
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

# In-memory memory store (for demo purposes)
memory_store: Dict[str, Dict[str, Any]] = {}


class ReadMemoryRequest(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str


class WriteMemoryRequest(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    content: str


class SearchMemoryRequest(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    query: str


class MCPExecuteRequest(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    tool: str
    params: dict[str, Any]


class MCPExecuteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    result: Any


def read_memory(id: str) -> dict[str, Any]:
    if id not in memory_store:
        raise HTTPException(status_code=404, detail=f"Memory not found: {id}")
    return {"id": id, "content": memory_store[id]["content"], "timestamp": memory_store[id]["timestamp"]}


def write_memory(id: str, content: str) -> dict[str, Any]:
    memory_store[id] = {
        "content": content,
        "timestamp": datetime.now(UTC)
    }
    return {"id": id, "status": "written", "timestamp": memory_store[id]["timestamp"]}


def search_memory(query: str) -> dict[str, Any]:
    results = []
    query_lower = query.lower()
    for mem_id, data in memory_store.items():
        if query_lower in data["content"].lower():
            results.append({"id": mem_id, "content": data["content"], "timestamp": data["timestamp"]})
    return {"query": query, "matches": results}


router = APIRouter(prefix="/mcp", tags=["mcp"])


@router.get("/tools")
def list_tools(current_user: User = Depends(require_operator_or_admin)):
    return {"tools": ["read_memory", "write_memory", "search_memory"]}


@router.post("/execute", response_model=MCPExecuteResponse)
def execute_tool(request: MCPExecuteRequest, current_user: User = Depends(require_operator_or_admin)):
    if request.tool == "read_memory":
        params = ReadMemoryRequest(**request.params)
        return {"result": read_memory(params.id)}
    elif request.tool == "write_memory":
        params = WriteMemoryRequest(**request.params)
        return {"result": write_memory(params.id, params.content)}
    elif request.tool == "search_memory":
        params = SearchMemoryRequest(**request.params)
        return {"result": search_memory(params.query)}
    else:
        raise HTTPException(status_code=status.HTTP_400, detail=f"Unsupported tool: {request.tool}")
