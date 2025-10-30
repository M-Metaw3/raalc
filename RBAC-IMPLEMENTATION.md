# 🔐 RBAC Implementation Guide

## نظرة عامة

تم تطبيق نظام **RBAC (Role-Based Access Control)** متقدم يدعم:
- ✅ Multiple Roles per Admin
- ✅ Dynamic Permissions
- ✅ Resource-Action Pattern
- ✅ Super Admin مع كل الصلاحيات
- ✅ Admin Login بدون OTP
- ✅ Avatar Upload فقط (بدون documents)

---

## 📊 هندسة النظام (Architecture)

### Database Schema

```sql
┌─────────────────────────────────────────────────────────────┐
│                      RBAC Database Schema                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  admins                        admin_roles                  │
│  ┌──────────────┐             ┌──────────────┐            │
│  │ id           │◄────────────│ adminId      │            │
│  │ firstName    │             │ roleId       │────┐       │
│  │ lastName     │             │ assignedBy   │    │       │
│  │ email        │             │ assignedAt   │    │       │
│  │ password     │             └──────────────┘    │       │
│  │ avatar       │                                 │       │
│  │ isActive     │                                 │       │
│  └──────────────┘                                 │       │
│                                                    │       │
│  roles                     role_permissions       │       │
│  ┌──────────────┐         ┌──────────────┐       │       │
│  │ id           │◄────────│ roleId       │◄──────┘       │
│  │ name         │         │ permissionId │────┐          │
│  │ slug         │         │ grantedBy    │    │          │
│  │ description  │         │ grantedAt    │    │          │
│  │ isActive     │         └──────────────┘    │          │
│  └──────────────┘                             │          │
│                                                │          │
│  permissions                                  │          │
│  ┌──────────────┐                            │          │
│  │ id           │◄───────────────────────────┘          │
│  │ name         │ (e.g., users.create)                  │
│  │ resource     │ (e.g., users)                         │
│  │ action       │ (e.g., create)                        │
│  │ group        │ (e.g., User Management)               │
│  │ isActive     │                                       │
│  └──────────────┘                                       │
└─────────────────────────────────────────────────────────────┘
```

### Design Patterns المستخدمة

#### 1. **Repository Pattern**
```javascript
// Abstraction of Data Layer
AdminRepository.findWithRolesAndPermissions(adminId)
RoleRepository.assignPermissions(roleId, permissionIds)
```

#### 2. **Service Layer Pattern (SOLID - Single Responsibility)**
```javascript
// Business Logic Separation
AdminAuthService  → Admin Authentication & Management
RBACService       → Role & Permission Management
```

#### 3. **Strategy Pattern (for Authorization)**
```javascript
// Flexible Authorization Strategies
requirePermission(['users.create'])
requireRole(['Super Admin'])
requireAnyPermission(['users.*', 'agents.*'])
```

#### 4. **Chain of Responsibility (Middleware)**
```javascript
authenticate → authorize('ADMIN') → requirePermission('users.create') → controller
```

---

## 🔑 Permissions System

### Resource-Action Pattern

جميع الـ Permissions تتبع نمط `RESOURCE.ACTION`:

```javascript
// Users
users.create
users.read
users.update
users.delete
users.list
users.activate
users.deactivate

// Agents
agents.create
agents.read
agents.update
agents.delete
agents.list
agents.approve
agents.reject
agents.activate
agents.deactivate

// Admins
admins.create
admins.read
admins.update
admins.delete
admins.list
admins.activate
admins.deactivate

// Roles
roles.create
roles.read
roles.update
roles.delete
roles.list
roles.assign
roles.revoke

// Permissions
permissions.create
permissions.read
permissions.update
permissions.delete
permissions.list
permissions.grant
permissions.revoke

// Documents
documents.read
documents.approve
documents.reject
documents.delete
documents.list

// Settings
settings.read
settings.update

// Reports
reports.read
reports.export

// Audit
audit.read
audit.export
```

### Permission Groups

الـ Permissions مجمعة للتنظيم في الـ UI:

