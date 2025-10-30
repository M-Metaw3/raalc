# 📝 Activity Logging System - نظام تسجيل الأنشطة

## 🎯 نظرة عامة

نظام شامل لتسجيل وتتبع جميع أنشطة الوكلاء (Agents) في الشيفتات، الاستراحات، والجلسات.

---

## ✅ ما يُسجل تلقائياً

### 1️⃣ Check-in Events
```javascript
Type: 'check_in'
Action: "Agent checked in at 08:07 (7 minutes late)"
Metadata: {
  shiftId: 1,
  checkInStatus: 'late',
  lateMinutes: 7
}
```

**متى:** عند تسجيل دخول الوكيل (POST `/api/agents/check-in`)

---

### 2️⃣ Check-out Events
```javascript
Type: 'check_out'
Action: "Agent checked out. Total work: 450 minutes (Overtime: 15 minutes)"
Metadata: {
  totalWorkMinutes: 450,
  totalBreakMinutes: 30,
  overtimeMinutes: 15
}
```

**متى:** عند إنهاء العمل (POST `/api/agents/check-out`)

---

### 3️⃣ Break Request Events
```javascript
Type: 'break_request'
Action: "Requested short break for 15 minutes"
Metadata: {
  breakId: 5,
  type: 'short',
  requestedDuration: 15,
  autoApproved: true
}
```

**متى:** عند طلب استراحة (POST `/api/agents/break/request`)

---

### 4️⃣ Break Start Events
```javascript
Type: 'break_start'
Action: "Started short break"
Metadata: {
  breakId: 5,
  type: 'short'
}
```

**متى:** عند بدء الاستراحة (auto أو بعد الموافقة)

---

### 5️⃣ Break End Events
```javascript
Type: 'break_end'
Action: "Ended short break (17 minutes)"
Metadata: {
  breakId: 5,
  type: 'short',
  actualDuration: 17
}
```

**متى:** عند إنهاء الاستراحة (POST `/api/agents/break/end`)

---

### 6️⃣ Break Approved Events
```javascript
Type: 'break_approved'
Action: "Break request approved by admin"
Metadata: {
  breakId: 5,
  reviewerId: 1
}
```

**متى:** عند موافقة الإدارة (POST `/api/admin/break-requests/:id/approve`)

---

### 7️⃣ Break Rejected Events
```javascript
Type: 'break_rejected'
Action: "Break request rejected by admin: Too many breaks today"
Metadata: {
  breakId: 5,
  reviewerId: 1,
  reason: "Too many breaks today"
}
```

**متى:** عند رفض الإدارة (POST `/api/admin/break-requests/:id/reject`)

---

## 📊 Activity Log Structure

```javascript
{
  id: 123,
  agentId: 5,
  sessionId: 10,                  // Related session (if applicable)
  type: 'check_in',               // Activity type
  action: "Agent checked in...",  // Human-readable description
  details: "...",                 // Additional details (JSON string)
  metadata: {                     // Structured data
    shiftId: 1,
    checkInStatus: 'late',
    lateMinutes: 7
  },
  ipAddress: "192.168.1.100",
  userAgent: "Mozilla/5.0...",
  performedBy: null,              // Admin ID (if admin action)
  timestamp: "2025-10-24T08:07:00"
}
```

---

## 🔌 API Endpoints

### For Agents:

#### 1. Get My Activity Logs
```http
GET /api/agents/activity-logs?limit=50
Authorization: Bearer {agentToken}
```

**Response:**
```json
{
  "ok": true,
  "message": "Activity logs retrieved successfully",
  "data": {
    "logs": [
      {
        "id": 123,
        "type": "check_in",
        "action": "Agent checked in at 08:07",
        "timestamp": "2025-10-24T08:07:00"
      },
      ...
    ],
    "count": 50,
    "agent": {
      "id": 5,
      "fullName": "أحمد محمد",
      "email": "ahmed@example.com"
    }
  }
}
```

---

