const ErrorLog = require('../models/ErrorLog');

// Middleware to log all errors
const errorLogger = async (err, req, res, next) => {
  // Extract user info if available
  const userId = req.user?.id || null;
  const username = req.user?.username || 'anonymous';
  
  // Get IP address (considering proxies)
  const ipAddress = req.headers['x-forwarded-for']?.split(',')[0] || 
                    req.headers['x-real-ip'] || 
                    req.socket.remoteAddress;

  // Log the error
  await ErrorLog.create({
    userId,
    username,
    errorType: 'backend',
    errorMessage: err.message || 'Unknown error',
    errorStack: err.stack,
    endpoint: req.originalUrl || req.url,
    method: req.method,
    requestBody: req.body,
    userAgent: req.headers['user-agent'],
    ipAddress,
    severity: err.statusCode >= 500 ? 'critical' : 'error'
  });

  // Continue to next error handler
  next(err);
};

module.exports = { errorLogger };
