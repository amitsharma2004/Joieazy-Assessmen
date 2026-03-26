import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-blue-600 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="text-xl font-bold tracking-tight">
          📚 Joineazy
        </Link>

        {/* Nav links */}
        {user && (
          <div className="flex items-center gap-6">
            {isAdmin ? (
              <>
                <Link to="/admin/assignments" className="hover:text-blue-200 text-sm font-medium">Assignments</Link>
                <Link to="/admin/groups" className="hover:text-blue-200 text-sm font-medium">Groups</Link>
                <Link to="/admin/analytics" className="hover:text-blue-200 text-sm font-medium">Analytics</Link>
              </>
            ) : (
              <>
                <Link to="/student/assignments" className="hover:text-blue-200 text-sm font-medium">Assignments</Link>
                <Link to="/student/groups" className="hover:text-blue-200 text-sm font-medium">My Groups</Link>
              </>
            )}

            {/* User info + logout */}
            <div className="flex items-center gap-3 ml-4 pl-4 border-l border-blue-400">
              <span className="text-sm">
                <span className="opacity-75">Hi, </span>
                <span className="font-semibold">{user.name}</span>
                <span className="ml-1 text-xs bg-blue-500 px-2 py-0.5 rounded-full uppercase">
                  {user.role}
                </span>
              </span>
              <button
                onClick={handleLogout}
                className="text-xs bg-white text-blue-600 px-3 py-1 rounded-full font-medium hover:bg-blue-50"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
