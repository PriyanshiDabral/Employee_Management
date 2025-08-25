const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { getDatabase } = require('../config/database');

const router = express.Router();

// Login endpoint
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    const db = getDatabase();

    db.get(
      `SELECT u.*, e.name, e.department, e.role as employee_role 
       FROM users u 
       LEFT JOIN employees e ON u.id = e.user_id 
       WHERE u.email = ?`,
      [email],
      async (err, user) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        if (!user || !await bcrypt.compare(password, user.password)) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
          { 
            userId: user.id, 
            email: user.email, 
            role: user.role,
            name: user.name,
            department: user.department
          },
          process.env.JWT_SECRET,
          { expiresIn: '24h' }
        );

        res.json({
          token,
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name,
            department: user.department,
            employee_role: user.employee_role
          }
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Register endpoint (admin only)
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').trim().isLength({ min: 2 }),
  body('role').isIn(['admin', 'employee']),
  body('department').trim().isLength({ min: 2 }),
  body('employee_role').trim().isLength({ min: 2 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name, role, department, employee_role, phone, address, salary } = req.body;
    const db = getDatabase();

    // Check if user already exists
    db.get("SELECT id FROM users WHERE email = ?", [email], async (err, existingUser) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create user
      db.run(
        "INSERT INTO users (email, password, role) VALUES (?, ?, ?)",
        [email, hashedPassword, role],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Error creating user' });
          }

          const userId = this.lastID;

          // Create employee record
          db.run(`
            INSERT INTO employees (user_id, name, email, role, department, status, phone, address, salary, hire_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [userId, name, email, employee_role, department, 'active', phone, address, salary, new Date().toISOString().split('T')[0]], function(err) {
            if (err) {
              return res.status(500).json({ error: 'Error creating employee record' });
            }

            res.status(201).json({ 
              message: 'User created successfully',
              userId: userId,
              employeeId: this.lastID
            });
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Verify token endpoint
router.get('/verify', (req, res) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ user: decoded });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
