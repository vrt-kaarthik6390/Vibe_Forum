from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from auth import get_current_user
from database import supabase_admin
import uuid

router = APIRouter(prefix="/upload", tags=["upload"])


@router.post("/avatar")
async def upload_avatar(file: UploadFile = File(...), user=Depends(get_current_user)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only images are allowed")

    file_ext = file.filename.split(".")[-1]
    file_path = f"{user.id}/avatar.{file_ext}"
    content = await file.read()

    result = supabase_admin.storage.from_("Avatars").upload(
        path=file_path,
        file=content,
        file_options={"content-type": file.content_type, "upsert": "true"},
    )

    public_url = supabase_admin.storage.from_("Avatars").get_public_url(file_path)

    # Update profile
    supabase_admin.table("profiles").update({"avatar_url": public_url}).eq("id", user.id).execute()

    return {"url": public_url}


@router.post("/post-image")
async def upload_post_image(file: UploadFile = File(...), user=Depends(get_current_user)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only images are allowed")

    file_ext = file.filename.split(".")[-1]
    file_name = f"{user.id}/{uuid.uuid4()}.{file_ext}"
    content = await file.read()

    supabase_admin.storage.from_("post-image").upload(
        path=file_name,
        file=content,
        file_options={"content-type": file.content_type},
    )

    public_url = supabase_admin.storage.from_("post-image").get_public_url(file_name)
    return {"url": public_url}
