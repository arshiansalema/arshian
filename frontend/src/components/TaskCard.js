import React, { useState } from 'react';
import { motion } from 'framer-motion';
import UserAvatar from './UserAvatar';
import './TaskCard.css';

const PRIORITY_CONFIG = {
  low: { label: 'Low', color: 'var(--success)', icon: '🟢' },
  medium: { label: 'Medium', color: 'var(--warning)', icon: '🟡' },
  high: { label: 'High', color: 'var(--error)', icon: '🔴' }
};

function TaskCard({ 
  task, 
  onEdit, 
  onDelete, 
  onSmartAssign, 
  isBeingEdited, 
  currentUser, 
  users 
}) {
  const [showActions, setShowActions] = useState(false);

  const formatDate = (date) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString();
  };

  const getPriorityConfig = () => {
    return PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
  };

  const isOverdue = () => {
    if (!task.dueDate) return false;
    return new Date(task.dueDate) < new Date() && task.status !== 'done';
  };

  const isAssignedToCurrentUser = () => {
    return task.assignedTo?.id === currentUser.id;
  };

  const canEdit = () => {
    return task.createdBy.id === currentUser.id || isAssignedToCurrentUser();
  };

  const priorityConfig = getPriorityConfig();
  const overdue = isOverdue();

  return (
    <motion.div
      className={`task-card ${overdue ? 'overdue' : ''} ${isBeingEdited ? 'being-edited' : ''}`}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Being Edited Indicator */}
      {isBeingEdited && (
        <div className="editing-indicator">
          <div className="editing-avatar">
            <UserAvatar user={isBeingEdited} size="small" />
          </div>
          <span className="editing-text">
            {isBeingEdited.fullName} is editing...
          </span>
        </div>
      )}

      {/* Task Header */}
      <div className="task-header">
        <div className="task-priority">
          <span 
            className="priority-indicator"
            style={{ color: priorityConfig.color }}
            title={`${priorityConfig.label} Priority`}
          >
            {priorityConfig.icon}
          </span>
        </div>

        <motion.div 
          className="task-actions"
          initial={{ opacity: 0 }}
          animate={{ opacity: showActions ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {canEdit() && (
            <button
              className="action-button edit"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              title="Edit task"
            >
              ✏️
            </button>
          )}
          
          {!task.assignedTo && (
            <button
              className="action-button smart-assign"
              onClick={(e) => {
                e.stopPropagation();
                onSmartAssign();
              }}
              title="Smart Assign"
            >
              🎯
            </button>
          )}

          {task.createdBy.id === currentUser.id && (
            <button
              className="action-button delete"
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm('Are you sure you want to delete this task?')) {
                  onDelete();
                }
              }}
              title="Delete task"
            >
              🗑️
            </button>
          )}
        </motion.div>
      </div>

      {/* Task Content */}
      <div className="task-content" onClick={onEdit}>
        <h3 className="task-title">{task.title}</h3>
        
        {task.description && (
          <p className="task-description">
            {task.description.length > 100 
              ? `${task.description.substring(0, 100)}...` 
              : task.description
            }
          </p>
        )}

        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <div className="task-tags">
            {task.tags.slice(0, 3).map((tag, index) => (
              <span key={index} className="task-tag">
                {tag}
              </span>
            ))}
            {task.tags.length > 3 && (
              <span className="task-tag more">
                +{task.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Task Footer */}
      <div className="task-footer">
        <div className="task-meta">
          {/* Due Date */}
          {task.dueDate && (
            <div className={`due-date ${overdue ? 'overdue' : ''}`}>
              <span className="due-icon">📅</span>
              <span className="due-text">{formatDate(task.dueDate)}</span>
            </div>
          )}

          {/* Comments Count */}
          {task.comments && task.comments.length > 0 && (
            <div className="comments-count">
              <span className="comment-icon">💬</span>
              <span className="comment-text">{task.comments.length}</span>
            </div>
          )}

          {/* Attachments Count */}
          {task.attachments && task.attachments.length > 0 && (
            <div className="attachments-count">
              <span className="attachment-icon">📎</span>
              <span className="attachment-text">{task.attachments.length}</span>
            </div>
          )}
        </div>

        {/* Assigned User */}
        <div className="task-assignment">
          {task.assignedTo ? (
            <div className="assigned-user">
              <UserAvatar 
                user={task.assignedTo} 
                size="small" 
                showTooltip 
              />
            </div>
          ) : (
            <div className="unassigned">
              <span className="unassigned-icon">👤</span>
            </div>
          )}
        </div>
      </div>

      {/* Version indicator for development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="version-indicator">
          v{task.version}
        </div>
      )}
    </motion.div>
  );
}

export default TaskCard;