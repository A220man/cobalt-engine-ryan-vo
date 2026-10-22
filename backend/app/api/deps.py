from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.database import get_db
from app.models import User, UserRole


security = HTTPBearer(auto_error=False)


class TokenData:
    def __init__(self, sub: str, roles: list[str], preferred_username: str, email: str):
        self.sub = sub
        self.roles = roles
        self.preferred_username = preferred_username
        self.email = email


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    settings = get_settings()

    # Demo mode: create/return a demo user (LOCALHOST ONLY)
    if settings.demo_mode and settings.app_env == "development":
        demo_user = db.query(User).filter(User.keycloak_id == "demo-user").first()
        if not demo_user:
            demo_user = User(
                keycloak_id="demo-user",
                username="demo",
                email="demo@localhost",
                role=UserRole.ADMIN,
            )
            db.add(demo_user)
            db.commit()
            db.refresh(demo_user)
        return demo_user

    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        # In production, fetch JWKS from Keycloak and validate properly
        # For now, decode without verification (dev only)
        payload = jwt.decode(
            credentials.credentials,
            key="",  # Would use JWKS in production
            options={"verify_signature": False},
            audience=settings.keycloak_client_id,
            issuer=f"{settings.keycloak_url}/realms/{settings.keycloak_realm}",
        )
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token_data = TokenData(
        sub=payload.get("sub", ""),
        roles=payload.get("roles", []),
        preferred_username=payload.get("preferred_username", ""),
        email=payload.get("email", ""),
    )

    # Get or create user from token
    user = db.query(User).filter(User.keycloak_id == token_data.sub).first()
    if not user:
        # Map Keycloak roles to app roles
        role = UserRole.OPERATOR
        if "admin" in token_data.roles:
            role = UserRole.ADMIN
        elif "viewer" in token_data.roles:
            role = UserRole.VIEWER

        user = User(
            keycloak_id=token_data.sub,
            username=token_data.preferred_username or token_data.email,
            email=token_data.email,
            role=role,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    return user


def require_role(*allowed_roles: UserRole):
    def role_checker(user: User = Depends(get_current_user)) -> User:
        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Required role: {[r.value for r in allowed_roles]}",
            )
        return user
    return role_checker


def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return user


def require_operator_or_admin(user: User = Depends(get_current_user)) -> User:
    if user.role not in (UserRole.OPERATOR, UserRole.ADMIN):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operator or admin access required",
        )
    return user