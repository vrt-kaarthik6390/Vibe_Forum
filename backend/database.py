from supabase import create_client, Client
from config import settings

# Regular client (uses anon key, respects RLS)
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)

# Admin client (uses service role key, bypasses RLS — for admin operations only)
supabase_admin: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
