from flask import Flask, jsonify, request
from flask_cors import CORS
from supabase import create_client, Client
from google import genai
from PIL import Image 

app = Flask(__name__)
CORS(app)

# =====================================================
# 1. SETUP KEYS (PASTE YOUR REAL KEYS INSIDE THE QUOTES)
# =====================================================

# SUPABASE KEYS
supabase_url = "https://ldkjaykrpojinkyrnbzo.supabase.co"
supabase_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxka2pheWtycG9qaW5reXJuYnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5OTM5OTAsImV4cCI6MjA4MDU2OTk5MH0.ssfBi8iLDstNWMLgg8g4NGw7w3N14jdfzrsTW_f0FNg" 

# GEMINI KEY (Directly here as you requested)
gemini_key = "AIzaSyCsek0lsULBJc0a6cOpccBDseIBA1O-DsI"

# =====================================================
# 2. INITIALIZE CLIENTS
# =====================================================

# Connect to Supabase
supabase: Client = create_client(supabase_url, supabase_key)

# Connect to Gemini
# We use the key directly here, so no .env file is needed
client = genai.Client(api_key=gemini_key)


# =====================================================
# 3. ROUTES
# =====================================================

# --- SUPABASE ROUTES (To-Do List) ---

@app.route('/tasks', methods=['GET'])
def get_tasks():
    # Fetch all tasks
    response = supabase.table('todos').select("*").order('due_date', desc=False).execute()
    return jsonify(response.data)

@app.route('/tasks', methods=['POST'])
def add_task():
    data = request.json
    response = supabase.table('todos').insert({
        "task": data['task'], 
        "due_date": data.get('due_date')
    }).execute()
    return jsonify(response.data)

@app.route('/tasks/<int:id>', methods=['DELETE'])
def delete_task(id):
    supabase.table('todos').delete().eq('id', id).execute()
    return jsonify({"message": "Task deleted"})

@app.route('/tasks/<int:id>', methods=['PUT'])
def update_task(id):
    data = request.json
    supabase.table('todos').update({"task": data['task']}).eq('id', id).execute()
    return jsonify({"message": "Task updated"})

# --- GEMINI ROUTE (AI) ---

@app.route('/ask-ai', methods=['POST'])
def ask_ai():
    try:
        data = request.json
        # Get the prompt from the user, or use a default one
        user_prompt = data.get('prompt', 'Hello AI')
        
        # Ask Gemini
        response = client.models.generate_content(
            model='gemini-2.0-flash', 
            contents=user_prompt
        )
        
        # Return the text back to the frontend
        return jsonify({"reply": response.text})
    
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)