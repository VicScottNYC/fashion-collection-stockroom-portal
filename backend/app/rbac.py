import os
from enum import Enum
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from supabase import Client, create_client

from app.auth import AuthenticatedUser, get_current_user


BACKEND_DIR = Path(__file__).resolve().parent.parent
load_dotenv(dotenv_path=BACKEND_DIR / ".env")


class AppRole(str, Enum):
    ADMINISTRATOR = "administrator"
    INVENTORY_MANAGER = "inventory_manager"
    VIEWER = "viewer"


@lru_cache(maxsize=1)
def get_admin_client() -> Client:
    return create_client(
        os.environ["SUPABASE_URL"],
        os.environ["SUPABASE_SECRET_KEY"],
    )


def get_current_role(
    user: AuthenticatedUser = Depends(get_current_user),
) -> AppRole:
    try:
        response = (
            get_admin_client()
            .table("user_roles")
            .select("role")
            .eq("user_id", str(user.id))
            .single()
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No application role assigned.",
            )

        return AppRole(response.data["role"])

    except HTTPException:
        raise

    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid application role.",
        ) from None

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to verify application permissions.",
        ) from None


def require_roles(*allowed_roles: AppRole):
    def dependency(
        role: AppRole = Depends(get_current_role),
    ) -> AppRole:
        if role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions for this operation.",
            )

        return role

    return dependency