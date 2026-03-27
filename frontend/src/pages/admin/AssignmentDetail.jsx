import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../utils/api';
import Spinner from '../../components/common/Spinner';
import { ArrowLeftIcon, PencilIcon, LinkIcon, CalendarIcon, UserIcon, CheckCircleIcon, ClockIcon } from '../../components/common/Icons';

const AssignmentDetail = () => {
  const { id } = useParams();
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/assignments/${id}`)
      .then(({ data }) => setAssignment(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Spinner />;
  if (!assignment) return <div className="text-center py-16 text-gray-400">Assignment not found</div>;

  const confirmed = assignment.submissions?.filter(s => s.status === 'confirmed') || [];
  const pending   = assignment.submissions?.filter(s => s.status === 'pending')   || [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link to="/admin/assignments" className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline mb-4">
        <ArrowLeftIcon className="w-4 h-4" /> Back to Assignments
      </Link>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800 mb-1">{assignment.title}</h1>
            {assignment.description && <p className="text-sm text-gray-500 mb-3">{assignment.description}</p>}
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1.5">
                <CalendarIcon className="w-4 h-4 text-gray-400" />
                Due: <strong>{new Date(assignment.due_date).toLocaleDateString()}</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <UserIcon className="w-4 h-4 text-gray-400" /> {assignment.creator?.name || assignment.creator_name}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                assignment.assigned_to==='all' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                {assignment.assigned_to==='all' ? 'All Students' : 'Specific Groups'}
              </span>
            </div>
            {assignment.onedrive_link && (
              <a href={assignment.onedrive_link} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1.5 mt-3 text-sm text-blue-600 hover:underline">
                <LinkIcon className="w-4 h-4" /> Open OneDrive Submission Folder
              </a>
            )}
          </div>
          <Link to={`/admin/assignments/${id}/edit`}
            className="flex items-center gap-1.5 text-sm bg-blue-50 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-100 transition">
            <PencilIcon className="w-4 h-4" /> Edit
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Confirmed', value: confirmed.length, icon: CheckCircleIcon, bg: 'bg-green-50', text: 'text-green-600' },
          { label: 'Pending',   value: pending.length,   icon: ClockIcon,       bg: 'bg-yellow-50', text: 'text-yellow-600' },
          { label: 'Total',     value: assignment.submissions?.length || 0, icon: UserIcon, bg: 'bg-gray-50', text: 'text-gray-600' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl p-4 flex items-center gap-3`}>
            <s.icon className={`w-8 h-8 ${s.text}`} />
            <div>
              <div className={`text-2xl font-bold ${s.text}`}>{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Submissions table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Group Submissions</h2>
        </div>
        {assignment.submissions?.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">No submissions yet</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-5 py-3 text-left">Group</th>
                <th className="px-5 py-3 text-left">Confirmed By</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {assignment.submissions.map(s => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium">{s.group?.name || '-'}</td>
                  <td className="px-5 py-3 text-gray-500">{s.confirmer?.name || '-'}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${
                      s.status==='confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {s.status==='confirmed'
                        ? <><CheckCircleIcon className="w-3.5 h-3.5" /> Confirmed</>
                        : <><ClockIcon className="w-3.5 h-3.5" /> Pending</>}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-500">
                    {s.confirmed_at ? new Date(s.confirmed_at).toLocaleDateString() : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AssignmentDetail;
