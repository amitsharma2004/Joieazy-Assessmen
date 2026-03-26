import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../../components/common/Spinner';

const StudentGroups = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [addMemberEmail, setAddMemberEmail] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchGroups = async () => {
    try {
      const { data } = await api.get('/groups');
      setGroups(data);
    } catch {
      setError('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGroups(); }, []);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    setSaving(true);
    try {
      await api.post('/groups', { name: newGroupName });
      setNewGroupName('');
      setShowCreate(false);
      fetchGroups();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create group');
    } finally {
      setSaving(false);
    }
  };

  const handleAddMember = async (groupId) => {
    const email = addMemberEmail[groupId]?.trim();
    if (!email) return;
    try {
      await api.post(`/groups/${groupId}/members`, { email });
      setAddMemberEmail((prev) => ({ ...prev, [groupId]: '' }));
      fetchGroups();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add member');
    }
  };

  const handleRemoveMember = async (groupId, userId) => {
    if (!window.confirm('Remove this member?')) return;
    try {
      await api.delete(`/groups/${groupId}/members/${userId}`);
      fetchGroups();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to remove member');
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Groups</h1>
          <p className="text-sm text-gray-500 mt-0.5">{groups.length} group(s)</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
        >
          + Create Group
        </button>
      </div>

      {/* Create group form */}
      {showCreate && (
        <form onSubmit={handleCreateGroup} className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex gap-3">
          <input
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="Group name..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? '...' : 'Create'}
          </button>
          <button type="button" onClick={() => setShowCreate(false)} className="text-gray-500 hover:text-gray-700 px-2">
            ✕
          </button>
        </form>
      )}

      {error && <div className="text-red-600 text-sm mb-4">{error}</div>}

      {groups.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-5xl mb-3">👥</p>
          <p className="font-medium">No groups yet</p>
          <p className="text-sm mt-1">Create a group to collaborate with classmates</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((g) => {
            const isCreator = g.created_by === user.id;
            return (
              <div key={g.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="font-semibold text-gray-800">{g.name}</h2>
                    <p className="text-xs text-gray-400">
                      Created by {g.creator?.name} · {g.group_members?.length || 0} member(s)
                      {isCreator && <span className="ml-2 text-blue-500 font-medium">You are the creator</span>}
                    </p>
                  </div>
                </div>

                {/* Members list */}
                <div className="space-y-2 mb-3">
                  {(g.group_members || []).map((m) => (
                    <div key={m.user_id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                      <div>
                        <span className="text-sm font-medium">{m.users?.name}</span>
                        <span className="text-xs text-gray-400 ml-2">{m.users?.email}</span>
                        {m.user_id === user.id && <span className="text-xs text-blue-500 ml-2">(you)</span>}
                      </div>
                      {isCreator && m.user_id !== user.id && (
                        <button
                          onClick={() => handleRemoveMember(g.id, m.user_id)}
                          className="text-xs text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add member (creator only) */}
                {isCreator && (
                  <div className="flex gap-2 mt-2">
                    <input
                      type="email"
                      value={addMemberEmail[g.id] || ''}
                      onChange={(e) => setAddMemberEmail((prev) => ({ ...prev, [g.id]: e.target.value }))}
                      placeholder="Add member by email..."
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    <button
                      onClick={() => handleAddMember(g.id)}
                      className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-100"
                    >
                      + Add
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentGroups;
