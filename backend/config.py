import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", "")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    SUPER_ADMIN_EMAIL: str = "vrtkaarthik6@gmail.com"
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")

    class Config:
        env_file = ".env"


settings = Settings()
