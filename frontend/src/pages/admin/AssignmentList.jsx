import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import Spinner from '../../components/common/Spinner';

const getDueBadge = (dueDate) => {
  const now = new Date(); const due = new Date(dueDate);
  const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
  if (diff < 0)  return <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Overdue</span>;
  if (diff <= 3) return <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Due soon</span>;
  return <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Active</span>;
};

const AssignmentList = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [search, setSearch]     = useState('');
  const [filter, setFilter]     = useState('all'); // all | active | overdue

  const fetchAssignments = async () => {
    try {
      const { data } = await api.get('/assignments');
      setAssignments(data);
    } catch { toast.error('Failed to load assignments'); }
    finally  { setLoading(false); }
  };

  useEffect(() => { fetchAssignments(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this assignment?')) return;
    setDeleting(id);
    try {
      await api.delete(`/assignments/${id}`);
      setAssignments(prev => prev.filter(a => a.id !== id));
      toast.success('Assignment deleted');
    } catch { toast.error('Failed to delete'); }
    finally  { setDeleting(null); }
  };

  // CSV Export
  const exportCSV = async () => {
    try {
      const { data: subs } = await api.get('/submissions');
      if (!subs.length) { toast('No submissions to export', { icon: 'ℹ️' }); return; }

      const rows = [['Assignment','Group','Confirmed By','Status','Date']];
      subs.forEach(s => rows.push([
        s.assignment?.title || '',
        s.group?.name || '',
        s.confirmer?.name || '',
        s.status,
        s.confirmed_at ? new Date(s.confirmed_at).toLocaleDateString() : '-'
      ]));

      const csv  = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a'); a.href = url;
      a.download = `joineazy-submissions-${new Date().toISOString().split('T')[0]}.csv`;
      a.click(); URL.revokeObjectURL(url);
      toast.success('CSV exported!');
    } catch { toast.error('Export failed'); }
  };

  const filtered = assignments.filter(a => {
    const matchSearch = a.title.toLowerCase().includes(search.toLowerCase());
    if (filter === 'overdue') return matchSearch && new Date(a.due_date) < new Date();
    if (filter === 'active')  return matchSearch && new Date(a.due_date) >= new Date();
    return matchSearch;
  });

  if (loading) return <Spinner />;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Assignments</h1>
          <p className="text-sm text-gray-500 mt-0.5">{assignments.length} total</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV}
            className="bg-green-50 text-green-700 border border-green-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-100 transition">
            📥 Export CSV
          </button>
          <Link to="/admin/assignments/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
            + New Assignment
          </Link>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Search assignments..."
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
        <div className="flex gap-2">
          {['all','active','overdue'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium border transition ${
                filter===f ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'}`}>
              {f.charAt(0).toUpperCase()+f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-5xl mb-3">📋</p>
          <p className="font-medium">{search || filter!=='all' ? 'No matching assignments' : 'No assignments yet'}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(a => (
            <div key={a.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h2 className="text-base font-semibold text-gray-800">{a.title}</h2>
                    {getDueBadge(a.due_date)}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      a.assigned_to==='all' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                      {a.assigned_to==='all' ? 'All Students' : 'Specific Groups'}
                    </span>
                  </div>

                  {a.description && <p className="text-sm text-gray-500 mb-2 line-clamp-2">{a.description}</p>}

                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>📅 Due: <strong>{new Date(a.due_date).toLocaleDateString()}</strong></span>
                    {a.onedrive_link && (
                      <a href={a.onedrive_link} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">🔗 OneDrive</a>
                    )}
                    <span>By: {a.creator?.name || a.creator_name}</span>
                  </div>

                  {a.stats && a.stats.total_groups > 0 && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span>Submission Progress</span>
                        <span>{a.stats.confirmed_groups}/{a.stats.total_groups} groups</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full transition-all"
                          style={{ width: `${(a.stats.confirmed_groups/a.stats.total_groups)*100}%` }} />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Link to={`/admin/assignments/${a.id}`}
                    className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition">View</Link>
                  <Link to={`/admin/assignments/${a.id}/edit`}
                    className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition">Edit</Link>
                  <button onClick={() => handleDelete(a.id)} disabled={deleting===a.id}
                    className="text-xs bg-red-50 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-100 transition disabled:opacity-50">
                    {deleting===a.id ? '...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AssignmentList;
