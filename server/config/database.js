const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || './database/employees.db';
const DB_DIR = path.dirname(DB_PATH);

// Ensure database directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

let db = null;

const getDatabase = () => {
  if (!db) {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('❌ Error opening database:', err.message);
      } else {
        console.log('✅ Connected to SQLite database');
      }
    });
  }
  return db;
};

const initDatabase = () => {
  const database = getDatabase();
  
  // Create users table (for authentication)
  database.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'employee',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create employees table (for employee data)
  database.run(`
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL,
      department TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      phone TEXT,
      address TEXT,
      hire_date DATE,
      salary DECIMAL(10,2),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
    )
  `);

  // Insert default admin user if not exists
  database.get("SELECT * FROM users WHERE email = 'admin@company.com'", (err, row) => {
    if (!row) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = bcrypt.hashSync('admin123', 10);

      database.run(
        "INSERT INTO users (email, password, role) VALUES (?, ?, ?)",
        ['admin@company.com', hashedPassword, 'admin'],
        function(err) {
          if (err) {
            console.error('❌ Error creating admin user:', err.message);
          } else {
            console.log('✅ Default admin user created');

            // Create corresponding employee record
            database.run(`
              INSERT INTO employees (user_id, name, email, role, department, status, hire_date)
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [this.lastID, 'System Administrator', 'admin@company.com', 'Administrator', 'IT', 'active', new Date().toISOString().split('T')[0]]);
          }
        }
      );
    }
  });

  // Add sample employees for all departments and roles
  const sampleEmployees = [
    { name: 'John Smith', email: 'john.smith@company.com', role: 'Software Engineer', department: 'Engineering', status: 'active', phone: '+1-555-0101', address: '123 Tech Street, San Francisco, CA', salary: 95000, hire_date: '2023-01-15' },
    { name: 'Sarah Johnson', email: 'sarah.johnson@company.com', role: 'Senior Software Engineer', department: 'Engineering', status: 'active', phone: '+1-555-0102', address: '456 Dev Avenue, San Francisco, CA', salary: 125000, hire_date: '2022-03-20' },
    { name: 'Michael Chen', email: 'michael.chen@company.com', role: 'Product Manager', department: 'Engineering', status: 'active', phone: '+1-555-0103', address: '789 Product Lane, San Francisco, CA', salary: 130000, hire_date: '2022-06-10' },
    { name: 'Emma Wilson', email: 'emma.wilson@company.com', role: 'HR Manager', department: 'Human Resources', status: 'active', phone: '+1-555-0201', address: '321 HR Plaza, San Francisco, CA', salary: 85000, hire_date: '2021-09-05' },
    { name: 'David Rodriguez', email: 'david.rodriguez@company.com', role: 'Marketing Specialist', department: 'Marketing', status: 'active', phone: '+1-555-0301', address: '654 Brand Street, San Francisco, CA', salary: 65000, hire_date: '2023-02-14' },
    { name: 'Lisa Thompson', email: 'lisa.thompson@company.com', role: 'Designer', department: 'Marketing', status: 'active', phone: '+1-555-0302', address: '987 Design Way, San Francisco, CA', salary: 70000, hire_date: '2022-11-08' },
    { name: 'Robert Brown', email: 'robert.brown@company.com', role: 'Sales Representative', department: 'Sales', status: 'active', phone: '+1-555-0401', address: '147 Sales Drive, San Francisco, CA', salary: 55000, hire_date: '2023-04-22' },
    { name: 'Jennifer Davis', email: 'jennifer.davis@company.com', role: 'Sales Representative', department: 'Sales', status: 'pending', phone: '+1-555-0402', address: '258 Revenue Road, San Francisco, CA', salary: 55000, hire_date: '2024-01-10' },
    { name: 'William Garcia', email: 'william.garcia@company.com', role: 'Accountant', department: 'Finance', status: 'active', phone: '+1-555-0501', address: '369 Finance Circle, San Francisco, CA', salary: 75000, hire_date: '2022-08-15' },
    { name: 'Ashley Martinez', email: 'ashley.martinez@company.com', role: 'Operations Manager', department: 'Operations', status: 'active', phone: '+1-555-0601', address: '741 Operations Blvd, San Francisco, CA', salary: 90000, hire_date: '2021-12-03' },
    { name: 'Christopher Lee', email: 'christopher.lee@company.com', role: 'Customer Success Manager', department: 'Customer Service', status: 'active', phone: '+1-555-0701', address: '852 Service Street, San Francisco, CA', salary: 68000, hire_date: '2022-05-18' },
    { name: 'Amanda White', email: 'amanda.white@company.com', role: 'Legal Counsel', department: 'Legal', status: 'active', phone: '+1-555-0801', address: '963 Legal Lane, San Francisco, CA', salary: 150000, hire_date: '2021-07-12' },
    { name: 'Kevin Johnson', email: 'kevin.johnson@company.com', role: 'Software Engineer', department: 'Engineering', status: 'inactive', phone: '+1-555-0104', address: '159 Code Avenue, San Francisco, CA', salary: 98000, hire_date: '2021-11-30' },
    { name: 'Maria Rodriguez', email: 'maria.rodriguez@company.com', role: 'Sales Representative', department: 'Sales', status: 'pending', phone: '+1-555-0403', address: '357 Prospect Street, San Francisco, CA', salary: 52000, hire_date: '2024-01-25' }
  ];

  sampleEmployees.forEach(employee => {
    database.run(`
      INSERT OR IGNORE INTO employees (name, email, role, department, status, phone, address, salary, hire_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      employee.name, employee.email, employee.role, employee.department,
      employee.status, employee.phone, employee.address, employee.salary, employee.hire_date
    ], function(err) {
      if (err && !err.message.includes('UNIQUE constraint failed')) {
        console.error('❌ Error creating sample employee:', err.message);
      } else if (this.changes > 0) {
        console.log(`✅ Sample employee created: ${employee.name}`);
      }
    });
  });

  console.log('📊 Database initialized');
};

const closeDatabase = () => {
  if (db) {
    db.close((err) => {
      if (err) {
        console.error('❌ Error closing database:', err.message);
      } else {
        console.log('✅ Database connection closed');
      }
    });
  }
};

// Handle graceful shutdown
process.on('SIGINT', () => {
  closeDatabase();
  process.exit(0);
});

module.exports = {
  getDatabase,
  initDatabase,
  closeDatabase
};
