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
