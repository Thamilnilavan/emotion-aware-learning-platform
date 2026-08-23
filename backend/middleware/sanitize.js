const { body, param, query, validationResult } = require('express-validator');

const sanitizeInput = (req, res, next) => {
  // Sanitize body parameters
  if (req.body) {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].trim();
      }
    }
  }
  
  // Sanitize query parameters
  if (req.query) {
    for (const key in req.query) {
      if (typeof req.query[key] === 'string') {
        req.query[key] = req.query[key].trim();
      }
    }
  }
  
  next();
};

const validateRequest = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    next();
  };
};

// Common validation rules
const validationRules = {
  objectId: (field) => param(field).isMongoId().withMessage(`Invalid ${field} format`),
  email: body('email').isEmail().normalizeEmail().withMessage('Invalid email format'),
  password: body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  name: body('name').trim().notEmpty().withMessage('Name is required'),
  requiredString: (field) => body(field).trim().notEmpty().withMessage(`${field} is required`),
  optionalString: (field) => body(field).optional().trim(),
  number: (field, min = 0, max = Number.MAX_SAFE_INTEGER) => 
    body(field).isInt({ min, max }).withMessage(`${field} must be between ${min} and ${max}`),
  optionalNumber: (field, min = 0, max = Number.MAX_SAFE_INTEGER) =>
    body(field).optional().isInt({ min, max }).withMessage(`${field} must be between ${min} and ${max}`),
  boolean: (field) => body(field).isBoolean().withMessage(`${field} must be a boolean`),
  optionalBoolean: (field) => body(field).optional().isBoolean().withMessage(`${field} must be a boolean`),
  enum: (field, values) => body(field).isIn(values).withMessage(`${field} must be one of: ${values.join(', ')}`),
  optionalEnum: (field, values) => body(field).optional().isIn(values).withMessage(`${field} must be one of: ${values.join(', ')}`),
};

module.exports = {
  sanitizeInput,
  validateRequest,
  validationRules
};
