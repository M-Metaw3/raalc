# API Endpoints Documentation
# توثيق نقاط النهاية

## Base URL
```
http://localhost:4000/api
```

---

## 🔴 Admin Endpoints

### Public Endpoints

#### Login
```http
POST /api/admins/login

Request Body:
{
  "email": "admin@dubaicourts.ae",
  "password": "Admin@123"
}

Response:
{
  "ok": true,
  "message": "Login successful.",
  "data": {
    "admin": {
      "id": 1,
      "firstName": "System",
      "lastName": "Administrator",
      "email": "admin@dubaicourts.ae",
      "userType": "ADMIN",
      "isSuperAdmin": true,
      "isActive": true
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": "7d"
    }
  }
}
```

#### Refresh Token
```http
POST /api/admins/refresh-token

Request Body:
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

Response:
{
  "ok": true,
  "message": "Access token refreshed successfully.",
  "data": {
    "tokens": {
      "accessToken": "new_access_token...",
      "refreshToken": "new_refresh_token...",
      "expiresIn": "7d"
    }
  }
}
```

### Protected Endpoints (Require Admin Authentication)

#### Get Profile
```http
GET /api/admins/me
Authorization: Bearer {access_token}

Response:
{
  "ok": true,
  "data": {
    "admin": {
      "id": 1,
      "firstName": "System",
      "lastName": "Administrator",
      "email": "admin@dubaicourts.ae",
      "userType": "ADMIN"
    }
  }
}
```

#### Change Password
```http
POST /api/admins/change-password
Authorization: Bearer {access_token}

Request Body:
{
  "currentPassword": "Admin@123",
  "newPassword": "NewPassword@456",
  "confirmPassword": "NewPassword@456"
}

Response:
{
  "ok": true,
  "message": "Password changed successfully.",
  "data": {
    "message": "Password changed successfully"
  }
}
```

#### Create Admin
```http
POST /api/admins/create
Authorization: Bearer {access_token}

Request Body:
{
  "firstName": "محمد",
  "lastName": "أحمد",
  "email": "admin2@dubaicourts.ae",
  "password": "Password@123",
  "phone": "0551234567"
}

Response:
{
  "ok": true,
  "message": "Admin account created successfully.",
  "data": {
    "admin": {
      "id": 2,
      "firstName": "محمد",
      "lastName": "أحمد",
      "email": "admin2@dubaicourts.ae",
      "userType": "ADMIN"
    }
  }
}
```

#### Get All Admins
```http
GET /api/admins/list?page=1&limit=20&search=محمد&isActive=true
Authorization: Bearer {access_token}

Response:
{
  "ok": true,
  "data": {
    "data": [ /* array of admins */ ],
    "total": 5,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

#### Get System Statistics
```http
GET /api/admins/stats
Authorization: Bearer {access_token}

Response:
{
  "ok": true,
  "data": {
    "stats": {
      "totalAdmins": 5,
      "totalUsers": 1234,
      "totalAgents": 89,
      "pendingAgents": 12
    }
  }
}
```

---

## 🟢 User Endpoints

### Public Endpoints

#### Register
```http
POST /api/users/register

Request Body:
{
  "firstName": "أحمد",
  "lastName": "محمد",
  "email": "ahmed@example.com",
  "password": "Password@123",
  "confirmPassword": "Password@123",
  "phone": "0551234567"
}

Response:
{
  "ok": true,
  "message": "Registration successful.",
  "data": {
    "user": {
      "id": 1,
      "firstName": "أحمد",
      "lastName": "محمد",
      "email": "ahmed@example.com",
      "userType": "USER",
      "isActive": true,
      "isEmailVerified": false
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
      "expiresIn": "7d"
    }
  }
}
```

#### Login
```http
POST /api/users/login

Request Body:
{
  "email": "ahmed@example.com",
  "password": "Password@123"
}

Response:
{
  "ok": true,
  "message": "Login successful.",
  "data": {
    "user": { /* user object */ },
    "tokens": { /* tokens */ }
  }
}
```

#### Verify Email
```http
GET /api/users/verify-email/{token}

Response:
{
  "ok": true,
  "message": "Email verified successfully.",
  "data": {
    "message": "Email verified successfully"
  }
}
```

### Protected Endpoints (Require User Authentication)

#### Get Profile
```http
GET /api/users/me
Authorization: Bearer {access_token}

Response:
{
  "ok": true,
  "data": {
    "user": {
      "id": 1,
      "firstName": "أحمد",
      "lastName": "محمد",
      "email": "ahmed@example.com",
      "userType": "USER"
    }
  }
}
```

#### Change Password
```http
POST /api/users/change-password
Authorization: Bearer {access_token}

Request Body:
{
  "currentPassword": "Password@123",
  "newPassword": "NewPassword@456",
  "confirmPassword": "NewPassword@456"
}
```

### Admin Only Endpoints

#### Get All Users
```http
GET /api/users/list?page=1&limit=20&isActive=true&search=أحمد
Authorization: Bearer {admin_access_token}

