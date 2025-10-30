# RAALC Best Practices

A comprehensive guide to writing clean, maintainable, and secure code in RAALC.

## Table of Contents

1. [Code Organization](#code-organization)
2. [Error Handling](#error-handling)
3. [Security](#security)
4. [Database](#database)
5. [API Design](#api-design)
6. [Performance](#performance)
7. [Testing](#testing)
8. [Documentation](#documentation)

---

## Code Organization

### 1. Follow the Layered Architecture

**❌ Don't:** Put business logic in controllers
```javascript
// Bad: Business logic in controller
router.post('/users', async (req, res) => {
  const hashedPassword = await bcrypt.hash(req.body.password, 10);
  const user = await connection.query('INSERT INTO users SET ?', [{ ...req.body, password: hashedPassword }]);
  res.json(user);
});
```

**✅ Do:** Keep controllers thin, delegate to services
```javascript
// Good: Controller delegates to service
class UserController {
  static async create(req, res, next) {
    try {
      const user = await UserService.create(req.body);
      res.status(201).json({ ok: true, data: user });
    } catch (error) {
      next(error);
    }
  }
}
```

### 2. Use Consistent Naming Conventions

```javascript
// Classes: PascalCase
class UserService {}

// Files: camelCase (match class name)
// userService.js, authController.js

// Functions/Variables: camelCase
const getUserById = () => {}
const isActive = true

// Constants: UPPER_SNAKE_CASE
const MAX_LOGIN_ATTEMPTS = 5
const DEFAULT_PAGE_SIZE = 20

// Database tables: snake_case
// users, order_items, product_categories
```

### 3. File and Folder Structure

```
src/
├── controllers/           # One controller per resource
│   ├── AuthController.js
│   └── UserController.js
├── services/             # Business logic services
│   ├── AuthService.js
│   └── UserService.js
├── repositories/         # Database access layer
│   └── UserRepository.js
└── models/               # TypeORM entities
    └── User.js
```

---

## Error Handling

### 1. Use ErrorHandler for Operational Errors

**✅ Do:** Throw descriptive errors
```javascript
const { ErrorHandlers } = require('@utils/ErrorHandler');

if (!user) {
  throw ErrorHandlers.notFound('errors.userNotFound', { userId });
}

if (user.email === newEmail) {
  throw ErrorHandlers.conflict('errors.emailExists', { email: newEmail });
}
```

### 2. Always Use try-catch in Controllers

**❌ Don't:** Let errors bubble up unhandled
```javascript
// Bad
router.get('/users/:id', async (req, res) => {
  const user = await UserService.getById(req.params.id);
  res.json(user);
});
```

**✅ Do:** Catch and pass to error middleware
```javascript
// Good
router.get('/users/:id', async (req, res, next) => {
  try {
    const user = await UserService.getById(req.params.id);
    res.json({ ok: true, data: user });
  } catch (error) {
    next(error);
  }
});
```

### 3. Log Errors with Context

```javascript
logger.error('User registration failed', {
  email: req.body.email,
  error: error.message,
  stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
});
```

---

## Security

### 1. Never Store Plain Text Passwords

```javascript
const bcrypt = require('bcryptjs');

// Hash before storing
const hashedPassword = await bcrypt.hash(password, 10);

// Verify on login
const isValid = await bcrypt.compare(inputPassword, storedHash);
```

### 2. Validate and Sanitize All Input

```javascript
const { body, param } = require('express-validator');
const { validate } = require('@middleware/validation');

router.post('/users',
  [
    body('email').isEmail().normalizeEmail(),
    body('age').isInt({ min: 18, max: 120 }),
    body('website').optional().isURL(),
    param('id').isInt(),
    validate
  ],
  controller.create
);
```

### 3. Use Parameterized Queries

**❌ Don't:** Concatenate SQL strings
```javascript
// Bad: SQL injection vulnerability
const query = `SELECT * FROM users WHERE email = '${email}'`;
```

**✅ Do:** Use parameterized queries
```javascript
// Good: Protected against SQL injection
const [user] = await connection.query(
  'SELECT * FROM users WHERE email = ?',
  [email]
);
```

### 4. Implement Rate Limiting

```javascript
const { strictLimiter } = require('@middleware/rateLimiter');

// Apply to sensitive endpoints
router.post('/auth/login', strictLimiter, AuthController.login);
router.post('/auth/register', strictLimiter, AuthController.register);
```

### 5. Don't Expose Sensitive Data

```javascript
// Remove sensitive fields before returning
const user = await UserRepository.findById(id);
delete user.password;
delete user.reset_token;
return user;

// Or use explicit field selection
const [user] = await connection.query(
  'SELECT id, email, name, created_at FROM users WHERE id = ?',
  [id]
);
```

---

## Database

### 1. Use Transactions for Multi-Step Operations

```javascript
const { getConnection } = require('typeorm');

async createOrder(orderData) {
  const connection = getConnection();
  const queryRunner = connection.createQueryRunner();
  
  await queryRunner.connect();
  await queryRunner.startTransaction();
  
  try {
    // Create order
    const order = await queryRunner.query(
      'INSERT INTO orders SET ?',
      [orderData]
    );
    
    // Create order items
    for (const item of orderData.items) {
      await queryRunner.query(
        'INSERT INTO order_items SET ?',
        [{ ...item, order_id: order.insertId }]
      );
    }
    
    // Update inventory
    await queryRunner.query(
      'UPDATE products SET stock = stock - ? WHERE id = ?',
      [item.quantity, item.product_id]
    );
    
    await queryRunner.commitTransaction();
    return order;
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
}
```

### 2. Use Indexes for Frequently Queried Fields

```sql
-- Add indexes in migrations
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
```

### 3. Avoid N+1 Queries

**❌ Don't:** Load related data in loop
```javascript
// Bad: N+1 queries
const orders = await connection.query('SELECT * FROM orders');
for (const order of orders) {
  order.items = await connection.query(
    'SELECT * FROM order_items WHERE order_id = ?',
    [order.id]
  );
}
```

**✅ Do:** Use JOIN or load in batch
```javascript
// Good: Single query with JOIN
const orders = await connection.query(`
  SELECT 
    o.*,
    oi.id AS item_id,
    oi.product_id,
    oi.quantity,
    oi.price
  FROM orders o
  LEFT JOIN order_items oi ON oi.order_id = o.id
`);
```

---

## API Design

### 1. Use Consistent Response Format

```javascript
// Success response
{
  "ok": true,
  "data": { /* ... */ },
  "message": "Operation successful"
}

// Error response
{
  "ok": false,
  "message": "Resource not found",
  "messageKey": "errors.notFound",
  "errors": [ /* validation errors */ ]
}
```

### 2. Use Appropriate HTTP Status Codes

```javascript
// 200 OK - Successful GET, PUT, PATCH
res.status(200).json({ ok: true, data: user });

// 201 Created - Successful POST
res.status(201).json({ ok: true, data: newUser });

// 204 No Content - Successful DELETE
res.status(204).send();

// 400 Bad Request - Invalid input
throw ErrorHandlers.badRequest('errors.invalidInput');

// 401 Unauthorized - Authentication required
throw ErrorHandlers.unauthorized('auth.tokenRequired');

// 403 Forbidden - Insufficient permissions
throw ErrorHandlers.forbidden('auth.insufficientPermissions');

// 404 Not Found - Resource doesn't exist
throw ErrorHandlers.notFound('errors.userNotFound');

// 409 Conflict - Resource already exists
throw ErrorHandlers.conflict('errors.emailExists');

// 422 Unprocessable Entity - Validation failed
// (handled automatically by validation middleware)

// 429 Too Many Requests - Rate limit exceeded
// (handled automatically by rate limiter)

// 500 Internal Server Error - Unexpected error
throw ErrorHandlers.internal('errors.internal');
```

### 3. Implement Pagination

```javascript
async function getPaginated(req) {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;
  
  const [items, [{ total }]] = await Promise.all([
    connection.query(
      'SELECT * FROM items LIMIT ? OFFSET ?',
      [limit, offset]
    ),
    connection.query('SELECT COUNT(*) as total FROM items')
  ]);
  
  return {
    data: items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
}
```

### 4. Version Your API

```javascript
// Route structure
router.use('/api/v1/users', userRoutes);
router.use('/api/v2/users', userRoutesV2);
```

---

## Performance

### 1. Implement Caching

```javascript
const CacheService = require('@services/CacheService');

async function getUser(userId) {
  // Check cache first
  const cacheKey = `user:${userId}`;
  let user = await CacheService.get(cacheKey);
  
  if (!user) {
    // Cache miss - fetch from database
    user = await UserRepository.findById(userId);
    
    // Store in cache (1 hour TTL)
    await CacheService.set(cacheKey, user, 3600);
  }
  
  return user;
}

// Invalidate cache on update
async function updateUser(userId, data) {
  const user = await UserRepository.update(userId, data);
  await CacheService.del(`user:${userId}`);
  return user;
}
```

### 2. Use Background Jobs for Heavy Tasks

```javascript
const { addJob } = require('@services/Queue');

// Don't block the response
async function processOrder(orderId) {
  // ... create order in database ...
  
  // Queue heavy tasks
  await addJob('email', 'order-confirmation', { orderId });
  await addJob('notification', 'push-notification', { orderId });
  await addJob('analytics', 'track-conversion', { orderId });
  
  // Return immediately
  return order;
}
```

### 3. Optimize Database Queries

```javascript
// Select only needed fields
const [user] = await connection.query(
  'SELECT id, name, email FROM users WHERE id = ?',
  [userId]
);

// Use LIMIT for large result sets
const users = await connection.query(
  'SELECT * FROM users LIMIT ? OFFSET ?',
  [limit, offset]
);

// Use connection pooling (already configured in database.js)
```

---

## Testing

### 1. Write Unit Tests for Services

```javascript
const UserService = require('@services/UserService');
const UserRepository = require('@repositories/UserRepository');

jest.mock('@repositories/UserRepository');

describe('UserService', () => {
  it('should create a new user', async () => {
    const userData = { email: 'test@example.com', password: 'password123' };
    UserRepository.create.mockResolvedValue({ id: 1, ...userData });
    
    const user = await UserService.register(userData);
    
    expect(user).toHaveProperty('id');
    expect(UserRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ email: userData.email })
    );
  });
});
```

### 2. Write Integration Tests for APIs

```javascript
const request = require('supertest');
const app = require('../src/app');

describe('Auth API', () => {
  it('should register a new user', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'SecurePass123',
        name: 'Test User'
      });
    
    expect(response.status).toBe(201);
    expect(response.body.ok).toBe(true);
  });
});
```

---

## Documentation

### 1. Document Complex Functions

```javascript
/**
 * Creates a new order with inventory reservation
 * 
 * @param {Object} orderData - Order details
 * @param {number} orderData.userId - ID of the user placing the order
 * @param {Array} orderData.items - Array of order items
 * @param {string} orderData.paymentMethod - Payment method (credit_card, paypal, etc.)
 * @returns {Promise<Object>} Created order with items
 * @throws {ErrorHandler} If inventory is insufficient
 */
async function createOrder(orderData) {
  // Implementation
}
```

### 2. Keep README Up to Date

- Document new features
- Update installation steps
- Add usage examples
- Maintain dependency list

### 3. Use Clear Commit Messages

```bash
# Good commit messages
git commit -m "feat: Add user authentication with JWT"
git commit -m "fix: Prevent duplicate email registration"
git commit -m "refactor: Extract payment logic to service"
git commit -m "docs: Update API documentation"

# Bad commit messages
git commit -m "update"
git commit -m "fix bug"
git commit -m "changes"
```

---

## Code Review Checklist

Before submitting code for review:

- [ ] Code follows the layered architecture
- [ ] All errors are properly handled
- [ ] Input validation is implemented
- [ ] Sensitive data is not exposed
- [ ] Database queries use parameterization
- [ ] Transactions are used for multi-step operations
- [ ] Response format is consistent
- [ ] Appropriate HTTP status codes are used
- [ ] Caching is implemented where appropriate
- [ ] Background jobs are used for heavy tasks
- [ ] Unit tests are written
- [ ] Integration tests pass
- [ ] Code is documented
- [ ] No console.log statements (use logger)
- [ ] No hardcoded values (use environment variables)
- [ ] Commit messages are clear

---

**Following these best practices will help you build maintainable, secure, and performant applications!**

