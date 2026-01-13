import React, { useState, useEffect } from 'react';

const API_URL = 'http://localhost:3000/api/tasks';

export default function Home() {
  const [tasks, setTasks] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch tasks
  const fetchTasks = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setTasks(data);
      setLoading(false);
    } catch (err) {
      setError('Không thể kết nối đến server');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Add new task
  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTaskTitle })
      });

      if (res.ok) {
        const newTask = await res.json();
        setTasks([...tasks, newTask]);
        setNewTaskTitle('');
      }
    } catch (err) {
      setError('Không thể thêm task');
    }
  };

  // Toggle task completion
  const handleToggleTask = async (task) => {
    try {
      const res = await fetch(`${API_URL}/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: task.title,
          isCompleted: !task.isCompleted 
        })
      });

      if (res.ok) {
        const updatedTask = await res.json();
        setTasks(tasks.map(t => t.id === task.id ? updatedTask : t));
      }
    } catch (err) {
      setError('Không thể cập nhật task');
    }
  };

  // Delete task
  const handleDeleteTask = async (id) => {
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setTasks(tasks.filter(t => t.id !== id));
      }
    } catch (err) {
      setError('Không thể xóa task');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAddTask();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
            📝 Task Manager
          </h1>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {/* Add Task */}
          <div className="mb-6">
            <div className="flex gap-2">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Nhập task mới..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleAddTask}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                Thêm
              </button>
            </div>
          </div>

          {/* Task List */}
          <div className="space-y-2">
            {tasks.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                Chưa có task nào. Hãy thêm task mới!
              </p>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={task.isCompleted}
                    onChange={() => handleToggleTask(task)}
                    className="w-5 h-5 text-blue-500 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  />
                  <span
                    className={`flex-1 ${
                      task.isCompleted
                        ? 'line-through text-gray-400'
                        : 'text-gray-800'
                    }`}
                  >
                    {task.title}
                  </span>
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm font-medium"
                  >
                    Xóa
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Stats */}
          <div className="mt-6 pt-4 border-t border-gray-200 text-center text-sm text-gray-600">
            Tổng: {tasks.length} tasks | Hoàn thành:{' '}
            {tasks.filter((t) => t.isCompleted).length}
          </div>
        </div>
      </div>
    </div>
  );
}