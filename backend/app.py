from flask import Flask, jsonify, request
from flask_cors import CORS
from supabase import create_client, Client

app = Flask(__name__)
CORS(app)

# --- YOUR KEYS ---
# PASTE YOUR REAL SUPABASE KEYS HERE
url = "https://ldkjaykrpojinkyrnbzo.supabase.co"
# Make sure your long key is pasted here inside the quotes:
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxka2pheWtycG9qaW5reXJuYnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5OTM5OTAsImV4cCI6MjA4MDU2OTk5MH0.ssfBi8iLDstNWMLgg8g4NGw7w3N14jdfzrsTW_f0FNg" 
# -----------------

supabase: Client = create_client(url, key)

@app.route('/tasks', methods=['GET'])
def get_tasks():
    # Fetch all tasks, ordered by due_date so soonest are first
    response = supabase.table('todos').select("*").order('due_date', desc=False).execute()
    return jsonify(response.data)

@app.route('/tasks', methods=['POST'])
def add_task():
    data = request.json
    # Insert task AND the selected due_date
    response = supabase.table('todos').insert({
        "task": data['task'], 
        "due_date": data.get('due_date') # Use .get() in case it's empty
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

if __name__ == '__main__':
    app.run(port=5000)