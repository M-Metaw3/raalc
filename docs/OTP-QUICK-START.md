# OTP System - Quick Start Guide

## 🚀 Quick Overview

تم تطبيق نظام OTP كامل مع الميزات التالية:

### ✅ الخيار المُختار: **Option A (Modified)**

```
التسجيل → إنشاء User (غير مفعل) → إرسال OTP → التحقق من OTP → تفعيل الحساب
```

## 📋 المواصفات المُطبّقة

| الميزة | القيمة | قابل للتخصيص |
|--------|---------|---------------|
| **OTP Length** | 6 أرقام | ✅ عبر `.env` |
| **OTP Expiry** | 10 دقائق | ✅ عبر `.env` |
| **Max Resend** | 3 مرات كل 15 دقيقة | ✅ عبر `.env` |
| **OTP Types** | Email Verification, Password Reset, Login Verification | ❌ ثابت |
| **SMS Method** | SMS فقط | ✅ متعدد Providers |
| **Storage** | Redis | ❌ ثابت |
| **Event System** | Event Listener (فوري) | ❌ ثابت |
| **Login Unverified** | ❌ لا يُسمح | ❌ ثابت |
| **New Device** | يُطلب OTP | ✅ حسب Device ID |

## ⚙️ Configuration

### 1. إعداد Redis

```bash
# Docker
docker run -d -p 6379:6379 redis:alpine

# أو محلياً
redis-server
```

### 2. تكوين .env

```env
# OTP Settings
OTP_LENGTH=6
OTP_EXPIRY_MINUTES=10
OTP_MAX_RESEND_ATTEMPTS=3
OTP_RESEND_COOLDOWN_MINUTES=15

# SMS Provider (Development)
SMS_PROVIDER=console

# SMS Provider (Production) - اختر واحد
# SMS_PROVIDER=twilio
# TWILIO_ACCOUNT_SID=your_sid
# TWILIO_AUTH_TOKEN=your_token
# SMS_FROM_NUMBER=+966XXXXXXXXXX
```

### 3. تشغيل التطبيق

```bash
npm install
npm run dev
```

## 🔥 الاستخدام السريع

### 1️⃣ التسجيل (Register)
```http
POST /api/users/register
{
  "firstName": "أحمد",
  "lastName": "علي",
  "email": "ahmed@example.com",
  "password": "Pass123!@",
  "phone": "0551234567"
}
```
**النتيجة:** يتم إنشاء User (inactive) + إرسال OTP فوراً

### 2️⃣ التحقق من OTP (Verify)
```http
POST /api/users/verify-otp
{
  "phone": "0551234567",
  "otp": "123456"
}
```
**النتيجة:** تفعيل الحساب + إرجاع Tokens

### 3️⃣ إعادة إرسال OTP (Resend)
```http
POST /api/users/resend-otp
{
  "phone": "0551234567"
}
```
**النتيجة:** إرسال OTP جديد (مع Rate Limiting)

### 4️⃣ تسجيل الدخول (Login)
```http
POST /api/users/login
{
  "email": "ahmed@example.com",
  "password": "Pass123!@",
  "deviceId": "device_abc123"
}
```
**نتيجة 1 (نفس الجهاز):** Tokens مباشرة  
**نتيجة 2 (جهاز جديد):** طلب OTP → استخدم `/verify-login-otp`

### 5️⃣ نسيت كلمة المرور (Forgot Password)
```http
POST /api/users/forgot-password
{
  "email": "ahmed@example.com"
}
```
**النتيجة:** إرسال OTP

### 6️⃣ إعادة تعيين كلمة المرور (Reset Password)
```http
POST /api/users/reset-password
{
  "phone": "0551234567",
  "otp": "123456",
  "newPassword": "NewPass123!@"
}
```
**النتيجة:** تحديث كلمة المرور

## 📁 الملفات المُضافة/المُعدّلة

### ملفات جديدة
- ✨ `src/services/OTPService.js` - إدارة OTP مع Redis
- ✨ `src/services/SMSService.js` - إرسال SMS (متعدد Providers)
- ✨ `src/events/OTPEventEmitter.js` - Event System للإرسال الفوري
- ✨ `src/middleware/otpRateLimiter.js` - Rate Limiting للـ OTP
- ✨ `src/validators/otpValidators.js` - Validation للـ OTP requests
- ✨ `docs/OTP-SYSTEM.md` - وثائق كاملة
- ✨ `docs/OTP-QUICK-START.md` - هذا الملف

