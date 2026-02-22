from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
from auth import get_current_user
from database import supabase, supabase_admin

router = APIRouter(prefix="/posts", tags=["posts"])


class CreatePostRequest(BaseModel):
    title: str
    body: Optional[str] = None
    image_url: Optional[str] = None
    post_type: str = "text"
    group_id: Optional[str] = None


@router.get("")
async def get_feed(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=50),
    group_id: Optional[str] = Query(None),
    sort: str = Query("new"),  # "new", "top", "hot"
):
    offset = (page - 1) * limit
    query = (
        supabase.table("posts")
        .select("*, profiles(id, username, display_name, avatar_url)")
        .eq("is_deleted", False)
    )
    if group_id:
        query = query.eq("group_id", group_id)
    else:
        query = query.is_("group_id", "null")  # Only show public feed posts

    if sort == "top":
        query = query.order("upvotes", desc=True)
    else:
        query = query.order("created_at", desc=True)

    try:
        result = query.range(offset, offset + limit - 1).execute()
        return {"posts": result.data, "page": page, "limit": limit}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.get("/{post_id}")
async def get_post(post_id: str):
    result = (
        supabase.table("posts")
        .select("*, profiles(id, username, display_name, avatar_url)")
        .eq("id", post_id)
        .eq("is_deleted", False)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Post not found")
    return result.data


@router.post("")
async def create_post(body: CreatePostRequest, user=Depends(get_current_user)):
    print(f"DEBUG: create_post called by user {user.id} with title {body.title}")
    try:
        result = (
            supabase_admin.table("posts")
            .insert({
                "user_id": user.id,
                "title": body.title,
                "body": body.body,
                "image_url": body.image_url,
                "post_type": body.post_type,
                "group_id": body.group_id,
            })
            .execute()
        )
        
        print(f"DEBUG: Create post result: {result}")
        
        if not result.data:
            # Check if there's an error in the response
            error_msg = getattr(result, 'error', 'Unknown database error')
            raise HTTPException(status_code=400, detail=f"Failed to create post: {error_msg}")
        return result.data[0]
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to create post: {str(e)}")


@router.delete("/{post_id}")
async def delete_post(post_id: str, user=Depends(get_current_user)):
    # Check ownership
    post = supabase_admin.table("posts").select("user_id").eq("id", post_id).single().execute()
    if not post.data:
        raise HTTPException(status_code=404, detail="Post not found")
    if post.data["user_id"] != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    supabase_admin.table("posts").update({"is_deleted": True}).eq("id", post_id).execute()
    return {"message": "Post deleted"}
