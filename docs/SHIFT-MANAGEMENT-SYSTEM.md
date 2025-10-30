# 🏢 Shift Management System - نظام إدارة الشيفتات

نظام شامل لإدارة شيفتات الوكلاء (Agents) والاستراحات والحضور والانصراف.

---

## 📋 المحتويات

1. [نظرة عامة](#نظرة-عامة)
2. [الأدوار](#الأدوار)
3. [نماذج البيانات](#نماذج-البيانات)
4. [الفلوهات الرئيسية](#الفلوهات-الرئيسية)
5. [القواعد والتحققات](#القواعد-والتحققات)
6. [الشاشات](#الشاشات)
7. [API Endpoints](#api-endpoints)
8. [الإشعارات](#الإشعارات)
9. [التقارير](#التقارير)

---

## 🎯 نظرة عامة

### الهدف

تطبيق نظام بسيط ودقيق لإدارة:

- ✅ مواعيد الشيفتات (صباحي / مسائي / من المنزل)
- ✅ سياسات الاستراحات (عدد المرّات، المدة، آلية الموافقة)
- ✅ تتبّع حضور وانصراف الوكلاء
- ✅ حساب ساعات العمل الفعلية
- ✅ تقارير أداء قابلة للعرض

### المبدأ الأساسي

**كل القواعد قابلة للضبط** من شاشة إعدادات الأدمن:
- أوقات الشيفت
- عدد ومدة الاستراحات
- آلية الموافقات
- الإسناد حسب القسم/الدور/نوع الشيفت

---

## 👥 الأدوار

### 1. Admin (إدارة)
- ضبط إعدادات الشيفتات والاستراحات
- عرض التقارير
- اعتماد الاستراحات (إن لزم)
- إدارة الأقسام والوكلاء

### 2. Agent (وكيل)
- بدء/إنهاء الشيفت
- طلب استراحات وفق السياسات
- عرض سجل العمل اليومي

### 3. Supervisor (اختياري)
- الموافقة على طلبات الفريق
- عرض تقارير الفريق فقط

---

## 🗄️ نماذج البيانات

### 1. Department (القسم)
```javascript
{
  id: INT,
  name: VARCHAR(100),        // English name
  nameAr: VARCHAR(100),      // Arabic name
  description: TEXT,
  isActive: BOOLEAN
}
```

**أمثلة:** أسرة، عمل، ميراث، عقارات

---

### 2. Shift (الشيفت)
```javascript
{
  id: INT,
  name: VARCHAR(50),           // "Morning", "Evening", "Remote"
  nameAr: VARCHAR(50),         // "صباحي", "مسائي", "من المنزل"
  startTime: TIME,             // 08:00:00
  endTime: TIME,               // 16:00:00
  gracePeriod: INT,            // 10 minutes
  allowOvertime: BOOLEAN,
  overtimeRequiresApproval: BOOLEAN,
  maxOvertimeMinutes: INT,
  assignmentType: ENUM('all', 'department', 'specific'),
  departmentId: INT (nullable),
  isActive: BOOLEAN
}
```

---

### 3. BreakPolicy (سياسة الاستراحة)
```javascript
{
  id: INT,
  shiftId: INT (unique),       // واحد لكل shift
  maxBreaksPerDay: INT,        // 2
  minDuration: INT,            // 10 minutes
  maxDuration: INT,            // 30 minutes
  autoApproveLimit: INT,       // 15 minutes
  cooldownMinutes: INT,        // 90 minutes
  preferredStartTime: TIME,    // 12:00:00 (optional)
  preferredEndTime: TIME,      // 14:00:00 (optional)
  blockDuringMeetings: BOOLEAN,
  meetingBufferMinutes: INT,   // 10 minutes
  allowedBreakTypes: JSON      // ['short', 'lunch', 'emergency']
}
```

---

### 4. AgentSession (جلسة العمل)
```javascript
{
  id: INT,
  agentId: INT,
  shiftId: INT,
  date: DATE,                  // 2025-10-23
  checkIn: DATETIME,           // 2025-10-23 08:07:00
  checkOut: DATETIME,          // 2025-10-23 16:00:00
  checkInStatus: ENUM('on_time', 'late', 'early'),
  lateMinutes: INT,
  totalWorkMinutes: INT,
  totalBreakMinutes: INT,
  overtimeMinutes: INT,
  overtimeApproved: BOOLEAN,
  status: ENUM('active', 'on_break', 'completed', 'incomplete'),
  checkInIp: VARCHAR(45),
  checkInLocation: JSON,       // {lat, lng}
  notes: TEXT
}
```

---

### 5. BreakRequest (طلب استراحة)
```javascript
{
  id: INT,
  sessionId: INT,
  agentId: INT,
  policyId: INT,
  type: ENUM('short', 'lunch', 'emergency'),
  requestedDuration: INT,      // 15 minutes
  actualDuration: INT,         // 17 minutes
  startTime: DATETIME,
  endTime: DATETIME,
  status: ENUM('pending', 'approved', 'rejected', 'active', 'completed', 'cancelled'),
  autoApproved: BOOLEAN,
  reason: TEXT,
  rejectionReason: TEXT,
  reviewedBy: INT (Admin ID),
  reviewedAt: DATETIME,
  violatedRules: JSON          // ['max_breaks', 'cooldown']
}
```

---

### 6. ActivityLog (سجل الأنشطة)
```javascript
{
  id: INT,
  agentId: INT,
  sessionId: INT,
  type: ENUM(
    'check_in', 'check_out', 
    'break_request', 'break_start', 'break_end',
    'break_approved', 'break_rejected',
    'status_change', 'shift_change',
    'overtime_request', 'overtime_approved'
  ),
  action: VARCHAR(255),        // "Agent checked in at 08:07"
  details: TEXT,
  metadata: JSON,
  ipAddress: VARCHAR(45),
  timestamp: DATETIME
}
```

---

### 7. Approval (الموافقات)
```javascript
{
  id: INT,
  requestType: ENUM('break', 'overtime', 'shift_change', 'early_checkout'),
  requestId: INT,
  agentId: INT,
  approverId: INT (Admin ID),
  action: ENUM('approved', 'rejected', 'pending'),
  reason: TEXT,
  notes: TEXT,
  metadata: JSON,
  createdAt: DATETIME,
  reviewedAt: DATETIME
}
```

---

### 8. Report (التقرير اليومي)
```javascript
{
  id: INT,
  date: DATE,
  agentId: INT,
  sessionId: INT,
  totalWorkMinutes: INT,
  totalBreaks: INT,
  totalBreakMinutes: INT,
  overtimeMinutes: INT,
  lateMinutes: INT,
  checkInTime: TIME,
  checkOutTime: TIME,
  attendanceStatus: ENUM('present', 'late', 'absent', 'on_leave', 'incomplete'),
  performanceScore: FLOAT,
  violations: JSON,            // [{type, description, severity}]
  notes: TEXT,
  metadata: JSON
}
```

---

## 🔄 الفلوهات الرئيسية

### 1️⃣ Check-in (بداية اليوم)

```
Agent → يضغط "بدء العمل"
  ↓
System → يتحقق:
  • هل الوقت داخل نافذة الشيفت؟
  • هل تخطّى فترة السماح (Grace Period)?
  ↓
ON TIME:
  ✅ Status = 'active'
  ✅ يبدأ عدّاد ساعات العمل
  ✅ يُسجّل Check-in مع (وقت/موقع/IP)

LATE (within grace):
  ⚠️ Status = 'late'
  ⚠️ يُسجّل عدد دقائق التأخير
  ⚠️ ملاحظة في Activity Log

OUTSIDE SHIFT:
  ❌ رفض: "لا يمكنك بدء العمل الآن: خارج وقت الشيفت"
```

---

### 2️⃣ Break Request (طلب استراحة)

```
Agent → يضغط "طلب استراحة"
  ↓
Agent → يحدد:
  • نوع (قصيرة/غداء/طارئة)
  • المدة (10-30 دقيقة)
  • السبب (اختياري)
  ↓
System → يتحقق من القواعد:
  ✅ عدد الاستراحات < maxBreaksPerDay
  ✅ المدة بين [minDuration, maxDuration]
  ✅ مرّ cooldownMinutes من آخر استراحة
  ✅ ليس هناك اجتماع قريب
  ↓
IF all rules pass AND duration ≤ autoApproveLimit:
  ✅ Status = 'approved' (auto)
  ✅ يبدأ الاستراحة فوراً
  ✅ Status = 'on_break'
  ✅ يتوقف عدّاد العمل
  
ELSE IF any rule violated:
  ❌ Status = 'rejected'
  ❌ رسالة واضحة: "تجاوزت الحد اليومي" أو "يجب الانتظار X دقائق"
  
ELSE:
  ⏳ Status = 'pending'
  ⏳ يذهب للإدارة/Supervisor
  ⏳ رسالة: "طلبك قيد المراجعة"
```

---

### 3️⃣ Break Resume (العودة من الاستراحة)

```
Agent → يضغط "عودة للعمل"
  ↓
System → يحسب:
  • actualDuration = endTime - startTime
  • يضيف للـ totalBreakMinutes
  ↓
System → يحدّث:
  ✅ Status = 'active'
  ✅ يستكمل عدّاد العمل
  ✅ يُسجّل Activity Log
```

---

### 4️⃣ Check-out (نهاية اليوم)

```
Agent → يضغط "إنهاء العمل"
  ↓
System → يتحقق:
  • هل الوكيل في حالة "نشط"؟
  • لو في استراحة → يطلب منه العودة أولاً
  ↓
System → يحسب:
  totalWorkMinutes = (checkOut - checkIn) - totalBreakMinutes
  overtimeMinutes = (totalWorkMinutes) - (shiftDuration)
  ↓
System → يُقفل:
  ✅ Status = 'completed'
  ✅ يُولّد Daily Report
  ✅ يُسجّل Check-out مع (وقت/موقع/IP)
```

---

## ✅ القواعد والتحققات

### 1. Check-in Rules
- ✅ لا بدء عمل خارج نافذة الشيفت
- ✅ تسجيل التأخير إذا تجاوز Grace Period
- ✅ منع تكرار Check-in في نفس اليوم

### 2. Break Rules
- ✅ عدد الاستراحات ≤ maxBreaksPerDay
- ✅ مدة كل استراحة: [minDuration, maxDuration]
- ✅ cooldown بين الاستراحات
- ✅ رفض إذا اجتماع قريب (blockDuringMeetings)
- ✅ auto-approve إذا duration ≤ autoApproveLimit

### 3. Check-out Rules
- ✅ لا يمكن إنهاء العمل أثناء الاستراحة
- ✅ حساب Overtime إن وُجد
- ✅ overtime يتطلب موافقة إن لزم

### 4. Validation Messages
```javascript
// واضحة وبسيطة:
"لا يمكنك بدء العمل الآن: خارج وقت الشيفت (08:00–16:00)."
"طلب الاستراحة مرفوض: الحد الأدنى 10 دقائق والحد الأقصى 20 دقيقة."
"لا يمكنك أخذ استراحة الآن: لديك اجتماع بعد 10 دقائق."
"تم قبول استراحتك تلقائيًا لمدة 15 دقيقة. استراحة سعيدة!"
"تجاوزت الحد اليومي: 2 استراحة فقط."
"يجب الانتظار 90 دقيقة من آخر استراحة."
```

---

## 🖥️ الشاشات

### 1. شاشة إعدادات الأدمن

#### Tabs:
1. **الشيفتات:**
   - قائمة الشيفتات (اسم، من، إلى، Grace، Overtime)
   - زر: إضافة شيفت جديد
   - زر: تعديل/حذف

2. **سياسات الاستراحات:**
   - لكل شيفت: عدد/مدة/موافقة تلقائية/Cooldown
   - نوافذ مفضلة/حظر أثناء الاجتماعات

3. **الإسناد:**
   - تعيين شيفت لقسم/مجموعة/وكيل محدد

4. **قواعد عامة:**
   - حد أقصى للـ Overtime/اليوم
   - إعدادات الإشعارات

---

### 2. شاشة الوكيل (لوحة التحكم)

#### Header:
```
الحالة: نشط | Shift: صباحي | الوقت المتبقي: 3:45
```

#### أزرار:
- 🟢 بدء العمل (Check-in)
- ☕ طلب استراحة
- ▶️ عودة للعمل
- 🔴 إنهاء العمل (Check-out)

#### بطاقات اليوم:
```
📊 الاستراحات: 1/2 مستهلكة
⏱️ إجمالي وقت الاستراحات: 15 دقيقة
⏳ إجمالي ساعات العمل: 5:30
```

#### Timeline:
```
08:07 ✅ بدء العمل (متأخر 7 دقائق)
11:30 ☕ استراحة قصيرة (15 دقيقة)
11:45 ▶️ عودة للعمل
---
```

---

### 3. شاشة الموافقات (للإدارة)

#### الأعمدة:
- الوكيل
- القسم
- نوع الطلب (استراحة/أوفر تايم)
- المدة
- الحالة
- الإجراءات (موافقة/رفض)

#### فلاتر:
- القسم
- الوكيل
- الحالة (قيد المراجعة/مقبول/مرفوض)
- التاريخ

---

## 🔔 الإشعارات

### للوكيل:
- ✅ قبول/رفض الاستراحة
- ⏰ تنبيه قرب نهاية الشيفت
- ⚠️ تحذير تجاوز الحد

### للإدارة/المشرف:
- 🆕 طلبات جديدة
- ⏱️ استراحات طويلة قيد المراجعة
- ⚠️ تجاوز قواعد

---

## 📊 التقارير

### 1. تقرير الحضور/الانصراف
- ساعات العمل الفعلية/اليوم
- متوسط الالتزام ببداية الشيفت
- عدد أيام التأخير
- معدل الحضور

### 2. تقرير الاستراحات
- عدد الاستراحات/اليوم
- مدد الاستراحات
- أنواع الاستراحات
- معدلات الرفض/الموافقة

### 3. تقرير الانضباط
- التأخيرات
- مغادرة مبكرة
- خروقات القواعد
- عدد الأيام الكاملة

### 4. مقارنات
- حسب الشيفت
- حسب القسم
- حسب الفريق
- حسب الفترة (يومي/أسبوعي/شهري)

### 5. تصدير
- CSV
- Excel
- PDF

---

## 🎬 سيناريوهات حقيقية

### Scenario A: شيفت صباحي مع استراحة تلقائية

```
Agent: أحمد
Shift: صباحي (08:00–16:00), Grace=10د
Policy: 2 استراحة/يوم، 10–20د، ≤15د موافقة تلقائية، Cooldown=90د

Timeline:
08:07 → بدء العمل (داخل Grace) ✅ نشط
11:30 → طلب استراحة 15د → قُبل تلقائيًا ✅
11:45 → عودة للعمل
13:00 → طلب 20د → يذهب للموافقة (> 15د) ⏳
13:05 → Admin وافق ✅
13:25 → عودة للعمل
16:00 → إنهاء العمل

Report:
- إجمالي ساعات العمل: 7:30 (450 دقيقة)
- استراحات: 35 دقيقة (15د + 20د)
- ساعات فعلية: 6:55 (415 دقيقة)
- تأخير: 7 دقائق
- Performance Score: 92%
```

---

### Scenario B: من المنزل + حد استراحات

```
Agent: سارة
Shift: من المنزل (09:00–17:00)
Policy: 1 استراحة فقط 30د

Timeline:
09:00 → بدء العمل ✅
12:00 → طلب استراحة 30د → قُبل ✅
12:30 → عودة للعمل
15:00 → طلب استراحة ثانية → ❌ رفض
       "تجاوزت الحد اليومي: 1 استراحة فقط"
17:00 → إنهاء العمل

Report:
- ساعات فعلية: 7:30 (450 دقيقة)
- استراحات: 1 (30 دقيقة)
- Violations: 1 محاولة تجاوز الحد
- Performance Score: 95%
```

---

## 🚀 التنفيذ

### Phase 1: Models & Database ✅
- [x] Create all models
- [x] Update Agent model
- [x] Add relations

### Phase 2: Repositories & Services
- [ ] Create repositories
- [ ] Create services
- [ ] Implement business logic

### Phase 3: Controllers & Routes
- [ ] Create controllers
- [ ] Create validators
- [ ] Create routes

### Phase 4: Middleware & Security
- [ ] Check shift time middleware
- [ ] Break policy validation
- [ ] Authorization checks

### Phase 5: Seeders & Test Data
- [ ] Seed departments
- [ ] Seed shifts
- [ ] Seed break policies

### Phase 6: Testing
- [ ] Unit tests
- [ ] Integration tests
- [ ] Postman collection

---

## 📚 مراجع

- [TypeORM Documentation](https://typeorm.io/)
- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)

---

**نظام شامل ومرن لإدارة الشيفتات! 🎯**

