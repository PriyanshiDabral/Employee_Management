const { getDatabase } = require('../config/database');

const sampleEmployees = [
  // Engineering Department
  {
    name: 'John Smith',
    email: 'john.smith@company.com',
    role: 'Software Engineer',
    department: 'Engineering',
    status: 'active',
    phone: '+1-555-0101',
    address: '123 Tech Street, San Francisco, CA 94105',
    salary: 95000,
    hire_date: '2023-01-15'
  },
  {
    name: 'Sarah Johnson',
    email: 'sarah.johnson@company.com',
    role: 'Senior Software Engineer',
    department: 'Engineering',
    status: 'active',
    phone: '+1-555-0102',
    address: '456 Dev Avenue, San Francisco, CA 94105',
    salary: 125000,
    hire_date: '2022-03-20'
  },
  {
    name: 'Michael Chen',
    email: 'michael.chen@company.com',
    role: 'Product Manager',
    department: 'Engineering',
    status: 'active',
    phone: '+1-555-0103',
    address: '789 Product Lane, San Francisco, CA 94105',
    salary: 130000,
    hire_date: '2022-06-10'
  },

  // Human Resources Department
  {
    name: 'Emma Wilson',
    email: 'emma.wilson@company.com',
    role: 'HR Manager',
    department: 'Human Resources',
    status: 'active',
    phone: '+1-555-0201',
    address: '321 HR Plaza, San Francisco, CA 94105',
    salary: 85000,
    hire_date: '2021-09-05'
  },

  // Marketing Department
  {
    name: 'David Rodriguez',
    email: 'david.rodriguez@company.com',
    role: 'Marketing Specialist',
    department: 'Marketing',
    status: 'active',
    phone: '+1-555-0301',
    address: '654 Brand Street, San Francisco, CA 94105',
    salary: 65000,
    hire_date: '2023-02-14'
  },
  {
    name: 'Lisa Thompson',
    email: 'lisa.thompson@company.com',
    role: 'Designer',
    department: 'Marketing',
    status: 'active',
    phone: '+1-555-0302',
    address: '987 Design Way, San Francisco, CA 94105',
    salary: 70000,
    hire_date: '2022-11-08'
  },

  // Sales Department
  {
    name: 'Robert Brown',
    email: 'robert.brown@company.com',
    role: 'Sales Representative',
    department: 'Sales',
    status: 'active',
    phone: '+1-555-0401',
    address: '147 Sales Drive, San Francisco, CA 94105',
    salary: 55000,
    hire_date: '2023-04-22'
  },
  {
    name: 'Jennifer Davis',
    email: 'jennifer.davis@company.com',
    role: 'Sales Representative',
    department: 'Sales',
    status: 'pending',
    phone: '+1-555-0402',
    address: '258 Revenue Road, San Francisco, CA 94105',
    salary: 55000,
    hire_date: '2024-01-10'
  },

  // Finance Department
  {
    name: 'William Garcia',
    email: 'william.garcia@company.com',
    role: 'Accountant',
    department: 'Finance',
    status: 'active',
    phone: '+1-555-0501',
    address: '369 Finance Circle, San Francisco, CA 94105',
    salary: 75000,
    hire_date: '2022-08-15'
  },

  // Operations Department
  {
    name: 'Ashley Martinez',
    email: 'ashley.martinez@company.com',
    role: 'Operations Manager',
    department: 'Operations',
    status: 'active',
    phone: '+1-555-0601',
    address: '741 Operations Blvd, San Francisco, CA 94105',
    salary: 90000,
    hire_date: '2021-12-03'
  },

  // Customer Service Department
  {
    name: 'Christopher Lee',
    email: 'christopher.lee@company.com',
    role: 'Customer Success Manager',
    department: 'Customer Service',
    status: 'active',
    phone: '+1-555-0701',
    address: '852 Service Street, San Francisco, CA 94105',
    salary: 68000,
    hire_date: '2022-05-18'
  },

  // Legal Department
  {
    name: 'Amanda White',
    email: 'amanda.white@company.com',
    role: 'Legal Counsel',
    department: 'Legal',
    status: 'active',
    phone: '+1-555-0801',
    address: '963 Legal Lane, San Francisco, CA 94105',
    salary: 150000,
    hire_date: '2021-07-12'
  },

  // Additional employees with different statuses
  {
    name: 'Kevin Johnson',
    email: 'kevin.johnson@company.com',
    role: 'Software Engineer',
    department: 'Engineering',
    status: 'inactive',
    phone: '+1-555-0104',
    address: '159 Code Avenue, San Francisco, CA 94105',
    salary: 98000,
    hire_date: '2021-11-30'
  },
  {
    name: 'Maria Rodriguez',
    email: 'maria.rodriguez@company.com',
    role: 'Sales Representative',
    department: 'Sales',
    status: 'pending',
    phone: '+1-555-0403',
    address: '357 Prospect Street, San Francisco, CA 94105',
    salary: 52000,
    hire_date: '2024-01-25'
  }
];

async function populateEmployees() {
  const db = getDatabase();
  
  console.log('🌱 Starting to populate employees...');
  
  for (const employee of sampleEmployees) {
    try {
      await new Promise((resolve, reject) => {
        db.run(`
          INSERT OR IGNORE INTO employees (name, email, role, department, status, phone, address, salary, hire_date)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          employee.name,
          employee.email,
          employee.role,
          employee.department,
          employee.status,
          employee.phone,
          employee.address,
          employee.salary,
          employee.hire_date
        ], function(err) {
          if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
              console.log(`⚠️  Employee ${employee.name} already exists, skipping...`);
              resolve();
            } else {
              reject(err);
            }
          } else {
            console.log(`✅ Added employee: ${employee.name} - ${employee.role} (${employee.department})`);
            resolve();
          }
        });
      });
    } catch (error) {
      console.error(`❌ Error adding employee ${employee.name}:`, error.message);
    }
  }
  
  console.log('🎉 Employee population completed!');
  
  // Get final count
  db.get("SELECT COUNT(*) as total FROM employees", (err, result) => {
    if (!err) {
      console.log(`📊 Total employees in database: ${result.total}`);
    }
    process.exit(0);
  });
}

// Run the population script
populateEmployees().catch(console.error);
