# 🧪 دليل اختبار نظام الـ Admin - RBAC

## 📋 نظرة عامة

تم إنشاء نظام اختبار شامل لجميع endpoints الخاصة بالـ Admin، يتضمن:
- ✅ **16 سيناريو رئيسي**
- ✅ **اختبار Success Cases**
- ✅ **اختبار Error Cases**  
- ✅ **اختبار RBAC (Roles & Permissions)**
- ✅ **قياس الأداء (Response Time)**

---

## 🚀 كيفية التشغيل

### الخطوة 1: تشغيل السيرفر
```bash
npm run dev
```

### الخطوة 2: في Terminal آخر، شغل الاختبار
```bash
npm run test:admin
```

---

## 📊 السيناريوهات المختبرة

### ✅ STEP 1: تشغيل Database Seeders
- إنشاء 5 أدوار: Super Admin, Admin, Moderator, Content Manager, Support
- إنشاء 48 permission
- تعيين الـ permissions للـ roles
- إنشاء Super Admin account

### 🔐 STEP 2: Super Admin Login
- تسجيل دخول Super Admin
- الحصول على JWT token
- التحقق من البيانات

### ❌ STEP 3: Login Error Cases
- ✅ محاولة تسجيل الدخول بـ wrong password
- ✅ محاولة تسجيل الدخول بـ non-existent user
- ✅ محاولة تسجيل الدخول بدون password

### 📋 STEP 4: Get Roles and Permissions
- الحصول على جميع الأدوار
- الحصول على جميع الـ permissions (مقسمة حسب المجموعات)

### ➕ STEP 5: Create New Admin
- إنشاء admin جديد
- التحقق من البيانات

### ❌ STEP 6: Create Admin Error Cases
- ✅ محاولة إنشاء admin بـ duplicate email
- ✅ محاولة إنشاء admin بـ weak password
- ✅ محاولة إنشاء admin بدون authentication

### 🎭 STEP 7: Assign Roles to Admin
- تعيين دور "Admin" للـ admin الجديد

### 🔐 STEP 8: New Admin Login
- تسجيل دخول الـ admin الجديد
- التحقق من الـ roles

### 👤 STEP 9: Profile Management
- الحصول على الـ profile
- تحديث الـ profile (firstName, phone)

### 🔒 STEP 10: Permission-Based Access Control
- ✅ Super Admin يستطيع الوصول لكل شيء
- ✅ Admin role يستطيع list admins (لأن لديه الإذن)

### 🎭 STEP 11: Role Management (CRUD)
- ✅ إنشاء role جديد
- ✅ الحصول على role بـ ID
- ✅ تحديث role
- ✅ حذف role

### 👥 STEP 12: Admin Management (CRUD)
- ✅ Get all admins
- ✅ Get admin by ID
- ✅ Update admin
- ✅ Deactivate admin
- ✅ محاولة login بحساب غير مفعّل (يجب أن يفشل)
- ✅ Reactivate admin

### 🔄 STEP 13: Token Refresh
- الحصول على refresh token
- استخدامه للحصول على access token جديد

### 🔑 STEP 14: Change Password
- تغيير كلمة المرور
- تسجيل الدخول بكلمة المرور الجديدة
- إعادة كلمة المرور للأصلية

### 🔐 STEP 15: Assign Permissions to Role
- تعيين permissions لـ role معين

### 🔍 STEP 16: Search and Filters
- ✅ البحث عن admins بالاسم
- ✅ فلترة admins حسب الحالة (active/inactive)

---

## 📈 مثال على Output الاختبار

```
🚀 Starting Admin Flow Tests
Target: http://localhost:4000
Time: 2025-10-23T18:19:45.346Z

============================================================
  📦 STEP 1: Running Database Seeders
============================================================

✅ [1196ms] Run seeders (Roles, Permissions, Super Admin)

============================================================
  🔐 STEP 2: Super Admin Login
============================================================

✅ [245ms] Super Admin login successful
   Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6M...

============================================================
  ❌ STEP 3: Login Error Cases
============================================================

✅ [123ms] Login with wrong password fails correctly
✅ [87ms] Login with non-existent user fails correctly
✅ [56ms] Login without password fails correctly

...

============================================================
  📊 FINAL TEST REPORT
============================================================

Total Tests: 42
✅ Passed: 42
❌ Failed: 0
Success Rate: 100.00%
Total Duration: 5234ms (5.23s)
```

---

## 🎯 الـ Features المختبرة

### ✅ Authentication & Authorization
- Login (success & error cases)
- Token generation
- Token refresh
- Password change
- Role-based access control

### ✅ Admin Management
- Create admin
- Update admin
- Deactivate/Activate admin
- Get admin(s)
- Delete admin (soft delete)

### ✅ Role Management
- CRUD operations
- Assign roles to admins
- Get role with permissions

### ✅ Permission Management
- Get all permissions
- Assign permissions to roles
- Permission-based access control

### ✅ Profile Management
- Get profile
- Update profile

### ✅ Search & Filtering
- Search by name
- Filter by status

---

## 🔧 Configuration

يمكنك تغيير الـ base URL من خلال environment variable:

```bash
TEST_BASE_URL=http://localhost:3000 npm run test:admin
```

---

## 📝 ملاحظات مهمة

1. **Database:** الاختبار يستخدم نفس الـ database الحالي
2. **Seeders:** يتم تشغيلها تلقائياً في بداية كل اختبار
3. **Super Admin:** البيانات موجودة في `env.example`:
   - Email: `superadmin@raalc.com`
   - Password: `SuperAdmin@123!`

4. **Clean Up:** الاختبار لا يحذف البيانات المنشأة (يمكنك إضافة cleanup إذا أردت)

---

## 🐛 في حالة حدوث مشاكل

### المشكلة: "Server is not running"
**الحل:** تأكد من تشغيل السيرفر أولاً:
```bash
npm run dev
```

### المشكلة: "Cannot connect to database"
**الحل:** تأكد من:
1. MySQL server شغال
2. بيانات الـ database في `.env` صحيحة

### المشكلة: "OTP/Redis errors"
**الحل:** Redis غير مطلوب للـ Admin testing

---

## ✨ التحسينات المستقبلية

- [ ] إضافة Avatar upload testing
- [ ] إضافة Performance benchmarking
- [ ] إضافة Load testing
- [ ] إضافة Database cleanup بعد الاختبار
- [ ] إضافة Postman collection
- [ ] إضافة Jest integration tests

---

## 📞 الدعم

إذا واجهت أي مشكلة، تحقق من:
1. الـ logs في terminal
2. الـ error messages في التقرير النهائي
3. الـ response data في console

---

**تم إنشاء هذا النظام بواسطة AI Assistant 🤖**






