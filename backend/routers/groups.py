from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
from auth import get_current_user
from database import supabase, supabase_admin

router = APIRouter(prefix="/groups", tags=["groups"])


class CreateGroupRequest(BaseModel):
    name: str
    description: Optional[str] = None
    is_public: bool = True


@router.get("")
async def list_groups(search: Optional[str] = Query(None)):
    query = supabase.table("groups").select("*, profiles(id, username, display_name, avatar_url)").order("member_count", desc=True)
    if search:
        query = query.ilike("name", f"%{search}%")
    result = query.limit(50).execute()
    return {"groups": result.data}


@router.post("")
async def create_group(body: CreateGroupRequest, user=Depends(get_current_user)):
    result = (
        supabase_admin.table("groups")
        .insert({
            "name": body.name,
            "description": body.description,
            "is_public": body.is_public,
            "created_by": user.id,
        })
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=400, detail="Failed to create group")

    group_id = result.data[0]["id"]
    # Add creator as owner
    supabase_admin.table("group_members").insert({
        "group_id": group_id,
        "user_id": user.id,
        "role": "owner",
    }).execute()

    return result.data[0]


@router.get("/{group_id}")
async def get_group(group_id: str):
    result = (
        supabase.table("groups")
        .select("*, profiles(id, username, display_name, avatar_url)")
        .eq("id", group_id)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Group not found")
    return result.data


@router.get("/{group_id}/members")
async def get_group_members(group_id: str):
    result = (
        supabase.table("group_members")
        .select("*, profiles(id, username, display_name, avatar_url)")
        .eq("group_id", group_id)
        .execute()
    )
    return {"members": result.data}


@router.post("/{group_id}/join")
async def join_group(group_id: str, user=Depends(get_current_user)):
    # Check already member
    existing = (
        supabase.table("group_members")
        .select("id")
        .eq("group_id", group_id)
        .eq("user_id", user.id)
        .execute()
    )
    if existing.data:
        raise HTTPException(status_code=400, detail="Already a member")

    supabase_admin.table("group_members").insert({"group_id": group_id, "user_id": user.id}).execute()
    
    # Get current member count and update
    group_data = supabase_admin.table("groups").select("member_count").eq("id", group_id).single().execute()
    if group_data.data:
        supabase_admin.table("groups").update({"member_count": group_data.data["member_count"] + 1}).eq("id", group_id).execute()
        
    return {"message": "Joined group"}


@router.delete("/{group_id}/leave")
async def leave_group(group_id: str, user=Depends(get_current_user)):
    supabase_admin.table("group_members").delete().eq("group_id", group_id).eq("user_id", user.id).execute()
    return {"message": "Left group"}


@router.get("/my/joined")
async def my_groups(user=Depends(get_current_user)):
    result = (
        supabase.table("group_members")
        .select("*, groups(id, name, description, avatar_url, member_count)")
        .eq("user_id", user.id)
        .execute()
    )
    return {"groups": result.data}
