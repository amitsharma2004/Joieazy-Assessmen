import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Wraps routes that require authentication.
 * If role is provided, also enforces role-based access.
 */
const ProtectedRoute = ({ children, role }) => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'admin' ? '/admin/assignments' : '/student/assignments'} replace />;
  }

  return children;
};

export default ProtectedRoute;
