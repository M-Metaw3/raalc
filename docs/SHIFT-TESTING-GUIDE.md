# 🧪 Shift Management Testing Guide

هذا الدليل يشرح كيفية اختبار نظام إدارة الورديات والاستراحات (Shift Management System).

---

## 📋 **قبل البدء**

### **1️⃣ تأكد من تشغيل الخدمات المطلوبة:**

```bash
# MySQL
# Redis
# Node.js server
```

### **2️⃣ قم بتشغيل الـ Seeders:**

```bash
npm run seed
```

هذا سيُنشئ:
- ✅ الأدوار والصلاحيات
- ✅ Super Admin
- ✅ الأقسام (Departments)
- ✅ الورديات (Shifts)
- ✅ سياسات الاستراحة (Break Policies)

### **3️⃣ شغّل السيرفر:**

```bash
npm run dev
```

---

## 🧪 **طرق الاختبار**

### **الطريقة 1️⃣: Automated Test Script** ⭐ **مُوصى به**

```bash
npm run test:shift
```

#### **المميزات:**
- ✅ اختبار شامل لكل الـ Flow
- ✅ يُنشئ agent تلقائياً
- ✅ يختبر check-in, break requests, approvals, check-out
- ✅ يطبع تقرير مفصّل
- ✅ يعرض الأخطاء بوضوح

#### **الناتج المتوقع:**

```
🚀 Starting Shift Management Flow Tests
Target: http://localhost:4000
Time: 2025-10-24T10:30:00.000Z

============================================================
  📦 SETUP: Admin & Agent Preparation
============================================================

✅ [234ms] Admin Login
   Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
✅ [45ms] Get Departments
   Departments: 5
   Using Department ID: 1
✅ [38ms] Get Shifts
   Shifts: 4
   Using Shift: Morning (08:00:00-16:00:00)
✅ [156ms] Create Test Agent
   Agent ID: 23
   Email: agent_1729767000000@test.com
✅ [89ms] Approve Agent
   Agent approved
✅ [67ms] Assign Shift to Agent
   Shift assigned
✅ [234ms] Agent Login
   Agent logged in

============================================================
  👤 AGENT FLOW: Check-in, Breaks, Check-out
============================================================

✅ [123ms] Agent Check-in
   Session ID: 15
   Status: active
   Late minutes: 0
✅ [45ms] Get Session Status
   Status: active
   Work minutes: 2
✅ [89ms] Request Short Break (Auto-approved)
   Break ID: 12
   Status: approved
   Auto-approved: true
✅ [2345ms] End Short Break
   Actual duration: 0.03 minutes
✅ [78ms] Request Long Break (Needs Approval)
   Break ID: 13
   Status: pending
   Requires approval: true

============================================================
  👨‍💼 ADMIN FLOW: Approvals
============================================================

✅ [56ms] Get Pending Break Requests
   Pending requests: 1
✅ [98ms] Approve Break Request
   Break approved

============================================================
  👤 AGENT FLOW: Continue & Check-out
============================================================

✅ [2234ms] End Long Break
   Actual duration: 0.04 minutes
✅ [67ms] Get Today's Breaks
   Total breaks today: 2
✅ [45ms] Get Activity Logs
   Activity logs: 7
   Last activity: break_end
✅ [123ms] Agent Check-out
   Work minutes: 5
   Break minutes: 0
   Number of breaks: 2
✅ [89ms] Get Session History
   Sessions: 1
   Total work minutes: 5

============================================================
  📊 ADMIN FLOW: Reports & Dashboard
============================================================

✅ [78ms] Admin View Sessions
   Total sessions: 1
✅ [112ms] Admin Dashboard Stats
   Active agents: 0
   Completed: 1
   Pending approvals: 0

============================================================
  📊 FINAL TEST REPORT
============================================================

Total Tests: 21
✅ Passed: 21
❌ Failed: 0
Success Rate: 100.00%
============================================================

🎉 ALL TESTS PASSED! 🎉
```

---

### **الطريقة 2️⃣: Postman Collection** 🎨

#### **استيراد الـ Collection:**

1. افتح Postman
2. اذهب إلى **Import**
3. اختر ملف: `postman/Shift-Management-Collection.json`
4. استيراد الـ Environment: `postman/RAALC-Environment.postman_environment.json`

#### **تشغيل الـ Collection:**

**أ) يدوياً (Manual):**
- قم بتشغيل كل request بالترتيب
- كل request سيحفظ البيانات المطلوبة تلقائياً (tokens, IDs)

**ب) Collection Runner:**
1. اضغط على "..." بجانب Collection
2. اختر **Run collection**
3. اضغط **Run RAALC - Shift Management**
4. شاهد النتائج

#### **الترتيب المُوصى به:**

```
1️⃣ Admin Authentication
   └─ Admin Login

2️⃣ Setup Data
   ├─ Get Departments
   └─ Get Shifts

3️⃣ Agent Management
   ├─ Create Agent
   ├─ Approve Agent
   ├─ Assign Shift to Agent
   └─ Agent Login

4️⃣ Agent Shift Flow
   ├─ Check-in
   ├─ Get Session Status
   ├─ Request Short Break
   ├─ End Break
   ├─ Get Today's Breaks
   ├─ Get Activity Logs
   ├─ Check-out
   └─ Get Session History

5️⃣ Admin Management
   ├─ Get Pending Break Requests
   ├─ Approve Break Request
   ├─ Get All Sessions
   └─ Get Dashboard Stats
```

---

### **الطريقة 3️⃣: Manual Testing (cURL/Thunder Client)** 🔧

