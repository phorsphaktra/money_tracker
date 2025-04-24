import { useState, useMemo } from 'react';
import { useTaskContext } from '../contexts/TaskContext';
import { TaskList } from '../components/TaskList';
import { TaskModal } from '../components/TaskModal';
import { Task, TaskProject } from '../types/task';

export const TasksScreen = () => {
  const { tasks, projects, loading, error: contextError, addTask, updateTask, deleteTask } = useTaskContext();
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [selectedProject, setSelectedProject] = useState<TaskProject | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [filters] = useState({
    status: 'all',
    priority: 'all',
    search: '',
    assignedTo: 'all',
    dueDate: null as Date | null
  });
  const [error, setError] = useState<string | null>(null);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (selectedProject && task.projectId !== selectedProject.id) return false;
      if (filters.status !== 'all' && task.status !== filters.status) return false;
      if (filters.priority !== 'all' && task.priority !== filters.priority) return false;
      if (filters.assignedTo !== 'all' && task.assignedTo !== filters.assignedTo) return false;
      if (filters.search) {
        const search = filters.search.toLowerCase();
        return task.title.toLowerCase().includes(search) ||
               task.description.toLowerCase().includes(search);
      }
      if (filters.dueDate) {
        const taskDate = new Date(task.dueDate);
        const filterDate = new Date(filters.dueDate);
        if (taskDate.toDateString() !== filterDate.toDateString()) return false;
      }
      return true;
    });
  }, [tasks, filters, selectedProject]);

  const handleCreateTask = async (newTask: Partial<Task>) => {
    if (!selectedProject?.id) {
      setError('Please select a project first');
      return;
    }

    try {
      setError(null);
      const taskData: Partial<Task> = {
        ...newTask,
        projectId: selectedProject.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: newTask.status || 'initial',
        priority: newTask.priority || 'Medium',
        comments: []
      };
      
      await addTask(taskData);
      setShowNewTaskForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
    }
  };

  if (contextError || error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{contextError || error}</p>
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
        fixed lg:static top-0 left-0 h-full w-64 bg-gray-50 border-r p-4 z-40
      `}>
        <h2 className="text-xl font-bold mb-4">Projects</h2>
        <div className="space-y-2">
          {projects.map(project => (
            <button
              key={project.id}
              onClick={() => setSelectedProject(project)}
              className={`w-full text-left px-3 py-2 rounded ${
                selectedProject?.id === project.id
                  ? 'bg-blue-500 text-white'
                  : 'hover:bg-gray-100'
              }`}
            >
              {project.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold">
                {selectedProject ? selectedProject.name : 'All Tasks'}
              </h1>
              {selectedProject && (
                <p className="text-gray-500 text-sm mt-1">
                  {selectedProject.members.length} members
                </p>
              )}
            </div>
            <button
              onClick={() => setShowNewTaskForm(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              disabled={!selectedProject}
            >
              New Task
            </button>
          </div>

          {/* <TaskFilters 
            filters={filters} 
            onChange={setFilters}
            projectMembers={selectedProject?.members || []}
          /> */}

          {loading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          ) : (
            <TaskList
              tasks={filteredTasks}
              onUpdateTask={updateTask}
              onDeleteTask={deleteTask}
            />
          )}
        </div>
      </div>

      {showNewTaskForm && selectedProject?.id ? (
        <TaskModal
          onClose={() => setShowNewTaskForm(false)}
          onSubmit={handleCreateTask}
          projectMembers={selectedProject.members}
          projectId={selectedProject.id}
          initialStatus="initial"
          initialPriority="Medium"
        />
      ) : null}
    </div>
  );
};


