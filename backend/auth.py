from fastapi import HTTPException, Header
from typing import Optional
from database import supabase
from config import settings


async def get_current_user(authorization: Optional[str] = Header(None)):
    """Validate Supabase JWT and return user data."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")

    token = authorization.replace("Bearer ", "")

    print(f"DEBUG: Validating token...")
    try:
        user_response = supabase.auth.get_user(token)
        print(f"DEBUG: Auth user response: {user_response}")
        if not user_response or not user_response.user:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        print(f"DEBUG: Authenticated user ID: {user_response.user.id}")
        return user_response.user
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")


async def get_admin_user(authorization: Optional[str] = Header(None)):
    """Validate JWT AND verify the user is the super admin."""
    user = await get_current_user(authorization)
    if user.email != settings.SUPER_ADMIN_EMAIL:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user
