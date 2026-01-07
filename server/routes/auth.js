const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password required' });
    }

    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim().toLowerCase();
    
    // Validate email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    // Validate username
    if (trimmedUsername.length < 3 || trimmedUsername.length > 20) {
      return res.status(400).json({ error: 'Username must be 3-20 characters' });
    }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
      return res.status(400).json({ error: 'Username can only contain letters, numbers, and underscores' });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return res.status(400).json({ error: 'Password must contain uppercase, lowercase, and number' });
    }
    
    try {
      const existingUsername = await User.findByUsernameCaseInsensitive(trimmedUsername);
      if (existingUsername) {
        return res.status(409).json({ error: 'Username already exists' });
      }
      const existingEmail = await User.findByEmailCaseInsensitive(trimmedEmail);
      if (existingEmail) {
        return res.status(409).json({ error: 'Email already exists' });
      }
    } catch (error) {
      console.error('Registration lookup error:', error);
      return res.status(500).json({ error: 'Server error' });
    }

    let user;
    try {
      user = await User.create(trimmedUsername, trimmedEmail, password);
    } catch (error) {
      console.error('Registration error:', error);
      if (error.message.includes('unique constraint') || error.message.includes('duplicate') || error.message.includes('already exists')) {
        return res.status(409).json({ error: 'Username or email already exists' });
      }
      return res.status(400).json({ error: 'Registration failed' });
    }

    res.status(201).json({ message: 'User created', user });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    let user;
    try {
      user = await User.findByUsernameCaseInsensitive(username.trim());
    } catch (err) {
      console.error('Error finding user:', err);
      return res.status(500).json({ error: 'Database error. Please try again.' });
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    let validPassword;
    try {
      validPassword = await bcrypt.compare(password, user.password);
    } catch (err) {
      console.error('Error comparing password:', err);
      return res.status(500).json({ error: 'Authentication error. Please try again.' });
    }

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, is_admin: user.is_admin },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '30d' } // 30 days - users stay logged in for a month
    );

    res.json({ 
      token, 
      user: { 
        id: user.id, 
        username: user.username, 
        balance: user.balance || 1000,
        is_admin: user.is_admin || false 
      } 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// Refresh token endpoint - get a new token without re-entering password
router.post('/refresh', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Token required' });
    }

    // Verify the token (even if expired, we can still decode it)
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', async (err, decoded) => {
      // If token is valid or just expired (not tampered), issue new token
      if (err && err.name !== 'TokenExpiredError') {
        return res.status(403).json({ error: 'Invalid token' });
      }

      // Get fresh user data
      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Issue new token
      const newToken = jwt.sign(
        { id: user.id, username: user.username, is_admin: user.is_admin },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '30d' }
      );

      res.json({ 
        token: newToken, 
        user: { 
          id: user.id, 
          username: user.username, 
          balance: user.balance || 1000,
          is_admin: user.is_admin || false 
        } 
      });
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ error: 'Token refresh failed' });
  }
});

module.exports = router;