```javascript
- User Management
- Agent Management
- Admin Management
- Role & Permission Management
- Document Management
- System Management
- Reporting & Analytics
```

---

## 👥 Roles System

### Default Roles

#### 1. **Super Admin**
- **صلاحيات:** ALL PERMISSIONS
- **الوصف:** صلاحيات كاملة على كل النظام
- **التعيين:** في الـ seeder

#### 2. **Admin**
- **صلاحيات:** User, Agent, Document Management (محدودة)
- **الوصف:** إدارة المستخدمين والوكلاء
- **التعيين:** يدوياً من Super Admin

#### 3. **Moderator**
- **صلاحيات:** Read-only + Document Approval
- **الوصف:** المراقبة والموافقة على المستندات
- **التعيين:** يدوياً

#### 4. **Content Manager**
- **صلاحيات:** Document & Settings Management
- **الوصف:** إدارة المحتوى والإعدادات
- **التعيين:** يدوياً

#### 5. **Support**
- **صلاحيات:** Read-only على كل شيء
- **الوصف:** دعم العملاء (عرض فقط)
- **التعيين:** يدوياً

---

## 🚀 API Endpoints

### Admin Authentication

#### 1. Admin Login (بدون OTP)
```http
POST /api/admins/login
Content-Type: application/json

{
  "email": "admin@raalc.com",
  "password": "YourPassword123!"
}

Response:
{
  "ok": true,
  "data": {
    "admin": {
      "id": 1,
      "firstName": "John",
      "lastName": "Doe",
      "email": "admin@raalc.com",
      "userType": "ADMIN",
      "roles": ["Admin"],
      "permissions": ["users.read", "users.list", ...]
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1...",
      "refreshToken": "eyJhbGciOiJIUzI1..."
    }
  }
}
```

#### 2. Refresh Token
```http
POST /api/admins/refresh-token
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1..."
}
```

#### 3. Get Profile
```http
GET /api/admins/profile
Authorization: Bearer <accessToken>
```

#### 4. Update Profile
```http
PATCH /api/admins/profile
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "firstName": "New Name",
  "phone": "+971501234567"
}
```

#### 5. Change Password
```http
POST /api/admins/change-password
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword123!",
  "confirmPassword": "NewPassword123!"
}
```

#### 6. Upload Avatar
```http
POST /api/admins/avatar
Authorization: Bearer <accessToken>
Content-Type: multipart/form-data

avatar: <file>
```

---

### Admin Management (Requires Permissions)

#### 1. Get All Admins
```http
GET /api/admins?isActive=true&search=john
Authorization: Bearer <accessToken>
Permission Required: admins.list
```

#### 2. Create Admin
```http
POST /api/admins
Authorization: Bearer <accessToken>
Permission Required: admins.create

{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@raalc.com",
  "password": "Password123!",
  "phone": "+971501234567",
  "isActive": true,
  "roleIds": [2, 3]
}
```

#### 3. Get Admin by ID
```http
GET /api/admins/:id
Authorization: Bearer <accessToken>
Permission Required: admins.read
```

#### 4. Update Admin
```http
PATCH /api/admins/:id
Authorization: Bearer <accessToken>
Permission Required: admins.update

{
  "firstName": "Updated Name",
  "isActive": false
}
```

#### 5. Set Admin Status
```http
PATCH /api/admins/:id/status
Authorization: Bearer <accessToken>
Permission Required: admins.activate OR admins.deactivate

{
  "isActive": false
}
```

#### 6. Delete Admin
```http
DELETE /api/admins/:id
Authorization: Bearer <accessToken>
Permission Required: admins.delete
```

#### 7. Assign Roles to Admin
```http
POST /api/admins/:id/roles
Authorization: Bearer <accessToken>
Permission Required: roles.assign (or Super Admin)

{
  "roleIds": [2, 3]
}
```

---

### RBAC Management

#### Roles

