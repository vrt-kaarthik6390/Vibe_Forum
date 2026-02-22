from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings

from routers import posts, comments, reactions, friends, groups, chat, admin, profiles, upload, notifications

app = FastAPI(
    title="Vibe Forum API",
    description="Backend API for Vibe Forum - YouTube Community Forum",
    version="1.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://localhost:5173",
        "http://localhost:5174",
        "https://*.netlify.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(posts.router, prefix="/api")
app.include_router(comments.router, prefix="/api")
app.include_router(reactions.router, prefix="/api")
app.include_router(friends.router, prefix="/api")
app.include_router(groups.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(profiles.router, prefix="/api")
app.include_router(upload.router, prefix="/api")
app.include_router(notifications.router, prefix="/api")


@app.get("/")
async def root():
    return {"message": "Vibe Forum API is running 🚀"}


@app.get("/health")
async def health():
    return {"status": "ok"}
