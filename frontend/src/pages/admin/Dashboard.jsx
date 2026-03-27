import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import Spinner from '../../components/common/Spinner';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ClipboardIcon, UsersIcon, AcademicCapIcon, ChartBarIcon, PlusIcon, SparklesIcon } from '../../components/common/Icons';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState([]);
  const [groups, setGroups]       = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/submissions/analytics'),
      api.get('/groups'),
      api.get('/assignments'),
    ]).then(([aRes, gRes, assRes]) => {
      setAnalytics(aRes.data);
      setGroups(gRes.data);
      setAssignments(assRes.data);
    }).catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const totalAssign  = assignments.length;
  const totalGroups  = groups.length;
  const totalStudents = [...new Set(groups.flatMap(g => (g.group_members || []).map(m => m.user_id)))].length;
  const avgCompletion = analytics.length
    ? Math.round(analytics.reduce((s, a) => s + a.completion_rate, 0) / analytics.length) : 0;

  // Most recent assignments
  const recent = [...assignments].sort((a,b) => new Date(b.created_at)-new Date(a.created_at)).slice(0,4);

  // Chart data (top 5 assignments by completion)
  const chartData = [...analytics].sort((a,b)=>b.completion_rate-a.completion_rate).slice(0,5);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl p-6 text-white mb-8">
        <div className="flex items-center gap-2 mb-1">
          <SparklesIcon className="w-6 h-6 text-indigo-200" />
          <h1 className="text-2xl font-bold">Welcome, {user.name}!</h1>
        </div>
        <p className="text-indigo-100 mt-1 text-sm">Here's your class overview for today.</p>
        <div className="mt-4 flex items-center gap-6 text-sm">
          <span className="text-indigo-100">Average submission rate: <strong className="text-white text-lg">{avgCompletion}%</strong></span>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Assignments',    value: totalAssign,          Icon: ClipboardIcon,    bg: 'bg-blue-50',   text: 'text-blue-600',   link: '/admin/assignments' },
          { label: 'Groups',         value: totalGroups,          Icon: UsersIcon,        bg: 'bg-purple-50', text: 'text-purple-600', link: '/admin/groups' },
          { label: 'Students',       value: totalStudents,        Icon: AcademicCapIcon,  bg: 'bg-green-50',  text: 'text-green-600',  link: '/admin/groups' },
          { label: 'Avg Completion', value: `${avgCompletion}%`,  Icon: ChartBarIcon,     bg: 'bg-orange-50', text: 'text-orange-600', link: '/admin/analytics' },
        ].map(s => (
          <Link key={s.label} to={s.link} className={`${s.bg} rounded-xl p-4 text-center hover:shadow-md transition`}>
            <s.Icon className={`w-7 h-7 ${s.text} mx-auto mb-2`} />
            <div className={`text-2xl font-bold ${s.text}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Chart */}
        {chartData.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><ChartBarIcon className="w-5 h-5 text-gray-400" /> Top Assignment Completion</h2>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 30 }}>
                <XAxis dataKey="title" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" interval={0} />
                <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 10 }} />
                <Tooltip formatter={v => [`${v}%`, 'Completion']} />
                <Bar dataKey="completion_rate" radius={[4,4,0,0]}>
                  {chartData.map(e => (
                    <Cell key={e.assignment_id}
                      fill={e.completion_rate===100?'#22c55e':e.completion_rate>=50?'#3b82f6':'#f59e0b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Recent assignments */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2"><ClipboardIcon className="w-5 h-5 text-gray-400" /> Recent Assignments</h2>
            <Link to="/admin/assignments" className="text-xs text-blue-600 hover:underline">View all</Link>
          </div>
          {recent.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No assignments yet</p>
          ) : (
            <div className="space-y-3">
              {recent.map(a => {
                const stat = analytics.find(x => x.assignment_id === a.id);
                return (
                  <Link to={`/admin/assignments/${a.id}`} key={a.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                    <div>
                      <p className="text-sm font-medium text-gray-800 line-clamp-1">{a.title}</p>
                      <p className="text-xs text-gray-400">Due {new Date(a.due_date).toLocaleDateString()}</p>
                    </div>
                    {stat && (
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        stat.completion_rate===100?'bg-green-100 text-green-700':
                        stat.completion_rate>0?'bg-yellow-100 text-yellow-700':'bg-gray-100 text-gray-600'}`}>
                        {stat.completion_rate}%
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Link to="/admin/assignments/new"
          className="flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl text-sm font-medium hover:bg-blue-700 transition">
          <PlusIcon className="w-4 h-4" /> New Assignment
        </Link>
        <Link to="/admin/assignments"
          className="flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 py-3 rounded-xl text-sm font-medium hover:bg-gray-50 transition">
          <ClipboardIcon className="w-4 h-4" /> All Assignments
        </Link>
        <Link to="/admin/groups"
          className="flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 py-3 rounded-xl text-sm font-medium hover:bg-gray-50 transition">
          <UsersIcon className="w-4 h-4" /> View Groups
        </Link>
        <Link to="/admin/analytics"
          className="flex items-center justify-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-700 py-3 rounded-xl text-sm font-medium hover:bg-indigo-100 transition">
          <ChartBarIcon className="w-4 h-4" /> Analytics
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboard;
