const Task = require('../models/Task');
const User = require('../models/User');
const Activity = require('../models/Activity');
const { randomUUID } = require('crypto');

// Get all tasks grouped by status
const getAllTasks = async (req, res) => {
  try {
    const { status, assignedTo, priority } = req.query;
    
    // Build filter
    const filter = { isArchived: false };
    if (status) filter.status = status;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (priority) filter.priority = priority;

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'username firstName lastName avatar')
      .populate('createdBy', 'username firstName lastName avatar')
      .sort({ position: 1, createdAt: -1 });

    // Group by status
    const taskGroups = {
      todo: [],
      'in-progress': [],
      done: []
    };

    tasks.forEach(task => {
      if (taskGroups[task.status]) {
        taskGroups[task.status].push(task);
      }
    });

    res.json({
      tasks: taskGroups,
      totalCount: tasks.length
    });

  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      message: 'Error fetching tasks'
    });
  }
};

// Create a new task
const createTask = async (req, res) => {
  try {
    const taskData = {
      ...req.body,
      createdBy: req.user._id,
      lastModifiedBy: req.user._id
    };

    // Validate unique title
    const isUnique = await Task.validateUniqueTitle(taskData.title);
    if (!isUnique) {
      return res.status(400).json({
        message: 'A task with this title already exists'
      });
    }

    // If assignedTo is provided, validate the user exists
    if (taskData.assignedTo) {
      const assignedUser = await User.findById(taskData.assignedTo);
      if (!assignedUser || !assignedUser.isActive) {
        return res.status(400).json({
          message: 'Assigned user not found or inactive'
        });
      }
    }

    const task = new Task(taskData);
    await task.save();

    // Populate the task
    await task.populate('assignedTo', 'username firstName lastName avatar');
    await task.populate('createdBy', 'username firstName lastName avatar');

    // Log activity
    await Activity.logActivity({
      action: 'task_created',
      actor: req.user._id,
      target: task._id,
      targetModel: 'Task',
      description: Activity.createDescription('task_created', req.user.fullName, {
        taskTitle: task.title
      }),
      category: 'task',
      severity: 'low',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(201).json({
      message: 'Task created successfully',
      task
    });

  } catch (error) {
    console.error('Create task error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message,
        value: err.value
      }));
      
      return res.status(400).json({
        message: 'Validation error',
        errors
      });
    }

    res.status(500).json({
      message: 'Error creating task'
    });
  }
};

// Get a single task
const getTask = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id)
      .populate('assignedTo', 'username firstName lastName avatar')
      .populate('createdBy', 'username firstName lastName avatar')
      .populate('comments.author', 'username firstName lastName avatar');

    if (!task || task.isArchived) {
      return res.status(404).json({
        message: 'Task not found'
      });
    }

    res.json({ task });

  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({
      message: 'Error fetching task'
    });
  }
};

// Update a task
const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const clientVersion = updateData.version;

    const task = await Task.findById(id);

    if (!task || task.isArchived) {
      return res.status(404).json({
        message: 'Task not found'
      });
    }

    // Check for conflicts
    if (clientVersion && task.hasConflict(clientVersion)) {
      await Activity.logActivity({
        action: 'conflict_detected',
        actor: req.user._id,
        target: task._id,
        targetModel: 'Task',
        description: Activity.createDescription('conflict_detected', req.user.fullName, {
          taskTitle: task.title,
          otherUser: task.lastModifiedBy?.fullName || 'Unknown'
        }),
        category: 'task',
        severity: 'medium',
        conflictId: randomUUID(),
        isResolved: false,
        details: {
          clientVersion,
          serverVersion: task.version,
          conflictType: 'version_mismatch'
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      return res.status(409).json({
        message: 'Conflict detected: Task has been modified by another user',
        conflict: {
          clientVersion,
          serverVersion: task.version,
          serverTask: task,
          lastModifiedBy: task.lastModifiedBy
        }
      });
    }

    // Validate unique title if title is being updated
    if (updateData.title && updateData.title !== task.title) {
      const isUnique = await Task.validateUniqueTitle(updateData.title, id);
      if (!isUnique) {
        return res.status(400).json({
          message: 'A task with this title already exists'
        });
      }
    }

    // If assignedTo is being updated, validate the user
    if (updateData.assignedTo && updateData.assignedTo !== task.assignedTo?.toString()) {
      const assignedUser = await User.findById(updateData.assignedTo);
      if (!assignedUser || !assignedUser.isActive) {
        return res.status(400).json({
          message: 'Assigned user not found or inactive'
        });
      }
    }

    // Store previous values for activity logging
    const previousValues = {
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      assignedTo: task.assignedTo,
      dueDate: task.dueDate,
      tags: task.tags
    };

    // Update task
    Object.assign(task, updateData);
    task.lastModifiedBy = req.user._id;
    task.lastModified = new Date();

    await task.save();

    // Populate the updated task
    await task.populate('assignedTo', 'username firstName lastName avatar');
    await task.populate('createdBy', 'username firstName lastName avatar');

    // Log activity
    await Activity.logActivity({
      action: 'task_updated',
      actor: req.user._id,
      target: task._id,
      targetModel: 'Task',
      description: Activity.createDescription('task_updated', req.user.fullName, {
        taskTitle: task.title
      }),
      category: 'task',
      severity: 'low',
      details: {
        previous: previousValues,
        current: {
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          assignedTo: task.assignedTo,
          dueDate: task.dueDate,
          tags: task.tags
        }
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      message: 'Task updated successfully',
      task
    });

  } catch (error) {
    console.error('Update task error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message,
        value: err.value
      }));
      
      return res.status(400).json({
        message: 'Validation error',
        errors
      });
    }

    res.status(500).json({
      message: 'Error updating task'
    });
  }
};

