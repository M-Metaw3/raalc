# نظام المصادقة والتفويض - محاكم دبي
# Authentication & Authorization System - Dubai Courts

## نظرة عامة | Overview

تم تصميم نظام المصادقة لمشروع محاكم دبي لدعم **ثلاثة أنواع منفصلة من المستخدمين** مع جداول قواعد بيانات منفصلة وخدمات مستقلة لكل نوع:

The authentication system for Dubai Courts project is designed to support **three separate user types** with separate database tables and independent services for each type:

1. **Admins** - المسؤولون: الوصول الكامل للنظام | Full system access
2. **Users** - المستخدمون العاديون: وصول أساسي | Basic access  
3. **Agents** - الوكلاء: يحتاجون موافقة المسؤول | Require admin approval

---

## هيكلة المشروع | Project Structure

### 📁 Models (Entities)
```
src/models/
├── Admin.js      # نموذج المسؤولين | Admin entity
├── User.js       # نموذج المستخدمين | User entity  
└── Agent.js      # نموذج الوكلاء | Agent entity
```

### 📁 Repositories  
```
src/repositories/
├── AdminRepository.js    # عمليات قاعدة البيانات للمسؤولين
├── UserRepository.js     # عمليات قاعدة البيانات للمستخدمين
└── AgentRepository.js    # عمليات قاعدة البيانات للوكلاء
```

### 📁 Services (Business Logic)
```
src/services/
├── AdminService.js    # منطق الأعمال للمسؤولين
├── UserService.js     # منطق الأعمال للمستخدمين
└── AgentService.js    # منطق الأعمال للوكلاء
```

### 📁 Controllers
```
src/controllers/
├── adminController.js    # معالجات HTTP للمسؤولين
├── userController.js     # معالجات HTTP للمستخدمين
└── agentController.js    # معالجات HTTP للوكلاء
```

### 📁 Routes
```
src/routes/
├── adminRoutes.js    # مسارات المسؤولين | /api/admins/*
├── userRoutes.js     # مسارات المستخدمين | /api/users/*
├── agentRoutes.js    # مسارات الوكلاء | /api/agents/*
└── index.js          # المسارات الرئيسية
```

---

## التقنيات المستخدمة | Technologies Used

- **Node.js & Express.js** - إطار عمل الخادم | Server framework
- **TypeORM** - ORM لقاعدة البيانات | Database ORM
- **MySQL** - قاعدة البيانات | Database
- **JWT (jsonwebtoken)** - المصادقة عبر الرموز | Token-based authentication
- **bcryptjs** - تشفير كلمات المرور | Password hashing
- **express-validator** - التحقق من البيانات | Data validation
- **i18next** - الترجمة (عربي/إنجليزي) | Internationalization

---

## جداول قاعدة البيانات | Database Tables

### 1. جدول Admins

```sql
CREATE TABLE admins (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  firstName VARCHAR(100) NOT NULL,
  lastName VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NULL,
  isSuperAdmin BOOLEAN DEFAULT FALSE,
  isActive BOOLEAN DEFAULT TRUE,
  createdBy INT UNSIGNED NULL,
  lastLoginAt DATETIME NULL,
  lastLoginIp VARCHAR(45) NULL,
  deletedAt DATETIME NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**المسؤول الافتراضي | Default Admin:**
- Email: `admin@dubaicourts.ae`
- Password: `Admin@123`
- ⚠️ **مهم**: قم بتغيير كلمة المرور فوراً في الإنتاج!

### 2. جدول Users

```sql
CREATE TABLE users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  firstName VARCHAR(100) NOT NULL,
  lastName VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NULL,
  isActive BOOLEAN DEFAULT TRUE,
  isEmailVerified BOOLEAN DEFAULT FALSE,
  emailVerificationToken VARCHAR(255) NULL,
  emailVerificationExpires DATETIME NULL,
  lastLoginAt DATETIME NULL,
  lastLoginIp VARCHAR(45) NULL,
  deletedAt DATETIME NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 3. جدول Agents

```sql
CREATE TABLE agents (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  firstName VARCHAR(100) NOT NULL,
  lastName VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  licenseNumber VARCHAR(100) NULL,
  agencyName VARCHAR(255) NULL,
  isActive BOOLEAN DEFAULT FALSE,
  isEmailVerified BOOLEAN DEFAULT FALSE,
  approvedBy INT UNSIGNED NULL,
  approvedAt DATETIME NULL,
  rejectedBy INT UNSIGNED NULL,
  rejectedAt DATETIME NULL,
  rejectionReason TEXT NULL,
  lastLoginAt DATETIME NULL,
  lastLoginIp VARCHAR(45) NULL,
  deletedAt DATETIME NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (approvedBy) REFERENCES admins(id),
  FOREIGN KEY (rejectedBy) REFERENCES admins(id)
);
```

---

## الأدوار والصلاحيات | Roles & Permissions

