const Joi = require('joi');

// Custom validation for MongoDB ObjectId
const objectId = Joi.string().pattern(/^[0-9a-fA-F]{24}$/).message('Invalid ObjectId format');

// User validation schemas
const userSchemas = {
  register: Joi.object({
    username: Joi.string()
      .min(3)
      .max(30)
      .pattern(/^[a-zA-Z0-9_]+$/)
      .required()
      .messages({
        'string.pattern.base': 'Username can only contain letters, numbers, and underscores',
        'string.min': 'Username must be at least 3 characters long',
        'string.max': 'Username cannot exceed 30 characters'
      }),
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address'
      }),
    password: Joi.string()
      .min(6)
      .max(100)
      .required()
      .messages({
        'string.min': 'Password must be at least 6 characters long'
      }),
    firstName: Joi.string()
      .min(1)
      .max(50)
      .trim()
      .required(),
    lastName: Joi.string()
      .min(1)
      .max(50)
      .trim()
      .required()
  }),

  login: Joi.object({
    email: Joi.string()
      .email()
      .required(),
    password: Joi.string()
      .required()
  }),

  updateProfile: Joi.object({
    firstName: Joi.string()
      .min(1)
      .max(50)
      .trim(),
    lastName: Joi.string()
      .min(1)
      .max(50)
      .trim(),
    avatar: Joi.string()
      .uri()
  })
};

// Task validation schemas
const taskSchemas = {
  create: Joi.object({
    title: Joi.string()
      .min(1)
      .max(200)
      .trim()
      .required()
      .custom((value, helpers) => {
        const columnNames = ['todo', 'in progress', 'done'];
        if (columnNames.includes(value.toLowerCase())) {
          return helpers.error('any.invalid');
        }
        return value;
      })
      .messages({
        'any.invalid': 'Task title cannot match column names (Todo, In Progress, Done)'
      }),
    description: Joi.string()
      .max(1000)
      .trim()
      .allow(''),
    status: Joi.string()
      .valid('todo', 'in-progress', 'done')
      .default('todo'),
    priority: Joi.string()
      .valid('low', 'medium', 'high', 'urgent')
      .default('medium'),
    assignedTo: objectId.allow(null),
    dueDate: Joi.date()
      .min('now')
      .allow(null),
    tags: Joi.array()
      .items(Joi.string().max(50).trim())
      .max(10)
      .default([]),
    position: Joi.number()
      .integer()
      .min(0)
      .default(0)
  }),

  update: Joi.object({
    title: Joi.string()
      .min(1)
      .max(200)
      .trim()
      .custom((value, helpers) => {
        const columnNames = ['todo', 'in progress', 'done'];
        if (columnNames.includes(value.toLowerCase())) {
          return helpers.error('any.invalid');
        }
        return value;
      })
      .messages({
        'any.invalid': 'Task title cannot match column names (Todo, In Progress, Done)'
      }),
    description: Joi.string()
      .max(1000)
      .trim()
      .allow(''),
    status: Joi.string()
      .valid('todo', 'in-progress', 'done'),
    priority: Joi.string()
      .valid('low', 'medium', 'high', 'urgent'),
    assignedTo: objectId.allow(null),
    dueDate: Joi.date()
      .min('now')
      .allow(null),
    tags: Joi.array()
      .items(Joi.string().max(50).trim())
      .max(10),
    position: Joi.number()
      .integer()
      .min(0),
    version: Joi.number()
      .integer()
      .min(1)
  }),

  move: Joi.object({
    status: Joi.string()
      .valid('todo', 'in-progress', 'done')
      .required(),
    position: Joi.number()
      .integer()
      .min(0)
      .required(),
    version: Joi.number()
      .integer()
      .min(1)
      .required()
  }),

  assign: Joi.object({
    assignedTo: objectId.required(),
    version: Joi.number()
      .integer()
      .min(1)
      .required()
  }),

  comment: Joi.object({
    text: Joi.string()
      .min(1)
      .max(500)
      .trim()
      .required()
  })
};

// Activity validation schemas
const activitySchemas = {
  query: Joi.object({
    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(20),
    action: Joi.string()
      .valid(
        'task_created', 'task_updated', 'task_deleted', 'task_assigned',
        'task_unassigned', 'task_moved', 'task_commented', 'task_archived',
        'task_unarchived', 'user_registered', 'user_login', 'user_logout',
        'conflict_detected', 'conflict_resolved', 'smart_assign'
      ),
    category: Joi.string()
      .valid('task', 'user', 'system', 'security'),
    startDate: Joi.date(),
    endDate: Joi.date()
      .min(Joi.ref('startDate'))
  })
};

// Generic validation middleware factory
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      return res.status(400).json({
        message: 'Validation error',
        errors
      });
    }

    req[property] = value;
    next();
  };
};

// Specific validation middleware
const validateRegistration = validate(userSchemas.register);
const validateLogin = validate(userSchemas.login);
const validateProfileUpdate = validate(userSchemas.updateProfile);

const validateTaskCreation = validate(taskSchemas.create);
const validateTaskUpdate = validate(taskSchemas.update);
const validateTaskMove = validate(taskSchemas.move);
const validateTaskAssign = validate(taskSchemas.assign);
const validateTaskComment = validate(taskSchemas.comment);

const validateActivityQuery = validate(activitySchemas.query, 'query');

// Custom validation for MongoDB ObjectId parameters
const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        message: `Invalid ${paramName} format`,
        errors: [{
          field: paramName,
          message: 'Must be a valid MongoDB ObjectId',
          value: id
        }]
      });
    }
    
    next();
  };
};

// Validation for pagination parameters
const validatePagination = (req, res, next) => {
  const schema = Joi.object({
    page: Joi.number()
      .integer()
      .min(1)
      .default(1),
    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(20),
    sort: Joi.string()
      .valid('createdAt', '-createdAt', 'title', '-title', 'priority', '-priority', 'status', '-status')
      .default('-createdAt')
  });

  const { error, value } = schema.validate(req.query, {
    stripUnknown: true,
    convert: true
  });

  if (error) {
    return res.status(400).json({
      message: 'Invalid pagination parameters',
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }

  req.pagination = value;
  next();
};

module.exports = {
  validate,
  validateRegistration,
  validateLogin,
  validateProfileUpdate,
  validateTaskCreation,
  validateTaskUpdate,
  validateTaskMove,
  validateTaskAssign,
  validateTaskComment,
  validateActivityQuery,
  validateObjectId,
  validatePagination,
  userSchemas,
  taskSchemas,
  activitySchemas
};