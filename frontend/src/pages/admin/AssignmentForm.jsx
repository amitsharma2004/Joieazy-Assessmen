import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../utils/api';
import Spinner from '../../components/common/Spinner';

const AssignmentForm = () => {
  const { id } = useParams(); // undefined = create, id = edit
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    title: '',
    description: '',
    due_date: '',
    onedrive_link: '',
    assigned_to: 'all',
    group_ids: []
  });
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Fetch all groups for the selector
  useEffect(() => {
    api.get('/groups').then(({ data }) => setGroups(data)).catch(() => {});
  }, []);

  // If editing, prefill form
  useEffect(() => {
    if (!isEdit) return;
    api.get(`/assignments/${id}`)
      .then(({ data }) => {
        setForm({
          title: data.title,
          description: data.description || '',
          due_date: data.due_date,
          onedrive_link: data.onedrive_link || '',
          assigned_to: data.assigned_to,
          group_ids: (data.assignment_groups || []).map((ag) => ag.group_id)
        });
      })
      .catch(() => setError('Failed to load assignment'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleGroupToggle = (gid) => {
    setForm((prev) => ({
      ...prev,
      group_ids: prev.group_ids.includes(gid)
        ? prev.group_ids.filter((g) => g !== gid)
        : [...prev.group_ids, gid]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.title.trim() || !form.due_date) {
      return setError('Title and due date are required');
    }
    if (form.assigned_to === 'specific' && form.group_ids.length === 0) {
      return setError('Select at least one group when assigning to specific groups');
    }

    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/assignments/${id}`, form);
      } else {
        await api.post('/assignments', form);
      }
      navigate('/admin/assignments');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save assignment');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h1 className="text-xl font-bold text-gray-800 mb-6">
          {isEdit ? '✏️ Edit Assignment' : '➕ New Assignment'}
        </h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Assignment title"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Assignment details and instructions..."
            />
          </div>

          {/* Due date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
            <input
              type="date"
              required
              value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* OneDrive Link */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">OneDrive Submission Link</label>
            <input
              type="url"
              value={form.onedrive_link}
              onChange={(e) => setForm({ ...form, onedrive_link: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://onedrive.live.com/..."
            />
          </div>

          {/* Assign to */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
            <select
              value={form.assigned_to}
              onChange={(e) => setForm({ ...form, assigned_to: e.target.value, group_ids: [] })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Students</option>
              <option value="specific">Specific Groups</option>
            </select>
          </div>

          {/* Group selector (specific only) */}
          {form.assigned_to === 'specific' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Groups</label>
              {groups.length === 0 ? (
                <p className="text-sm text-gray-400">No groups created yet</p>
              ) : (
                <div className="border border-gray-200 rounded-lg divide-y max-h-48 overflow-y-auto">
                  {groups.map((g) => (
                    <label key={g.id} className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.group_ids.includes(g.id)}
                        onChange={() => handleGroupToggle(g.id)}
                        className="rounded text-blue-600"
                      />
                      <span className="text-sm font-medium">{g.name}</span>
                      <span className="text-xs text-gray-400">{g.group_members?.length || 0} members</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-60 transition"
            >
              {saving ? 'Saving...' : isEdit ? 'Update Assignment' : 'Create Assignment'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/assignments')}
              className="px-6 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignmentForm;