### 🔴 Admin (مسؤول)
**الصلاحيات:**
- ✅ إنشاء مسؤولين جدد | Create new admins
- ✅ الموافقة على/رفض الوكلاء | Approve/reject agents  
- ✅ تفعيل/تعطيل المستخدمين والوكلاء | Activate/deactivate users & agents
- ✅ عرض جميع المستخدمين والوكلاء | View all users & agents
- ✅ عرض الإحصائيات | View statistics
- ✅ إدارة النظام الكاملة | Full system management

### 🟢 User (مستخدم عادي)
**الصلاحيات:**
- ✅ التسجيل الذاتي (تفعيل فوري) | Self-registration (instant activation)
- ✅ تسجيل الدخول | Login
- ✅ عرض الملف الشخصي | View profile
- ✅ تغيير كلمة المرور | Change password
- ✅ الوصول للميزات العامة | Access general features

### 🟡 Agent (وكيل)
**الصلاحيات:**
- ✅ التسجيل (يتطلب موافقة المسؤول) | Register (requires admin approval)
- ✅ تسجيل الدخول (بعد الموافقة فقط) | Login (after approval only)
- ✅ عرض الملف الشخصي | View profile
- ✅ تغيير كلمة المرور | Change password
- ✅ الوصول لميزات محددة | Access specific functionalities

---

## نقاط النهاية (API Endpoints)

### 🔴 Admin Endpoints (`/api/admins`)

#### المسارات العامة | Public Routes
```http
POST   /api/admins/login           # تسجيل دخول المسؤول
POST   /api/admins/refresh-token   # تحديث الرمز
```

#### مسارات المسؤول | Admin Routes (يتطلب مصادقة)
```http
GET    /api/admins/me                 # الملف الشخصي
POST   /api/admins/change-password    # تغيير كلمة المرور
POST   /api/admins/create             # إنشاء مسؤول جديد
GET    /api/admins/list               # قائمة جميع المسؤولين
GET    /api/admins/stats              # إحصائيات النظام
```

### 🟢 User Endpoints (`/api/users`)

#### المسارات العامة | Public Routes
```http
POST   /api/users/register          # التسجيل (تفعيل فوري)
POST   /api/users/login             # تسجيل الدخول
POST   /api/users/refresh-token     # تحديث الرمز
GET    /api/users/verify-email/:token  # تأكيد البريد
```

#### مسارات المستخدم | User Routes (يتطلب مصادقة)
```http
GET    /api/users/me                # الملف الشخصي
POST   /api/users/change-password   # تغيير كلمة المرور
```

#### مسارات المسؤول فقط | Admin Only
```http
GET    /api/users/list              # قائمة جميع المستخدمين
POST   /api/users/:userId/activate     # تفعيل مستخدم
POST   /api/users/:userId/deactivate   # تعطيل مستخدم
```

### 🟡 Agent Endpoints (`/api/agents`)

#### المسارات العامة | Public Routes
```http
POST   /api/agents/register         # التسجيل (يحتاج موافقة)
POST   /api/agents/login            # تسجيل الدخول (بعد الموافقة)
POST   /api/agents/refresh-token    # تحديث الرمز
```

#### مسارات الوكيل | Agent Routes (يتطلب مصادقة)
```http
GET    /api/agents/me               # الملف الشخصي
POST   /api/agents/change-password  # تغيير كلمة المرور
```

#### مسارات المسؤول فقط | Admin Only
```http
GET    /api/agents/list             # قائمة جميع الوكلاء
GET    /api/agents/pending          # الوكلاء قيد الانتظار
POST   /api/agents/:agentId/approve    # الموافقة على وكيل
POST   /api/agents/:agentId/reject     # رفض وكيل
POST   /api/agents/:agentId/activate   # تفعيل وكيل
POST   /api/agents/:agentId/deactivate # تعطيل وكيل
```

---

## أمثلة الاستخدام | Usage Examples

### 1. تسجيل مستخدم جديد | Register New User

```http
POST /api/users/register
Content-Type: application/json

{
  "firstName": "أحمد",
  "lastName": "محمد",
  "email": "ahmed@example.com",
  "password": "Password@123",
  "confirmPassword": "Password@123",
  "phone": "0551234567"
}
```

**الاستجابة | Response:**
```json
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
      "isActive": true
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
      "expiresIn": "7d"
    }
  }
}
```

### 2. تسجيل وكيل جديد | Register New Agent

```http
POST /api/agents/register
Content-Type: application/json

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
```

**الاستجابة | Response:**
```json
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
      "isActive": false
    },
    "message": "Registration successful. Your account is pending admin approval."
  }
}
```

### 3. تسجيل دخول المسؤول | Admin Login

```http
POST /api/admins/login
Content-Type: application/json

{
  "email": "admin@dubaicourts.ae",
  "password": "Admin@123"
}
```

