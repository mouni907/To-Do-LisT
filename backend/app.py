import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import google.generativeai as genai
from supabase import create_client, Client

# 1. Load environment variables from .env file
load_dotenv()

# 2. Get keys securely
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Check if keys are loaded
if not GOOGLE_API_KEY:
    print("❌ Error: GOOGLE_API_KEY not found in .env file")
if not SUPABASE_URL:
    print("❌ Error: SUPABASE_URL not found in .env file")

# 3. Configure Google Gemini AI
try:
    genai.configure(api_key=GOOGLE_API_KEY)
    model = genai.GenerativeModel('gemini-pro')
except Exception as e:
    print(f"Error configuring Gemini: {e}")

# 4. Configure Supabase Database
try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
except Exception as e:
    print(f"Error connecting to Supabase: {e}")

# 5. Initialize Flask App
app = Flask(__name__)
CORS(app)  # Allows your Frontend to talk to this Backend

# --- ROUTES ---

@app.route('/')
def home():
    """Simple check to see if server is running"""
    return jsonify({"message": "Backend is running successfully!"})

@app.route('/api/chat', methods=['POST'])
def chat_with_ai():
    """Route to talk to Gemini"""
    try:
        data = request.json
        user_message = data.get('message', '')

        if not user_message:
            return jsonify({"error": "No message provided"}), 400

        # Ask Gemini
        response = model.generate_content(user_message)
        
        return jsonify({"reply": response.text})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- UPDATED ROUTES BELOW (Renamed to /tasks) ---

@app.route('/tasks', methods=['GET'])  # <--- CHANGED FROM /api/todos
def get_todos():
    """Fetch tasks from Supabase"""
    try:
        # Make sure your table in Supabase is actually named 'todos'
        response = supabase.table('todos').select("*").execute()
        return jsonify(response.data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/tasks', methods=['POST']) # <--- CHANGED FROM /api/todos
def add_todo():
    """Add a new task to Supabase"""
    try:
        data = request.json
        task_text = data.get('task')
        
        # Insert into Supabase table 'todos'
        response = supabase.table('todos').insert({"task": task_text}).execute()
        return jsonify(response.data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 6. Run the App
if __name__ == '__main__':
    app.run(debug=True, port=5000)