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
    
    if (username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    
    let user;
    try {
      user = await User.create(username, password);
    } catch (error) {
      console.error('Registration error:', error);
      if (error.message.includes('unique constraint') || error.message.includes('duplicate')) {
        return res.status(400).json({ error: 'Username already exists' });
      }
      return res.status(400).json({ error: 'Registration failed. Please try again.' });
    }

    res.status(201).json({ message: 'User created', user });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
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
