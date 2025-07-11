import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import UserAvatar from './UserAvatar';
import './Navbar.css';

function Navbar() {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { isConnected, connectedUsers } = useSocket();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo and Brand */}
        <div className="navbar-brand">
          <Link to="/" className="brand-link">
            <div className="brand-icon">📋</div>
            <span className="brand-text">TodoBoard</span>
          </Link>
          
          {/* Connection Status Indicator */}
          <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
            <div className="status-dot"></div>
            <span className="status-text">
              {isConnected ? 'Live' : 'Offline'}
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="navbar-nav">
          <Link 
            to="/board" 
            className={`nav-link ${isActiveRoute('/board') || isActiveRoute('/') ? 'active' : ''}`}
          >
            <span className="nav-icon">📊</span>
            Board
          </Link>
        </div>

        {/* Right Side */}
        <div className="navbar-right">
          {/* Connected Users Indicator */}
          {connectedUsers.length > 0 && (
            <div className="connected-users">
              <div className="users-count">
                <span className="users-icon">👥</span>
                <span className="count">{connectedUsers.length}</span>
              </div>
              <div className="users-avatars">
                {connectedUsers.slice(0, 3).map((connectedUser) => (
                  <UserAvatar
                    key={connectedUser.id}
                    user={connectedUser}
                    size="small"
                    className="connected-avatar"
                    showTooltip
                  />
                ))}
                {connectedUsers.length > 3 && (
                  <div className="more-users">+{connectedUsers.length - 3}</div>
                )}
              </div>
            </div>
          )}

          {/* User Menu */}
          <div className="user-menu-container">
            <button
              className="user-menu-trigger"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            >
              <UserAvatar user={user} size="medium" />
              <span className="user-name">{user?.firstName}</span>
              <svg 
                className={`dropdown-arrow ${isUserMenuOpen ? 'open' : ''}`}
                width="16" 
                height="16" 
                viewBox="0 0 16 16"
              >
                <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" fill="none"/>
              </svg>
            </button>

            <AnimatePresence>
              {isUserMenuOpen && (
                <motion.div
                  className="user-menu-dropdown"
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="user-info">
                    <UserAvatar user={user} size="large" />
                    <div className="user-details">
                      <div className="user-full-name">{user?.firstName} {user?.lastName}</div>
                      <div className="user-email">{user?.email}</div>
                      <div className="user-role">{user?.role}</div>
                    </div>
                  </div>
                  
                  <div className="menu-divider"></div>
                  
                  <Link 
                    to="/profile" 
                    className="menu-item"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <span className="menu-icon">👤</span>
                    Profile Settings
                  </Link>
                  
                  <div className="menu-divider"></div>
                  
                  <button 
                    className="menu-item logout-button"
                    onClick={handleLogout}
                  >
                    <span className="menu-icon">🚪</span>
                    Logout
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;