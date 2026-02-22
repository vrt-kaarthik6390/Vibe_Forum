from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from auth import get_current_user
from database import supabase, supabase_admin

router = APIRouter(prefix="/reactions", tags=["reactions"])


class ReactionRequest(BaseModel):
    post_id: str
    type: str  # 'upvote' or 'downvote'


@router.post("")
async def toggle_reaction(body: ReactionRequest, user=Depends(get_current_user)):
    if body.type not in ("upvote", "downvote"):
        raise HTTPException(status_code=400, detail="Invalid reaction type")

    # Check existing reaction
    existing = (
        supabase.table("reactions")
        .select("*")
        .eq("post_id", body.post_id)
        .eq("user_id", user.id)
        .execute()
    )

    if existing.data:
        current = existing.data[0]
        if current["type"] == body.type:
            # Remove reaction (toggle off)
            supabase_admin.table("reactions").delete().eq("id", current["id"]).execute()
            return {"action": "removed", "type": body.type}
        else:
            # Switch reaction
            supabase_admin.table("reactions").update({"type": body.type}).eq("id", current["id"]).execute()
            return {"action": "switched", "type": body.type}
    else:
        # New reaction
        supabase_admin.table("reactions").insert({
            "post_id": body.post_id,
            "user_id": user.id,
            "type": body.type,
        }).execute()
        return {"action": "added", "type": body.type}


@router.get("/{post_id}/my-reaction")
async def get_my_reaction(post_id: str, user=Depends(get_current_user)):
    result = (
        supabase.table("reactions")
        .select("type")
        .eq("post_id", post_id)
        .eq("user_id", user.id)
        .execute()
    )
    if result.data:
        return {"reaction": result.data[0]["type"]}
    return {"reaction": None}
