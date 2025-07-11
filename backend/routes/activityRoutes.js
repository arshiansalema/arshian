const express = require('express');
const router = express.Router();

const activityController = require('../controllers/activityController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { validateActivityQuery, validateObjectId } = require('../middleware/validation');

// All routes require authentication
router.use(authenticate);

// Activity routes
router.get('/', validateActivityQuery, activityController.getRecentActivities);
router.get('/stats', activityController.getActivityStats);
router.get('/user/:userId', validateObjectId('userId'), activityController.getUserActivities);
router.get('/task/:taskId', validateObjectId('taskId'), activityController.getTaskActivities);

// Admin only routes
router.put('/conflict/:activityId/resolve', requireAdmin, validateObjectId('activityId'), activityController.resolveConflict);
router.post('/cleanup', requireAdmin, activityController.cleanOldActivities);

module.exports = router;