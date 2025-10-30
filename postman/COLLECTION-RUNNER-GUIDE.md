# 🏃 Postman Collection Runner - دليل التشغيل التلقائي

كيف تشغّل **كل الاختبارات دفعة واحدة** باستخدام Postman Collection Runner! ⚡

---

## 🎯 ما هو Collection Runner؟

Collection Runner يسمح لك بتشغيل **كل الـ requests في الـ Collection** تلقائياً بترتيب معين، مع:
- ✅ Auto token management
- ✅ Auto data flow بين الـ requests
- ✅ تقرير شامل بالنتائج
- ✅ وقت التنفيذ لكل request

---

## 🚀 كيفية الاستخدام

### 1️⃣ تأكد من تشغيل السيرفر:
```bash
npm run dev
```

### 2️⃣ افتح Postman Collection Runner:

#### الطريقة الأولى:
- اضغط على `RAALC Admin API` Collection
- اضغط **Run** (الزر الأزرق أعلى اليمين)

#### الطريقة الثانية:
- قائمة **View** → **Collection Runner**
- اختر `RAALC Admin API`

### 3️⃣ إعدادات الـ Runner:

```
Collection: RAALC Admin API
Environment: RAALC Development ✅ (مهم جداً!)
Iterations: 1
Delay: 0 ms (أو 100ms للـ safety)
Data File: (leave empty)
```

### 4️⃣ حدد الـ Requests:

#### ✅ Recommended Order (الترتيب الموصى به):

##### أ) **Full Test Flow:**
```
✅ 1️⃣ Authentication
   ✅ Super Admin Login
   ⬜ Refresh Access Token (skip for now)

✅ 4️⃣ Role Management
   ✅ Get All Roles

✅ 5️⃣ Permission Management
   ✅ Get All Permissions

✅ 2️⃣ Admin Management
   ✅ Create New Admin
   ✅ Get All Admins
   ✅ Get Admin By ID
   ⬜ Update Admin (skip or include)
   ⬜ Deactivate Admin (skip for now)
   ⬜ Reactivate Admin (skip for now)
   ⬜ Delete Admin (skip for now)

✅ 6️⃣ Role Assignment
   ✅ Assign Roles to Admin
   ✅ Get Admin Roles

✅ 7️⃣ Test New Admin Access
   ✅ Login as New Admin
   ✅ New Admin - Get Profile
   ✅ New Admin - List Admins

✅ 3️⃣ Profile Management
   ✅ Get My Profile
   ⬜ Update My Profile (optional)
   ⬜ Change Password (skip - requires manual update)
   ⬜ Upload Avatar (skip - requires file)
```

##### ب) **Quick Test (اختبار سريع):**
```
✅ Super Admin Login
✅ Get All Roles
✅ Get All Permissions
✅ Create New Admin
✅ Get All Admins
✅ Assign Roles to Admin
✅ Login as New Admin
✅ New Admin - Get Profile
```

### 5️⃣ اضغط **Run RAALC Admin API** (الزر الأزرق)

### 6️⃣ انتظر النتائج! 🎉

---

## 📊 فهم النتائج

### ✅ Success Results:
```
✅ Super Admin Login              200 OK   320ms
✅ Get All Roles                  200 OK    15ms
✅ Get All Permissions            200 OK    12ms
✅ Create New Admin               201 Created  45ms
...
```

### ❌ Failed Results:
```
❌ Create New Admin               409 Conflict
   → Email already exists
```

---

## 🎛️ Advanced Options

### 1️⃣ **Iterations (تكرار):**
```
Iterations: 3
```
سيشغّل الـ Collection **3 مرات**، كل مرة بـ email جديد!

### 2️⃣ **Delay (تأخير):**
```
Delay: 100 ms
```
تأخير 100ms بين كل request (مفيد للـ rate limiting)

### 3️⃣ **Save Responses:**
```
Save Responses: ✅
```
لحفظ الـ responses ومشاهدتها بعد التشغيل

### 4️⃣ **Keep Variable Values:**
```
Keep variable values: ✅
```
لحفظ الـ tokens بين الـ iterations

---

## 🔄 Test Flow Logic

### الـ Data Flow بين الـ Requests:

```
┌─────────────────────────────┐
│  Super Admin Login          │
│  ↓ Saves: accessToken       │
└─────────────────────────────┘
              ↓
┌─────────────────────────────┐
│  Create New Admin           │
│  ↓ Saves: newAdminId        │
│  ↓ Saves: uniqueEmail       │
└─────────────────────────────┘
              ↓
┌─────────────────────────────┐
│  Assign Roles to Admin      │
│  Uses: newAdminId           │
└─────────────────────────────┘
              ↓
┌─────────────────────────────┐
│  Login as New Admin         │
│  Uses: uniqueEmail          │
│  ↓ Saves: newAdminAccessToken│
└─────────────────────────────┘
              ↓
┌─────────────────────────────┐
│  New Admin - Get Profile    │
│  Uses: newAdminAccessToken  │
└─────────────────────────────┘
```

