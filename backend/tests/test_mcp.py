import os
os.environ["DEMO_MODE"] = "true"

def test_mcp_tools_list(client):
    response = client.get("/api/mcp/tools")
    assert response.status_code == 200
    data = response.json()
    assert "tools" in data
    assert set(data["tools"]) == {"read_memory", "write_memory", "search_memory"}

def test_mcp_write_and_read(client):
    client.post("/api/mcp/execute", json={
        "tool": "write_memory",
        "params": {"id": "test1", "content": "hello"}
    })
    response = client.post("/api/mcp/execute", json={
        "tool": "read_memory",
        "params": {"id": "test1"}
    })
    assert response.status_code == 200
    data = response.json()
    assert data["result"]["id"] == "test1"
    assert data["result"]["content"] == "hello"
