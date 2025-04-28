import React, { useState } from 'react';
import { TaskProject } from '../types/task';

const PROJECT_COLORS = [
  { name: 'Blue', value: 'bg-blue-500' },
  { name: 'Green', value: 'bg-green-500' },
  { name: 'Purple', value: 'bg-purple-500' },
  { name: 'Red', value: 'bg-red-500' },
  { name: 'Yellow', value: 'bg-yellow-500' }
];

const PROJECT_TYPES = {
  PERSONAL: 'Personal',
  WORK: 'Work',
  TEAM: 'Team',
  OTHER: 'Other'
} as const;

type ProjectType = typeof PROJECT_TYPES[keyof typeof PROJECT_TYPES];

const PROJECT_TYPE_OPTIONS = Object.values(PROJECT_TYPES);

interface ProjectModalProps {
  onClose: () => void;
  onSubmit: (project: Omit<TaskProject, 'id'>) => Promise<void>;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    members: [] as string[],
    color: 'bg-blue-500',
    type: PROJECT_TYPES.TEAM as ProjectType,
    newMemberEmail: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addMember = () => {
    const email = formData.newMemberEmail.trim();
    if (email && !formData.members.includes(email)) {
      setFormData(prev => ({
        ...prev,
        members: [...prev.members, email],
        newMemberEmail: ''
      }));
    }
  };

  const removeMember = (email: string) => {
    setFormData(prev => ({
      ...prev,
      members: prev.members.filter(m => m !== email)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = [];
    if (!formData.name.trim()) errors.push('Project name is required');
    if (formData.type !== PROJECT_TYPES.PERSONAL && formData.members.length === 0) {
      errors.push('Add at least one team member for non-personal projects');
    }

    if (errors.length > 0) {
      setError(errors.join(', '));
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        name: formData.name.trim(),
        description: formData.description.trim(),
        members: formData.type === PROJECT_TYPES.PERSONAL ? [] : formData.members,
        color: formData.color,
        type: formData.type,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active', // or any default status
        createdBy: 'system' // or replace with the actual user ID
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Create New Project</h2>
            <button type="button" onClick={onClose} className="text-gray-500">✕</button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-1">Project Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 h-24"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Project Color</label>
              <div className="flex gap-3">
                {PROJECT_COLORS.map(color => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, color: color.value }))}
                    className={`w-8 h-8 rounded-full ${color.value} ${
                      formData.color === color.value ? 'ring-2 ring-offset-2 ring-blue-600' : ''
                    }`}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Project Type</label>
              <select
                value={formData.type}
                onChange={e => setFormData(prev => ({ ...prev, type: e.target.value as ProjectType }))}
                className="w-full p-2 border rounded"
              >
                {PROJECT_TYPE_OPTIONS.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Team Members</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="email"
                  value={formData.newMemberEmail}
                  onChange={e => setFormData(prev => ({ ...prev, newMemberEmail: e.target.value }))}
                  placeholder="Enter email address"
                  className="flex-1 p-2 border rounded"
                />
                <button
                  type="button"
                  onClick={addMember}
                  className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
                >
                  Add
                </button>
              </div>
              <div className="space-y-2">
                {formData.members.map(email => (
                  <div key={email} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-sm">{email}</span>
                    <button
                      type="button"
                      onClick={() => removeMember(email)}
                      className="text-red-500 hover:text-red-700"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
