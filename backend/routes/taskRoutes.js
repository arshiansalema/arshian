const express = require('express');
const router = express.Router();

const taskController = require('../controllers/taskController');
const { authenticate } = require('../middleware/auth');
const { 
  validateTaskCreation,
  validateTaskUpdate,
  validateTaskMove,
  validateTaskAssign,
  validateTaskComment,
  validateObjectId
} = require('../middleware/validation');

// All routes require authentication
router.use(authenticate);

// Task CRUD operations
router.get('/', taskController.getAllTasks);
router.post('/', validateTaskCreation, taskController.createTask);
router.get('/:id', validateObjectId(), taskController.getTask);
router.put('/:id', validateObjectId(), validateTaskUpdate, taskController.updateTask);
router.delete('/:id', validateObjectId(), taskController.deleteTask);

// Task management operations
router.put('/:id/move', validateObjectId(), validateTaskMove, taskController.moveTask);
router.put('/:id/assign', validateObjectId(), validateTaskAssign, taskController.assignTask);
router.post('/:id/smart-assign', validateObjectId(), taskController.smartAssignTask);
router.post('/:id/comments', validateObjectId(), validateTaskComment, taskController.addComment);
router.put('/:id/archive', validateObjectId(), taskController.archiveTask);

module.exports = router;