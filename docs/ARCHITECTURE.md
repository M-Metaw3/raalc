# RAALC Architecture Guide

## Overview

RAALC follows a layered architecture pattern with clear separation of concerns:

```
┌─────────────────────────────────────────┐
│          HTTP Request (Client)          │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│           Express Middleware             │
│  • CORS, Helmet, Compression            │
│  • Body Parsing, Morgan Logging         │
│  • Rate Limiting                        │
│  • i18n, Authentication                 │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│              Routes Layer                │
│  • Route definitions                    │
│  • Input validation                     │
│  • Request handling                     │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│           Controllers Layer              │
│  • Request/Response handling            │
│  • Input sanitization                   │
│  • Response formatting                  │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│            Services Layer                │
│  • Business logic                       │
│  • Orchestration                        │
│  • Transaction management               │
│  • External API calls                   │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│          Repositories Layer              │
│  • Database operations                  │
│  • Query building                       │
│  • Data mapping                         │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│          Database (MySQL/Redis)          │
└─────────────────────────────────────────┘
```

## Layer Responsibilities

### 1. Routes Layer (`src/routes/`)

**Purpose:** Define API endpoints and attach middleware

**Responsibilities:**
- Map HTTP methods and paths to controllers
- Apply route-specific middleware (auth, validation, rate limiting)
- Group related endpoints

**Example:**
```javascript
const router = express.Router();
const { authenticate } = require('@middleware/auth');
const { body } = require('express-validator');
const { validate } = require('@middleware/validation');

router.post('/register',
  [
    body('email').isEmail(),
    body('password').isLength({ min: 8 }),
    validate
  ],
  authController.register
);

router.get('/profile', authenticate, userController.getProfile);
```

### 2. Controllers Layer (`src/controllers/`)

**Purpose:** Handle HTTP requests and responses

**Responsibilities:**
- Extract data from request (params, query, body)
- Call appropriate service methods
- Format response data
- Handle controller-level errors
- Send HTTP responses

**Example:**
```javascript
const UserService = require('@services/UserService');

class UserController {
  static async getProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const user = await UserService.getById(userId);
      
      res.json({
        ok: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }
}
```

**Best Practices:**
- Keep controllers thin - delegate to services
- Don't put business logic in controllers
- Always use try-catch and pass errors to next()
- Return consistent response formats

### 3. Services Layer (`src/services/`)

**Purpose:** Implement business logic and orchestration

**Responsibilities:**
- Implement business rules and validation
- Coordinate between multiple repositories
- Manage transactions
- Call external APIs
- Queue background jobs
- Implement caching strategies

**Example:**
```javascript
const UserRepository = require('@repositories/UserRepository');
const { ErrorHandlers } = require('@utils/ErrorHandler');
const CacheService = require('@services/CacheService');
const bcrypt = require('bcryptjs');

class UserService {
  static async getById(userId) {
    // Check cache first
    const cacheKey = `user:${userId}`;
    let user = await CacheService.get(cacheKey);
    
    if (!user) {
      user = await UserRepository.findById(userId);
      
      if (!user) {
        throw ErrorHandlers.notFound('errors.userNotFound');
      }
      
      // Cache for 1 hour
      await CacheService.set(cacheKey, user, 3600);
    }
    
    return user;
  }
  
  static async register(data) {
    // Check if email exists
    const existing = await UserRepository.findByEmail(data.email);
    if (existing) {
      throw ErrorHandlers.conflict('auth.emailAlreadyExists');
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    // Create user
    const user = await UserRepository.create({
      ...data,
      password: hashedPassword
    });
    
    // Queue welcome email
    await addJob('email', 'welcome-email', {
      to: user.email,
      name: user.name
    });
    
    return user;
  }
}
```

**Best Practices:**
- Single responsibility per service
- Use transactions for multi-step operations
- Implement caching for expensive operations
- Throw descriptive errors using ErrorHandler
- Don't expose database models directly

### 4. Repositories Layer (`src/repositories/`)

**Purpose:** Abstract database operations

**Responsibilities:**
- Execute database queries
- Map database results to objects
- Provide reusable query methods
- Handle database-specific errors

**Example:**
```javascript
const { getConnection } = require('typeorm');

class UserRepository {
  static async findById(id) {
    const connection = getConnection();
    const [user] = await connection.query(
      'SELECT * FROM users WHERE id = ?',
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
    const result = await connection.query(
      'INSERT INTO users SET ?',
      [data]
    );
    return { id: result.insertId, ...data };
  }
  
  static async update(id, data) {
    const connection = getConnection();
    await connection.query(
      'UPDATE users SET ? WHERE id = ?',
      [data, id]
    );
    return this.findById(id);
  }
}
```

**Best Practices:**
- Never put business logic in repositories
- Use parameterized queries (prevent SQL injection)
- Return consistent data structures
- Don't handle business errors (let service layer decide)

## Cross-Cutting Concerns

### Middleware (`src/middleware/`)

