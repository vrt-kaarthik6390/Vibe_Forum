from fastapi import APIRouter, Depends
from auth import get_current_user
from database import supabase

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("")
async def get_notifications(user=Depends(get_current_user)):
    result = (
        supabase.table("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", desc=True)
        .limit(30)
        .execute()
    )
    unread = sum(1 for n in result.data if not n["is_read"])
    return {"notifications": result.data, "unread_count": unread}


@router.patch("/read")
async def mark_all_read(user=Depends(get_current_user)):
    supabase.table("notifications").update({"is_read": True}).eq("user_id", user.id).execute()
    return {"message": "All notifications marked as read"}


@router.patch("/{notification_id}/read")
async def mark_read(notification_id: str, user=Depends(get_current_user)):
    supabase.table("notifications").update({"is_read": True}).eq("id", notification_id).eq("user_id", user.id).execute()
    return {"message": "Notification marked as read"}
