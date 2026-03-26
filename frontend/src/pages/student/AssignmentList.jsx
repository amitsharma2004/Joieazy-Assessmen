import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import Spinner from '../../components/common/Spinner';
import ConfirmModal from '../../components/student/ConfirmModal';

const StudentAssignmentList = () => {
  const [assignments, setAssignments] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState(null); // for confirm modal
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      const [aRes, gRes] = await Promise.all([
        api.get('/assignments'),
        api.get('/groups')
      ]);
      setAssignments(aRes.data);
      setGroups(gRes.data);
    } catch {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const getGroupSubmission = (assignment) => {
    return assignment.group_submissions?.[0] || null;
  };

  const statusBadge = (dueDate) => {
    const due = new Date(dueDate);
    const now = new Date();
    if (due < now) return <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Overdue</span>;
    const diff = (due - now) / (1000 * 60 * 60 * 24);
    if (diff <= 3) return <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Due soon</span>;
    return <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Active</span>;
  };

  if (loading) return <Spinner />;

  // Progress: number of confirmed submissions across all assignments
  const totalAssignments = assignments.length;
  const confirmedCount = assignments.filter((a) =>
    a.group_submissions?.some((s) => s.status === 'confirmed')
  ).length;
  const progressPct = totalAssignments > 0 ? Math.round((confirmedCount / totalAssignments) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Assignments</h1>
        <p className="text-sm text-gray-500 mt-0.5">{assignments.length} assignment(s)</p>
      </div>

      {/* Overall progress */}
      {totalAssignments > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Overall Progress</span>
            <span className="text-sm font-bold text-blue-600">{confirmedCount}/{totalAssignments} submitted</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-500 h-3 rounded-full transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">{progressPct}% complete</p>
        </div>
      )}

      {error && <div className="text-red-600 text-sm mb-4">{error}</div>}

      {assignments.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-5xl mb-3">📋</p>
          <p className="font-medium">No assignments yet</p>
          <p className="text-sm mt-1">Check back later</p>
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map((a) => {
            const sub = getGroupSubmission(a);
            const isConfirmed = sub?.status === 'confirmed';
            const isPending = sub?.status === 'pending';

            return (
              <div key={a.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h2 className="text-base font-semibold text-gray-800">{a.title}</h2>
                      {statusBadge(a.due_date)}
                      {isConfirmed && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                          ✅ Submitted
                        </span>
                      )}
                      {isPending && (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                          ⏳ Confirm Pending
                        </span>
                      )}
                    </div>

                    {a.description && (
                      <p className="text-sm text-gray-500 mb-2 line-clamp-2">{a.description}</p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>📅 Due: <strong>{new Date(a.due_date).toLocaleDateString()}</strong></span>
                      <span>By: {a.creator?.name}</span>
                      {a.onedrive_link && (
                        <a href={a.onedrive_link} target="_blank" rel="noreferrer"
                          className="text-blue-500 hover:underline font-medium">
                          🔗 Open Submission Folder
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Confirm button */}
                  {!isConfirmed && groups.length > 0 && (
                    <button
                      onClick={() => setSelectedAssignment(a)}
                      className={`ml-4 text-sm px-4 py-2 rounded-lg font-medium transition ${
                        isPending
                          ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {isPending ? 'Confirm Now ✓' : 'Mark Submitted'}
                    </button>
                  )}
                  {!isConfirmed && groups.length === 0 && (
                    <span className="ml-4 text-xs text-gray-400 italic">Join a group first</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm modal */}
      {selectedAssignment && (
        <ConfirmModal
          assignment={selectedAssignment}
          groups={groups}
          onClose={() => setSelectedAssignment(null)}
          onSuccess={() => { setSelectedAssignment(null); fetchData(); }}
        />
      )}
    </div>
  );
};

export default StudentAssignmentList;