#### 2. Get My Activity Statistics
```http
GET /api/agents/activity-stats?startDate=2025-10-01&endDate=2025-10-24
Authorization: Bearer {agentToken}
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "total": 150,
    "byType": {
      "check_in": 20,
      "check_out": 20,
      "break_request": 35,
      "break_start": 35,
      "break_end": 35,
      "break_approved": 3,
      "break_rejected": 2
    },
    "timeline": [
      {
        "date": "2025-10-01",
        "count": 8
      },
      {
        "date": "2025-10-02",
        "count": 7
      },
      ...
    ]
  }
}
```

---

### For Admins:

#### 1. Get All Activity Logs (with filters)
```http
GET /api/admin/activity-logs?startDate=2025-10-24&agentId=5&type=check_in
Authorization: Bearer {adminToken}
```

**Query Parameters:**
- `startDate` - من تاريخ (YYYY-MM-DD)
- `endDate` - إلى تاريخ (YYYY-MM-DD)
- `agentId` - فلتر حسب الوكيل
- `type` - فلتر حسب نوع النشاط

**Response:**
```json
{
  "ok": true,
  "data": {
    "logs": [...],
    "count": 100,
    "grouped": {
      "5": [...],  // Logs for agent 5
      "7": [...]   // Logs for agent 7
    }
  }
}
```

---

#### 2. Get Recent Activity
```http
GET /api/admin/activity-logs/recent?limit=20
Authorization: Bearer {adminToken}
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "logs": [
      {
        "id": 456,
        "agentId": 5,
        "type": "check_out",
        "action": "Agent checked out",
        "timestamp": "2025-10-24T16:05:00"
      },
      ...
    ],
    "count": 20
  }
}
```

---

#### 3. Get Specific Agent's Activity Logs
```http
GET /api/admin/agents/{agentId}/activity-logs?limit=100
Authorization: Bearer {adminToken}
```

**Response:** Same as agent's own logs

---

#### 4. Get Specific Agent's Activity Stats
```http
GET /api/admin/agents/{agentId}/activity-stats?startDate=2025-10-01&endDate=2025-10-24
Authorization: Bearer {adminToken}
```

**Response:** Same as agent's own stats

---

## 🎯 Use Cases

### 1. Agent Dashboard - Activity Timeline
```javascript
// Show agent's recent activities
GET /api/agents/activity-logs?limit=10

// Display:
- 16:00 ✅ Checked out (worked 7h 30m)
- 13:45 ▶️ Resumed work
- 13:30 ☕ Break ended (15 minutes)
- 13:15 ☕ Break started
- 11:00 ☕ Break ended (15 minutes)
- 10:45 ☕ Break started
- 08:07 ✅ Checked in (7 min late)
```

---

### 2. Admin Dashboard - Recent Activity Feed
```javascript
// Show all agents' recent activities
GET /api/admin/activity-logs/recent?limit=20

// Display:
- أحمد (Agent #5) checked out - 2 min ago
- سارة (Agent #7) started break - 5 min ago
- محمد (Agent #10) checked in - 10 min ago
- ...
```

---

### 3. Agent Performance Report
```javascript
// Get agent's activity stats for the month
GET /api/admin/agents/5/activity-stats?startDate=2025-10-01&endDate=2025-10-31

// Calculate:
- Total work days: 20
- On-time check-ins: 18 (90%)
- Late check-ins: 2 (10%)
- Total breaks: 40
- Breaks per day: 2 (average)
```

---

### 4. Audit Trail
```javascript
// Check what happened during a specific session
GET /api/admin/sessions/123/activity-logs

// Timeline:
1. 08:05 - Check-in (on time)
2. 11:00 - Break request (15 min)
3. 11:00 - Break started
4. 11:17 - Break ended (actual: 17 min)
5. 13:30 - Break request (20 min)
6. 13:31 - Break approved by Admin
7. 13:31 - Break started
8. 13:50 - Break ended
9. 16:00 - Check-out
```

---

## 📈 Activity Types Reference

| Type | Description | Triggered By |
|------|-------------|--------------|
| `check_in` | تسجيل الدخول | Agent check-in |
| `check_out` | إنهاء العمل | Agent check-out |
| `break_request` | طلب استراحة | Agent requests break |
| `break_start` | بدء الاستراحة | Break approved or auto-approved |
| `break_end` | إنهاء الاستراحة | Agent ends break |
| `break_approved` | موافقة على الاستراحة | Admin approves break |
| `break_rejected` | رفض الاستراحة | Admin rejects break |
| `status_change` | تغيير الحالة | System status change |
| `shift_change` | تغيير الشيفت | Admin changes agent's shift |
| `overtime_request` | طلب وقت إضافي | Agent overtime request |
| `overtime_approved` | موافقة على الوقت الإضافي | Admin approves overtime |
| `system_event` | حدث نظام | System-triggered event |

