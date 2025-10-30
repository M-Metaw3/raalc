# RAALC - Reusable Architecture And Logic Components

Enterprise-grade Node.js backend template with production-ready features, best practices, and scalable architecture.

## 🚀 Features

- **Express.js Framework** - Fast, minimalist web framework
- **TypeORM** - Powerful ORM with migration support
- **Redis Integration** - Caching and session management
- **BullMQ** - Background job processing
- **i18n Support** - Multi-language translations (EN, AR, ES)
- **JWT Authentication** - Secure token-based auth
- **File Upload** - Multer integration with validation
- **Rate Limiting** - Protect your APIs from abuse
- **Logging** - Winston logger with rotation
- **Error Handling** - Centralized error management
- **Validation** - express-validator integration
- **Security** - Helmet, CORS, compression
- **Background Workers** - Email, notifications, cleanup
- **Development Tools** - Nodemon, ESLint, Prettier
- **Testing Ready** - Jest and Supertest setup

## 📁 Project Structure

```
raalc/
├── src/
│   ├── config/           # Configuration files
│   │   ├── database.js
│   │   ├── redis.js
│   │   └── i18n.js
│   ├── controllers/      # Route controllers
│   ├── services/         # Business logic
│   │   ├── Queue.js
│   │   └── CacheService.js
│   ├── repositories/     # Database operations
│   ├── models/           # TypeORM entities
│   ├── middleware/       # Express middleware
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   ├── i18n.js
│   │   ├── rateLimiter.js
│   │   └── validation.js
│   ├── routes/           # API routes
│   ├── workers/          # Background job workers
│   │   ├── emailWorker.js
│   │   ├── notificationWorker.js
│   │   └── cleanupWorker.js
│   ├── utils/            # Utility functions
│   │   ├── logger.js
│   │   └── ErrorHandler.js
│   ├── translations/     # i18n translation files
│   │   ├── en.json
│   │   ├── ar.json
│   │   └── es.json
│   ├── migrations/       # Database migrations
│   └── app.js            # Main application file
├── tests/                # Test files
├── docs/                 # Documentation
├── logs/                 # Log files
├── scripts/              # Utility scripts
├── uploads/              # File uploads
├── package.json
├── env.example
└── README.md
```

## 🛠️ Installation

### Prerequisites

- Node.js 16+ and npm
- MySQL 8+ or MariaDB
- Redis 6+

### Setup

1. **Clone and navigate to the project:**
```bash
git clone <your-repo>
cd raalc
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure environment:**
```bash
# Copy env.example to .env
cp env.example .env

# Edit .env with your configuration
# Update database, Redis, SMTP settings, etc.
```

4. **Create database:**
```sql
CREATE DATABASE raalc_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

5. **Run migrations:**
```bash
npm run migrate
```

6. **Start the server:**
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

## 🔧 Configuration

### Environment Variables

See `env.example` for all available configuration options:

- **Application:** `NODE_ENV`, `PORT`, `APP_URL`
- **Database:** `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- **Redis:** `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`
- **JWT:** `JWT_SECRET`, `JWT_EXPIRES_IN`
- **SMTP:** `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`
- **File Upload:** `MAX_FILE_SIZE`, `UPLOAD_DIR`
- **Rate Limiting:** `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX_REQUESTS`

## 📚 Usage Examples

### 1. Authentication Middleware

```javascript
const { authenticate, authorize } = require('@middleware/auth');
const express = require('express');
const router = express.Router();

// Protect route with authentication
router.get('/profile', authenticate, (req, res) => {
  res.json({ user: req.user });
});

// Protect route with authentication + role check
router.delete('/users/:id', 
  authenticate, 
  authorize('admin', 'superadmin'),
  deleteUser
);
```

### 2. Error Handling

```javascript
const { ErrorHandlers } = require('@utils/ErrorHandler');

// In your controller
if (!user) {
  throw ErrorHandlers.notFound('errors.userNotFound');
}

// Custom error
throw new ErrorHandler('custom.error.key', 400, { userId: 123 });
```

### 3. Validation

```javascript
const { body } = require('express-validator');
const { validate } = require('@middleware/validation');

