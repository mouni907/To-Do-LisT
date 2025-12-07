import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Config:
    GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_KEY = os.getenv("SUPABASE_KEY")

    if not GOOGLE_API_KEY:
        print("❌ Error: GOOGLE_API_KEY not found in .env file")
    if not SUPABASE_URL:
        print("❌ Error: SUPABASE_URL not found in .env file")