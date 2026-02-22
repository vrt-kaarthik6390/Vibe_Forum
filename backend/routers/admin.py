from fastapi import APIRouter, Depends, HTTPException
from auth import get_admin_user
from database import supabase_admin

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/stats")
async def get_stats(admin=Depends(get_admin_user)):
    """Dashboard stats for super admin."""
    posts = supabase_admin.table("posts").select("id", count="exact").execute()
    users = supabase_admin.table("profiles").select("id", count="exact").execute()
    comments = supabase_admin.table("comments").select("id", count="exact").execute()
    groups = supabase_admin.table("groups").select("id", count="exact").execute()
    return {
        "total_posts": posts.count,
        "total_users": users.count,
        "total_comments": comments.count,
        "total_groups": groups.count,
    }


@router.get("/posts")
async def admin_get_posts(admin=Depends(get_admin_user), page: int = 1, limit: int = 30):
    offset = (page - 1) * limit
    result = (
        supabase_admin.table("posts")
        .select("*, profiles(id, username, email)")
        .order("created_at", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )
    return {"posts": result.data}


@router.delete("/posts/{post_id}")
async def admin_delete_post(post_id: str, admin=Depends(get_admin_user)):
    """Admin can hard-delete any post."""
    supabase_admin.table("posts").update({"is_deleted": True}).eq("id", post_id).execute()
    return {"message": "Post deleted by admin"}


@router.delete("/comments/{comment_id}")
async def admin_delete_comment(comment_id: str, admin=Depends(get_admin_user)):
    supabase_admin.table("comments").update({"is_deleted": True}).eq("id", comment_id).execute()
    return {"message": "Comment deleted by admin"}


@router.get("/users")
async def admin_get_users(admin=Depends(get_admin_user), page: int = 1, limit: int = 30):
    offset = (page - 1) * limit
    result = (
        supabase_admin.table("profiles")
        .select("*")
        .order("created_at", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )
    return {"users": result.data}


@router.delete("/users/{user_id}")
async def admin_delete_user(user_id: str, admin=Depends(get_admin_user)):
    """Admin can delete a user account (soft delete via profile)."""
    # Delete from auth via admin client
    supabase_admin.auth.admin.delete_user(user_id)
    return {"message": "User deleted by admin"}


@router.get("/reports")
async def admin_get_reported_content(admin=Depends(get_admin_user)):
    """Get all posts and comments for review."""
    posts = (
        supabase_admin.table("posts")
        .select("*, profiles(id, username)")
        .eq("is_deleted", False)
        .order("created_at", desc=True)
        .limit(50)
        .execute()
    )
    comments = (
        supabase_admin.table("comments")
        .select("*, profiles(id, username)")
        .eq("is_deleted", False)
        .order("created_at", desc=True)
        .limit(50)
        .execute()
    )
    return {"posts": posts.data, "comments": comments.data}
