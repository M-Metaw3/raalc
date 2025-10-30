# 📮 RAALC Postman Collection - ملخص شامل

كل ما تحتاجه لاختبار الـ Admin API من Postman! 🚀

---

## 📦 الملفات المتوفرة

```
postman/
├── Admin-Flow-Collection.json              # الـ Collection الرئيسي
├── RAALC-Environment.postman_environment.json  # الـ Environment
├── README.md                               # دليل الاستخدام
├── COLLECTION-RUNNER-GUIDE.md              # دليل Collection Runner
└── POSTMAN-SETUP-SUMMARY.md                # هذا الملف
```

---

## 🚀 التثبيت السريع (Quick Setup)

### 1️⃣ Import في Postman:

```
1. افتح Postman
2. اضغط Import
3. اسحب هذه الملفات:
   - Admin-Flow-Collection.json
   - RAALC-Environment.postman_environment.json
4. اختر Environment: "RAALC Development"
```

### 2️⃣ شغّل السيرفر:

```bash
npm run dev
```

### 3️⃣ جرّب أول Request:

```
POST /api/admins/login

Body:
{
  "email": "superadmin@raalc.com",
  "password": "SuperAdmin@123!"
}
```

✅ **الـ Token سيُحفظ تلقائياً!**

---

## 🎯 الميزات الرئيسية

### ✅ 1. Auto Token Management
```javascript
// الـ Scripts تحفظ الـ tokens تلقائياً بعد Login:
pm.collectionVariables.set('accessToken', response.data.tokens.accessToken);
```

**بدون نسخ ولصق! 🎉**

### ✅ 2. Auto Generate Unique Data
```javascript
// كل مرة تنشئ admin، email جديد يتولد تلقائياً:
const timestamp = Date.now();
pm.collectionVariables.set('uniqueEmail', `newadmin${timestamp}@raalc.com`);
```

**بدون تعديل يدوي! 🎉**

### ✅ 3. Auto Save IDs
```javascript
// بعد إنشاء admin، الـ ID يُحفظ تلقائياً:
pm.collectionVariables.set('newAdminId', response.data.admin.id);
```

**يعمل تلقائياً في الـ requests التالية! 🎉**

### ✅ 4. Authorization في كل Request
```
Authorization: Bearer {{accessToken}}
```

**مُعدّ مسبقاً على مستوى الـ Collection! 🎉**

---

## 📂 محتوى الـ Collection

### 31 Request موزعة على 7 أقسام:

| القسم | عدد الـ Requests | الوصف |
|-------|-----------------|-------|
| 1️⃣ Authentication | 2 | Login & Refresh Token |
| 2️⃣ Admin Management | 7 | CRUD للـ Admins |
| 3️⃣ Profile Management | 4 | Profile & Avatar |
| 4️⃣ Role Management | 5 | CRUD للـ Roles |
| 5️⃣ Permission Management | 4 | إدارة الصلاحيات |
| 6️⃣ Role Assignment | 3 | ربط Roles بـ Admins |
| 7️⃣ Test New Admin Access | 3 | اختبار الصلاحيات |

**إجمالي: 28 Request** 🎯

---

## 🔑 الـ Variables

### Collection Variables:

| Variable | Description | Auto-Updated? |
|----------|-------------|---------------|
| `accessToken` | Super Admin token | ✅ Yes |
| `refreshToken` | Refresh token | ✅ Yes |
| `newAdminAccessToken` | New admin token | ✅ Yes |
| `newAdminId` | Created admin ID | ✅ Yes |
| `testRoleId` | Created role ID | ✅ Yes |
| `uniqueEmail` | Generated email | ✅ Yes |
| `uniqueRoleName` | Generated role name | ✅ Yes |

### Environment Variable:

| Variable | Value | Editable |
|----------|-------|----------|
| `base_url` | http://localhost:4000 | ✅ Yes |

---

## 🧪 طرق الاختبار

### 1️⃣ Manual Testing (يدوي):

```
1. افتح Postman
2. اختر Request
3. اضغط Send
4. شوف النتيجة
```

**✅ مناسب لـ:** اختبار سريع، debugging

---

### 2️⃣ Collection Runner (تلقائي):

```
1. اضغط Run على الـ Collection
2. حدد الـ Requests المطلوبة
3. اضغط Run
4. شاهد النتائج
```

**✅ مناسب لـ:** Full flow testing، smoke testing

**📖 دليل شامل:** [COLLECTION-RUNNER-GUIDE.md](./COLLECTION-RUNNER-GUIDE.md)

---

### 3️⃣ Newman CLI (من الـ Terminal):

#### Windows:
```bash
npm run test:postman
```

#### Linux/Mac:
```bash
bash scripts/test-admin-postman.sh
```

**✅ مناسب لـ:** CI/CD، Automation، Reporting

**📊 يولد HTML Report تلقائياً!**

---

## 📊 Newman Installation

### Install:
```bash
npm install -g newman
npm install -g newman-reporter-htmlextra
```

### Run:
```bash
newman run postman/Admin-Flow-Collection.json \
  -e postman/RAALC-Environment.postman_environment.json \
  --reporters cli,htmlextra \
  --reporter-htmlextra-export reports/test-report.html
```

### Result:
```
✅ HTML Report: reports/test-report.html
```

---

## 🎬 Test Flows

### Flow 1: Basic Admin Login
```
1. Super Admin Login
   → Saves: accessToken, refreshToken

2. Get My Profile
   → Uses: accessToken
   → Returns: admin info

✅ Test Complete!
```

---

