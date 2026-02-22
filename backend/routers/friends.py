from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from auth import get_current_user
from database import supabase

router = APIRouter(prefix="/friends", tags=["friends"])


@router.get("")
async def get_friends(user=Depends(get_current_user)):
    """Get all accepted friends."""
    result = (
        supabase.table("friendships")
        .select("*, requester:profiles!friendships_requester_id_fkey(id, username, display_name, avatar_url), addressee:profiles!friendships_addressee_id_fkey(id, username, display_name, avatar_url)")
        .or_(f"requester_id.eq.{user.id},addressee_id.eq.{user.id}")
        .eq("status", "accepted")
        .execute()
    )
    return {"friends": result.data}


@router.get("/requests")
async def get_friend_requests(user=Depends(get_current_user)):
    """Get pending incoming friend requests."""
    result = (
        supabase.table("friendships")
        .select("*, requester:profiles!friendships_requester_id_fkey(id, username, display_name, avatar_url)")
        .eq("addressee_id", user.id)
        .eq("status", "pending")
        .execute()
    )
    return {"requests": result.data}


@router.post("/request/{target_user_id}")
async def send_friend_request(target_user_id: str, user=Depends(get_current_user)):
    if target_user_id == user.id:
        raise HTTPException(status_code=400, detail="Cannot send request to yourself")

    # Check existing
    existing = (
        supabase.table("friendships")
        .select("*")
        .or_(
            f"and(requester_id.eq.{user.id},addressee_id.eq.{target_user_id}),and(requester_id.eq.{target_user_id},addressee_id.eq.{user.id})"
        )
        .execute()
    )
    if existing.data:
        raise HTTPException(status_code=400, detail="Friendship already exists")

    result = (
        supabase.table("friendships")
        .insert({"requester_id": user.id, "addressee_id": target_user_id, "status": "pending"})
        .execute()
    )

    # Notify target
    try:
        profile = supabase.table("profiles").select("username").eq("id", user.id).single().execute()
        supabase.table("notifications").insert({
            "user_id": target_user_id,
            "type": "friend_request",
            "title": "New friend request",
            "body": f"{profile.data['username']} sent you a friend request",
            "reference_id": result.data[0]["id"],
        }).execute()
    except Exception:
        pass

    return {"message": "Friend request sent"}


@router.patch("/request/{friendship_id}")
async def respond_to_request(friendship_id: str, action: str = Query(...), user=Depends(get_current_user)):
    if action not in ("accept", "reject"):
        raise HTTPException(status_code=400, detail="Invalid action")

    friendship = (
        supabase.table("friendships")
        .select("*")
        .eq("id", friendship_id)
        .eq("addressee_id", user.id)
        .single()
        .execute()
    )
    if not friendship.data:
        raise HTTPException(status_code=404, detail="Friend request not found")

    new_status = "accepted" if action == "accept" else "rejected"
    supabase.table("friendships").update({"status": new_status}).eq("id", friendship_id).execute()
    return {"message": f"Friend request {new_status}"}


@router.delete("/{friendship_id}")
async def remove_friend(friendship_id: str, user=Depends(get_current_user)):
    supabase.table("friendships").delete().eq("id", friendship_id).or_(
        f"requester_id.eq.{user.id},addressee_id.eq.{user.id}"
    ).execute()
    return {"message": "Friendship removed"}
