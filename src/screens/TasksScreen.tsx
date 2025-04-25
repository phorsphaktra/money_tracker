import { useState } from 'react';
import { useTaskContext } from '../contexts/TaskContext';
import { useTaskFilters } from '../hooks/useTaskFilters';
import { TaskList } from '../components/task/TaskList';
import { TaskModal } from '../components/task/TaskModal';
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
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
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
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`
        fixed lg:static top-0 left-0 h-full w-72
        bg-white shadow-lg p-6 z-40 overflow-y-auto
        transform lg:transform-none transition-transform duration-200
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800">Projects</h2>
            <button
              onClick={() => setShowNewProjectForm(true)}
              className="p-2 bg-blue-50 hover:bg-blue-100 rounded-lg text-blue-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          <div className="space-y-2">
            {projects.map(project => (
              <button
                key={project.id}
                onClick={() => setSelectedProject(project)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors
                  ${selectedProject?.id === project.id
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'hover:bg-gray-100 text-gray-700'
                  }`}
              >
                {project.name}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-x-hidden p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {selectedProject ? selectedProject.name : 'All Tasks'}
              </h1>
              {selectedProject && (
                <p className="text-gray-500 mt-1">
                  {selectedProject.members.length} team members
                </p>
              )}
            </div>
            <button
              onClick={() => setShowNewTaskForm(true)}
              disabled={!selectedProject}
              className="px-6 py-2.5 bg-blue-500 text-white rounded-lg shadow-md
                hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors"
            >
              Add New Task
            </button>
          </div>

          <TaskList
            tasks={filteredTasks}
            onUpdateTask={updateTask}
            onDeleteTask={deleteTask}
          />
        </div>
      </main>

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