---

## 🧪 Test Scenarios

### Scenario 1: Basic Admin Flow
```
Requests:
1. Super Admin Login
2. Create New Admin
3. Get Admin By ID
4. Get My Profile

Expected Results:
✅ All pass
✅ newAdminId saved
✅ Tokens working
```

### Scenario 2: RBAC Flow
```
Requests:
1. Super Admin Login
2. Get All Roles
3. Get All Permissions
4. Create New Admin
5. Assign Roles to Admin
6. Login as New Admin
7. Test New Admin - List Admins

Expected Results:
✅ All pass
✅ New admin has correct roles
✅ Permissions applied correctly
```

### Scenario 3: Error Handling
```
Requests:
1. Super Admin Login
2. Create New Admin
3. Create New Admin (again - should fail)

Expected Results:
✅ First creation: 201 Created
❌ Second creation: 409 Conflict (expected)
```

---

## 📝 Pre-request & Test Scripts

### كيف يعمل الـ Auto Token Management؟

#### في Super Admin Login (Test Script):
```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    
    // Save tokens automatically
    pm.collectionVariables.set('accessToken', response.data.tokens.accessToken);
    pm.collectionVariables.set('refreshToken', response.data.tokens.refreshToken);
    
    console.log('✅ Tokens saved!');
}
```

#### في Create New Admin (Pre-request Script):
```javascript
// Generate unique email
const timestamp = Date.now();
pm.collectionVariables.set('uniqueEmail', `newadmin${timestamp}@raalc.com`);
```

#### في Create New Admin (Test Script):
```javascript
if (pm.response.code === 201) {
    const response = pm.response.json();
    
    // Save new admin ID
    pm.collectionVariables.set('newAdminId', response.data.admin.id);
    
    console.log('✅ Admin ID saved: ' + response.data.admin.id);
}
```

---

## 🎨 Customize Runner

### 1️⃣ Skip Certain Requests:

في الـ Runner، **uncheck** الـ requests اللي مش عايزها:
```
✅ Super Admin Login
✅ Create New Admin
⬜ Delete Admin (unchecked)
```

### 2️⃣ Run Specific Folder Only:

بدل ما تشغل الـ Collection كامل، شغّل folder واحد:
```
Right-click on "2️⃣ Admin Management" → Run
```

### 3️⃣ Export Results:

بعد التشغيل:
```
Export Results → JSON or HTML
```

---

## 🐛 Common Issues

### ❌ Issue 1: "Unauthorized" في أول request بعد Login
**Solution:**
- تأكد إن `Keep variable values` مفعّل
- تأكد إن Environment = `RAALC Development`

### ❌ Issue 2: "Invalid admin ID" في Get Admin By ID
**Solution:**
- تأكد إن `Create New Admin` نجح قبلها
- شوف Console لو `newAdminId` محفوظ

### ❌ Issue 3: "Email already exists"
**Solution:**
- امسح الـ uniqueEmail من Variables يدوياً
- أو شغّل مرة تانية (هيولد email جديد تلقائياً)

### ❌ Issue 4: Multiple requests failing
**Solution:**
```bash
# Restart server:
npm run dev

# Check if port 4000 is available:
netstat -an | findstr ":4000"
```

---

## 📊 Expected Results

### ✅ Perfect Run (9 requests):
```
Total Requests: 9
Passed: 9
Failed: 0
Duration: ~2 seconds

✅ Super Admin Login              320ms
✅ Get All Roles                   15ms
✅ Get All Permissions             12ms
✅ Create New Admin                45ms
✅ Get All Admins                  11ms
✅ Assign Roles to Admin           18ms
✅ Login as New Admin             310ms
✅ New Admin - Get Profile         14ms
✅ New Admin - List Admins         10ms
```

---

## 🎯 Pro Tips

### 1. استخدم Console:
```
View → Show Postman Console
```
لمشاهدة الـ logs من الـ scripts

### 2. استخدم Tests:
أضف tests لكل request:
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has admin", function () {
    const response = pm.response.json();
    pm.expect(response.data).to.have.property('admin');
});
```

### 3. استخدم Newman للـ CLI:
```bash
# Install Newman
npm install -g newman

# Run collection from CLI
newman run Admin-Flow-Collection.json \
  -e RAALC-Environment.postman_environment.json \
  --reporters cli,html

# HTML Report سيُنشأ تلقائياً!
```

---

## 🎉 Summary

### ✅ ما تعلمناه:
1. كيف نشغّل Collection Runner
2. كيف نحدد الـ requests المطلوبة
3. كيف نفهم النتائج
4. كيف نستخدم الـ Variables
5. كيف نحل المشاكل الشائعة

### 🚀 Next Steps:
1. جرّب تشغيل Quick Test أولاً
2. بعدين جرّب Full Test Flow
3. استخدم Newman للـ CI/CD

---

**Happy Testing! 🎉**





