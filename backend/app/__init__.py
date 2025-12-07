from flask import Flask
from flask_cors import CORS
from supabase import create_client, Client
import google.generativeai as genai
from app.config import Config

# 1. Initialize Flask App
app = Flask(__name__)
CORS(app)

# 2. Configure Google Gemini AI
try:
    genai.configure(api_key=Config.GOOGLE_API_KEY)
    model = genai.GenerativeModel('gemini-pro')
except Exception as e:
    print(f"Error configuring Gemini: {e}")
    model = None

# 3. Configure Supabase Database
supabase: Client = None
try:
    supabase = create_client(Config.SUPABASE_URL, Config.SUPABASE_KEY)
except Exception as e:
    print(f"Error connecting to Supabase: {e}")

# 4. Import Routes (MUST be at the bottom to avoid circular imports)
from app import routes