import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import Spinner from '../../components/common/Spinner';

const getDueBadge = (dueDate) => {
  const now = new Date();
  const due = new Date(dueDate);
  const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
  if (diff < 0)  return { label: `Overdue by ${Math.abs(diff)}d`, cls: 'bg-red-100 text-red-700' };
  if (diff === 0) return { label: 'Due today!', cls: 'bg-orange-100 text-orange-700' };
  if (diff <= 3) return { label: `${diff}d left`, cls: 'bg-yellow-100 text-yellow-700' };
  return { label: `${diff}d left`, cls: 'bg-green-100 text-green-700' };
};

const StudentDashboard = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [groups, setGroups]           = useState([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    Promise.all([api.get('/assignments'), api.get('/groups')])
      .then(([aRes, gRes]) => { setAssignments(aRes.data); setGroups(gRes.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const total     = assignments.length;
  const confirmed = assignments.filter(a => a.group_submissions?.some(s => s.status === 'confirmed')).length;
  const pending   = assignments.filter(a => a.group_submissions?.some(s => s.status === 'pending')).length;
  const notStarted = total - confirmed - pending;
  const progress  = total > 0 ? Math.round((confirmed / total) * 100) : 0;

  // Upcoming: not confirmed, sorted by due date asc
  const upcoming = [...assignments]
    .filter(a => !a.group_submissions?.some(s => s.status === 'confirmed'))
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
    .slice(0, 4);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white mb-8">
        <h1 className="text-2xl font-bold">👋 Welcome back, {user.name}!</h1>
        <p className="text-blue-100 mt-1 text-sm">Here's your assignment progress overview.</p>

        {/* Overall progress bar */}
        <div className="mt-5">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-blue-100">Overall Completion</span>
            <span className="font-bold">{progress}%</span>
          </div>
          <div className="w-full bg-blue-500 rounded-full h-3">
            <div className="bg-white h-3 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-blue-100 text-xs mt-1">{confirmed} of {total} assignments submitted</p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total',       value: total,      icon: '📋', bg: 'bg-blue-50',   text: 'text-blue-600' },
          { label: 'Submitted',   value: confirmed,  icon: '✅', bg: 'bg-green-50',  text: 'text-green-600' },
          { label: 'Pending',     value: pending,    icon: '⏳', bg: 'bg-yellow-50', text: 'text-yellow-600' },
          { label: 'My Groups',   value: groups.length, icon: '👥', bg: 'bg-purple-50', text: 'text-purple-600' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl p-4 text-center`}>
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className={`text-2xl font-bold ${s.text}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Upcoming deadlines */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">⏰ Upcoming Deadlines</h2>
            <Link to="/student/assignments" className="text-xs text-blue-600 hover:underline">View all</Link>
          </div>

          {upcoming.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">🎉 All caught up!</p>
          ) : (
            <div className="space-y-3">
              {upcoming.map(a => {
                const badge = getDueBadge(a.due_date);
                return (
                  <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-800 line-clamp-1">{a.title}</p>
                      <p className="text-xs text-gray-400">{new Date(a.due_date).toLocaleDateString()}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${badge.cls}`}>{badge.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* My groups */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">👥 My Groups</h2>
            <Link to="/student/groups" className="text-xs text-blue-600 hover:underline">Manage</Link>
          </div>

          {groups.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-gray-400">No groups yet</p>
              <Link to="/student/groups"
                className="mt-2 inline-block text-xs bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                Create a Group
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {groups.slice(0, 4).map(g => (
                <div key={g.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{g.name}</p>
                    <p className="text-xs text-gray-400">{g.group_members?.length || 0} members</p>
                  </div>
                  {g.created_by === user.id &&
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Creator</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3">
        <Link to="/student/assignments"
          className="bg-blue-600 text-white text-center py-3 rounded-xl text-sm font-medium hover:bg-blue-700 transition">
          📋 View Assignments
        </Link>
        <Link to="/student/groups"
          className="bg-white border border-gray-200 text-gray-700 text-center py-3 rounded-xl text-sm font-medium hover:bg-gray-50 transition">
          👥 Manage Groups
        </Link>
        <Link to="/student/assignments"
          className="bg-green-50 border border-green-200 text-green-700 text-center py-3 rounded-xl text-sm font-medium hover:bg-green-100 transition">
          ✅ Confirm Submissions
        </Link>
      </div>
    </div>
  );
};

export default StudentDashboard;
