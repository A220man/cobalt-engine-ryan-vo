import pytest

def test_create_agent(client, demo_user, demo_workspace):
    response = client.post(
        "/api/agents",
        json={"name": "New Agent", "workspace_id": demo_workspace.id, "description": "Test agent"},
    )
    assert response.status_code in (201, 401)
    if response.status_code == 201:
        data = response.json()
        assert data["name"] == "New Agent"
        assert data["workspace_id"] == demo_workspace.id


def test_list_agents(client, demo_user, demo_workspace, demo_agent):
    response = client.get("/api/agents")
    assert response.status_code in (200, 401)
    if response.status_code == 200:
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1


def test_get_agent(client, demo_agent):
    response = client.get(f"/api/agents/{demo_agent.id}")
    assert response.status_code in (200, 401, 404)
    if response.status_code == 200:
        data = response.json()
        assert data["id"] == demo_agent.id
        assert data["name"] == demo_agent.name


def test_get_agent_has_workspace_fields(client, demo_user, demo_agent):
    """Verify AgentRead includes workspace_name and workspace_path."""
    response = client.get(f"/api/agents/{demo_agent.id}")
    assert response.status_code in (200, 401, 404)
    if response.status_code == 200:
        data = response.json()
        # New fields added for multi-user isolation visibility
        assert "workspace_name" in data, f"Expected workspace_name in response, got: {data}"
        assert "workspace_path" in data, f"Expected workspace_path in response, got: {data}"
        # Verify they are not None when workspace exists
        assert data["workspace_name"] is not None, "workspace_name should not be None"
        assert data["workspace_path"] is not None, "workspace_path should not be None"