Response:
{
  "ok": true,
  "data": {
    "data": [ /* array of users */ ],
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

#### Deactivate User
```http
POST /api/users/{userId}/deactivate
Authorization: Bearer {admin_access_token}

Response:
{
  "ok": true,
  "message": "User account deactivated successfully."
}
```

#### Activate User
```http
POST /api/users/{userId}/activate
Authorization: Bearer {admin_access_token}

Response:
{
  "ok": true,
  "message": "User account activated successfully."
}
```

---

## 🟡 Agent Endpoints

### Public Endpoints

#### Register
```http
POST /api/agents/register

Request Body:
{
  "firstName": "سعيد",
  "lastName": "علي",
  "email": "agent@example.com",
  "password": "Password@123",
  "confirmPassword": "Password@123",
  "phone": "0559876543",
  "licenseNumber": "AG-12345",
  "agencyName": "وكالة دبي القانونية"
}

Response:
{
  "ok": true,
  "message": "Agent registration successful. Your account is pending admin approval.",
  "data": {
    "agent": {
      "id": 1,
      "firstName": "سعيد",
      "lastName": "علي",
      "email": "agent@example.com",
      "userType": "AGENT",
      "isActive": false,
      "licenseNumber": "AG-12345",
      "agencyName": "وكالة دبي القانونية"
    },
    "message": "Registration successful. Your account is pending admin approval."
  }
}
```

#### Login
```http
POST /api/agents/login

Request Body:
{
  "email": "agent@example.com",
  "password": "Password@123"
}

Response (if approved):
{
  "ok": true,
  "message": "Login successful.",
  "data": {
    "agent": { /* agent object */ },
    "tokens": { /* tokens */ }
  }
}

Response (if pending):
{
  "ok": false,
  "message": "Your agent account is pending admin approval. Please wait for activation.",
  "statusCode": 403
}
```

### Protected Endpoints (Require Agent Authentication)

#### Get Profile
```http
GET /api/agents/me
Authorization: Bearer {access_token}

Response:
{
  "ok": true,
  "data": {
    "agent": {
      "id": 1,
      "firstName": "سعيد",
      "lastName": "علي",
      "email": "agent@example.com",
      "userType": "AGENT",
      "isActive": true,
      "approvedBy": 1,
      "approvedAt": "2024-10-21T10:30:00Z"
    }
  }
}
```

### Admin Only Endpoints

#### Get All Agents
```http
GET /api/agents/list?page=1&limit=20&isActive=true
Authorization: Bearer {admin_access_token}

Response:
{
  "ok": true,
  "data": {
    "data": [ /* array of agents */ ],
    "total": 89,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

#### Get Pending Agents
```http
GET /api/agents/pending?page=1&limit=20
Authorization: Bearer {admin_access_token}

Response:
{
  "ok": true,
  "data": {
    "data": [
      {
        "id": 5,
        "firstName": "خالد",
        "lastName": "سالم",
        "email": "khaled@example.com",
        "phone": "0551112222",
        "licenseNumber": "AG-67890",
        "agencyName": "وكالة الشارقة",
        "isActive": false,
        "createdAt": "2024-10-20T15:00:00Z"
      }
    ],
    "total": 12,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

#### Approve Agent
```http
POST /api/agents/{agentId}/approve
Authorization: Bearer {admin_access_token}

Response:
{
  "ok": true,
  "message": "Agent account approved and activated successfully.",
  "data": {
    "agent": {
      "id": 5,
      "firstName": "خالد",
      "lastName": "سالم",
      "isActive": true,
      "approvedBy": 1,
      "approvedAt": "2024-10-21T12:00:00Z"
    }
  }
}
```

#### Reject Agent
```http
POST /api/agents/{agentId}/reject
Authorization: Bearer {admin_access_token}

Request Body:
{
  "reason": "المعلومات المقدمة غير كاملة"
}

Response:
{
  "ok": true,
  "message": "Agent application rejected successfully.",
  "data": {
    "agent": {
      "id": 5,
      "isActive": false,
      "rejectedBy": 1,
      "rejectedAt": "2024-10-21T12:00:00Z",
      "rejectionReason": "المعلومات المقدمة غير كاملة"
    }
  }
}
```

#### Deactivate Agent
```http
POST /api/agents/{agentId}/deactivate
Authorization: Bearer {admin_access_token}

Response:
{
  "ok": true,
  "message": "User account deactivated successfully."
}
```

#### Activate Agent
```http
POST /api/agents/{agentId}/activate
Authorization: Bearer {admin_access_token}

Response:
{
  "ok": true,
  "message": "User account activated successfully."
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "ok": false,
  "message": "Bad request. Please check your input.",
  "statusCode": 400
}
```

### 401 Unauthorized
```json
{
  "ok": false,
  "message": "Invalid email or password.",
  "statusCode": 401
}
```

### 403 Forbidden
```json
{
  "ok": false,
  "message": "You don't have sufficient permissions to perform this action.",
  "statusCode": 403
}
```

### 404 Not Found
```json
{
  "ok": false,
  "message": "Resource not found.",
  "statusCode": 404
}
```

### 409 Conflict
```json
{
  "ok": false,
  "message": "Email address already registered.",
  "statusCode": 409
}
```

### 422 Validation Error
```json
{
  "ok": false,
  "message": "Validation failed. Please check your input.",
  "messageKey": "errors.validationFailed",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email address.",
      "value": "invalid-email"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters long.",
      "value": ""
    }
  ]
}
```

### 500 Internal Server Error
```json
{
  "ok": false,
  "message": "Internal server error. Please try again later.",
  "statusCode": 500
}
```

---

## Authentication Headers

All protected endpoints require the `Authorization` header:

```http
Authorization: Bearer {access_token}
```

Example:
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Query Parameters

### Pagination
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

### Filtering
- `isActive`: Filter by active status (true/false)
- `search`: Search by name or email

Example:
```http
GET /api/users/list?page=2&limit=50&isActive=true&search=أحمد
```

---

## Rate Limiting

- Default: 100 requests per 15 minutes
- Applies to all endpoints
- Returns 429 Too Many Requests when exceeded

---

## Internationalization

The API supports English and Arabic.

Set the language using the `Accept-Language` header:
```http
Accept-Language: ar
Accept-Language: en
```

All error messages and success messages will be returned in the requested language.


