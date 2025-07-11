const User = require('../models/User');
const Task = require('../models/Task');
const Activity = require('../models/Activity');

// Get all active users
const getAllUsers = async (req, res) => {
  try {
    const { search, role, isActive = true } = req.query;

    // Build filter
    const filter = { isActive: isActive === 'true' };
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { username: new RegExp(search, 'i') },
        { firstName: new RegExp(search, 'i') },
        { lastName: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') }
      ];
    }

    const users = await User.find(filter)
      .select('-password')
      .sort({ firstName: 1, lastName: 1 });

    res.json({
      users,
      count: users.length
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      message: 'Error fetching users'
    });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select('-password');

    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    // Get user statistics
    const taskStats = await Task.aggregate([
      { $match: { assignedTo: user._id, isArchived: false } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const activityCount = await Activity.countDocuments({ 
      actor: user._id,
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
    });

    // Format task stats
    const stats = {
      todo: 0,
      'in-progress': 0,
      done: 0,
      total: 0,
      recentActivity: activityCount
    };

    taskStats.forEach(stat => {
      stats[stat._id] = stat.count;
      stats.total += stat.count;
    });

    res.json({
      user: {
        ...user.toObject(),
        stats
      }
    });

  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      message: 'Error fetching user'
    });
  }
};

// Get user dashboard data
const getUserDashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user's tasks grouped by status
    const tasks = await Task.find({
      assignedTo: userId,
      isArchived: false
    })
      .populate('createdBy', 'username firstName lastName avatar')
      .sort({ priority: 1, createdAt: -1 });

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

    // Get recent activities
    const recentActivities = await Activity.getUserActivities(userId, 10);

    // Get overdue tasks
    const overdueTasks = await Task.find({
      assignedTo: userId,
      dueDate: { $lt: new Date() },
      status: { $ne: 'done' },
      isArchived: false
    }).populate('createdBy', 'username firstName lastName avatar');

    // Calculate statistics
    const stats = {
      totalTasks: tasks.length,
      todoTasks: taskGroups.todo.length,
      inProgressTasks: taskGroups['in-progress'].length,
      completedTasks: taskGroups.done.length,
      overdueTasks: overdueTasks.length,
      recentActivities: recentActivities.length
    };

    res.json({
      tasks: taskGroups,
      recentActivities,
      overdueTasks,
      stats
    });

  } catch (error) {
    console.error('Get user dashboard error:', error);
    res.status(500).json({
      message: 'Error fetching dashboard data'
    });
  }
};

// Update user (admin only)
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, username, role, isActive } = req.body;

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'Admin access required'
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    // Check if email or username already exists (if changing)
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          message: 'Email already exists'
        });
      }
    }

    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({
          message: 'Username already exists'
        });
      }
    }

    // Store previous values
    const previousValues = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      username: user.username,
      role: user.role,
      isActive: user.isActive
    };

    // Update user
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (email !== undefined) user.email = email;
    if (username !== undefined) user.username = username;
    if (role !== undefined) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    // Log activity
    await Activity.logActivity({
      action: 'user_updated',
      actor: req.user._id,
      target: user._id,
      targetModel: 'User',
      description: `${req.user.fullName} updated user ${user.fullName}`,
      category: 'user',
      severity: 'medium',
      details: {
        previous: previousValues,
        current: {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          username: user.username,
          role: user.role,
          isActive: user.isActive
        }
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      message: 'User updated successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        avatar: user.avatar,
        role: user.role,
        isActive: user.isActive,
        lastActive: user.lastActive,
        updatedAt: user.updatedAt
      }
    });

  } catch (error) {
    console.error('Update user error:', error);
    
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
      message: 'Error updating user'
    });
  }
};

// Deactivate user (admin only)
const deactivateUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'Admin access required'
      });
    }

    if (id === req.user._id.toString()) {
      return res.status(400).json({
        message: 'You cannot deactivate yourself'
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    user.isActive = false;
    await user.save();

    // Unassign all tasks from this user
    await Task.updateMany(
      { assignedTo: id },
      { $unset: { assignedTo: 1 } }
    );

    // Log activity
    await Activity.logActivity({
      action: 'user_deactivated',
      actor: req.user._id,
      target: user._id,
      targetModel: 'User',
      description: `${req.user.fullName} deactivated user ${user.fullName}`,
      category: 'user',
      severity: 'medium',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      message: 'User deactivated successfully'
    });

  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({
      message: 'Error deactivating user'
    });
  }
};

// Reactivate user (admin only)
const reactivateUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'Admin access required'
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    user.isActive = true;
    await user.save();

    // Log activity
    await Activity.logActivity({
      action: 'user_reactivated',
      actor: req.user._id,
      target: user._id,
      targetModel: 'User',
      description: `${req.user.fullName} reactivated user ${user.fullName}`,
      category: 'user',
      severity: 'medium',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      message: 'User reactivated successfully'
    });

  } catch (error) {
    console.error('Reactivate user error:', error);
    res.status(500).json({
      message: 'Error reactivating user'
    });
  }
};

// Get user workload (for smart assign)
const getUserWorkload = async (req, res) => {
  try {
    const users = await User.findActiveUsers();

    const workloads = await Promise.all(
      users.map(async (user) => {
        const activeTasks = await Task.countDocuments({
          assignedTo: user._id,
          status: { $in: ['todo', 'in-progress'] },
          isArchived: false
        });

        const completedTasks = await Task.countDocuments({
          assignedTo: user._id,
          status: 'done',
          isArchived: false
        });

        return {
          user: {
            id: user._id,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            fullName: user.fullName,
            avatar: user.avatar
          },
          activeTasks,
          completedTasks,
          totalTasks: activeTasks + completedTasks
        };
      })
    );

    // Sort by active tasks (ascending) for smart assign reference
    workloads.sort((a, b) => a.activeTasks - b.activeTasks);

    res.json({
      workloads,
      recommendedUser: workloads[0] // User with least active tasks
    });

  } catch (error) {
    console.error('Get user workload error:', error);
    res.status(500).json({
      message: 'Error fetching user workload'
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  getUserDashboard,
  updateUser,
  deactivateUser,
  reactivateUser,
  getUserWorkload
};