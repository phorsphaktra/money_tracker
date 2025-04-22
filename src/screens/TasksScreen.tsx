import React, { useState } from 'react';
import { useTaskContext } from '../contexts/TaskContext';

export const TasksScreen = () => {
  const { tasks, loading, error, addTask, updateTask, deleteTask } = useTaskContext();
  const [newTask, setNewTask] = useState({ title: '', description: '' });
  const [filter, setFilter] = useState<'all' | 'completed' | 'active'>('all');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;
    
    await addTask({
      ...newTask,
      completed: false,
      date: new Date().toISOString()
    });
    setNewTask({ title: '', description: '' });
  };

  const handleToggleTask = (taskId: string, completed: boolean) => {
    updateTask(taskId, !completed);
  };

  const handleDeleteTask = (taskId: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      deleteTask(taskId);
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'completed') return task.completed;
    if (filter === 'active') return !task.completed;
    return true;
  });

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile sidebar toggle */}
      <button 
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-blue-500 text-white rounded"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        {isSidebarOpen ? '✕' : '☰'}
      </button>

      {/* Sidebar */}
      <div className={`
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 transform transition-transform duration-200 ease-in-out
        fixed lg:static top-0 left-0 h-full z-40
      `}>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Task Tracker</h1>
          
          <form onSubmit={handleAddTask} className="mb-8 space-y-4">
            <input
              type="text"
              placeholder="Task Title"
              value={newTask.title}
              onChange={(e) => setNewTask({...newTask, title: e.target.value})}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <textarea
              placeholder="Task Description"
              value={newTask.description}
              onChange={(e) => setNewTask({...newTask, description: e.target.value})}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button 
              type="submit" 
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition"
              disabled={loading}
            >
              {loading ? 'Adding...' : 'Add Task'}
            </button>
          </form>

          {loading && (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          )}

          <div className="space-y-4">
            {filteredTasks.map(task => (
              <div 
                key={task.id} 
                className="border p-4 rounded shadow-sm hover:shadow-md transition flex items-center justify-between"
              >
                <div className="flex-1">
                  <h3 className={`text-xl ${task.completed ? 'line-through text-gray-500' : ''}`}>
                    {task.title}
                  </h3>
                  {task.description && (
                    <p className="text-gray-600 mt-1">{task.description}</p>
                  )}
                  <p className="text-sm text-gray-400 mt-2">
                    {new Date(task.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleToggleTask(task.id, task.completed)}
                    className={`px-3 py-1 rounded transition ${
                      task.completed 
                        ? 'bg-gray-500 hover:bg-gray-600' 
                        : 'bg-green-500 hover:bg-green-600'
                    } text-white`}
                  >
                    {task.completed ? 'Undo' : 'Complete'}
                  </button>
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {!loading && filteredTasks.length === 0 && (
              <p className="text-center text-gray-500">No tasks found</p>
            )}
          </div>
        </div>
      </div>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