**Available Middleware:**
- `auth.js` - Authentication & authorization
- `errorHandler.js` - Global error handling
- `i18n.js` - Internationalization
- `rateLimiter.js` - Rate limiting
- `validation.js` - Input validation

### Utilities (`src/utils/`)

**Core Utilities:**
- `logger.js` - Winston logger with PII masking
- `ErrorHandler.js` - Custom error classes

### Background Workers (`src/workers/`)

**Purpose:** Process background jobs asynchronously

**Available Workers:**
- `emailWorker.js` - Email sending
- `notificationWorker.js` - Push notifications
- `cleanupWorker.js` - File and cache cleanup

## Data Flow Examples

### 1. User Registration Flow

```
POST /api/auth/register
  ↓
Route: Apply validation middleware
  ↓
Controller: Extract request data
  ↓
Service: 
  - Validate business rules
  - Hash password
  - Call UserRepository.create()
  - Queue welcome email
  ↓
Repository: Execute INSERT query
  ↓
Service: Return created user
  ↓
Controller: Format response
  ↓
Response: 201 Created with user data
  ↓
Background: Email worker sends welcome email
```

### 2. Get User Profile Flow (with caching)

```
GET /api/users/profile
  ↓
Middleware: Authenticate (verify JWT)
  ↓
Controller: Extract user ID from token
  ↓
Service:
  - Check CacheService for user data
  - If miss, call UserRepository.findById()
  - Store in cache with TTL
  ↓
Repository: Execute SELECT query
  ↓
Service: Return user data
  ↓
Controller: Format response
  ↓
Response: 200 OK with user data
```

### 3. Order Creation with Transaction

```
POST /api/orders
  ↓
Middleware: Authenticate, validate
  ↓
Controller: Extract order data
  ↓
Service:
  - Start database transaction
  - Validate inventory availability
  - Create order (OrderRepository)
  - Create order items (OrderItemRepository)
  - Reserve inventory (InventoryRepository)
  - Commit transaction
  - Queue order confirmation email
  ↓
Multiple Repositories: Execute queries in transaction
  ↓
Service: Return created order
  ↓
Controller: Format response
  ↓
Response: 201 Created with order data
  ↓
Background: Email worker sends confirmation
```

## Error Handling Strategy

### 1. Validation Errors (422)
- Caught by validation middleware
- Returns field-level errors

### 2. Business Logic Errors (400, 404, 409, etc.)
- Thrown by services using ErrorHandler
- Caught by error middleware
- Returns translated message

### 3. System Errors (500)
- Database errors, external API failures
- Caught by error middleware
- Logged with full stack trace
- Returns generic message to client

## Security Considerations

### Authentication Flow
1. User logs in with credentials
2. Server validates and generates JWT
3. Client includes JWT in Authorization header
4. Middleware verifies JWT on protected routes
5. User info attached to request object

### Authorization
- Role-based access control via `authorize()` middleware
- Fine-grained permissions in service layer

### Input Validation
- express-validator at route level
- Business logic validation in services
- SQL injection prevention via parameterized queries

## Performance Optimization

### Caching Strategy
- Cache frequently accessed data (users, settings)
- Use appropriate TTL based on data volatility
- Invalidate cache on updates

### Background Jobs
- Email sending
- Image processing
- Report generation
- Cleanup tasks

### Database Optimization
- Use indexes on frequently queried fields
- Implement connection pooling
- Use transactions for data consistency
- Avoid N+1 queries

## Monitoring and Logging

### Winston Logger Levels
- `error` - Critical errors requiring attention
- `warn` - Warning messages (rate limits, etc.)
- `info` - General information (startup, requests)
- `debug` - Detailed debugging information

### What to Log
- All errors with context
- Authentication attempts
- Rate limit violations
- Important business events
- External API calls

### What NOT to Log
- Passwords (automatically masked)
- API keys, secrets
- Credit card information
- Personal identifiable information (PII)

## Testing Strategy

### Unit Tests
- Test services in isolation
- Mock repositories and external dependencies
- Test business logic edge cases

### Integration Tests
- Test API endpoints end-to-end
- Use test database
- Test authentication and authorization

### Example Test
```javascript
const request = require('supertest');
const app = require('../src/app');

describe('Auth API', () => {
  it('should register a new user', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'SecurePass123!',
        name: 'Test User'
      });
    
    expect(response.status).toBe(201);
    expect(response.body.ok).toBe(true);
    expect(response.body.data).toHaveProperty('id');
  });
});
```

## Deployment Considerations

### Environment-Specific Configuration
- Development: Detailed logging, debug mode
- Staging: Production-like with test data
- Production: Error-level logging, optimized

### Database Migrations
- Always create migrations for schema changes
- Test migrations on staging first
- Have rollback plan ready

### Scaling Strategy
- Horizontal scaling: Multiple Node.js instances
- Load balancing: Nginx or cloud load balancer
- Session management: Redis for shared sessions
- Background jobs: Separate worker processes

---

**This architecture provides a solid foundation for building scalable, maintainable backend applications.**

