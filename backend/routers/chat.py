from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
from auth import get_current_user
from database import supabase

router = APIRouter(prefix="/chat", tags=["chat"])


class SendMessageRequest(BaseModel):
    body: str
    receiver_id: Optional[str] = None  # For DMs
    group_id: Optional[str] = None     # For group chat


@router.post("/send")
async def send_message(body: SendMessageRequest, user=Depends(get_current_user)):
    if not body.receiver_id and not body.group_id:
        raise HTTPException(status_code=400, detail="Must specify receiver_id or group_id")
    if body.receiver_id and body.group_id:
        raise HTTPException(status_code=400, detail="Cannot specify both receiver_id and group_id")

    result = (
        supabase.table("messages")
        .insert({
            "sender_id": user.id,
            "receiver_id": body.receiver_id,
            "group_id": body.group_id,
            "body": body.body,
        })
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=400, detail="Failed to send message")

    # Notify DM recipient
    if body.receiver_id:
        try:
            profile = supabase.table("profiles").select("username").eq("id", user.id).single().execute()
            supabase.table("notifications").insert({
                "user_id": body.receiver_id,
                "type": "message",
                "title": "New message",
                "body": f"{profile.data['username']}: {body.body[:80]}",
                "reference_id": user.id,
            }).execute()
        except Exception:
            pass

    return result.data[0]


@router.get("/dm/{other_user_id}")
async def get_dm(other_user_id: str, user=Depends(get_current_user)):
    """Get DM conversation between current user and another user."""
    result = (
        supabase.table("messages")
        .select("*, sender:profiles!messages_sender_id_fkey(id, username, display_name, avatar_url)")
        .or_(
            f"and(sender_id.eq.{user.id},receiver_id.eq.{other_user_id}),and(sender_id.eq.{other_user_id},receiver_id.eq.{user.id})"
        )
        .order("created_at", desc=False)
        .limit(100)
        .execute()
    )
    # Mark messages as read
    supabase.table("messages").update({"is_read": True}).eq("receiver_id", user.id).eq("sender_id", other_user_id).execute()
    return {"messages": result.data}


@router.get("/group/{group_id}")
async def get_group_messages(group_id: str, user=Depends(get_current_user)):
    """Get group chat messages."""
    # Verify user is member
    member = (
        supabase.table("group_members")
        .select("id")
        .eq("group_id", group_id)
        .eq("user_id", user.id)
        .execute()
    )
    if not member.data:
        raise HTTPException(status_code=403, detail="Not a group member")

    result = (
        supabase.table("messages")
        .select("*, sender:profiles!messages_sender_id_fkey(id, username, display_name, avatar_url)")
        .eq("group_id", group_id)
        .order("created_at", desc=False)
        .limit(100)
        .execute()
    )
    return {"messages": result.data}


@router.get("/conversations")
async def get_conversations(user=Depends(get_current_user)):
    """Get list of DM conversations (unique users)."""
    result = (
        supabase.table("messages")
        .select("sender_id, receiver_id, body, created_at, sender:profiles!messages_sender_id_fkey(id, username, display_name, avatar_url), receiver:profiles!messages_receiver_id_fkey(id, username, display_name, avatar_url)")
        .or_(f"sender_id.eq.{user.id},receiver_id.eq.{user.id}")
        .is_("group_id", "null")
        .order("created_at", desc=True)
        .limit(50)
        .execute()
    )
    return {"conversations": result.data}
