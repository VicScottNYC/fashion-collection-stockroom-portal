import os
from functools import lru_cache
from pathlib import Path
from uuid import UUID

import jwt
from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWKClient
from pydantic import BaseModel

BACKEND_DIR = Path(__file__).resolve().parent.parent
load_dotenv(dotenv_path=BACKEND_DIR / ".env")

SUPABASE_URL = os.environ["SUPABASE_URL"].rstrip("/")
JWT_ISSUER = f"{SUPABASE_URL}/auth/v1"
JWKS_URL = f"{JWT_ISSUER}/.well-known/jwks.json"

bearer_scheme = HTTPBearer(auto_error=False)


class AuthenticatedUser(BaseModel):
    id: UUID
    email: str | None = None


@lru_cache(maxsize=1)
def get_jwks_client() -> PyJWKClient:
    return PyJWKClient(
        JWKS_URL,
        cache_jwk_set=True,
        lifespan=300,
        timeout=5,
    )


def verify_access_token(token: str) -> AuthenticatedUser:
    """Verify a Supabase ES256 access token."""

    try:
        signing_key = get_jwks_client().get_signing_key_from_jwt(
            token
        )

        claims = jwt.decode(
            token,
            signing_key.key,
            algorithms=["ES256"],
            audience="authenticated",
            issuer=JWT_ISSUER,
            options={
                "require": [
                    "exp",
                    "iat",
                    "iss",
                    "aud",
                    "sub",
                ]
            },
            leeway=30,
        )

        if claims.get("role") != "authenticated":
            raise jwt.InvalidTokenError(
                "Invalid Supabase authentication role"
            )

        user_id = UUID(claims["sub"])

        return AuthenticatedUser(
            id=user_id,
            email=claims.get("email"),
        )

    except (jwt.PyJWTError, ValueError, KeyError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from None


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(
        bearer_scheme
    ),
) -> AuthenticatedUser:
    """Require a valid Supabase access token."""

    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return verify_access_token(credentials.credentials)
