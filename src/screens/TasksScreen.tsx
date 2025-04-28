import { useState, useMemo } from 'react';
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
  const [searchQuery, setSearchQuery] = useState('');

  // Filtered tasks
  const filteredTasks = useTaskFilters(tasks, filters, selectedProject);

  // Task statistics
  const taskStats = useMemo(() => {
    return {
      total: filteredTasks.length,
      completed: filteredTasks.filter(t => t.status === 'completed').length,
      inProgress: filteredTasks.filter(t => t.status === 'in_progress').length,
      initial: filteredTasks.filter(t => t.status === 'initial').length
    };
  }, [filteredTasks]);

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


  // Render loading state with skeleton
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="space-y-4 w-full max-w-lg px-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-900">
      {/* Mobile Sidebar Toggle */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed z-50 bottom-4 right-4 p-3 rounded-full bg-indigo-600 text-white shadow-lg"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d={isSidebarOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
        </svg>
      </button>

      {/* Backdrop */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden
            transition-opacity duration-300 ease-in-out"
        />
      )}

      {/* Sidebar - replace motion.aside with regular aside */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-72 
          bg-white dark:bg-slate-800/50 backdrop-blur-xl 
          border-r border-slate-200/50 dark:border-slate-700/50
          transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Projects</h2>
            <button
              onClick={() => setShowNewProjectForm(true)}
              className="p-2 rounded-lg text-indigo-600 dark:text-indigo-400 
                hover:bg-indigo-50 dark:hover:bg-indigo-500/10
                transition-colors duration-200"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4">
            <div className="space-y-1">
              {projects.map(project => (
                <button
                  key={project.id}
                  onClick={() => setSelectedProject(project)}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200
                    ${selectedProject?.id === project.id
                      ? 'bg-gradient-to-r from-indigo-50 to-violet-50/50 dark:from-indigo-500/10 dark:to-violet-500/10 text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                >
                  <div className="font-medium">{project.name}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-500">
                    {project.members.length} members
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Header with Stats */}
          <div className="mb-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
                  {selectedProject ? selectedProject.name : 'All Tasks'}
                </h1>
                {selectedProject && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {selectedProject.members.length} team members
                  </p>
                )}
              </div>
              <button
                onClick={() => setShowNewTaskForm(true)}
                disabled={!selectedProject}
                className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-violet-500
                  hover:from-indigo-600 hover:to-violet-600
                  disabled:from-slate-400 disabled:to-slate-500
                  text-white rounded-lg shadow-sm disabled:opacity-50 
                  disabled:cursor-not-allowed transition-all duration-200"
              >
                Add New Task
              </button>
            </div>

            {/* Task Statistics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Total Tasks', value: taskStats.total, color: 'slate' },
                { label: 'Completed', value: taskStats.completed, color: 'green' },
                { label: 'In Progress', value: taskStats.inProgress, color: 'blue' },
                { label: 'Initial', value: taskStats.initial, color: 'red' },
              ].map(({ label, value, color }) => (
                <div key={label} className={`bg-${color}-50 dark:bg-${color}-500/10 
                  border border-${color}-200/50 dark:border-${color}-500/30 
                  rounded-xl p-4`}>
                  <dt className={`text-${color}-600 dark:text-${color}-400 text-sm font-medium`}>
                    {label}
                  </dt>
                  <dd className={`text-${color}-700 dark:text-${color}-300 text-2xl font-semibold`}>
                    {value}
                  </dd>
                </div>
              ))}
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="search"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200/50 
                    dark:border-slate-700/50 bg-white dark:bg-slate-800/50 
                    focus:ring-2 focus:ring-indigo-500/50 outline-none"
                />
              </div>
              {/* <div className="flex-none">
                <select className="block w-full px-4 py-2 rounded-xl border border-slate-200/50 
                  dark:border-slate-700/50 bg-white dark:bg-slate-800/50">
                  <option value="all">All Members</option>
                  {projectMembers.map(member => (
                    <option key={member.id} value={member.id}>{member.name}</option>
                  ))}
                </select>
              </div> */}
            </div>
          </div>

          {/* Task List */}
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

