import React, { useState } from 'react';
import './UserAvatar.css';

function UserAvatar({ 
  user, 
  size = 'medium', 
  className = '', 
  showTooltip = false,
  showOnlineStatus = false,
  onClick 
}) {
  const [imageError, setImageError] = useState(false);

  if (!user) return null;

  const sizeClass = {
    small: 'avatar-small',
    medium: 'avatar-medium',
    large: 'avatar-large',
    xlarge: 'avatar-xlarge'
  }[size];

  const getInitials = () => {
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
  };

  const getAvatarContent = () => {
    if (user.avatar && !imageError) {
      return (
        <img
          src={user.avatar}
          alt={`${user.firstName} ${user.lastName}`}
          className="avatar-image"
          onError={() => setImageError(true)}
        />
      );
    }
    
    return (
      <div className="avatar-initials">
        {getInitials()}
      </div>
    );
  };

  const avatarElement = (
    <div 
      className={`user-avatar ${sizeClass} ${className} ${onClick ? 'clickable' : ''}`}
      onClick={onClick}
      title={showTooltip ? `${user.firstName} ${user.lastName}` : undefined}
    >
      {getAvatarContent()}
      
      {showOnlineStatus && (
        <div className="online-status online"></div>
      )}
    </div>
  );

  if (showTooltip) {
    return (
      <div className="avatar-tooltip-wrapper">
        {avatarElement}
        <div className="avatar-tooltip">
          <div className="tooltip-name">{user.firstName} {user.lastName}</div>
          <div className="tooltip-username">@{user.username}</div>
        </div>
      </div>
    );
  }

  return avatarElement;
}

export default UserAvatar;