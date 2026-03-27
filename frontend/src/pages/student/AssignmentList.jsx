import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import Spinner from '../../components/common/Spinner';
import ConfirmModal from '../../components/student/ConfirmModal';
import { SearchIcon, CalendarIcon, LinkIcon, UserIcon, CheckCircleIcon, ClockIcon, ClipboardIcon } from '../../components/common/Icons';

const getDueBadge = (dueDate) => {
  const now  = new Date(); const due = new Date(dueDate);
  const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
  if (diff < 0)   return { label: `Overdue ${Math.abs(diff)}d`, cls: 'bg-red-100 text-red-700' };
  if (diff === 0) return { label: 'Due today!',                  cls: 'bg-orange-100 text-orange-700' };
  if (diff <= 3)  return { label: `${diff}d left`,              cls: 'bg-yellow-100 text-yellow-700' };
  return { label: `${diff}d left`, cls: 'bg-green-100 text-green-700' };
};

const StudentAssignmentList = () => {
  const [assignments, setAssignments] = useState([]);
  const [groups, setGroups]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [search, setSearch]           = useState('');
  const [filter, setFilter]           = useState('all');

  const fetchData = async () => {
    try {
      const [aRes, gRes] = await Promise.all([api.get('/assignments'), api.get('/groups')]);
      setAssignments(aRes.data); setGroups(gRes.data);
    } catch { toast.error('Failed to load assignments'); }
    finally  { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const getStatus = (a) => {
    if (a.group_submissions?.some(s => s.status==='confirmed')) return 'submitted';
    if (a.group_submissions?.some(s => s.status==='pending'))   return 'pending';
    if (new Date(a.due_date) < new Date()) return 'overdue';
    return 'active';
  };

  const filtered = assignments.filter(a => {
    const matchSearch = a.title.toLowerCase().includes(search.toLowerCase()) ||
                        a.description?.toLowerCase().includes(search.toLowerCase());
    const status = getStatus(a);
    return matchSearch && (filter==='all' || status===filter);
  });

  const total     = assignments.length;
  const confirmed = assignments.filter(a => getStatus(a)==='submitted').length;
  const pct       = total > 0 ? Math.round((confirmed/total)*100) : 0;

  if (loading) return <Spinner />;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Assignments</h1>
        <p className="text-sm text-gray-500 mt-0.5">{assignments.length} assignment(s)</p>
      </div>

      {/* Progress */}
      {total > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Overall Progress</span>
            <span className="text-sm font-bold text-blue-600">{confirmed}/{total} submitted</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div className="bg-blue-500 h-3 rounded-full transition-all" style={{ width:`${pct}%` }} />
          </div>
          <p className="text-xs text-gray-400 mt-1">{pct}% complete</p>
        </div>
      )}

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <SearchIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input type="text" value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Search assignments..."
            className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all','active','pending','submitted','overdue'].map(f => (
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
          <ClipboardIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">{search||filter!=='all'?'No matching assignments':'No assignments yet'}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(a => {
            const status    = getStatus(a);
            const dueBadge  = getDueBadge(a.due_date);
            const isPending   = status==='pending';
            const isSubmitted = status==='submitted';

            return (
              <div key={a.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h2 className="text-base font-semibold text-gray-800">{a.title}</h2>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${dueBadge.cls}`}>{dueBadge.label}</span>
                      {isSubmitted && (
                        <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                          <CheckCircleIcon className="w-3.5 h-3.5" /> Submitted
                        </span>
                      )}
                      {isPending && (
                        <span className="inline-flex items-center gap-1 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                          <ClockIcon className="w-3.5 h-3.5" /> Confirm Pending
                        </span>
                      )}
                    </div>
                    {a.description && <p className="text-sm text-gray-500 mb-2 line-clamp-2">{a.description}</p>}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="w-3.5 h-3.5" /> Due: <strong>{new Date(a.due_date).toLocaleDateString()}</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <UserIcon className="w-3.5 h-3.5" /> {a.creator_name||a.creator?.name}
                      </span>
                      {a.onedrive_link && (
                        <a href={a.onedrive_link} target="_blank" rel="noreferrer"
                          className="flex items-center gap-1 text-blue-500 hover:underline font-medium">
                          <LinkIcon className="w-3.5 h-3.5" /> Open Folder
                        </a>
                      )}
                    </div>
                  </div>

                  {!isSubmitted && groups.length > 0 && (
                    <button onClick={() => setSelectedAssignment(a)}
                      className={`ml-4 flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg font-medium transition ${
                        isPending ? 'bg-yellow-500 text-white hover:bg-yellow-600' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                      <CheckCircleIcon className="w-4 h-4" />
                      {isPending ? 'Confirm' : 'Mark Submitted'}
                    </button>
                  )}
                  {!isSubmitted && groups.length===0 && (
                    <span className="ml-4 text-xs text-gray-400 italic">Join a group first</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedAssignment && (
        <ConfirmModal
          assignment={selectedAssignment}
          groups={groups}
          onClose={() => setSelectedAssignment(null)}
          onSuccess={() => { setSelectedAssignment(null); fetchData(); toast.success('Submission confirmed!'); }}
        />
      )}
    </div>
  );
};

export default StudentAssignmentList;