// Move task (drag and drop)
const moveTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, position, version: clientVersion } = req.body;

    const task = await Task.findById(id);

    if (!task || task.isArchived) {
      return res.status(404).json({
        message: 'Task not found'
      });
    }

    // Check for conflicts
    if (clientVersion && task.hasConflict(clientVersion)) {
      return res.status(409).json({
        message: 'Conflict detected: Task has been modified by another user',
        conflict: {
          clientVersion,
          serverVersion: task.version,
          serverTask: task
        }
      });
    }

    const previousStatus = task.status;
    const previousPosition = task.position;

    // Update task position and status
    task.status = status;
    task.position = position;
    task.lastModifiedBy = req.user._id;

    await task.save();

    // Update positions of other tasks in the same column
    await Task.updateMany(
      {
        _id: { $ne: id },
        status: status,
        position: { $gte: position },
        isArchived: false
      },
      { $inc: { position: 1 } }
    );

    // Populate the task
    await task.populate('assignedTo', 'username firstName lastName avatar');
    await task.populate('createdBy', 'username firstName lastName avatar');

    // Log activity
    await Activity.logActivity({
      action: 'task_moved',
      actor: req.user._id,
      target: task._id,
      targetModel: 'Task',
      description: Activity.createDescription('task_moved', req.user.fullName, {
        taskTitle: task.title,
        fromStatus: previousStatus,
        toStatus: status
      }),
      category: 'task',
      severity: 'low',
      details: {
        previous: { status: previousStatus, position: previousPosition },
        current: { status, position }
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      message: 'Task moved successfully',
      task
    });

  } catch (error) {
    console.error('Move task error:', error);
    res.status(500).json({
      message: 'Error moving task'
    });
  }
};

// Smart assign task
const smartAssignTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { version: clientVersion } = req.body;

    const task = await Task.findById(id);

    if (!task || task.isArchived) {
      return res.status(404).json({
        message: 'Task not found'
      });
    }

    // Check for conflicts
    if (clientVersion && task.hasConflict(clientVersion)) {
      return res.status(409).json({
        message: 'Conflict detected: Task has been modified by another user',
        conflict: {
          clientVersion,
          serverVersion: task.version,
          serverTask: task
        }
      });
    }

    // Find user with fewest active tasks
    const selectedUser = await Task.findUserWithFewestTasks();

    const previousAssignee = task.assignedTo;
    
    // Assign task to selected user
    task.assignedTo = selectedUser._id;
    task.lastModifiedBy = req.user._id;

    await task.save();

    // Populate the task
    await task.populate('assignedTo', 'username firstName lastName avatar');
    await task.populate('createdBy', 'username firstName lastName avatar');

    // Log activity
    await Activity.logActivity({
      action: 'smart_assign',
      actor: req.user._id,
      target: task._id,
      targetModel: 'Task',
      description: Activity.createDescription('smart_assign', req.user.fullName, {
        taskTitle: task.title,
        assigneeName: selectedUser.fullName
      }),
      category: 'task',
      severity: 'low',
      details: {
        previous: { assignedTo: previousAssignee },
        current: { assignedTo: selectedUser._id },
        algorithm: 'fewest_active_tasks'
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      message: 'Task assigned successfully using smart assign',
      task,
      assignedTo: selectedUser
    });

  } catch (error) {
    console.error('Smart assign error:', error);
    res.status(500).json({
      message: 'Error in smart assign'
    });
  }
};

