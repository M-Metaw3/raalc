# 📮 RAALC Admin API - Postman Collection

Complete Postman Collection للـ Admin Flow مع **Automatic Token Management**! 🚀

---

## 📥 التثبيت (Installation)

### 1️⃣ استيراد الـ Collection

في Postman:
1. اضغط **Import**
2. اسحب ملف `Admin-Flow-Collection.json`
3. اضغط **Import**

### 2️⃣ استيراد الـ Environment

1. اضغط **Import**
2. اسحب ملف `RAALC-Environment.postman_environment.json`
3. اضغط **Import**
4. اختر الـ Environment من القائمة المنسدلة (أعلى يمين Postman)

---

## 🚀 الاستخدام السريع (Quick Start)

### ✅ الخطوات:

#### 1. شغّل السيرفر:
```bash
npm run dev
```

#### 2. شغّل الـ Seeders (إن لم تكن قد شغلتها):
```bash
npm run seed
```

#### 3. في Postman، اختبر بالترتيب:

##### أ) **Super Admin Login** (أول طلب):
```
POST /api/admins/login

Body:
{
  "email": "superadmin@raalc.com",
  "password": "SuperAdmin@123!"
}
```

✅ **الـ Script سيحفظ الـ tokens تلقائياً!**

##### ب) جرّب أي endpoint آخر:
- **Get All Admins**
- **Create New Admin**
- **Get My Profile**
- وأي endpoint آخر...

**كل الـ requests ستستخدم الـ token تلقائياً!** 🎉

---

## 🎯 الميزات (Features)

### ✅ 1. Auto Token Management
```javascript
// في كل Login Request، الـ Script يحفظ الـ tokens:
pm.collectionVariables.set('accessToken', response.data.tokens.accessToken);
pm.collectionVariables.set('refreshToken', response.data.tokens.refreshToken);
```

### ✅ 2. Auto Generate Unique Values
```javascript
// في Create Admin:
const timestamp = Date.now();
pm.collectionVariables.set('uniqueEmail', `newadmin${timestamp}@raalc.com`);
```

### ✅ 3. Auto Save IDs
```javascript
// بعد إنشاء Admin جديد:
pm.collectionVariables.set('newAdminId', response.data.admin.id);
```

### ✅ 4. Authorization في كل Request
```json
{
  "auth": {
    "type": "bearer",
    "bearer": [
      {
        "key": "token",
        "value": "{{accessToken}}"
      }
    ]
  }
}
```

---

## 📂 محتوى الـ Collection

### 1️⃣ **Authentication** (2 requests)
- ✅ Super Admin Login
- ✅ Refresh Access Token

### 2️⃣ **Admin Management** (7 requests)
- ✅ Create New Admin
- ✅ Get All Admins
- ✅ Get Admin By ID
- ✅ Update Admin
- ✅ Deactivate Admin
- ✅ Reactivate Admin
- ✅ Delete Admin

### 3️⃣ **Profile Management** (4 requests)
- ✅ Get My Profile
- ✅ Update My Profile
- ✅ Change Password
- ✅ Upload Avatar

### 4️⃣ **Role Management** (5 requests)
- ✅ Get All Roles
- ✅ Create Role
- ✅ Get Role By ID
- ✅ Update Role
- ✅ Delete Role

### 5️⃣ **Permission Management** (4 requests)
- ✅ Get All Permissions
- ✅ Assign Permissions to Role
- ✅ Remove Permission from Role
- ✅ Get Role Permissions

### 6️⃣ **Role Assignment** (3 requests)
- ✅ Assign Roles to Admin
- ✅ Get Admin Roles
- ✅ Remove Role from Admin

### 7️⃣ **Test New Admin Access** (3 requests)
- ✅ Login as New Admin
- ✅ New Admin - Get Profile
- ✅ New Admin - List Admins (Test Permission)

---

## 🔑 الـ Variables المتاحة

في Collection & Environment Variables:

