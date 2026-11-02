import os
import tempfile
from pathlib import Path
from fastapi.testclient import TestClient

from app.main import create_app
from app.core.database import Base, get_db
from app.api.deps import get_current_user
from app.models import User, UserRole, Workspace, Agent, AgentStatus
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import pytest


@pytest.fixture(scope="session")
def engine():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    yield engine


@pytest.fixture(scope="function")
def db_session(engine):
    connection = engine.connect()
    transaction = connection.begin()
    SessionLocal = sessionmaker(bind=connection, autocommit=False, autoflush=False)
    session = SessionLocal()
    yield session
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture(scope="function")
def demo_user(db_session):
    user = User(
        keycloak_id="demo-user",
        username="demo",
        email="demo@localhost",
        role=UserRole.ADMIN,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture(scope="function")
def demo_workspace(db_session, demo_user, tmp_path):
    workspace_path = tmp_path / "test_workspace"
    workspace_path.mkdir(parents=True, exist_ok=True)
    workspace = Workspace(
        name="Test Workspace",
        path=str(workspace_path),
        owner_id=demo_user.id,
    )
    db_session.add(workspace)
    db_session.commit()
    db_session.refresh(workspace)
    return workspace


@pytest.fixture(scope="function")
def demo_agent(db_session, demo_user, demo_workspace):
    agent = Agent(
        name="Test Agent",
        description="A test agent",
        system_prompt="You are a test agent",
        status=AgentStatus.ACTIVE,
        owner_id=demo_user.id,
        workspace_id=demo_workspace.id,
    )
    db_session.add(agent)
    db_session.commit()
    db_session.refresh(agent)
    return agent


@pytest.fixture(scope="function")
def client(db_session, demo_user):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    def override_get_current_user():
        return demo_user

    app = create_app()
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user
    yield TestClient(app)
    app.dependency_overrides.clear()


def test_file_write_and_read(client, demo_user, demo_workspace, demo_agent, tmp_path):
    # Write a file
    response = client.post(
        f"/api/agents/{demo_agent.id}/files",
        json={"path": "test.txt", "content": "Hello, World!"},
        params={"operation": "write"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["path"] == "test.txt"
    assert data["content"] == "Hello, World!"
    assert data["is_directory"] is False
    assert data["size"] == 13

    # Read the file back
    response = client.post(
        f"/api/agents/{demo_agent.id}/files",
        json={"path": "test.txt"},
        params={"operation": "read"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["path"] == "test.txt"
    assert data["content"] == "Hello, World!"


def test_file_list(client, demo_user, demo_workspace, demo_agent, tmp_path):
    # Create a few files
    workspace_path = Path(demo_workspace.path)
    (workspace_path / "file1.txt").write_text("content1")
    (workspace_path / "file2.txt").write_text("content2")
    (workspace_path / "subdir").mkdir()
    (workspace_path / "subdir" / "file3.txt").write_text("content3")

    # List root directory
    response = client.post(
        f"/api/agents/{demo_agent.id}/files",
        json={"path": "."},
        params={"operation": "list"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["path"] == "."
    assert len(data["files"]) >= 3
    file_names = [f["path"] for f in data["files"]]
    assert "file1.txt" in file_names
    assert "file2.txt" in file_names
    assert "subdir" in file_names


def test_file_delete(client, demo_user, demo_workspace, demo_agent, tmp_path):
    # Create a file
    workspace_path = Path(demo_workspace.path)
    (workspace_path / "to_delete.txt").write_text("delete me")

    # Delete the file
    response = client.post(
        f"/api/agents/{demo_agent.id}/files",
        json={"path": "to_delete.txt"},
        params={"operation": "delete"},
    )
    assert response.status_code == 200

    # Verify it's gone
    response = client.post(
        f"/api/agents/{demo_agent.id}/files",
        json={"path": "to_delete.txt"},
        params={"operation": "read"},
    )
    assert response.status_code == 404


def test_path_traversal_blocked(client, demo_user, demo_workspace, demo_agent, tmp_path):
    # Try various path traversal attempts
    for malicious_path in ["../outside.txt", "../../etc/passwd", "subdir/../../outside.txt"]:
        response = client.post(
            f"/api/agents/{demo_agent.id}/files",
            json={"path": malicious_path},
            params={"operation": "read"},
        )
        assert response.status_code == 403
        assert "outside workspace directory" in response.json()["detail"]


def test_write_creates_directories(client, demo_user, demo_workspace, demo_agent, tmp_path):
    # Write to a nested path that doesn't exist
    response = client.post(
        f"/api/agents/{demo_agent.id}/files",
        json={"path": "nested/deep/path/file.txt", "content": "deep content"},
        params={"operation": "write"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["path"] == "nested/deep/path/file.txt"
    assert data["content"] == "deep content"

    # Verify file exists on disk
    workspace_path = Path(demo_workspace.path)

def test_path_traversal_blocked_all_operations(client, demo_user, demo_workspace, demo_agent, tmp_path):
    """Test that path traversal is blocked for all file operations."""
    workspace_path = Path(demo_workspace.path)
    outside_path = workspace_path.parent / "outside"
    outside_path.mkdir()
    (outside_path / "secret.txt").write_text("SECRET")

    malicious_paths = [
        "../outside.txt",
        "../../etc/passwd",
        "subdir/../../outside.txt",
        "./../outside.txt",
    ]

    for malicious_path in malicious_paths:
        # Test READ
        response = client.post(
            f"/api/agents/{demo_agent.id}/files",
            json={"path": malicious_path},
            params={"operation": "read"},
        )
        assert response.status_code == 403, f"READ should be blocked for {malicious_path}"
        assert "outside workspace directory" in response.json()["detail"]

        # Test WRITE
        response = client.post(
            f"/api/agents/{demo_agent.id}/files",
            json={"path": malicious_path, "content": "malicious"},
            params={"operation": "write"},
        )
        assert response.status_code == 403, f"WRITE should be blocked for {malicious_path}"
        assert "outside workspace directory" in response.json()["detail"]

        # Test LIST
        response = client.post(
            f"/api/agents/{demo_agent.id}/files",
            json={"path": malicious_path},
            params={"operation": "list"},
        )
        assert response.status_code == 403, f"LIST should be blocked for {malicious_path}"
        assert "outside workspace directory" in response.json()["detail"]

        # Test DELETE
        response = client.post(
            f"/api/agents/{demo_agent.id}/files",
            json={"path": malicious_path},
            params={"operation": "delete"},
        )
        assert response.status_code == 403, f"DELETE should be blocked for {malicious_path}"
        assert "outside workspace directory" in response.json()["detail"]


def test_symlink_attacks_blocked(client, demo_user, demo_workspace, demo_agent, tmp_path):
    """Test that symlink attacks are blocked for all file operations."""
    workspace_path = Path(demo_workspace.path)
    outside_path = workspace_path.parent / "outside"
    outside_path.mkdir()
    secret_file = outside_path / "secret.txt"
    secret_file.write_text("SECRET DATA")

    # Create symlink file inside workspace pointing outside
    symlink_file = workspace_path / "link.txt"
    symlink_file.symlink_to(secret_file)

    # Create symlink directory inside workspace pointing outside
    symlink_dir = workspace_path / "linkdir"
    symlink_dir.symlink_to(outside_path)

    # Test READ on symlink file
    response = client.post(
        f"/api/agents/{demo_agent.id}/files",
        json={"path": "link.txt"},
        params={"operation": "read"},
    )
    assert response.status_code == 403
    assert "outside workspace directory" in response.json()["detail"]

    # Test WRITE on symlink file
    response = client.post(
        f"/api/agents/{demo_agent.id}/files",
        json={"path": "link.txt", "content": "malicious"},
        params={"operation": "write"},
    )
    assert response.status_code == 403
    assert "outside workspace directory" in response.json()["detail"]

    # Test LIST on symlink directory
    response = client.post(
        f"/api/agents/{demo_agent.id}/files",
        json={"path": "linkdir"},
        params={"operation": "list"},
    )
    assert response.status_code == 403
    assert "outside workspace directory" in response.json()["detail"]

    # Test DELETE on symlink file
    response = client.post(
        f"/api/agents/{demo_agent.id}/files",
        json={"path": "link.txt"},
        params={"operation": "delete"},
    )
    assert response.status_code == 403
    assert "outside workspace directory" in response.json()["detail"]

    # Verify outside file is untouched
    assert secret_file.read_text() == "SECRET DATA"


def test_legitimate_symlinks_within_workspace_work(client, demo_user, demo_workspace, demo_agent, tmp_path):
    """Test that symlinks within the workspace work correctly."""
    workspace_path = Path(demo_workspace.path)

    # Create a real file
    (workspace_path / "real_file.txt").write_text("REAL CONTENT")

    # Create a symlink to the real file (both inside workspace)
    symlink_file = workspace_path / "link_to_real.txt"
    symlink_file.symlink_to("real_file.txt")

    # READ should work
    response = client.post(
        f"/api/agents/{demo_agent.id}/files",
        json={"path": "link_to_real.txt"},
        params={"operation": "read"},
    )
    assert response.status_code == 200
    assert response.json()["content"] == "REAL CONTENT"

    # WRITE through symlink should work (follows symlink)
    response = client.post(
        f"/api/agents/{demo_agent.id}/files",
        json={"path": "link_to_real.txt", "content": "NEW CONTENT"},
        params={"operation": "write"},
    )
    assert response.status_code == 200
    assert response.json()["content"] == "NEW CONTENT"

    # Verify the real file was updated
    assert (workspace_path / "real_file.txt").read_text() == "NEW CONTENT"

    # LIST on directory containing symlink should work
    response = client.post(
        f"/api/agents/{demo_agent.id}/files",
        json={"path": "."},
        params={"operation": "list"},
    )
    assert response.status_code == 200
    file_names = [f["path"] for f in response.json()["files"]]
    assert "real_file.txt" in file_names
    assert "link_to_real.txt" in file_names
