# RAALC Quick Start Guide

Get up and running with RAALC in 5 minutes!

## Prerequisites

Before you start, make sure you have:
- ✅ Node.js 16+ installed
- ✅ MySQL 8+ or MariaDB running
- ✅ Redis 6+ running
- ✅ npm or yarn package manager

## Step-by-Step Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd raalc

# Install dependencies
npm install
```

### 2. Configure Environment

```bash
# Copy environment template
cp env.example .env

# Edit .env file with your settings
nano .env  # or use your preferred editor
```

**Minimum required configurations:**
```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=raalc_db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-super-secret-key-change-this

# Email (optional for getting started)
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

### 3. Create Database

```sql
-- Connect to MySQL
mysql -u root -p

-- Create database
CREATE DATABASE raalc_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Exit
exit;
```

### 4. Create Required Directories

```bash
# Create log and upload directories
mkdir -p logs uploads temp

# Add .gitkeep files
touch uploads/.gitkeep temp/.gitkeep logs/.gitkeep
```

### 5. Start the Server

```bash
# Development mode (with auto-reload)
npm run dev

# You should see:
# ✅ Database connected
# ✅ Job schedulers initialized
# ✅ Background workers loaded
# 🚀 raalc-api running on port 4000
```

### 6. Test the API

```bash
# Test health endpoint
curl http://localhost:4000/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2025-10-07T...",
  "uptime": 5.123,
  "environment": "development"
}

# Test API info
curl http://localhost:4000/api

# Expected response:
{
  "ok": true,
  "message": "RAALC API is running",
  "version": "1.0.0",
  "environment": "development"
}
```

## Next Steps

### 1. Create Your First Model

Create a user model in `src/models/User.js`:

```javascript
const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'User',
  tableName: 'users',
  columns: {
    id: {
      primary: true,
      type: 'int',
      generated: true
    },
    email: {
      type: 'varchar',
      unique: true
    },
    password: {
      type: 'varchar'
    },
    name: {
      type: 'varchar'
    },
    role: {
      type: 'varchar',
      default: 'user'
    },
    created_at: {
      type: 'timestamp',
      default: () => 'CURRENT_TIMESTAMP'
    }
  }
});
```

### 2. Create a Migration

```bash
# Create users table migration
node scripts/createMigration.js CreateUsersTable
```

In `src/migrations/[timestamp]-CreateUsersTable.js`:

```javascript
module.exports = {
  up: async (queryRunner) => {
    await queryRunner.query(`
      CREATE TABLE users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  },
  
  down: async (queryRunner) => {
    await queryRunner.query('DROP TABLE users');
  }
};
```

### 3. Create a Repository

Create `src/repositories/UserRepository.js`:

```javascript
const { getConnection } = require('typeorm');

class UserRepository {
  static async findById(id) {
    const connection = getConnection();
    const [user] = await connection.query(
      'SELECT id, email, name, role, created_at FROM users WHERE id = ?',
      [id]
    );
    return user || null;
  }
  
  static async findByEmail(email) {
    const connection = getConnection();
    const [user] = await connection.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return user || null;
  }
  
  static async create(data) {
    const connection = getConnection();
    const result = await connection.query('INSERT INTO users SET ?', [data]);
    return { id: result.insertId, ...data };
  }
}

module.exports = UserRepository;
```

### 4. Create a Service

Create `src/services/AuthService.js`:

```javascript
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserRepository = require('@repositories/UserRepository');
const { ErrorHandlers } = require('@utils/ErrorHandler');
const { addJob } = require('@services/Queue');

