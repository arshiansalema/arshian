import React, { useEffect } from 'react';
import { useTasks } from '../contexts/TaskContext';
import UserAvatar from './UserAvatar';
import './ActivityFeed.css';

function ActivityFeed({ onClose }) {
  const { activities, loadActivities } = useTasks();

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  const formatTime = (date) => {
    const now = new Date();
    const activityDate = new Date(date);
    const diffInMinutes = Math.floor((now - activityDate) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className="activity-feed">
      <div className="activity-header">
        <h3>Recent Activity</h3>
        <button className="close-activity" onClick={onClose}>×</button>
      </div>
      
      <div className="activity-list">
        {activities.length === 0 ? (
          <div className="empty-activity">
            <p>No recent activity</p>
          </div>
        ) : (
          activities.map((activity) => (
            <div key={activity._id} className="activity-item">
              <div className="activity-avatar">
                <UserAvatar user={activity.actor} size="small" />
              </div>
              <div className="activity-content">
                <p className="activity-description">
                  {activity.description}
                </p>
                <span className="activity-time">
                  {formatTime(activity.timestamp)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ActivityFeed;