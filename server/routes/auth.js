const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    
    // Validate username
    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({ error: 'Username must be 3-20 characters' });
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({ error: 'Username can only contain letters, numbers, and underscores' });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return res.status(400).json({ error: 'Password must contain uppercase, lowercase, and number' });
    }
    
    let user;
    try {
      user = await User.create(username.trim(), password);
    } catch (error) {
      console.error('Registration error:', error);
      if (error.message.includes('unique constraint') || error.message.includes('duplicate') || error.message.includes('already exists')) {
        return res.status(400).json({ error: 'Username already exists' });
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
      user = await User.findByUsername(username);
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
      { expiresIn: '24h' }
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

module.exports = router;
