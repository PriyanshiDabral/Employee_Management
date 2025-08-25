const express = require('express');
const { body, validationResult } = require('express-validator');
const { getDatabase } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all employees (admin) or current employee (employee)
router.get('/', authenticateToken, (req, res) => {
  const db = getDatabase();
  
  let query = `
    SELECT e.*, u.role as user_role 
    FROM employees e 
    LEFT JOIN users u ON e.user_id = u.id
  `;
  let params = [];

  // If user is not admin, only show their own record
  if (req.user.role !== 'admin') {
    query += ' WHERE e.user_id = ?';
    params.push(req.user.userId);
  }

  // Add search and filter parameters
  const { search, department, role, status, sortBy = 'name', sortOrder = 'ASC' } = req.query;
  
  if (req.user.role === 'admin') {
    const conditions = [];
    
    if (search) {
      conditions.push("(e.name LIKE ? OR e.email LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }
    
    if (department) {
      conditions.push("e.department = ?");
      params.push(department);
    }
    
    if (role) {
      conditions.push("e.role = ?");
      params.push(role);
    }
    
    if (status) {
      conditions.push("e.status = ?");
      params.push(status);
    }

    if (conditions.length > 0) {
      query += (query.includes('WHERE') ? ' AND ' : ' WHERE ') + conditions.join(' AND ');
    }
  }

  query += ` ORDER BY e.${sortBy} ${sortOrder}`;

  db.all(query, params, (err, employees) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(employees);
  });
});

// Get single employee
router.get('/:id', authenticateToken, (req, res) => {
  const db = getDatabase();
  const employeeId = req.params.id;

  let query = `
    SELECT e.*, u.role as user_role 
    FROM employees e 
    LEFT JOIN users u ON e.user_id = u.id 
    WHERE e.id = ?
  `;
  let params = [employeeId];

  // If user is not admin, only allow access to their own record
  if (req.user.role !== 'admin') {
    query += ' AND e.user_id = ?';
    params.push(req.user.userId);
  }

  db.get(query, params, (err, employee) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json(employee);
  });
});

// Create new employee (admin only)
router.post('/', [authenticateToken, requireAdmin], [
  body('name').trim().isLength({ min: 2 }),
  body('email').isEmail().normalizeEmail(),
  body('role').trim().isLength({ min: 2 }),
  body('department').trim().isLength({ min: 2 }),
  body('status').isIn(['active', 'inactive', 'pending'])
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, role, department, status, phone, address, salary, hire_date } = req.body;
  const db = getDatabase();

  db.run(`
    INSERT INTO employees (name, email, role, department, status, phone, address, salary, hire_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [name, email, role, department, status, phone, address, salary, hire_date], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'Email already exists' });
      }
      return res.status(500).json({ error: 'Database error' });
    }

    res.status(201).json({ 
      message: 'Employee created successfully',
      employeeId: this.lastID
    });
  });
});

// Update employee
router.put('/:id', authenticateToken, [
  body('name').optional().trim().isLength({ min: 2 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('role').optional().trim().isLength({ min: 2 }),
  body('department').optional().trim().isLength({ min: 2 }),
  body('status').optional().isIn(['active', 'inactive', 'pending'])
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const employeeId = req.params.id;
  const updates = req.body;
  const db = getDatabase();

  // If user is not admin, only allow updating their own record and limit fields
  if (req.user.role !== 'admin') {
    // First verify this is their record
    db.get("SELECT user_id FROM employees WHERE id = ?", [employeeId], (err, employee) => {
      if (err || !employee || employee.user_id !== req.user.userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Remove restricted fields for non-admin users
      const allowedFields = ['name', 'phone', 'address'];
      const filteredUpdates = {};
      allowedFields.forEach(field => {
        if (updates[field] !== undefined) {
          filteredUpdates[field] = updates[field];
        }
      });

      updateEmployee(filteredUpdates);
    });
  } else {
    updateEmployee(updates);
  }

  function updateEmployee(updateData) {
    const fields = Object.keys(updateData);
    if (fields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => updateData[field]);
    values.push(employeeId);

    db.run(
      `UPDATE employees SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      values,
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Email already exists' });
          }
          return res.status(500).json({ error: 'Database error' });
        }

        if (this.changes === 0) {
          return res.status(404).json({ error: 'Employee not found' });
        }

        res.json({ message: 'Employee updated successfully' });
      }
    );
  }
});

// Delete employee (admin only)
router.delete('/:id', [authenticateToken, requireAdmin], (req, res) => {
  const employeeId = req.params.id;
  const db = getDatabase();

  db.run("DELETE FROM employees WHERE id = ?", [employeeId], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json({ message: 'Employee deleted successfully' });
  });
});

// Get dashboard stats (admin only)
router.get('/stats/dashboard', [authenticateToken, requireAdmin], (req, res) => {
  const db = getDatabase();

  const queries = [
    "SELECT COUNT(*) as total FROM employees",
    "SELECT COUNT(*) as active FROM employees WHERE status = 'active'",
    "SELECT COUNT(*) as inactive FROM employees WHERE status = 'inactive'",
    "SELECT COUNT(*) as pending FROM employees WHERE status = 'pending'",
    "SELECT department, COUNT(*) as count FROM employees GROUP BY department",
    "SELECT role, COUNT(*) as count FROM employees GROUP BY role"
  ];

  Promise.all(queries.map(query => 
    new Promise((resolve, reject) => {
      db.all(query, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    })
  )).then(results => {
    res.json({
      total: results[0][0].total,
      active: results[1][0].active,
      inactive: results[2][0].inactive,
      pending: results[3][0].pending,
      departmentStats: results[4],
      roleStats: results[5]
    });
  }).catch(err => {
    res.status(500).json({ error: 'Database error' });
  });
});

module.exports = router;
