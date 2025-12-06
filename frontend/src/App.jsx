import { useState, useEffect } from 'react'

function App() {
  const [tasks, setTasks] = useState([])
  const [newTask, setNewTask] = useState("")
  const [newDate, setNewDate] = useState("") 
  const [newCategory, setNewCategory] = useState("Personal") // Feature 1: Default Category
  
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState("")
  
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => { 
      const now = new Date();
      setCurrentTime(now); 
      checkReminders(now); 
    }, 60000); 
    
    return () => clearInterval(interval);
  }, [tasks]);

  const checkReminders = (now) => {
    tasks.forEach(t => {
      // Don't remind if it's already done or in history
      if (!t.due_date || t.is_completed) return;
      
      const taskTime = new Date(t.due_date);
      const timeDiff = Math.abs(now - taskTime);
      if (timeDiff < 60000 && taskTime > now) { 
        alert(`⏰ REMINDER: It's time to ${t.task}!`); 
      }
    })
  }

  const fetchTasks = async () => {
    try {
      const response = await fetch('http://localhost:5000/tasks');
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error("Error connecting to Flask:", error);
    }
  }

  const addTask = async () => {
    if (!newTask) return;
    const dateToSend = newDate ? new Date(newDate).toISOString() : new Date().toISOString();

    await fetch('http://localhost:5000/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Feature 1: Sending Category and default completion status
      body: JSON.stringify({ 
        task: newTask, 
        due_date: dateToSend, 
        category: newCategory, 
        is_completed: false 
      })
    });
    setNewTask(""); 
    setNewDate(""); 
    fetchTasks();   
  }

  // Feature 2: Delete Confirmation
  const deleteTask = async (id) => {
    if (window.confirm("Are you sure you want to permanently delete this task?")) {
      await fetch(`http://localhost:5000/tasks/${id}`, { method: 'DELETE' });
      fetchTasks();
    }
  }

  // Feature 3: Clear All History
  const clearHistory = async () => {
    if (window.confirm("This will delete ALL tasks in history. Are you sure?")) {
      // Loop through history tasks and delete them one by one
      // (Ideally, your backend should have a 'delete-all' endpoint, but this works for now)
      for (const t of historyTasks) {
        await fetch(`http://localhost:5000/tasks/${t.id}`, { method: 'DELETE' });
      }
      fetchTasks();
    }
  }

  // Feature 4: Toggle Completion (Checkbox)
  const toggleComplete = async (task) => {
    const updatedStatus = !task.is_completed;
    // We optimistically update the UI locally first for speed
    const updatedTasks = tasks.map(t => t.id === task.id ? {...t, is_completed: updatedStatus} : t);
    setTasks(updatedTasks);

    await fetch(`http://localhost:5000/tasks/${task.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        task: task.task, 
        is_completed: updatedStatus 
      })
    });
    fetchTasks();
  };

  const startEditing = (task) => {
    setEditingId(task.id); 
    setEditText(task.task); 
  }

  const saveEdit = async (id) => {
    await fetch(`http://localhost:5000/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task: editText })
    });
    setEditingId(null); 
    fetchTasks();       
  }

  const nowTimestamp = currentTime.getTime();

  // LOGIC: Task is ACTIVE if (Time is Future) AND (Not Completed manually)
  const activeTasks = tasks.filter(t => {
    const isFuture = t.due_date ? new Date(t.due_date).getTime() > nowTimestamp : true;
    return isFuture && !t.is_completed; 
  });

  // LOGIC: Task is HISTORY if (Time is Past) OR (Completed manually)
  const historyTasks = tasks.filter(t => {
    const isPast = t.due_date ? new Date(t.due_date).getTime() <= nowTimestamp : false;
    return isPast || t.is_completed; 
  });

  // Helper for Category Colors
  const getCategoryColor = (cat) => {
    if (cat === 'Urgent') return '#ff4757';
    if (cat === 'Work') return '#2ed573';
    return '#1e90ff'; // Personal (Default)
  };

  const TaskRow = ({ t }) => {
    return (
      <li
        className="task-row"
        style={{ 
          backgroundColor: "rgba(0, 0, 0, 0.3)", 
          margin: "12px 0", 
          padding: "15px", 
          borderRadius: "10px",
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          color: "white", 
          border: "1px solid rgba(255, 255, 255, 0.1)", 
          backdropFilter: "blur(5px)" 
        }}
      >
        {editingId === t.id ? (
          <div style={{ display: "flex", gap: "8px", width: "100%" }}>
            <input type="text" value={editText} onChange={(e) => setEditText(e.target.value)}
              autoFocus style={{ flex: 1, padding: "8px", borderRadius: "6px", fontSize: "16px", outline: "none" }} />
            <button onClick={() => saveEdit(t.id)} style={{ cursor: "pointer", backgroundColor: "#4CAF50", color: "white", border: "none", borderRadius: "6px", padding: "8px 12px" }}>Save</button>
            <button onClick={() => setEditingId(null)} style={{ cursor: "pointer", backgroundColor: "rgba(255,255,255,0.2)", color: "white", border: "none", borderRadius: "6px", padding: "8px 12px" }}>Cancel</button>
          </div>
        ) : (
          <>
            <div style={{display: "flex", alignItems: "center", gap: "15px"}}>
              
              {/* Feature 4: Checkbox */}
              <input 
                type="checkbox" 
                checked={t.is_completed || false} 
                onChange={() => toggleComplete(t)}
                style={{ width: "20px", height: "20px", cursor: "pointer", accentColor: "#2ed573" }}
              />

              <div style={{display: "flex", flexDirection: "column"}}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ 
                      fontSize: "18px", 
                      fontWeight: "500", 
                      textDecoration: t.is_completed ? "line-through" : "none",
                      opacity: t.is_completed ? 0.6 : 1
                    }}>
                    {t.task}
                  </span>
                  
                  {/* Feature 1: Category Badge */}
                  {t.category && (
                    <span style={{
                      fontSize: "10px",
                      backgroundColor: getCategoryColor(t.category),
                      padding: "2px 8px",
                      borderRadius: "12px",
                      fontWeight: "bold",
                      textTransform: "uppercase"
                    }}>
                      {t.category}
                    </span>
                  )}
                </div>
                
                <span style={{ fontSize: "12px", color: "#ccc" }}>
                  {t.due_date ? new Date(t.due_date).toLocaleString() : ""}
                </span>
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <button title="Edit Task" onClick={() => startEditing(t)} className="btn-hover" style={{ cursor: "pointer", backgroundColor: "white", border: "none", fontSize: "16px", padding: "6px", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center" }}>✏️</button>
              <button title="Delete Task" onClick={() => deleteTask(t.id)} className="btn-hover" style={{ backgroundColor: "#d9d0d0ff", border: "none", color: "white", fontSize: "14px", cursor: "pointer", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>❌</button>
            </div>
          </>
        )}
      </li>
    );
  };

  return (
    <div style={{ 
        fontFamily: "sans-serif", 
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", 
        color: "white", 
        minHeight: "100vh", 
        width: "100%", 
        display: "flex", 
        flexDirection: "row", 
        boxSizing: "border-box",
        overflow: "hidden"
      }}>
      
      <style>{`
        body { margin: 0; padding: 0; width: 100%; overflow-x: hidden; }
        .btn-hover { transition: all 0.2s ease-in-out; opacity: 0.9; } 
        .btn-hover:hover { transform: scale(1.15); opacity: 1; }
        .input-animate { 
          border: 1px solid rgba(255, 255, 255, 0.3); 
          background: rgba(255, 255, 255, 0.1); 
          color: white; 
          transition: transform 0.2s ease, box-shadow 0.2s ease; 
        }
        .input-animate:focus { 
          background: rgba(255, 255, 255, 0.2); 
          border-color: white;
          outline: none;
          transform: scale(1.02); 
          box-shadow: 0px 0px 15px rgba(255, 255, 255, 0.5); 
        }
        .task-row { transition: background-color 0.2s ease-in-out; } 
        .history-sidebar::-webkit-scrollbar { width: 6px; }
        .history-sidebar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); borderRadius: 3px; }
      `}</style>

      {/* --- LEFT SIDEBAR: HISTORY --- */}
      <div className="history-sidebar" style={{
          width: "300px",
          minWidth: "250px",
          borderRight: "1px solid rgba(255,255,255,0.2)",
          padding: "20px",
          background: "rgba(0,0,0,0.2)",
          display: "flex",
          flexDirection: "column",
          height: "100vh"
      }}>
        <div style={{flex: 1, overflowY: "auto"}}>
          <h3 style={{ borderBottom: "1px solid rgba(255,255,255,0.3)", paddingBottom: "10px", marginTop: "0", color: "#ddd" }}>
            📜 History
          </h3>
          <p style={{fontSize: "12px", color: "#bbb", marginBottom: "20px"}}>
            Completed or Expired Tasks
          </p>
          <ul style={{ listStyle: "none", padding: 0, opacity: 0.7, filter: "grayscale(100%)" }}>
            {historyTasks.length > 0 ? (
              historyTasks.map(t => <TaskRow key={t.id} t={t} />)
            ) : (
              <p style={{opacity: 0.5, fontStyle: "italic"}}>No history yet.</p>
            )}
          </ul>
        </div>
        
        {/* Feature 3: Clear History Button */}
        {historyTasks.length > 0 && (
          <button 
            onClick={clearHistory}
            className="btn-hover"
            style={{
              marginTop: "10px",
              padding: "10px",
              background: "rgba(255, 71, 87, 0.2)",
              border: "1px solid rgba(255, 71, 87, 0.5)",
              color: "#ff4757",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "bold"
            }}
          >
            🗑 Clear History
          </button>
        )}
      </div>

      {/* --- MIDDLE SECTION: UPCOMING --- */}
      <div style={{ 
          flex: 1, 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center", 
          paddingTop: "50px",
          overflowY: "auto",
          height: "100vh"
      }}>
        <h1 style={{ marginBottom: "20px", textShadow: "0px 2px 4px rgba(0,0,0,0.3)" }}>
          TodoList Manager
        </h1>
        
        <div style={{ width: "500px", maxWidth: "90%" }}>
          <div style={{ marginBottom: "20px", display: "flex", gap: "10px", flexDirection: "column" }}>
            
            <div style={{ width: "100%" }}> 
              <input 
                type="text" 
                value={newTask} 
                onChange={(e) => setNewTask(e.target.value)} 
                onKeyDown={(e) => { if (e.key === 'Enter') addTask() }} 
                placeholder="Task Name..." 
                className="input-animate" 
                style={{ width: "100%", boxSizing: "border-box", padding: "12px", borderRadius: "8px", fontSize: "16px", outline: "none" }} 
              />
            </div>

            <div style={{display: "flex", gap: "10px"}}>
              <input
                type="datetime-local"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="input-animate"
                style={{ flex: 1, padding: "12px", borderRadius: "8px", fontSize: "16px", colorScheme: "dark", outline: "none" }}
              />
              
              {/* Feature 1: Category Selector */}
              <select 
                value={newCategory} 
                onChange={(e) => setNewCategory(e.target.value)}
                className="input-animate"
                style={{
                  padding: "12px", borderRadius: "8px", fontSize: "14px", 
                  background: "rgba(255,255,255,0.1)", color: "white", border: "1px solid rgba(255,255,255,0.3)", cursor: "pointer"
                }}
              >
                <option value="Personal" style={{color: "black"}}>Personal</option>
                <option value="Work" style={{color: "black"}}>Work</option>
                <option value="Urgent" style={{color: "black"}}>Urgent</option>
              </select>

              <button
                onClick={addTask}
                className="btn-hover"
                style={{ padding: "10px 25px", cursor: "pointer", fontWeight: "bold", border: "none", borderRadius: "8px", background: "white", color: "#764ba2", fontSize: "16px" }}
              >
                Add
              </button>
            </div>
          </div>

          <h3 style={{ borderBottom: "1px solid rgba(255,255,255,0.3)", paddingBottom: "5px" }}>
            📅 Upcoming (Future)
          </h3>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {activeTasks.length > 0 ? (
              activeTasks.map(t => <TaskRow key={t.id} t={t} />)
            ) : (
              // Feature 5: Empty State Illustration
              <div style={{ textAlign: "center", marginTop: "40px", opacity: 0.8 }}>
                <div style={{ fontSize: "50px", marginBottom: "10px" }}>🎉</div>
                <h3>All caught up!</h3>
                <p>No upcoming tasks. Enjoy your day!</p>
              </div>
            )}
          </ul>
        </div>
      </div>
      
    </div>
  )
}

export default App