#### **1. Admin Login:**

```bash
curl -X POST http://localhost:4000/api/admins/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@raalc.com",
    "password": "SuperAdmin@123!"
  }'
```

احفظ الـ `accessToken` من الـ response!

#### **2. Get Shifts:**

```bash
curl -X GET http://localhost:4000/api/admin/shifts \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

احفظ أول `id` من الـ shifts.

#### **3. Create Agent:**

```bash
curl -X POST http://localhost:4000/api/agents/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "Agent",
    "email": "testagent@test.com",
    "phone": "0501234567",
    "password": "Agent@123456",
    "confirmPassword": "Agent@123456"
  }'
```

#### **4. Assign Shift:**

```bash
curl -X PUT http://localhost:4000/api/agents/AGENT_ID \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "shiftId": SHIFT_ID,
    "departmentId": DEPARTMENT_ID
  }'
```

#### **5. Agent Check-in:**

```bash
curl -X POST http://localhost:4000/api/agents/check-in \
  -H "Authorization: Bearer YOUR_AGENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "location": {
      "lat": 24.7136,
      "lng": 46.6753
    }
  }'
```

#### **6. Request Break:**

```bash
curl -X POST http://localhost:4000/api/agents/break/request \
  -H "Authorization: Bearer YOUR_AGENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "short",
    "requestedDuration": 15,
    "reason": "Coffee break"
  }'
```

---

## 🧪 **سيناريوهات الاختبار**

### **سيناريو 1: Happy Path** ✅

```
1. Agent check-in on time
2. Request short break (auto-approved)
3. End break
4. Request lunch break (needs approval)
5. Admin approves
6. Agent ends break
7. Agent check-out
```

**النتيجة المتوقعة:** كل الخطوات تنجح ✅

---

### **سيناريو 2: Late Check-in** ⏰

```
1. Agent check-in بعد 15 دقيقة من بداية الوردية
```

**النتيجة المتوقعة:**
- ✅ Check-in ناجح
- ⚠️ `status: "late"`
- ⚠️ `lateMinutes: 15`

---

### **سيناريو 3: Break Limit Exceeded** 🚫

```
1. Agent requests 3 breaks
2. Agent requests 4th break
```

**النتيجة المتوقعة:**
- ✅ First 3 breaks succeed
- ❌ 4th break rejected: `shift.maxBreaksReached`

---

### **سيناريو 4: Break Too Long** 🚫

```
1. Agent requests break with duration > maxDuration
```

**النتيجة المتوقعة:**
- ❌ Request rejected: `shift.breakTooLong`

---

### **سيناريو 5: Check-out While on Break** 🚫

```
1. Agent on break
2. Agent tries to check-out
```

**النتيجة المتوقعة:**
- ❌ Check-out rejected: `shift.cannotCheckOutOnBreak`

---

## 📊 **التحقق من Activity Logs**

### **Agent View:**

```bash
GET /api/agents/activity-logs?limit=20
```

**النتيجة:**
```json
{
  "ok": true,
  "data": {
    "count": 7,
    "logs": [
      {
        "id": 15,
        "type": "check_out",
        "timestamp": "2025-10-24T10:45:00.000Z",
        "details": { "sessionId": 12 }
      },
      {
        "id": 14,
        "type": "break_end",
        "timestamp": "2025-10-24T10:40:00.000Z",
        "details": { "breakRequestId": 8 }
      }
    ]
  }
}
```

### **Admin View:**

```bash
GET /api/admin/agents/AGENT_ID/activity-logs?limit=50
```

---

## 🐛 **استكشاف الأخطاء**

### **❌ "Agent not found"**
- تأكد من إنشاء agent أولاً
- تأكد من تسجيل دخول الـ agent

### **❌ "No shift assigned"**
- قم بتعيين shift للـ agent عن طريق Admin
- استخدم endpoint: `PUT /api/agents/:id`

### **❌ "Already checked in"**
- الـ agent بالفعل checked in
- استخدم `GET /api/agents/session/status` للتحقق

### **❌ "Break policy not found"**
- تأكد من تشغيل الـ seeders
- تأكد من وجود break policy للـ shift

### **❌ "No active session"**
- قم بعمل check-in أولاً
- استخدم `POST /api/agents/check-in`

---

## 📝 **ملاحظات مهمة**

1. **التوقيت:**
   - الاختبار يعتمد على توقيت النظام
   - تأكد من أن الوقت الحالي داخل shift window

2. **Grace Period:**
   - Check-in مسموح خلال grace period (10 دقائق افتراضياً)
   - بعد grace period: يتم وضع علامة "late"

3. **Break Cooldown:**
   - بعد كل استراحة، يجب الانتظار cooldown period
   - افتراضياً: 90 دقيقة

4. **Auto-Approval:**
   - Break requests أقصر من `autoApproveLimit` تُقبل تلقائياً
   - افتراضياً: 15 دقيقة

---

## 🎯 **الخطوات التالية**

بعد الاختبار الناجح، يمكنك:

1. ✅ إضافة agents حقيقيين
2. ✅ تخصيص shift times
3. ✅ تعديل break policies
4. ✅ عرض التقارير
5. ✅ دمج مع frontend

---

## 📞 **الدعم**

إذا واجهت أي مشاكل:
1. تحقق من الـ logs: `logs/combined.log`
2. تحقق من الـ Redis connection
3. تحقق من الـ database connection
4. راجع الـ `.env` settings

---

**🎉 نظام إدارة الورديات جاهز للاستخدام!**





