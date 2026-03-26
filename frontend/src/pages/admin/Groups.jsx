import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import Spinner from '../../components/common/Spinner';

const AdminGroups = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/groups')
      .then(({ data }) => setGroups(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">All Groups</h1>
        <p className="text-sm text-gray-500 mt-0.5">{groups.length} group(s) total</p>
      </div>

      {groups.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-5xl mb-3">👥</p>
          <p className="font-medium">No groups yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groups.map((g) => (
            <div key={g.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-gray-800">{g.name}</h2>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  {g.group_members?.length || 0} members
                </span>
              </div>
              <p className="text-xs text-gray-400 mb-3">Created by {g.creator?.name}</p>
              <div className="space-y-1.5">
                {(g.group_members || []).map((m) => (
                  <div key={m.user_id} className="flex items-center gap-2 text-sm">
                    <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">
                      {m.users?.name?.[0]?.toUpperCase()}
                    </span>
                    <span>{m.users?.name}</span>
                    <span className="text-gray-400 text-xs">{m.users?.email}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminGroups;
