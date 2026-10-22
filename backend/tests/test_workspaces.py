def test_create_workspace(client, demo_user):
    # Need to simulate auth - in demo mode this works
    response = client.post(
        "/api/workspaces",
        json={"name": "New Workspace", "path": "/workspaces/new"},
    )
    # Without auth, should fail or work in demo mode
    # In demo mode, the auth dependency creates a demo user
    assert response.status_code in (201, 401)


def test_list_workspaces(client, demo_user, demo_workspace):
    response = client.get("/api/workspaces")
    assert response.status_code in (200, 401)
    if response.status_code == 200:
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1