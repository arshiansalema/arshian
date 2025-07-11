const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  action: {
    type: String,
    required: [true, 'Action is required'],
    enum: [
      'task_created',
      'task_updated',
      'task_deleted',
      'task_assigned',
      'task_unassigned',
      'task_moved',
      'task_commented',
      'task_archived',
      'task_unarchived',
      'user_registered',
      'user_login',
      'user_logout',
      'conflict_detected',
      'conflict_resolved',
      'smart_assign'
    ]
  },
  actor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Actor is required']
  },
  target: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'targetModel'
  },
  targetModel: {
    type: String,
    enum: ['Task', 'User'],
    required: function() {
      return this.target != null;
    }
  },
  details: {
    // Previous values for updates
    previous: mongoose.Schema.Types.Mixed,
    // New values for updates
    current: mongoose.Schema.Types.Mixed,
    // Additional context
    metadata: mongoose.Schema.Types.Mixed
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  // IP address for security logging
  ipAddress: {
    type: String,
    validate: {
      validator: function(ip) {
        // Basic IP validation (IPv4 and IPv6)
        const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
        return !ip || ipv4Regex.test(ip) || ipv6Regex.test(ip) || ip === 'localhost' || ip === '::1';
      },
      message: 'Invalid IP address format'
    }
  },
  userAgent: {
    type: String,
    maxlength: [500, 'User agent cannot exceed 500 characters']
  },
  // Categorization
  category: {
    type: String,
    enum: ['task', 'user', 'system', 'security'],
    default: 'task'
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low'
  },
  // For conflict tracking
  conflictId: {
    type: String,
    sparse: true
  },
  isResolved: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
activitySchema.index({ createdAt: -1 });
activitySchema.index({ actor: 1, createdAt: -1 });
activitySchema.index({ target: 1, createdAt: -1 });
activitySchema.index({ action: 1, createdAt: -1 });
activitySchema.index({ category: 1, createdAt: -1 });
activitySchema.index({ conflictId: 1 });

// Virtual for human-readable timestamp
activitySchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else {
    return `${seconds} second${seconds > 1 ? 's' : ''} ago`;
  }
});

// Static method to log activity
activitySchema.statics.logActivity = async function(activityData) {
  try {
    const activity = new this(activityData);
    await activity.save();
    return activity;
  } catch (error) {
    console.error('Failed to log activity:', error);
    // Don't throw error as logging should not break main functionality
    return null;
  }
};

// Static method to get recent activities
activitySchema.statics.getRecentActivities = function(limit = 20, filters = {}) {
  const query = { ...filters };
  
  return this.find(query)
    .populate('actor', 'username firstName lastName avatar')
    .populate('target')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to get activities by user
activitySchema.statics.getUserActivities = function(userId, limit = 50) {
  return this.find({ actor: userId })
    .populate('target')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to get activities for a specific task
activitySchema.statics.getTaskActivities = function(taskId, limit = 20) {
  return this.find({ 
    target: taskId,
    targetModel: 'Task'
  })
    .populate('actor', 'username firstName lastName avatar')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to clean old activities (for maintenance)
activitySchema.statics.cleanOldActivities = function(daysToKeep = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  
  return this.deleteMany({ 
    createdAt: { $lt: cutoffDate },
    severity: { $in: ['low', 'medium'] }
  });
};

// Instance method to mark conflict as resolved
activitySchema.methods.markResolved = function(resolvedBy, resolution) {
  this.isResolved = true;
  this.details.resolvedBy = resolvedBy;
  this.details.resolution = resolution;
  this.details.resolvedAt = new Date();
  return this.save();
};

// Helper functions for common activity descriptions
activitySchema.statics.createDescription = function(action, actorName, details = {}) {
  const descriptions = {
    task_created: `${actorName} created task "${details.taskTitle}"`,
    task_updated: `${actorName} updated task "${details.taskTitle}"`,
    task_deleted: `${actorName} deleted task "${details.taskTitle}"`,
    task_assigned: `${actorName} assigned task "${details.taskTitle}" to ${details.assigneeName}`,
    task_unassigned: `${actorName} unassigned task "${details.taskTitle}"`,
    task_moved: `${actorName} moved task "${details.taskTitle}" from ${details.fromStatus} to ${details.toStatus}`,
    task_commented: `${actorName} commented on task "${details.taskTitle}"`,
    task_archived: `${actorName} archived task "${details.taskTitle}"`,
    task_unarchived: `${actorName} unarchived task "${details.taskTitle}"`,
    user_registered: `${actorName} registered as a new user`,
    user_login: `${actorName} logged in`,
    user_logout: `${actorName} logged out`,
    conflict_detected: `Conflict detected on task "${details.taskTitle}" between ${actorName} and ${details.otherUser}`,
    conflict_resolved: `${actorName} resolved conflict on task "${details.taskTitle}" using ${details.resolution}`,
    smart_assign: `Smart assign allocated task "${details.taskTitle}" to ${details.assigneeName}`
  };

  return descriptions[action] || `${actorName} performed ${action}`;
};

module.exports = mongoose.model('Activity', activitySchema);