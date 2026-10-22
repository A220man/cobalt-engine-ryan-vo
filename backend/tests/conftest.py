import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from app.main import create_app
from app.core.database import Base, get_db
from app.models import User, UserRole, Workspace, Agent, AgentStatus


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
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app = create_app()
    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture
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


@pytest.fixture
def demo_workspace(db_session, demo_user):
    workspace = Workspace(
        name="Test Workspace",
        path="/workspaces/test",
        owner_id=demo_user.id,
    )
    db_session.add(workspace)
    db_session.commit()
    db_session.refresh(workspace)
    return workspace


@pytest.fixture
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