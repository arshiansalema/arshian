import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { TaskProvider } from './contexts/TaskContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import BoardPage from './pages/BoardPage';
import ProfilePage from './pages/ProfilePage';
import LoadingSpinner from './components/LoadingSpinner';

// Protected Route Component
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="app-loading">
        <LoadingSpinner size="large" text="Loading..." />
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
}

// Public Route Component (redirect to board if already logged in)
function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="app-loading">
        <LoadingSpinner size="large" text="Loading..." />
      </div>
    );
  }

  return user ? <Navigate to="/board" replace /> : children;
}

// App Content (inside providers)
function AppContent() {
  return (
    <>
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          } 
        />
        <Route 
          path="/register" 
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          } 
        />

        {/* Protected Routes */}
        <Route 
          path="/board" 
          element={
            <ProtectedRoute>
              <SocketProvider>
                <TaskProvider>
                  <BoardPage />
                </TaskProvider>
              </SocketProvider>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } 
        />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/board" replace />} />
        
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/board" replace />} />
      </Routes>

      {/* Toast notifications */}
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        containerClassName=""
        containerStyle={{}}
        toastOptions={{
          // Default options for all toasts
          duration: 4000,
          style: {
            background: 'var(--background)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-lg)',
            fontSize: '0.875rem',
            padding: 'var(--spacing-md)',
            boxShadow: 'var(--shadow-lg)',
          },
          // Success toasts
          success: {
            duration: 3000,
            iconTheme: {
              primary: 'var(--success)',
              secondary: 'white',
            },
            style: {
              borderColor: 'var(--success)',
            },
          },
          // Error toasts
          error: {
            duration: 5000,
            iconTheme: {
              primary: 'var(--error)',
              secondary: 'white',
            },
            style: {
              borderColor: 'var(--error)',
            },
          },
          // Loading toasts
          loading: {
            duration: Infinity,
            iconTheme: {
              primary: 'var(--primary-500)',
              secondary: 'white',
            },
            style: {
              borderColor: 'var(--primary-500)',
            },
          },
        }}
      />
    </>
  );
}

function App() {
  return (
    <div className="app">
      <Router>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </Router>
    </div>
  );
}

export default App;