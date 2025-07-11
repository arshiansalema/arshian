import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { useAuth } from './contexts/AuthContext';
import { useSocket } from './contexts/SocketContext';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import BoardPage from './pages/BoardPage';
import ProfilePage from './pages/ProfilePage';

// Components
import Navbar from './components/Navbar';
import LoadingSpinner from './components/LoadingSpinner';
import ConflictModal from './components/ConflictModal';

// Styles
import './styles/App.css';

function App() {
  const { user, loading } = useAuth();
  const { isConnected } = useSocket();

  if (loading) {
    return (
      <div className="app-loading">
        <LoadingSpinner size="large" />
        <p>Loading TodoBoard...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <AnimatePresence mode="wait">
        {user ? (
          <motion.div
            key="authenticated"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="app-authenticated"
          >
            <Navbar />
            
            {/* Connection Status */}
            {!isConnected && (
              <motion.div
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                className="connection-banner"
              >
                <span>⚠️ Connection lost. Trying to reconnect...</span>
              </motion.div>
            )}

            <main className="app-main">
              <Routes>
                <Route path="/" element={<BoardPage />} />
                <Route path="/board" element={<BoardPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>

            <ConflictModal />
          </motion.div>
        ) : (
          <motion.div
            key="unauthenticated"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="app-unauthenticated"
          >
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;