const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/validation');

// All routes require authentication
router.use(authenticate);

// User routes
router.get('/', userController.getAllUsers);
router.get('/dashboard', userController.getUserDashboard);
router.get('/workload', userController.getUserWorkload);
router.get('/:id', validateObjectId(), userController.getUserById);

// Admin only routes
router.put('/:id', requireAdmin, validateObjectId(), userController.updateUser);
router.put('/:id/deactivate', requireAdmin, validateObjectId(), userController.deactivateUser);
router.put('/:id/reactivate', requireAdmin, validateObjectId(), userController.reactivateUser);

module.exports = router;