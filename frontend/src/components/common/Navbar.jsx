import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  BookIcon, HomeIcon, ClipboardIcon, UsersIcon,
  ChartBarIcon, LogoutIcon, UserIcon
} from './Icons';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <nav className="bg-blue-600 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2 text-xl font-bold tracking-tight">
          <BookIcon className="w-6 h-6" />
          Joineazy
        </Link>

        {/* Nav links */}
        {user && (
          <div className="flex items-center gap-5">
            {isAdmin ? (
              <>
                <Link to="/admin/dashboard" className="flex items-center gap-1.5 hover:text-blue-200 text-sm font-medium">
                  <HomeIcon className="w-4 h-4" /> Dashboard
                </Link>
                <Link to="/admin/assignments" className="flex items-center gap-1.5 hover:text-blue-200 text-sm font-medium">
                  <ClipboardIcon className="w-4 h-4" /> Assignments
                </Link>
                <Link to="/admin/groups" className="flex items-center gap-1.5 hover:text-blue-200 text-sm font-medium">
                  <UsersIcon className="w-4 h-4" /> Groups
                </Link>
                <Link to="/admin/analytics" className="flex items-center gap-1.5 hover:text-blue-200 text-sm font-medium">
                  <ChartBarIcon className="w-4 h-4" /> Analytics
                </Link>
              </>
            ) : (
              <>
                <Link to="/student/dashboard" className="flex items-center gap-1.5 hover:text-blue-200 text-sm font-medium">
                  <HomeIcon className="w-4 h-4" /> Dashboard
                </Link>
                <Link to="/student/assignments" className="flex items-center gap-1.5 hover:text-blue-200 text-sm font-medium">
                  <ClipboardIcon className="w-4 h-4" /> Assignments
                </Link>
                <Link to="/student/groups" className="flex items-center gap-1.5 hover:text-blue-200 text-sm font-medium">
                  <UsersIcon className="w-4 h-4" /> My Groups
                </Link>
              </>
            )}

            {/* User info + logout */}
            <div className="flex items-center gap-3 ml-4 pl-4 border-l border-blue-400">
              <span className="flex items-center gap-1.5 text-sm">
                <UserIcon className="w-4 h-4 opacity-75" />
                <span className="font-semibold">{user.name}</span>
                <span className="ml-1 text-xs bg-blue-500 px-2 py-0.5 rounded-full uppercase">{user.role}</span>
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 text-xs bg-white text-blue-600 px-3 py-1 rounded-full font-medium hover:bg-blue-50"
              >
                <LogoutIcon className="w-3.5 h-3.5" /> Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
