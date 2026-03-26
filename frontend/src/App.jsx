import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Navbar from './components/common/Navbar';

// Auth pages
import Login from './pages/Login';
import Register from './pages/Register';

// Admin pages
import AdminAssignmentList from './pages/admin/AssignmentList';
import AdminAssignmentForm from './pages/admin/AssignmentForm';
import AdminAssignmentDetail from './pages/admin/AssignmentDetail';
import AdminAnalytics from './pages/admin/Analytics';
import AdminGroups from './pages/admin/Groups';

// Student pages
import StudentAssignmentList from './pages/student/AssignmentList';
import StudentGroups from './pages/student/Groups';

const AppRoot = () => {
  const { user } = useAuth();

  return (
    <BrowserRouter>
      <Navbar />
      <main>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Admin routes */}
          <Route path="/admin/assignments" element={
            <ProtectedRoute role="admin"><AdminAssignmentList /></ProtectedRoute>
          } />
          <Route path="/admin/assignments/new" element={
            <ProtectedRoute role="admin"><AdminAssignmentForm /></ProtectedRoute>
          } />
          <Route path="/admin/assignments/:id" element={
            <ProtectedRoute role="admin"><AdminAssignmentDetail /></ProtectedRoute>
          } />
          <Route path="/admin/assignments/:id/edit" element={
            <ProtectedRoute role="admin"><AdminAssignmentForm /></ProtectedRoute>
          } />
          <Route path="/admin/groups" element={
            <ProtectedRoute role="admin"><AdminGroups /></ProtectedRoute>
          } />
          <Route path="/admin/analytics" element={
            <ProtectedRoute role="admin"><AdminAnalytics /></ProtectedRoute>
          } />

          {/* Student routes */}
          <Route path="/student/assignments" element={
            <ProtectedRoute role="student"><StudentAssignmentList /></ProtectedRoute>
          } />
          <Route path="/student/groups" element={
            <ProtectedRoute role="student"><StudentGroups /></ProtectedRoute>
          } />

          {/* Default redirect */}
          <Route path="/" element={
            user
              ? <Navigate to={user.role === 'admin' ? '/admin/assignments' : '/student/assignments'} replace />
              : <Navigate to="/login" replace />
          } />

          {/* 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
};

const App = () => (
  <AuthProvider>
    <AppRoot />
  </AuthProvider>
);

export default App;
