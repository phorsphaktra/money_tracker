import { useState } from 'react';
import { useTaskContext } from '../contexts/TaskContext';
import { useTaskFilters } from '../hooks/useTaskFilters';
import { TaskList } from '../components/TaskList';
import { TaskModal } from '../components/TaskModal';
import { ProjectModal } from '../components/ProjectModal';
import { Task, TaskProject, TaskStatus, TaskPriority, TaskFilters } from '../types/task';

export const TasksScreen = () => {
  // Context and state
  const { 
    tasks, 
    projects, 
    loading, 
    error: contextError, 
    addTask, 
    updateTask, 
    deleteTask, 
    addProject 
  } = useTaskContext();

  // Local state
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);
  const [selectedProject, setSelectedProject] = useState<TaskProject | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters] = useState<TaskFilters>({
    status: 'all',
    priority: 'all',
    search: '',
    assignedTo: 'all',
    dueDate: null
  });

  // Filtered tasks
  const filteredTasks = useTaskFilters(tasks, filters, selectedProject);

  // Handlers
  const handleCreateTask = async (newTask: Partial<Task>) => {
    if (!selectedProject?.id) {
      setError('Please select a project first');
      return;
    }

    try {
      const taskData: Partial<Task> = {
        ...newTask,
        projectId: selectedProject.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: newTask.status || TaskStatus.Initial,
        priority: newTask.priority || TaskPriority.Medium,
        comments: []
      };
      
      await addTask(taskData);
      setShowNewTaskForm(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
    }
  };

  const handleCreateProject = async (projectData: Omit<TaskProject, 'id'>) => {
    try {
      setError(null);
      await addProject(projectData);
      setShowNewProjectForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
    }
  };


  // Render loading state
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  // Render error state
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
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Projects</h2>
            <button
              onClick={() => setShowNewProjectForm(true)}
              className="p-2 hover:bg-gray-100 rounded-md text-blue-600"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
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

          <TaskList
            tasks={filteredTasks}
            onUpdateTask={updateTask}
            onDeleteTask={deleteTask}
          />
        </div>
      </div>

      {/* Modals */}
      {showNewTaskForm && selectedProject?.id && (
        <TaskModal
          onClose={() => setShowNewTaskForm(false)}
          onSubmit={handleCreateTask}
          projectMembers={selectedProject.members}
          projectId={selectedProject.id}
        />
      )}

      {showNewProjectForm && (
        <ProjectModal
          onClose={() => setShowNewProjectForm(false)}
          onSubmit={handleCreateProject}
        />
      )}
    </div>
  );
};

