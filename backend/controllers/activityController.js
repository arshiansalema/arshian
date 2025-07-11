const Activity = require('../models/Activity');

// Get recent activities (last 20 by default)
const getRecentActivities = async (req, res) => {
  try {
    const { limit, action, category, startDate, endDate } = req.query;

    // Build filter
    const filter = {};
    if (action) filter.action = action;
    if (category) filter.category = category;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const activities = await Activity.getRecentActivities(
      parseInt(limit) || 20,
      filter
    );

    res.json({
      activities,
      count: activities.length
    });

  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({
      message: 'Error fetching activities'
    });
  }
};

// Get activities for a specific user
const getUserActivities = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit } = req.query;

    // Check if requesting user can access these activities
    if (userId !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'You can only view your own activities'
      });
    }

    const activities = await Activity.getUserActivities(
      userId,
      parseInt(limit) || 50
    );

    res.json({
      activities,
      count: activities.length
    });

  } catch (error) {
    console.error('Get user activities error:', error);
    res.status(500).json({
      message: 'Error fetching user activities'
    });
  }
};

// Get activities for a specific task
const getTaskActivities = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { limit } = req.query;

    const activities = await Activity.getTaskActivities(
      taskId,
      parseInt(limit) || 20
    );

    res.json({
      activities,
      count: activities.length
    });

  } catch (error) {
    console.error('Get task activities error:', error);
    res.status(500).json({
      message: 'Error fetching task activities'
    });
  }
};

// Get activity statistics
const getActivityStats = async (req, res) => {
  try {
    const { period = '7d' } = req.query; // 7d, 30d, 90d

    // Calculate date range
    const now = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    // Aggregate activities by action
    const actionStats = await Activity.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: now }
        }
      },
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Aggregate activities by category
    const categoryStats = await Activity.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: now }
        }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Daily activity counts
    const dailyStats = await Activity.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: now }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    // Most active users
    const userStats = await Activity.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: now }
        }
      },
      {
        $group: {
          _id: '$actor',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          count: 1,
          username: '$user.username',
          fullName: { $concat: ['$user.firstName', ' ', '$user.lastName'] }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]);

    // Total counts
    const totalActivities = await Activity.countDocuments({
      createdAt: { $gte: startDate, $lte: now }
    });

    const totalUnresolvedConflicts = await Activity.countDocuments({
      action: 'conflict_detected',
      isResolved: false,
      createdAt: { $gte: startDate, $lte: now }
    });

    res.json({
      period,
      dateRange: { startDate, endDate: now },
      totalActivities,
      totalUnresolvedConflicts,
      actionStats,
      categoryStats,
      dailyStats,
      userStats
    });

  } catch (error) {
    console.error('Get activity stats error:', error);
    res.status(500).json({
      message: 'Error fetching activity statistics'
    });
  }
};

// Mark conflict as resolved (admin only)
const resolveConflict = async (req, res) => {
  try {
    const { activityId } = req.params;
    const { resolution } = req.body;

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'Admin access required'
      });
    }

    const activity = await Activity.findById(activityId);

    if (!activity) {
      return res.status(404).json({
        message: 'Activity not found'
      });
    }

    if (activity.action !== 'conflict_detected') {
      return res.status(400).json({
        message: 'This activity is not a conflict'
      });
    }

    if (activity.isResolved) {
      return res.status(400).json({
        message: 'Conflict is already resolved'
      });
    }

    await activity.markResolved(req.user._id, resolution);

    res.json({
      message: 'Conflict marked as resolved',
      activity
    });

  } catch (error) {
    console.error('Resolve conflict error:', error);
    res.status(500).json({
      message: 'Error resolving conflict'
    });
  }
};

// Clean old activities (admin only)
const cleanOldActivities = async (req, res) => {
  try {
    const { daysToKeep = 90 } = req.body;

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'Admin access required'
      });
    }

    const result = await Activity.cleanOldActivities(daysToKeep);

    // Log the cleanup activity
    await Activity.logActivity({
      action: 'system_cleanup',
      actor: req.user._id,
      description: `${req.user.fullName} cleaned up old activities (${result.deletedCount} removed)`,
      category: 'system',
      severity: 'low',
      details: {
        deletedCount: result.deletedCount,
        daysToKeep
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      message: 'Old activities cleaned up successfully',
      deletedCount: result.deletedCount,
      daysToKeep
    });

  } catch (error) {
    console.error('Clean activities error:', error);
    res.status(500).json({
      message: 'Error cleaning old activities'
    });
  }
};

module.exports = {
  getRecentActivities,
  getUserActivities,
  getTaskActivities,
  getActivityStats,
  resolveConflict,
  cleanOldActivities
};