### 4. الموافقة على وكيل | Approve Agent

```http
POST /api/agents/123/approve
Authorization: Bearer {admin_access_token}
```

**الاستجابة | Response:**
```json
{
  "ok": true,
  "message": "Agent account approved and activated successfully.",
  "data": {
    "agent": {
      "id": 123,
      "firstName": "سعيد",
      "lastName": "علي",
      "isActive": true,
      "approvedAt": "2024-10-21T10:30:00Z"
    }
  }
}
```

### 5. عرض الإحصائيات | View Statistics

```http
GET /api/admins/stats
Authorization: Bearer {admin_access_token}
```

**الاستجابة | Response:**
```json
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

## الأمان | Security

### 🔒 تشفير كلمات المرور | Password Hashing
- استخدام **bcrypt** مع 12 جولة | Using bcrypt with 12 rounds
- لا يتم تخزين كلمات المرور الخام أبداً | Never store plain passwords

### 🎫 JWT Tokens
- **Access Token**: صالح لمدة 7 أيام | Valid for 7 days
- **Refresh Token**: صالح لمدة 30 يوم | Valid for 30 days
- يتضمن `userType` للتحقق من الدور | Includes userType for role verification

### 🛡️ الحماية من الهجمات | Attack Protection
- ✅ حماية من SQL Injection (عبر TypeORM) | SQL Injection protection
- ✅ حماية من Timing Attacks (مقارنة bcrypt الثابتة الوقت) | Timing attack protection
- ✅ منع Email Enumeration (رسائل خطأ عامة) | Email enumeration prevention
- ✅ Soft Delete للبيانات الحساسة | Soft delete for sensitive data
- ✅ تتبع تسجيل الدخول (IP & Timestamp) | Login tracking

### ✅ التحقق من البيانات | Data Validation
- استخدام **express-validator**
- كلمات مرور قوية (8+ حرف، أحرف كبيرة/صغيرة، أرقام، رموز) | Strong passwords
- تنسيق البريد الإلكتروني | Email format validation
- أرقام هواتف سعودية (05XXXXXXXX) | Saudi phone format

---

## المتغيرات البيئية | Environment Variables

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_REFRESH_EXPIRES_IN=30d

# Database Configuration  
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your-password
DB_NAME=dubai_courts_db

# Application
NODE_ENV=production
PORT=4000
```

---

## دليل الإعداد | Setup Guide

### 1. تثبيت الحزم | Install Dependencies
```bash
npm install
```

### 2. إعداد قاعدة البيانات | Setup Database
```bash
# إنشاء قاعدة البيانات
mysql -u root -p
CREATE DATABASE dubai_courts_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. إعداد المتغيرات البيئية | Setup Environment
```bash
cp env.example .env
# قم بتحرير .env وإضافة القيم الخاصة بك
```

### 4. تشغيل التطبيق | Run Application
```bash
# التطوير | Development
npm run dev

# الإنتاج | Production  
npm start
```

### 5. الوصول للنظام | Access System
- تسجيل دخول المسؤول الافتراضي:
  - Email: `admin@dubaicourts.ae`
  - Password: `Admin@123`

---

## أفضل الممارسات | Best Practices

### للمطورين | For Developers
1. ✅ استخدم الخدمة المناسبة لكل نوع مستخدم
2. ✅ تحقق من `userType` في الـ JWT قبل السماح بالعمليات
3. ✅ لا تخلط بين الجداول - كل نوع له جدول منفصل
4. ✅ استخدم `authorize()` middleware للتحكم في الوصول
5. ✅ سجّل جميع عمليات المصادقة المهمة

### للنشر | For Production
1. ⚠️ **غيّر كلمة مرور المسؤول الافتراضية فوراً!**
2. ⚠️ استخدم مفاتيح JWT قوية وعشوائية
3. ⚠️ فعّل HTTPS فقط
4. ⚠️ قم بإعداد rate limiting
5. ⚠️ راقب محاولات تسجيل الدخول الفاشلة

---

## استكشاف الأخطاء | Troubleshooting

### خطأ: "Email already exists"
- البريد الإلكتروني مسجل بالفعل في أحد الجداول الثلاثة
- تحقق من جميع الجداول: admins, users, agents

### خطأ: "Account pending approval"  
- الوكيل لم يتم الموافقة عليه بعد من المسؤول
- يجب على المسؤول الموافقة عبر `/api/agents/:id/approve`

### خطأ: "Invalid token"
- الرمز منتهي الصلاحية أو غير صحيح
- استخدم refresh token للحصول على رمز جديد

---

## الدعم | Support

للأسئلة والدعم الفني:
- 📧 Email: support@dubaicourts.ae
- 📚 Documentation: `/docs`

---

**تم إنشاؤه بواسطة:** فريق تطوير محاكم دبي
**التاريخ:** 21 أكتوبر 2024
**الإصدار:** 1.0.0