| Variable | Description | Auto-Updated? |
|----------|-------------|---------------|
| `base_url` | Base API URL | ❌ Manual |
| `accessToken` | Current access token | ✅ Auto (Login) |
| `refreshToken` | Current refresh token | ✅ Auto (Login) |
| `newAdminAccessToken` | New admin token | ✅ Auto (New Admin Login) |
| `newAdminId` | Created admin ID | ✅ Auto (Create Admin) |
| `testRoleId` | Created role ID | ✅ Auto (Create Role) |
| `uniqueEmail` | Generated unique email | ✅ Auto (Pre-request) |
| `uniqueRoleName` | Generated unique role name | ✅ Auto (Pre-request) |

---

## 🧪 اختبار الـ RBAC

### Test Flow:

#### 1️⃣ Login as Super Admin:
```
POST /api/admins/login
```

#### 2️⃣ Create New Admin:
```
POST /api/admins
```
✅ `newAdminId` محفوظ تلقائياً

#### 3️⃣ Assign Roles:
```
POST /api/admins/{{newAdminId}}/roles

Body:
{
  "roleIds": [2, 3]  // Admin + Moderator
}
```

#### 4️⃣ Login as New Admin:
```
POST /api/admins/login
(استخدم {{uniqueEmail}} و Admin@123456)
```
✅ `newAdminAccessToken` محفوظ تلقائياً

#### 5️⃣ Test New Admin Permissions:
```
GET /api/admins
(استخدم newAdminAccessToken)
```

---

## 📊 الـ Role IDs الافتراضية

من الـ Seeders:

| ID | Role Name | Description |
|----|-----------|-------------|
| 1 | Super Admin | Full access |
| 2 | Admin | Admin management |
| 3 | Moderator | Content moderation |
| 4 | Content Manager | Content management |
| 5 | Support | Customer support |

---

## 🔐 Default Credentials

### Super Admin:
```
Email: superadmin@raalc.com
Password: SuperAdmin@123!
```

### New Admin (بعد Create):
```
Email: {{uniqueEmail}}
Password: Admin@123456
```

---

## 🐛 Troubleshooting

### ❌ Problem: "Unauthorized" Error
**Solution:**
1. افتح `1️⃣ Authentication`
2. اضغط `Super Admin Login`
3. تأكد من حفظ الـ token (شوف Console في Postman)

### ❌ Problem: "Invalid admin ID"
**Solution:**
1. افتح `2️⃣ Admin Management`
2. اضغط `Create New Admin` أولاً
3. الـ `newAdminId` سيُحفظ تلقائياً

### ❌ Problem: "Email already exists"
**Solution:**
- الـ Script بيولد email unique تلقائياً
- لو حصل خطأ، اعمل Create Admin مرة تانية (سيولد email جديد)

### ❌ Problem: Server not responding
**Solution:**
```bash
# تأكد من تشغيل السيرفر:
npm run dev

# تأكد من الـ port في Environment:
base_url = http://localhost:4000
```

---

## 📝 Notes

### 1. Pre-request Scripts:
تُنفذ **قبل** كل request لتوليد القيم الديناميكية:
```javascript
// في Create Admin:
const timestamp = Date.now();
pm.collectionVariables.set('uniqueEmail', `newadmin${timestamp}@raalc.com`);
```

### 2. Test Scripts:
تُنفذ **بعد** كل request لحفظ البيانات:
```javascript
// في Login:
pm.collectionVariables.set('accessToken', response.data.tokens.accessToken);
```

### 3. Authorization:
الـ Collection level authorization = Bearer Token
```
Authorization: Bearer {{accessToken}}
```

---

## 🎉 Quick Test

### Run Full Flow (Manual):
1. ✅ Super Admin Login
2. ✅ Get All Roles
3. ✅ Get All Permissions
4. ✅ Create New Admin
5. ✅ Assign Roles to Admin
6. ✅ Login as New Admin
7. ✅ Test New Admin - Get Profile
8. ✅ Test New Admin - List Admins

**كل شيء يعمل تلقائياً بدون نسخ/لصق الـ tokens!** 🚀

---

## 📞 Support

لو واجهت أي مشكلة:
1. تأكد من تشغيل السيرفر (`npm run dev`)
2. تأكد من تشغيل الـ Seeders (`npm run seed`)
3. تأكد من اختيار الـ Environment الصحيح في Postman
4. افتح Console في Postman (View → Show Postman Console) لمشاهدة الأخطاء

---

**Happy Testing! 🎉**