### Flow 2: Create & Manage Admin
```
1. Super Admin Login
   → Saves: accessToken

2. Create New Admin
   → Generates: uniqueEmail
   → Saves: newAdminId

3. Get Admin By ID
   → Uses: newAdminId
   → Returns: admin details

4. Update Admin
   → Uses: newAdminId
   → Updates: fullName, phone

5. Assign Roles to Admin
   → Uses: newAdminId
   → Assigns: [2, 3] (Admin + Moderator)

✅ Admin Created & Configured!
```

---

### Flow 3: Test New Admin Permissions
```
1. Super Admin Login
   → Saves: accessToken

2. Create New Admin
   → Saves: newAdminId, uniqueEmail

3. Assign Roles
   → Assigns: [2] (Admin role)

4. Login as New Admin
   → Uses: uniqueEmail
   → Saves: newAdminAccessToken

5. New Admin - List Admins
   → Uses: newAdminAccessToken
   → Should succeed (has permission)

6. New Admin - Delete Admin
   → Uses: newAdminAccessToken
   → Should succeed (Admin role has delete permission)

✅ RBAC Working!
```

---

### Flow 4: Role & Permission Management
```
1. Super Admin Login

2. Get All Roles
   → Returns: 5 roles

3. Get All Permissions
   → Returns: 48 permissions

4. Create New Role
   → Name: "Test Role"
   → Saves: testRoleId

5. Assign Permissions to Role
   → Uses: testRoleId
   → Assigns: [1, 2, 3, 4, 5]

6. Get Role Permissions
   → Uses: testRoleId
   → Returns: 5 permissions

7. Remove Permission from Role
   → Removes: permission 1

8. Delete Role
   → Deletes: testRoleId

✅ Role Management Complete!
```

---

## 🐛 Troubleshooting

### ❌ "Unauthorized" Error

**Cause:** Token not saved or expired

**Solution:**
```
1. Run "Super Admin Login" first
2. Check Console (View → Show Postman Console)
3. Verify "✅ Tokens saved!" message
4. Check Collection Variables (eye icon)
```

---

### ❌ "Invalid admin ID"

**Cause:** `newAdminId` is null or empty

**Solution:**
```
1. Run "Create New Admin" first
2. Check Console for "✅ Admin ID saved: X"
3. Check Collection Variables
4. If empty, re-run Create Admin
```

---

### ❌ "Email already exists"

**Cause:** Email already used

**Solution:**
```
1. Delete `uniqueEmail` from Variables
2. Re-run "Create New Admin"
3. New unique email will be generated
```

---

### ❌ Server not responding

**Cause:** Server not running or wrong port

**Solution:**
```bash
# Start server:
npm run dev

# Check if running:
curl http://localhost:4000/health

# Expected:
{
  "status": "healthy",
  "timestamp": "2025-10-23T...",
  ...
}
```

---

### ❌ Newman: Command not found

**Solution:**
```bash
npm install -g newman
npm install -g newman-reporter-htmlextra
```

---

## 📝 Scripts Explanation

### Pre-request Script:
يُنفذ **قبل** إرسال الـ request:

```javascript
// Example: Generate unique email
const timestamp = Date.now();
pm.collectionVariables.set('uniqueEmail', `newadmin${timestamp}@raalc.com`);
```

**يُستخدم في:**
- Create New Admin
- Create Role

---

### Test Script:
يُنفذ **بعد** استلام الـ response:

```javascript
// Example: Save tokens
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.collectionVariables.set('accessToken', response.data.tokens.accessToken);
}
```

**يُستخدم في:**
- Super Admin Login
- Login as New Admin
- Create New Admin
- Create Role

---

## 🎯 Pro Tips

### 1. استخدم Console للـ Debugging:
```
View → Show Postman Console
```

### 2. استخدم Tests للـ Validation:
```javascript
pm.test("Status is 200", function () {
    pm.response.to.have.status(200);
});
```

### 3. استخدم Environments للـ Multiple Servers:
```
- RAALC Development (localhost:4000)
- RAALC Staging (staging.raalc.com)
- RAALC Production (api.raalc.com)
```

### 4. استخدم Newman للـ CI/CD:
```yaml
# .github/workflows/api-tests.yml
- name: Run API Tests
  run: npm run test:postman
```

---

## 📚 Additional Resources

### Documentation:
- [README.md](./README.md) - دليل الاستخدام الأساسي
- [COLLECTION-RUNNER-GUIDE.md](./COLLECTION-RUNNER-GUIDE.md) - Collection Runner
- [POSTMAN-SETUP-SUMMARY.md](./POSTMAN-SETUP-SUMMARY.md) - هذا الملف

### Scripts:
- `scripts/test-admin-postman.ps1` - Windows PowerShell
- `scripts/test-admin-postman.sh` - Linux/Mac Bash

### NPM Scripts:
```bash
npm run test:postman    # Run Newman tests
npm run test:admin      # Run Node.js tests
npm run seed            # Seed database
npm run dev             # Start server
```

---

## 🎉 Summary

### ✅ ما تم إنجازه:

1. **Postman Collection** بـ 28 request كامل
2. **Environment File** مع كل الـ variables
3. **Auto Token Management** بدون نسخ/لصق
4. **Auto Generate Data** لكل الـ requests
5. **Auto Save IDs** للـ admins و roles
6. **Collection Runner Guide** شامل
7. **Newman Scripts** للـ CLI testing
8. **HTML Reports** تلقائية

### 🚀 كيف تبدأ:

```bash
# 1. Import في Postman
# 2. Start server:
npm run dev

# 3. Run first request:
POST /api/admins/login

# 4. Enjoy automatic everything! 🎉
```

---

**Happy Testing! 📮🚀**

