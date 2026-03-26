import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import api from '../../utils/api';
import Spinner from '../../components/common/Spinner';

const Analytics = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/submissions/analytics')
      .then(({ data }) => setData(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const totalAssignments = data.length;
  const avgCompletion = data.length
    ? Math.round(data.reduce((sum, d) => sum + d.completion_rate, 0) / data.length)
    : 0;
  const fullyCompleted = data.filter((d) => d.completion_rate === 100).length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">📊 Analytics Dashboard</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-blue-50 rounded-xl p-5">
          <div className="text-3xl font-bold text-blue-600">{totalAssignments}</div>
          <div className="text-sm text-blue-700 mt-1">Total Assignments</div>
        </div>
        <div className="bg-green-50 rounded-xl p-5">
          <div className="text-3xl font-bold text-green-600">{avgCompletion}%</div>
          <div className="text-sm text-green-700 mt-1">Avg. Completion Rate</div>
        </div>
        <div className="bg-purple-50 rounded-xl p-5">
          <div className="text-3xl font-bold text-purple-600">{fullyCompleted}</div>
          <div className="text-sm text-purple-700 mt-1">Fully Completed</div>
        </div>
      </div>

      {/* Bar chart */}
      {data.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
          <h2 className="font-semibold text-gray-700 mb-4">Completion Rate by Assignment</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 40 }}>
              <XAxis
                dataKey="title"
                tick={{ fontSize: 11 }}
                angle={-30}
                textAnchor="end"
                interval={0}
              />
              <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [`${v}%`, 'Completion Rate']} />
              <Bar dataKey="completion_rate" radius={[4, 4, 0, 0]}>
                {data.map((entry) => (
                  <Cell
                    key={entry.assignment_id}
                    fill={entry.completion_rate === 100 ? '#22c55e' : entry.completion_rate >= 50 ? '#3b82f6' : '#f59e0b'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Detail table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Per-Assignment Breakdown</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th className="px-5 py-3 text-left">Assignment</th>
              <th className="px-5 py-3 text-left">Due Date</th>
              <th className="px-5 py-3 text-left">Confirmed</th>
              <th className="px-5 py-3 text-left">Pending</th>
              <th className="px-5 py-3 text-left">Completion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((d) => (
              <tr key={d.assignment_id} className="hover:bg-gray-50">
                <td className="px-5 py-3 font-medium">{d.title}</td>
                <td className="px-5 py-3 text-gray-500">{new Date(d.due_date).toLocaleDateString()}</td>
                <td className="px-5 py-3 text-green-600 font-medium">{d.confirmed_groups}</td>
                <td className="px-5 py-3 text-yellow-600 font-medium">{d.pending_groups}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${d.completion_rate === 100 ? 'bg-green-500' : d.completion_rate >= 50 ? 'bg-blue-500' : 'bg-yellow-400'}`}
                        style={{ width: `${d.completion_rate}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium">{d.completion_rate}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Analytics;