---

## 🔍 Filtering & Search

### By Date Range:
```http
GET /api/admin/activity-logs?startDate=2025-10-01&endDate=2025-10-31
```

### By Agent:
```http
GET /api/admin/activity-logs?agentId=5
```

### By Type:
```http
GET /api/admin/activity-logs?type=check_in
```

### Combined:
```http
GET /api/admin/activity-logs?startDate=2025-10-24&agentId=5&type=break_request
```

---

## 📊 Statistics Available

### 1. Total Activities
```javascript
stats.total // 150 activities
```

### 2. By Type
```javascript
stats.byType = {
  check_in: 20,
  check_out: 20,
  break_request: 35,
  break_start: 35,
  break_end: 35
}
```

### 3. Daily Timeline
```javascript
stats.timeline = [
  { date: '2025-10-01', count: 8 },
  { date: '2025-10-02', count: 7 },
  ...
]
```

---

## 🎨 UI Display Examples

### Agent Dashboard:
```
📊 نشاطي اليوم

┌─────────────────────────────────┐
│ 08:07  ✅ تسجيل الدخول         │
│        ⚠️ تأخرت 7 دقائق        │
├─────────────────────────────────┤
│ 11:00  ☕ بدأت استراحة قصيرة   │
├─────────────────────────────────┤
│ 11:17  ▶️ عودة للعمل           │
│        (استراحة: 17 دقيقة)     │
├─────────────────────────────────┤
│ 13:30  ⏳ طلب استراحة         │
│        (في انتظار الموافقة)    │
└─────────────────────────────────┘
```

### Admin Dashboard:
```
🌍 النشاط الأخير

┌──────────────────────────────────┐
│ أحمد (#5) - إنهاء العمل         │
│ منذ دقيقتين                     │
├──────────────────────────────────┤
│ سارة (#7) - بدأت استراحة        │
│ منذ 5 دقائق                     │
├──────────────────────────────────┤
│ محمد (#10) - تسجيل دخول          │
│ منذ 10 دقائق                    │
└──────────────────────────────────┘
```

---

## 🔐 Permissions Required

### Agent Endpoints:
- ✅ Authentication only (own logs)

### Admin Endpoints:
- ✅ `view_reports` permission

---

## 💾 Data Retention

**Recommendation:**
- Keep logs for at least 6 months
- Archive older logs to separate table
- Implement automatic cleanup job

**Storage Estimate:**
- ~10 logs per agent per day
- 100 agents = 1,000 logs/day
- 30 days = 30,000 logs/month
- With metadata: ~5-10 MB/month

---

## 🚀 Future Enhancements

### 1. Export to CSV
```javascript
GET /api/admin/activity-logs/export?format=csv&startDate=...
```

### 2. Real-time Activity Stream (WebSocket)
```javascript
socket.on('activity:new', (activity) => {
  // Display in real-time dashboard
});
```

### 3. Activity Alerts
```javascript
// Alert admin when:
- Agent late > 3 times in a week
- Unusual break patterns
- Overtime threshold exceeded
```

### 4. Activity Analytics Dashboard
```javascript
// Visualizations:
- Heatmap of check-in times
- Break patterns by day/time
- Peak activity hours
- Department comparisons
```

---

## ✅ Summary

### ما يُسجل:
✅ كل check-in/check-out
✅ كل طلب استراحة
✅ كل بداية/نهاية استراحة
✅ كل موافقة/رفض من الإدارة
✅ IP address & timestamp

### كيف تصل للـ Logs:
✅ Agent: `/api/agents/activity-logs`
✅ Admin: `/api/admin/activity-logs`
✅ Stats: `/api/agents/activity-stats`

### الاستخدامات:
✅ Audit trail
✅ Performance reports
✅ Timeline display
✅ Activity monitoring

---

**النظام جاهز ويسجل كل شيء تلقائياً! 📝✅**