class AuthService {
  static async register(data) {
    // Check if user exists
    const existing = await UserRepository.findByEmail(data.email);
    if (existing) {
      throw ErrorHandlers.conflict('auth.emailAlreadyExists');
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    // Create user
    const user = await UserRepository.create({
      email: data.email,
      password: hashedPassword,
      name: data.name,
      role: 'user'
    });
    
    // Queue welcome email
    await addJob('email', 'welcome-email', {
      to: user.email,
      subject: 'Welcome to RAALC!',
      html: `<h1>Welcome ${user.name}!</h1>`
    });
    
    // Generate token
    const token = this.generateToken(user);
    
    // Don't return password
    delete user.password;
    
    return { user, token };
  }
  
  static async login(email, password) {
    const user = await UserRepository.findByEmail(email);
    
    if (!user || !await bcrypt.compare(password, user.password)) {
      throw ErrorHandlers.unauthorized('auth.invalidCredentials');
    }
    
    const token = this.generateToken(user);
    delete user.password;
    
    return { user, token };
  }
  
  static generateToken(user) {
    return jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
  }
}

module.exports = AuthService;
```

### 5. Create a Controller

Create `src/controllers/AuthController.js`:

```javascript
const AuthService = require('@services/AuthService');

class AuthController {
  static async register(req, res, next) {
    try {
      const { email, password, name } = req.body;
      const result = await AuthService.register({ email, password, name });
      
      res.status(201).json({
        ok: true,
        message: req.t('auth.registerSuccess'),
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
  
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login(email, password);
      
      res.json({
        ok: true,
        message: req.t('auth.loginSuccess'),
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;
```

### 6. Create Routes

Create `src/routes/authRoutes.js`:

```javascript
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('@middleware/validation');
const { strictLimiter } = require('@middleware/rateLimiter');
const AuthController = require('@controllers/AuthController');

// Register
router.post('/register',
  strictLimiter,
  [
    body('email').isEmail().withMessage('validation.email'),
    body('password')
      .isLength({ min: 8 }).withMessage('validation.minLength')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('validation.passwordStrength'),
    body('name').notEmpty().withMessage('validation.required'),
    validate
  ],
  AuthController.register
);

// Login
router.post('/login',
  strictLimiter,
  [
    body('email').isEmail().withMessage('validation.email'),
    body('password').notEmpty().withMessage('validation.required'),
    validate
  ],
  AuthController.login
);

module.exports = router;
```

### 7. Register Routes in Main Router

Update `src/routes/index.js`:

```javascript
const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoutes');

// Register routes
router.use('/auth', authRoutes);

// API info
router.get('/', (req, res) => {
  res.json({
    ok: true,
    message: 'RAALC API is running',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

module.exports = router;
```

### 8. Test Your API

```bash
# Register a new user
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123",
    "name": "Test User"
  }'

# Login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123"
  }'
```

## Common Issues and Solutions

### Issue: Database connection failed

**Solution:**
1. Check MySQL is running: `sudo systemctl status mysql`
2. Verify credentials in `.env`
3. Ensure database exists: `CREATE DATABASE raalc_db;`

### Issue: Redis connection failed

**Solution:**
1. Check Redis is running: `sudo systemctl status redis`
2. Verify Redis host/port in `.env`
3. Test Redis: `redis-cli ping` (should return PONG)

### Issue: Port already in use

**Solution:**
```bash
# Find process using port 4000
lsof -i :4000  # or netstat -ano | findstr :4000 on Windows

# Kill the process or change PORT in .env
```

### Issue: Email worker errors

**Solution:**
- Email is optional for getting started
- Update SMTP settings in `.env` when ready
- For Gmail, use app passwords, not regular password

## Development Tips

### Hot Reload
Use nodemon for automatic server restart:
```bash
npm run dev
```

### Database Inspection
```bash
# Connect to database
mysql -u root -p raalc_db

# Show tables
SHOW TABLES;

# Inspect users table
DESC users;
SELECT * FROM users;
```

### Redis Inspection
```bash
# Connect to Redis
redis-cli

# List all keys
KEYS *

# Get value
GET user:123

# Clear all (careful!)
FLUSHDB
```

### Logs
```bash
# Watch combined logs
tail -f logs/combined.log

# Watch error logs
tail -f logs/error.log
```

## Next Learning Resources

1. **[Architecture Guide](./ARCHITECTURE.md)** - Understand the layered architecture
2. **[API Examples](./API-EXAMPLES.md)** - More API implementation examples
3. **[Testing Guide](./TESTING.md)** - Write tests for your code
4. **[Deployment Guide](./DEPLOYMENT.md)** - Deploy to production

## Need Help?

- Check the [main README](../README.md)
- Review example code in the template
- Open an issue on GitHub

---

**Happy Coding! 🚀**

