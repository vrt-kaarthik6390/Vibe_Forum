from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from auth import get_current_user
from database import supabase, supabase_admin

router = APIRouter(prefix="/profiles", tags=["profiles"])


class UpdateProfileRequest(BaseModel):
    username: Optional[str] = None
    display_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None


@router.get("/me")
async def get_my_profile(user=Depends(get_current_user)):
    result = supabase.table("profiles").select("*").eq("id", user.id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    return {**result.data, "email": user.email}


@router.patch("/me")
async def update_my_profile(body: UpdateProfileRequest, user=Depends(get_current_user)):
    updates = {k: v for k, v in body.dict().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = (
        supabase_admin.table("profiles")
        .update(updates)
        .eq("id", user.id)
        .execute()
    )
    return result.data[0] if result.data else {}


@router.get("/{user_id}")
async def get_profile(user_id: str):
    result = (
        supabase.table("profiles")
        .select("id, username, display_name, avatar_url, bio, created_at")
        .eq("id", user_id)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")

    # Get post count
    posts = (
        supabase.table("posts")
        .select("id", count="exact")
        .eq("user_id", user_id)
        .eq("is_deleted", False)
        .execute()
    )
    return {**result.data, "post_count": posts.count}


@router.get("/{user_id}/posts")
async def get_user_posts(user_id: str, page: int = 1, limit: int = 20):
    offset = (page - 1) * limit
    result = (
        supabase.table("posts")
        .select("*")
        .eq("user_id", user_id)
        .eq("is_deleted", False)
        .order("created_at", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )
    return {"posts": result.data}
