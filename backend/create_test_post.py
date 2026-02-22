import os
import asyncio
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

async def create_test_post():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    supabase: Client = create_client(url, key)

    user_id = "70c636ea-7170-4f81-9d18-1e6b4a22882a"
    
    try:
        print(f"Creating test post for user {user_id}...")
        res = supabase.table("posts").insert({
            "user_id": user_id,
            "title": "Admin Test Post",
            "body": "Testing post creation via admin script",
            "post_type": "text"
        }).execute()
        print(f"Create result: {res}")
        
    except Exception as e:
        print(f"Create error: {e}")

if __name__ == "__main__":
    asyncio.run(create_test_post())
