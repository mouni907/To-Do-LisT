from flask import request, jsonify
from app import app, supabase, model

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

        if model:
            response = model.generate_content(user_message)
            return jsonify({"reply": response.text})
        else:
            return jsonify({"error": "Gemini model not initialized"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- GET (Fetch) ---
@app.route('/tasks', methods=['GET'])
def get_todos():
    """Fetch tasks from Supabase and SORT them"""
    try:
        response = supabase.table('todos').select("*").order('due_date', desc=False).execute()
        return jsonify(response.data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- POST (Add) ---
@app.route('/tasks', methods=['POST'])
def add_todo():
    """Add a new task WITH DATE to Supabase"""
    try:
        data = request.json
        task_text = data.get('task')
        # Handle different date names just in case
        task_date = data.get('date') or data.get('due_date')

        response = supabase.table('todos').insert({
            "task": task_text, 
            "due_date": task_date 
        }).execute()
        
        return jsonify(response.data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- NEW: DELETE ---
@app.route('/tasks/<int:id>', methods=['DELETE'])
def delete_todo(id):
    """Delete a task by ID"""
    try:
        # Delete the row where the 'id' column matches the ID from the URL
        response = supabase.table('todos').delete().eq('id', id).execute()
        return jsonify({"message": "Task deleted", "data": response.data})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- NEW: UPDATE (Edit) ---
@app.route('/tasks/<int:id>', methods=['PUT'])
def update_todo(id):
    """Update a task's text or date"""
    try:
        data = request.json
        # This will update whatever you send (task text, date, or both)
        response = supabase.table('todos').update(data).eq('id', id).execute()
        return jsonify(response.data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500