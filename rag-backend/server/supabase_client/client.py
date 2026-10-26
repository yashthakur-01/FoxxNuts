from supabase import Client, create_client
from dotenv import load_dotenv
import os
load_dotenv()

SupabaseUrl = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SupabaseKey = os.getenv("SUPABASE_KEY") or os.getenv("SUPABASE_SECRET_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY")


supabase: Client = create_client(
    SupabaseUrl,
    SupabaseKey,
)