router.post('/register',
  [
    body('email').isEmail().withMessage('validation.email'),
    body('password').isLength({ min: 8 }).withMessage('validation.minLength'),
    validate
  ],
  registerController
);
```

### 4. Cache Service

```javascript
const CacheService = require('@services/CacheService');

// Set cache with TTL
await CacheService.set('user:123', userData, 3600); // 1 hour

// Get from cache
const data = await CacheService.get('user:123');

// Delete cache
await CacheService.del('user:123');

// Delete by pattern
await CacheService.delPattern('user:*');
```

### 5. Background Jobs

```javascript
const { addJob } = require('@services/Queue');

// Queue an email
await addJob('email', 'send-email', {
  to: 'user@example.com',
  subject: 'Welcome!',
  html: '<h1>Welcome to our platform</h1>'
});

// Queue with delay
await addJob('notification', 'send-notification', {
  userId: 123,
  message: 'Your order is ready'
}, {
  delay: 5000 // 5 seconds
});
```

### 6. i18n Translations

```javascript
// In your controller (req.t is available via middleware)
res.json({
  message: req.t('auth.loginSuccess')
});

// With interpolation
req.t('validation.minLength', { field: 'password', min: 8 });
```

### 7. Logging

```javascript
const logger = require('@utils/logger');

logger.info('User registered', { userId: 123, email: 'user@example.com' });
logger.error('Payment failed', { orderId: 456, error: err.message });
logger.warn('Low inventory', { productId: 789, stock: 5 });
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm test -- --coverage
```

## 📝 API Documentation

### Health Check
```
GET /health
```
Returns API health status and uptime.

### API Info
```
GET /api
```
Returns API version and environment information.

## 🔐 Security Features

- **Helmet.js** - Sets secure HTTP headers
- **CORS** - Configurable cross-origin resource sharing
- **Rate Limiting** - Prevents brute force attacks
- **JWT Authentication** - Secure token-based auth
- **Input Validation** - express-validator integration
- **SQL Injection Protection** - TypeORM parameterized queries
- **Sensitive Data Masking** - Automatic log sanitization

## 🚦 Background Workers

### Email Worker
- Processes email sending jobs
- Uses nodemailer with SMTP
- Configurable concurrency

### Notification Worker
- Handles push notifications, SMS, etc.
- Easily extendable for different providers

### Cleanup Worker
- Cleans up temporary files
- Removes old logs
- Maintains expired sessions

## 📊 Monitoring

### Queue Metrics
```javascript
const { getQueueMetrics } = require('@services/Queue');

const metrics = await getQueueMetrics('email');
// { waiting: 5, active: 2, completed: 100, failed: 3, delayed: 0 }
```

### Logs
- All logs are written to `logs/combined.log`
- Errors are written to `logs/error.log`
- Automatic log rotation (10MB per file, 5 files)

## 🛡️ Best Practices

1. **Never commit `.env` file** - Contains sensitive credentials
2. **Use migrations** - Always create migrations for schema changes
3. **Validate all inputs** - Use express-validator
4. **Handle errors properly** - Use ErrorHandler class
5. **Log important events** - Use Winston logger
6. **Cache frequently accessed data** - Use Redis cache
7. **Use background jobs** - For time-consuming tasks
8. **Follow REST conventions** - Consistent API design
9. **Document your APIs** - Clear endpoint documentation
10. **Write tests** - Ensure code reliability

## 🔄 Development Workflow

1. Create feature branch
2. Implement feature with tests
3. Run linting: `npm run lint`
4. Run tests: `npm test`
5. Commit with clear message
6. Create pull request
7. Code review
8. Merge to main

## 📦 Production Deployment

### Environment Setup
```bash
NODE_ENV=production
DB_LOGGING=false
LOG_LEVEL=error
```

### Database
```bash
# Run migrations
npm run migrate
```

### Process Manager
```bash
# Using PM2
pm2 start src/app.js --name raalc-api
pm2 save
pm2 startup
```

### Reverse Proxy (Nginx)
```nginx
server {
  listen 80;
  server_name api.yourdomain.com;
  
  location / {
    proxy_pass http://localhost:4000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

MIT License - feel free to use this template for your projects.

## 💬 Support

For issues and questions, please open an issue on GitHub.

---

**Built with ❤️ for the developer community**