### ملفات مُحدَّثة
- ♻️ `src/services/UserService.js` - دعم كامل للـ OTP flow
- ♻️ `src/controllers/userController.js` - إضافة OTP endpoints
- ♻️ `src/routes/userRoutes.js` - إضافة OTP routes
- ♻️ `src/translations/en.json` - رسائل OTP بالإنجليزية
- ♻️ `src/translations/ar.json` - رسائل OTP بالعربية
- ♻️ `env.example` - إضافة OTP & SMS config

## 🔒 الأمان (Security)

### ما تم تطبيقه:
- ✅ **Cryptographically Secure OTP** - باستخدام `crypto.randomBytes()`
- ✅ **Constant-Time Comparison** - منع Timing Attacks
- ✅ **Rate Limiting** - متعدد المستويات
- ✅ **Attempt Limiting** - max 5 محاولات لكل OTP
- ✅ **Redis TTL** - انتهاء تلقائي للـ OTP
- ✅ **Account State Management** - المستخدم يبقى inactive حتى التحقق
- ✅ **Device Tracking** - كشف الأجهزة الجديدة

## 🧪 الاختبار (Testing)

### Development Mode
في Console Mode، يظهر الـ OTP في:
1. Console log
2. Application logs (`logs/combined.log`)
3. Redis (استخدم `redis-cli`)

```bash
# الحصول على OTP من Redis
redis-cli
> GET otp:email_verification:0551234567
"123456"
```

### Production Mode
قم بتكوين SMS Provider (Twilio/AWS/Custom) في `.env`

## 📊 Monitoring

### Redis Keys للمراقبة
```bash
# عرض جميع OTPs
redis-cli KEYS "otp:*"

# عرض Rate Limits
redis-cli KEYS "ratelimit:*"

# حذف OTP محدد (Admin)
redis-cli DEL "otp:email_verification:0551234567"
```

## 🐛 Troubleshooting

### لا يصل OTP؟
1. ✅ تأكد من تشغيل Redis
2. ✅ تحقق من Console logs (Dev mode)
3. ✅ راجع SMS Provider config (Production)
4. ✅ تحقق من Rate Limiting status

### OTP غير صحيح؟
1. ✅ تأكد من عدم انتهاء الصلاحية (10 دقائق)
2. ✅ تحقق من رقم الهاتف
3. ✅ تأكد من عدم تجاوز 5 محاولات

### Rate Limit Exceeded؟
1. ✅ انتظر فترة الـ Cooldown
2. ✅ تحقق من Redis للـ rate limit keys
3. ✅ Admin يمكنه إعادة تعيين الـ limits

## 📚 الوثائق الكاملة

راجع `docs/OTP-SYSTEM.md` للتفاصيل الكاملة:
- Architecture & Flow Diagrams
- Detailed API Documentation
- Security Features
- Production Deployment Guide
- Error Handling
- Best Practices

## 🎯 Next Steps

1. ✅ اختبر التسجيل مع OTP
2. ✅ اختبر Login من جهاز جديد
3. ✅ اختبر Forgot Password flow
4. ✅ قم بتكوين SMS Provider للـ Production
5. ✅ أضف Frontend integration

## 💡 ملاحظات مهمة

### User Model
- `isActive`: يصبح `true` بعد التحقق من OTP
- `isEmailVerified`: يصبح `true` بعد التحقق من OTP
- `lastLoginIp`: يُستخدم لكشف الأجهزة الجديدة

### Phone Number Format
- تخزين: `0551234567` (Local format)
- إرسال SMS: `+9665551234567` (E.164 format - تلقائي)

### Redis Dependencies
النظام يعتمد بشكل كامل على Redis:
- ⚠️ إذا Redis down، لا يمكن إرسال/التحقق من OTP
- ✅ تأكد من Redis running قبل التشغيل
- ✅ استخدم Redis Cluster في Production

---

**Ready to use!** 🎉

للأسئلة أو المشاكل، راجع:
- `docs/OTP-SYSTEM.md` - وثائق كاملة
- `logs/combined.log` - Application logs
- `logs/error.log` - Error logs