// Assign task to user
const assignTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedTo, version: clientVersion } = req.body;

    const task = await Task.findById(id);

    if (!task || task.isArchived) {
      return res.status(404).json({
        message: 'Task not found'
      });
    }

    // Check for conflicts
    if (clientVersion && task.hasConflict(clientVersion)) {
      return res.status(409).json({
        message: 'Conflict detected: Task has been modified by another user',
        conflict: {
          clientVersion,
          serverVersion: task.version,
          serverTask: task
        }
      });
    }

    // Validate assigned user
    const assignedUser = await User.findById(assignedTo);
    if (!assignedUser || !assignedUser.isActive) {
      return res.status(400).json({
        message: 'Assigned user not found or inactive'
      });
    }

    const previousAssignee = task.assignedTo;
    
    task.assignedTo = assignedTo;
    task.lastModifiedBy = req.user._id;

    await task.save();

    // Populate the task
    await task.populate('assignedTo', 'username firstName lastName avatar');
    await task.populate('createdBy', 'username firstName lastName avatar');

    // Log activity
    await Activity.logActivity({
      action: 'task_assigned',
      actor: req.user._id,
      target: task._id,
      targetModel: 'Task',
      description: Activity.createDescription('task_assigned', req.user.fullName, {
        taskTitle: task.title,
        assigneeName: assignedUser.fullName
      }),
      category: 'task',
      severity: 'low',
      details: {
        previous: { assignedTo: previousAssignee },
        current: { assignedTo: assignedTo }
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      message: 'Task assigned successfully',
      task
    });

  } catch (error) {
    console.error('Assign task error:', error);
    res.status(500).json({
      message: 'Error assigning task'
    });
  }
};

// Add comment to task
const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    const task = await Task.findById(id);

    if (!task || task.isArchived) {
      return res.status(404).json({
        message: 'Task not found'
      });
    }

    await task.addComment(text, req.user._id);

    // Populate the task with comments
    await task.populate('comments.author', 'username firstName lastName avatar');
    await task.populate('assignedTo', 'username firstName lastName avatar');
    await task.populate('createdBy', 'username firstName lastName avatar');

    // Log activity
    await Activity.logActivity({
      action: 'task_commented',
      actor: req.user._id,
      target: task._id,
      targetModel: 'Task',
      description: Activity.createDescription('task_commented', req.user.fullName, {
        taskTitle: task.title
      }),
      category: 'task',
      severity: 'low',
      details: {
        commentText: text.substring(0, 100) + (text.length > 100 ? '...' : '')
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      message: 'Comment added successfully',
      task
    });

  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      message: 'Error adding comment'
    });
  }
};

// Delete task
const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id);

    if (!task || task.isArchived) {
      return res.status(404).json({
        message: 'Task not found'
      });
    }

    // Check if user owns the task or is admin
    if (task.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'You can only delete tasks you created'
      });
    }

    const taskTitle = task.title;
    await Task.findByIdAndDelete(id);

    // Log activity
    await Activity.logActivity({
      action: 'task_deleted',
      actor: req.user._id,
      description: Activity.createDescription('task_deleted', req.user.fullName, {
        taskTitle: taskTitle
      }),
      category: 'task',
      severity: 'medium',
      details: {
        deletedTask: {
          id: task._id,
          title: taskTitle,
          status: task.status,
          priority: task.priority
        }
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      message: 'Task deleted successfully'
    });

  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      message: 'Error deleting task'
    });
  }
};

// Archive task
const archiveTask = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id);

    if (!task || task.isArchived) {
      return res.status(404).json({
        message: 'Task not found'
      });
    }

    await task.archive(req.user._id);

    // Log activity
    await Activity.logActivity({
      action: 'task_archived',
      actor: req.user._id,
      target: task._id,
      targetModel: 'Task',
      description: Activity.createDescription('task_archived', req.user.fullName, {
        taskTitle: task.title
      }),
      category: 'task',
      severity: 'low',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      message: 'Task archived successfully'
    });

  } catch (error) {
    console.error('Archive task error:', error);
    res.status(500).json({
      message: 'Error archiving task'
    });
  }
};

module.exports = {
  getAllTasks,
  createTask,
  getTask,
  updateTask,
  moveTask,
  smartAssignTask,
  assignTask,
  addComment,
  deleteTask,
  archiveTask
};