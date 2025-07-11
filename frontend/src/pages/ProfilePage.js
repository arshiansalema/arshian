import React from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';
import UserAvatar from '../components/UserAvatar';

function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="profile-page">
      <Navbar />
      <div className="profile-content">
        <div className="profile-header">
          <UserAvatar user={user} size="xlarge" />
          <div className="profile-info">
            <h1>{user?.firstName} {user?.lastName}</h1>
            <p>@{user?.username}</p>
            <p>{user?.email}</p>
          </div>
        </div>
        <div className="profile-section">
          <h2>Settings</h2>
          <p>Profile settings coming soon...</p>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;