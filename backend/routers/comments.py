from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
from auth import get_current_user
from database import supabase, supabase_admin

router = APIRouter(prefix="/comments", tags=["comments"])


class CreateCommentRequest(BaseModel):
    post_id: str
    body: str
    parent_id: Optional[str] = None


@router.get("")
async def get_comments(post_id: str = Query(...)):
    result = (
        supabase.table("comments")
        .select("*, profiles(id, username, display_name, avatar_url)")
        .eq("post_id", post_id)
        .eq("is_deleted", False)
        .order("created_at", desc=False)
        .execute()
    )
    return {"comments": result.data}


@router.post("")
async def create_comment(body: CreateCommentRequest, user=Depends(get_current_user)):
    result = (
        supabase_admin.table("comments")
        .insert({
            "post_id": body.post_id,
            "user_id": user.id,
            "parent_id": body.parent_id,
            "body": body.body,
        })
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=400, detail="Failed to create comment")

    # Create notification for post owner
    try:
        post = supabase_admin.table("posts").select("user_id, title").eq("id", body.post_id).single().execute()
        if post.data and post.data["user_id"] != user.id:
            supabase_admin.table("notifications").insert({
                "user_id": post.data["user_id"],
                "type": "comment",
                "title": "New comment on your post",
                "body": body.body[:100],
                "reference_id": body.post_id,
            }).execute()
    except Exception:
        pass

    return result.data[0]


@router.delete("/{comment_id}")
async def delete_comment(comment_id: str, user=Depends(get_current_user)):
    comment = supabase_admin.table("comments").select("user_id").eq("id", comment_id).single().execute()
    if not comment.data:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment.data["user_id"] != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    supabase_admin.table("comments").update({"is_deleted": True}).eq("id", comment_id).execute()
    return {"message": "Comment deleted"}
