const ErrorCodes = {
  // Authentication Errors (1000-1099)
  INVALID_CREDENTIALS: { code: 1001, message: 'Invalid email or password' },
  TOKEN_EXPIRED: { code: 1002, message: 'Authentication token has expired' },
  TOKEN_INVALID: { code: 1003, message: 'Invalid authentication token' },
  ACCOUNT_DEACTIVATED: { code: 1004, message: 'Account has been deactivated' },
  CONSENT_REQUIRED: { code: 1005, message: 'Consent required before starting a session' },

  // Authorization Errors (1100-1199)
  ACCESS_DENIED: { code: 1101, message: 'Access denied' },
  INSUFFICIENT_PERMISSIONS: { code: 1102, message: 'Insufficient permissions' },
  NOT_RESOURCE_OWNER: { code: 1103, message: 'You do not own this resource' },

  // Validation Errors (2000-2099)
  INVALID_INPUT: { code: 2001, message: 'Invalid input data' },
  MISSING_REQUIRED_FIELD: { code: 2002, message: 'Required field is missing' },
  INVALID_EMAIL: { code: 2003, message: 'Invalid email format' },
  INVALID_PASSWORD: { code: 2004, message: 'Password must be at least 8 characters' },
  INVALID_ID: { code: 2005, message: 'Invalid ID format' },
  INVALID_SCORE_RANGE: { code: 2006, message: 'Score must be between 0 and 100' },
  INVALID_STATE: { code: 2007, message: 'Invalid state value' },
  NOTES_TOO_LONG: { code: 2008, message: 'Notes cannot exceed 20,000 characters' },

  // Resource Errors (3000-3099)
  RESOURCE_NOT_FOUND: { code: 3001, message: 'Resource not found' },
  USER_NOT_FOUND: { code: 3002, message: 'User not found' },
  COURSE_NOT_FOUND: { code: 3003, message: 'Course not found' },
  SESSION_NOT_FOUND: { code: 3004, message: 'Session not found' },
  ACTIVE_SESSION_NOT_FOUND: { code: 3005, message: 'Active session not found' },
  SESSION_COMPLETED: { code: 3006, message: 'Session is already completed' },
  SESSION_NOT_ACTIVE: { code: 3007, message: 'Session is not active' },

  // Conflict Errors (4000-4099)
  EMAIL_ALREADY_EXISTS: { code: 4001, message: 'Email already registered' },
  ALREADY_ENROLLED: { code: 4002, message: 'Already enrolled in this course' },
  DUPLICATE_RESOURCE: { code: 4003, message: 'Resource already exists' },

  // Rate Limit Errors (5000-5099)
  TOO_MANY_REQUESTS: { code: 5001, message: 'Too many requests, please try again later' },
  AI_RATE_LIMIT: { code: 5002, message: 'Too many AI requests, please slow down' },

  // Service Errors (6000-6099)
  AI_SERVICE_UNAVAILABLE: { code: 6001, message: 'AI emotion analysis is temporarily unavailable' },
  DATABASE_UNAVAILABLE: { code: 6002, message: 'Database is temporarily unavailable' },
  BATCH_ANALYSIS_UNAVAILABLE: { code: 6003, message: 'Batch analysis unavailable' },

  // File Upload Errors (7000-7099)
  FILE_TOO_LARGE: { code: 7001, message: 'File exceeds size limit' },
  INVALID_FILE_TYPE: { code: 7002, message: 'Invalid file type' },
  UPLOAD_FAILED: { code: 7003, message: 'File upload failed' },

  // Internal Errors (9000-9099)
  INTERNAL_ERROR: { code: 9001, message: 'Internal server error' },
  UNKNOWN_ERROR: { code: 9002, message: 'An unknown error occurred' },
};

class AppError extends Error {
  constructor(errorCode, details = null) {
    super(errorCode.message);
    this.code = errorCode.code;
    this.message = errorCode.message;
    this.details = details;
    this.name = 'AppError';
  }

  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
      },
    };
  }
}

module.exports = { ErrorCodes, AppError };