```http
# Get all roles
GET /api/rbac/roles
Permission: roles.list

# Get role by ID
GET /api/rbac/roles/:id
Permission: roles.read

# Create role
POST /api/rbac/roles
Permission: roles.create (or Super Admin)
{
  "name": "Custom Role",
  "description": "Description here",
  "isActive": true
}

# Update role
PATCH /api/rbac/roles/:id
Permission: roles.update (or Super Admin)

# Delete role
DELETE /api/rbac/roles/:id
Permission: roles.delete (or Super Admin)

# Assign permissions to role
POST /api/rbac/roles/:id/permissions
Permission: permissions.grant (or Super Admin)
{
  "permissionIds": [1, 2, 3, 4]
}
```

#### Permissions

```http
# Get all permissions (grouped)
GET /api/rbac/permissions?groupBy=group
Permission: permissions.list

# Create permission
POST /api/rbac/permissions
Permission: permissions.create (or Super Admin)
{
  "name": "custom.action",
  "resource": "custom",
  "action": "action",
  "description": "Description",
  "group": "Custom Group",
  "isActive": true
}
```

---

## 🌱 Seeding

### Run Seeders

```bash
# Run all seeders
npm run seed

# Rollback seeders (development only)
npm run seed:rollback
```

### Seeder Order

1. **01-roles.seeder.js** - Creates default roles
2. **02-permissions.seeder.js** - Creates all permissions from constants
3. **03-role-permissions.seeder.js** - Assigns permissions to roles
4. **04-super-admin.seeder.js** - Creates Super Admin account

### Super Admin Credentials (من .env)

```
Email: superadmin@raalc.com
Password: SuperAdmin@123!

⚠️ IMPORTANT: قم بتغيير كلمة المرور بعد أول تسجيل دخول!
```

---

## 🔒 Middleware Usage

### Authentication
```javascript
const { authenticate, authorize } = require('@middleware/auth');

// Require authentication only
router.get('/route', authenticate, controller);

// Require authentication + specific user type
router.get('/route', authenticate, authorize('ADMIN'), controller);
```

### Permission-Based Authorization
```javascript
const { requirePermission, requireAnyPermission } = require('@middleware/rbac');

// Require specific permission
router.post('/users',
  authenticate,
  authorize('ADMIN'),
  requirePermission('users.create'),
  controller
);

// Require ANY of the permissions
router.get('/dashboard',
  authenticate,
  authorize('ADMIN'),
  requireAnyPermission(['users.read', 'agents.read']),
  controller
);

// Require ALL permissions
router.patch('/users/:id',
  authenticate,
  authorize('ADMIN'),
  requirePermission(['users.read', 'users.update']),
  controller
);
```

### Role-Based Authorization
```javascript
const { requireRole, requireSuperAdmin } = require('@middleware/rbac');

// Require specific role
router.delete('/critical',
  authenticate,
  authorize('ADMIN'),
  requireRole('Super Admin'),
  controller
);

// Shortcut for Super Admin
router.delete('/critical',
  authenticate,
  authorize('ADMIN'),
  requireSuperAdmin(),
  controller
);
```

### Custom Authorization Helpers
```javascript
const { canManagePermissions, canManageRoles } = require('@middleware/rbac');

// Super Admin OR Admin with 'permissions.grant'
router.post('/roles/:id/permissions',
  authenticate,
  authorize('ADMIN'),
  canManagePermissions(),
  controller
);

// Super Admin OR Admin with 'roles.assign'
router.post('/admins/:id/roles',
  authenticate,
  authorize('ADMIN'),
  canManageRoles(),
  controller
);
```

---

## 📝 Usage Examples

### Check Permission in Service
```javascript
const AdminRepository = require('@repositories/AdminRepository');

async function doSomething(adminId) {
  // Check if admin has permission
  const hasPermission = await AdminRepository.hasPermission(
    adminId,
    'users.create'
  );
  
  if (!hasPermission) {
    throw ErrorHandlers.forbidden('Insufficient permissions');
  }
  
  // Continue...
}
```

### Get Admin Permissions
```javascript
const RBACService = require('@services/RBACService');

async function getAdminPermissions(adminId) {
  const permissions = await RBACService.getAdminPermissions(adminId);
  // Returns: ['users.create', 'users.read', ...]
}
```

