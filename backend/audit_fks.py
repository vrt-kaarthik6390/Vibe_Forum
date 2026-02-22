import os
import asyncio
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

async def audit():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    supabase: Client = create_client(url, key)

    dummy_id = "00000000-0000-0000-0000-000000000000"
    
    tables = [
        ("comments", {"post_id": dummy_id, "user_id": dummy_id, "body": "test"}),
        ("reactions", {"post_id": dummy_id, "user_id": dummy_id, "type": "upvote"}),
        ("friendships", {"requester_id": dummy_id, "addressee_id": dummy_id}),
        ("groups", {"name": "Test Group", "created_by": dummy_id}),
    ]
    
    for table, data in tables:
        try:
            res = supabase.table(table).insert(data).execute()
        except Exception as e:
            msg = str(e)
            target = "profiles"
            if "table \"users\"" in msg: target = "users"
            print(f"{table} -> {target}")

if __name__ == "__main__":
    asyncio.run(audit())
