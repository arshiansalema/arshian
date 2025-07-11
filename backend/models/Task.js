const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    minlength: [1, 'Task title cannot be empty'],
    maxlength: [200, 'Task title cannot exceed 200 characters'],
    validate: {
      validator: function(title) {
        // Validate that title doesn't match column names
        const columnNames = ['todo', 'in progress', 'done'];
        return !columnNames.includes(title.toLowerCase());
      },
      message: 'Task title cannot match column names (Todo, In Progress, Done)'
    }
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Task description cannot exceed 1000 characters'],
    default: ''
  },
  status: {
    type: String,
    enum: {
      values: ['todo', 'in-progress', 'done'],
      message: 'Status must be one of: todo, in-progress, done'
    },
    default: 'todo',
    required: true
  },
  priority: {
    type: String,
    enum: {
      values: ['low', 'medium', 'high', 'urgent'],
      message: 'Priority must be one of: low, medium, high, urgent'
    },
    default: 'medium',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Task must have a creator']
  },
  dueDate: {
    type: Date,
    validate: {
      validator: function(date) {
        return !date || date > new Date();
      },
      message: 'Due date must be in the future'
    }
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  position: {
    type: Number,
    default: 0
  },
  // Conflict detection fields
  version: {
    type: Number,
    default: 1
  },
  lastModified: {
    type: Date,
    default: Date.now
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isBeingEdited: {
    type: Boolean,
    default: false
  },
  editedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  editStartTime: {
    type: Date
  },
  // Attachment support
  attachments: [{
    name: String,
    url: String,
    size: Number,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Comments on tasks
  comments: [{
    text: {
      type: String,
      required: true,
      maxlength: [500, 'Comment cannot exceed 500 characters']
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Archive status
  isArchived: {
    type: Boolean,
    default: false
  },
  archivedAt: {
    type: Date
  },
  archivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
taskSchema.index({ status: 1, position: 1 });
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ createdBy: 1 });
taskSchema.index({ title: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ isArchived: 1 });
taskSchema.index({ lastModified: 1 });

// Compound index for conflict detection
taskSchema.index({ _id: 1, version: 1 });

// Virtual for overdue status
taskSchema.virtual('isOverdue').get(function() {
  return this.dueDate && this.dueDate < new Date() && this.status !== 'done';
});

// Virtual for days until due
taskSchema.virtual('daysUntilDue').get(function() {
  if (!this.dueDate) return null;
  const now = new Date();
  const timeDiff = this.dueDate.getTime() - now.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
});

// Pre-save middleware to update version and last modified
taskSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.version += 1;
    this.lastModified = new Date();
  }
  next();
});

// Static method to validate unique title
taskSchema.statics.validateUniqueTitle = async function(title, excludeId = null) {
  const query = { 
    title: new RegExp(`^${title}$`, 'i'),
    isArchived: false
  };
  
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  
  const existingTask = await this.findOne(query);
  return !existingTask;
};

// Static method to get tasks by status
taskSchema.statics.getTasksByStatus = function(status, populateFields = 'assignedTo createdBy') {
  return this.find({ status, isArchived: false })
    .populate(populateFields, 'username firstName lastName avatar')
    .sort({ position: 1, createdAt: -1 });
};

// Static method for smart assign logic
taskSchema.statics.findUserWithFewestTasks = async function() {
  const User = mongoose.model('User');
  
  // Get all active users
  const users = await User.findActiveUsers();
  
  if (users.length === 0) {
    throw new Error('No active users found');
  }
  
  // Count active tasks for each user
  const userTaskCounts = await Promise.all(
    users.map(async (user) => {
      const count = await this.countDocuments({
        assignedTo: user._id,
        status: { $in: ['todo', 'in-progress'] },
        isArchived: false
      });
      return { user, count };
    })
  );
  
  // Find minimum count
  const minCount = Math.min(...userTaskCounts.map(utc => utc.count));
  
  // Get all users with minimum count
  const usersWithMinTasks = userTaskCounts.filter(utc => utc.count === minCount);
  
  // Return random user from those with minimum tasks
  const randomIndex = Math.floor(Math.random() * usersWithMinTasks.length);
  return usersWithMinTasks[randomIndex].user;
};

// Instance method to detect conflicts
taskSchema.methods.hasConflict = function(clientVersion) {
  return this.version > clientVersion;
};

// Instance method to start edit session
taskSchema.methods.startEdit = function(userId) {
  this.isBeingEdited = true;
  this.editedBy = userId;
  this.editStartTime = new Date();
  return this.save();
};

// Instance method to end edit session
taskSchema.methods.endEdit = function() {
  this.isBeingEdited = false;
  this.editedBy = undefined;
  this.editStartTime = undefined;
  return this.save();
};

// Instance method to add comment
taskSchema.methods.addComment = function(text, authorId) {
  this.comments.push({
    text,
    author: authorId,
    createdAt: new Date()
  });
  return this.save();
};

// Instance method to archive task
taskSchema.methods.archive = function(userId) {
  this.isArchived = true;
  this.archivedAt = new Date();
  this.archivedBy = userId;
  return this.save();
};

module.exports = mongoose.model('Task', taskSchema);