### Assign Multiple Roles
```javascript
const RBACService = require('@services/RBACService');

await RBACService.assignRolesToAdmin(
  adminId,
  [adminRoleId, moderatorRoleId],
  currentAdminId
);
```

---

## 🔍 Testing

### 1. Login as Super Admin
```bash
POST /api/admins/login
{
  "email": "superadmin@raalc.com",
  "password": "SuperAdmin@123!"
}
```

### 2. Create New Admin
```bash
POST /api/admins
Authorization: Bearer <super-admin-token>
{
  "firstName": "Test",
  "lastName": "Admin",
  "email": "test@raalc.com",
  "password": "TestAdmin@123!",
  "roleIds": [2] // Admin role
}
```

### 3. Test Permissions
```bash
# As Super Admin - Should work
GET /api/rbac/permissions

# As regular Admin - Should fail if no permission
GET /api/rbac/permissions
```

---

## 🛡️ Security Best Practices

### 1. **Principle of Least Privilege**
- كل role له أقل صلاحيات ممكنة
- Super Admin فقط للحالات الضرورية

### 2. **Audit Logging**
- تسجيل كل تغيير في الصلاحيات
- `assignedBy`, `grantedBy` fields

### 3. **Token Security**
- JWT مع role & permissions في الـ payload
- Refresh token منفصل

### 4. **Password Requirements**
- 8+ characters
- Uppercase + lowercase + number + special char

### 5. **No Self-Deletion**
- Admin لا يستطيع حذف نفسه

---

## 📚 File Structure

```
src/
├── constants/
│   └── permissions.js           # All permissions definitions
├── models/
│   ├── Admin.js                 # Admin entity
│   ├── Role.js                  # Role entity
│   ├── Permission.js            # Permission entity
│   ├── AdminRole.js             # Junction table
│   └── RolePermission.js        # Junction table
├── repositories/
│   ├── AdminRepository.js       # Admin data access
│   ├── RoleRepository.js        # Role data access
│   └── PermissionRepository.js  # Permission data access
├── services/
│   ├── AdminAuthService.js      # Admin authentication
│   └── RBACService.js           # RBAC management
├── controllers/
│   ├── adminController.js       # Admin endpoints
│   └── rbacController.js        # RBAC endpoints
├── routes/
│   ├── adminRoutes.js           # Admin routes
│   └── rbacRoutes.js            # RBAC routes
├── middleware/
│   ├── auth.js                  # Authentication
│   └── rbac.js                  # Authorization
├── validators/
│   ├── adminValidator.js        # Admin validation
│   └── rbacValidator.js         # RBAC validation
└── seeders/
    ├── index.js                 # Seeder runner
    ├── 01-roles.seeder.js
    ├── 02-permissions.seeder.js
    ├── 03-role-permissions.seeder.js
    └── 04-super-admin.seeder.js
```

---

## ✅ Checklist

- [x] Role Model
- [x] Permission Model
- [x] AdminRole Junction Table
- [x] RolePermission Junction Table
- [x] Permission Constants
- [x] Repositories
- [x] Services
- [x] RBAC Middleware
- [x] Controllers
- [x] Routes
- [x] Validators
- [x] Seeders
- [x] Translations
- [x] Documentation

---

## 🎯 Next Steps

1. **Run Migrations** (if not using synchronize):
   ```bash
   npm run migrate
   ```

2. **Run Seeders**:
   ```bash
   npm run seed
   ```

3. **Test Super Admin Login**:
   ```bash
   POST /api/admins/login
   ```

4. **Create Additional Admins**:
   ```bash
   POST /api/admins
   ```

5. **Assign Roles**:
   ```bash
   POST /api/admins/:id/roles
   ```

---

## 💡 Tips

- استخدم `canManagePermissions()` و `canManageRoles()` للـ sensitive operations
- Super Admin يمتلك كل الـ permissions في الـ seeder
- Avatar upload فقط للـ Admin (بدون documents)
- التحقق من الـ permissions يحدث في الـ middleware قبل الـ controller

---

**🎉 نظام RBAC جاهز للاستخدام!**

