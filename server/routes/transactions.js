const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const Transaction = require('../models/Transaction');

router.get('/', authenticateToken, async (req, res) => {
  try {
    const transactions = await Transaction.findByUserId(req.user.id);
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { type, amount, description } = req.body;
    if (!type || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const transaction = await Transaction.create(req.user.id, type, amount, description);
    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
