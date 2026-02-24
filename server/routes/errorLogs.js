const express = require('express');
const router = express.Router();
const { authenticateToken, adminOnly, optionalAuth } = require('../middleware/auth');
const ErrorLog = require('../models/ErrorLog');

// Log error from frontend
router.post('/', optionalAuth, async (req, res) => {
  try {
    const {
      errorMessage, errorStack, pageUrl, severity,
      type, endpoint, method, requestBody,
      statusCode, componentStack, responseData,
      clientUserId, clientUsername
    } = req.body;
    
    // Prefer JWT-verified identity; fall back to client-reported identity
    const userId = req.user?.id || clientUserId || null;
    const username = req.user?.username || clientUsername || null;
    
    // Get IP address
    const ipAddress = req.headers['x-forwarded-for']?.split(',')[0] || 
                      req.headers['x-real-ip'] || 
                      req.socket.remoteAddress;

    await ErrorLog.create({
      userId,
      username,
      errorType: type || 'frontend',
      errorMessage: errorMessage || 'Unknown frontend error',
      errorStack,
      endpoint: endpoint || null,
      method: method || null,
      requestBody: requestBody || null,
      pageUrl,
      userAgent: req.headers['user-agent'],
      ipAddress,
      severity: severity || 'error',
      statusCode: statusCode || null,
      componentStack: componentStack || null,
      responseData: responseData || null
    });

    res.json({ success: true, message: 'Error logged' });
  } catch (error) {
    console.error('Error logging frontend error:', error);
    res.status(500).json({ error: 'Failed to log error' });
  }
});

// Get all error logs (admin only)
router.get('/', authenticateToken, adminOnly, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    
    const errors = await ErrorLog.getAll(limit, offset);
    res.json(errors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get error summary (admin only)
router.get('/summary', authenticateToken, adminOnly, async (req, res) => {
  try {
    const summary = await ErrorLog.getSummary();
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get errors for specific user (admin only)
router.get('/user/:userId', authenticateToken, adminOnly, async (req, res) => {
  try {
    const errors = await ErrorLog.getByUserId(req.params.userId);
    res.json(errors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark error as resolved (admin only)
router.put('/:id/resolve', authenticateToken, adminOnly, async (req, res) => {
  try {
    await ErrorLog.markResolved(req.params.id);
    res.json({ message: 'Error marked as resolved' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete old logs (admin only)
router.delete('/cleanup', authenticateToken, adminOnly, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    await ErrorLog.deleteOldLogs(days);
    res.json({ message: `Deleted error logs older than ${days} days` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
