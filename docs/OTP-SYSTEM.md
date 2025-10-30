# OTP Authentication System

## Overview

This document provides comprehensive documentation for the OTP (One-Time Password) authentication system implemented in the RAALC project. The system uses SMS-based OTP verification for user registration, login from new devices, and password reset.

## Architecture

### Flow Diagram

```
┌─────────────────┐
│ User Registers  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│ Create User (Inactive)  │
│ isEmailVerified: false  │
│ isActive: false         │
└────────┬────────────────┘
         │
         ▼
┌──────────────────────┐
│ Generate OTP         │
│ Store in Redis       │
│ (10 min TTL)         │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│ Emit Event           │
│ Send SMS (Immediate) │
└────────┬─────────────┘
         │
         ▼
┌──────────────────┐
│ User Enters OTP  │
└────────┬─────────┘
         │
         ▼
┌──────────────────────┐
│ Verify OTP           │
│ Update User:         │
│ isEmailVerified: true│
│ isActive: true       │
└────────┬─────────────┘
         │
         ▼
┌──────────────────┐
│ Generate Tokens  │
│ User Can Login   │
└──────────────────┘
```

## Key Components

### 1. OTPService (`src/services/OTPService.js`)

Handles all OTP-related operations using Redis for storage.

**Features:**
- Generates cryptographically secure 6-digit OTP codes
- Stores OTPs in Redis with automatic expiration (TTL)
- Tracks verification attempts to prevent brute force
- Implements rate limiting for OTP requests
- Supports multiple OTP types:
  - `email_verification` - Registration verification
  - `password_reset` - Password reset
  - `login_verification` - New device login

**Key Methods:**
```javascript
// Generate and store OTP
await OTPService.generateAndStore('email_verification', phone);

// Verify OTP
await OTPService.verifyOTP('email_verification', phone, otp);

// Check if user can resend OTP
const canResend = await OTPService.canResendOTP(phone);

// Delete OTP
await OTPService.deleteOTP('email_verification', phone);
```

**Configuration (from .env):**
```env
OTP_LENGTH=6                        # OTP code length
OTP_EXPIRY_MINUTES=10               # OTP validity period
OTP_MAX_RESEND_ATTEMPTS=3           # Max resend attempts
OTP_RESEND_COOLDOWN_MINUTES=15      # Cooldown between resend attempts
```

### 2. SMSService (`src/services/SMSService.js`)

Handles SMS sending through multiple providers.

**Supported Providers:**
1. **Console** (Development) - Logs SMS to console
2. **Twilio** - Production SMS gateway
3. **AWS SNS** - AWS Simple Notification Service
4. **Custom Gateway** - Your own SMS API

**Configuration:**
```env
SMS_PROVIDER=console                # console, twilio, aws, custom
SMS_FROM_NUMBER=+966XXXXXXXXXX      # Sender number

# Twilio
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token

# AWS SNS
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1

# Custom Gateway
CUSTOM_SMS_GATEWAY_URL=https://api.your-sms-provider.com/send
CUSTOM_SMS_API_KEY=your_api_key
```

**Usage:**
```javascript
// Send OTP via SMS
await SMSService.sendOTP(phone, otp, 'email_verification');

// Send custom SMS
await SMSService.sendSMS(phone, message);
```

**Phone Number Format:**
- Local: `05XXXXXXXX` (Saudi Arabia)
- International: `+9665XXXXXXXX`

The service automatically converts local format to international E.164 format.

### 3. OTP Event Emitter (`src/events/OTPEventEmitter.js`)

Handles OTP-related events with immediate execution using Node.js EventEmitter.

**Events:**
- `otp:send` - Triggered when OTP needs to be sent
- `otp:verified` - Triggered when OTP is successfully verified
- `otp:failed` - Triggered when OTP verification fails
- `otp:sent:success` - SMS sent successfully
- `otp:sent:failed` - SMS sending failed

**Usage:**
```javascript
const otpEventEmitter = require('@events/OTPEventEmitter');

// Emit OTP send event (automatically sends SMS)
otpEventEmitter.emitOTPSend({
  phone: '0551234567',
  otp: '123456',
  type: 'email_verification',
  userId: 1,
  email: 'user@example.com'
});

// Listen for custom events
otpEventEmitter.on('otp:sent:success', (data) => {
  console.log('OTP sent:', data.messageId);
});
```

### 4. OTP Rate Limiter (`src/middleware/otpRateLimiter.js`)

Prevents abuse by limiting OTP requests.

**Limits:**
- **Send OTP**: 5 attempts per 15 minutes (configurable)
- **Verify OTP**: 10 attempts per 15 minutes per IP+Phone
- **Forgot Password**: 3 attempts per hour per Email+IP

**Usage:**
```javascript
const otpRateLimiter = require('@middleware/otpRateLimiter');

// In routes
router.post('/verify-otp', 
  otpRateLimiter.limitVerifyOTP(),
  controller.verifyOTP
);

router.post('/resend-otp',
  otpRateLimiter.limitSendOTP(),
  controller.resendOTP
);

router.post('/forgot-password',
  otpRateLimiter.limitForgotPassword(),
  controller.forgotPassword
);
```

**Configuration:**
```env
OTP_RATE_LIMIT_WINDOW_MS=900000     # 15 minutes in milliseconds
OTP_RATE_LIMIT_MAX_ATTEMPTS=5       # Max attempts per window
```

### 5. User Service (`src/services/UserService.js`)

Integrated with OTP flow for user authentication.

**Key Methods:**

#### Registration with OTP
```javascript
const result = await UserService.register({
  firstName: 'Ahmed',
  lastName: 'Ali',
  email: 'ahmed@example.com',
  password: 'SecurePass123!',
  phone: '0551234567'
});

// Returns:
// {
//   user: { id, email, phone, isActive: false, isEmailVerified: false },
//   message: 'Registration successful. Please verify your phone number.',
//   otpSent: true
// }
```

#### Verify OTP
```javascript
const result = await UserService.verifyOTP('0551234567', '123456');

// Returns:
// {
//   user: { id, email, isActive: true, isEmailVerified: true },
//   tokens: { accessToken, refreshToken, expiresIn }
// }
```

#### Resend OTP
```javascript
const result = await UserService.resendOTP('0551234567');

// Returns:
// {
//   message: 'OTP resent successfully',
//   otpSent: true
// }
```

#### Login with Device Verification
```javascript
const result = await UserService.login(
  'ahmed@example.com',
  'SecurePass123!',
  '192.168.1.1',    // IP
  'device_123'       // Device ID
);

// If new device detected:
// {
//   requiresOTP: true,
//   message: 'New device detected. Please verify with OTP.',
//   phone: '0551234567',
//   userId: 1
// }

// If same device:
// {
//   user: { ... },
//   tokens: { ... }
// }
```

#### Verify Login OTP
```javascript
const result = await UserService.verifyLoginOTP(
  '0551234567',
  '123456',
  '192.168.1.1'
);

// Returns tokens for login
```

#### Forgot Password
```javascript
const result = await UserService.forgotPassword('ahmed@example.com');

// Returns:
// {
//   message: 'OTP sent to your registered phone number.',
//   otpSent: true,
//   phone: '0551234567'
// }
```

#### Reset Password
```javascript
const result = await UserService.resetPassword(
  '0551234567',
  '123456',      // OTP
  'NewPass123!'  // New password
);

// Returns:
// {
//   message: 'Password reset successfully.'
// }
```

## API Endpoints

### 1. Register User
```http
POST /api/users/register
Content-Type: application/json

{
  "firstName": "Ahmed",
  "lastName": "Ali",
  "email": "ahmed@example.com",
  "password": "SecurePass123!",
  "phone": "0551234567"
}
```

**Response:**
```json
{
  "ok": true,
  "message": "Registration successful. Please verify your phone number with the OTP sent.",
  "messageKey": "auth.registerSuccess",
  "data": {
    "user": {
      "id": 1,
      "email": "ahmed@example.com",
      "phone": "0551234567",
      "isActive": false,
      "isEmailVerified": false,
      "userType": "USER"
    },
    "message": "Registration successful. Please verify your phone number with the OTP sent.",
    "otpSent": true
  }
}
```

### 2. Verify OTP
```http
POST /api/users/verify-otp
Content-Type: application/json

{
  "phone": "0551234567",
  "otp": "123456"
}
```

**Response:**
```json
{
  "ok": true,
  "message": "OTP verified successfully.",
  "messageKey": "auth.otpVerified",
  "data": {
    "user": {
      "id": 1,
      "email": "ahmed@example.com",
      "isActive": true,
      "isEmailVerified": true,
      "userType": "USER"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
      "expiresIn": "7d"
    }
  }
}
```

### 3. Resend OTP
```http
POST /api/users/resend-otp
Content-Type: application/json

{
  "phone": "0551234567"
}
```

**Response:**
```json
{
  "ok": true,
  "message": "OTP resent successfully.",
  "messageKey": "auth.otpResent",
  "data": {
    "message": "OTP resent successfully",
    "otpSent": true
  }
}
```

### 4. Login
```http
POST /api/users/login
Content-Type: application/json

{
  "email": "ahmed@example.com",
  "password": "SecurePass123!",
  "deviceId": "device_123"
}
```

**Response (Same Device):**
```json
{
  "ok": true,
  "message": "Login successful.",
  "messageKey": "auth.loginSuccess",
  "data": {
    "user": { ... },
    "tokens": { ... }
  }
}
```

**Response (New Device):**
```json
{
  "ok": true,
  "message": "OTP verification required for login from new device.",
  "messageKey": "auth.otpRequired",
  "data": {
    "requiresOTP": true,
    "message": "New device detected. Please verify with OTP sent to your phone.",
    "phone": "0551234567",
    "userId": 1
  }
}
```

### 5. Verify Login OTP
```http
POST /api/users/verify-login-otp
Content-Type: application/json

{
  "phone": "0551234567",
  "otp": "123456"
}
```

**Response:** Same as regular login (returns tokens)

### 6. Forgot Password
```http
POST /api/users/forgot-password
Content-Type: application/json

{
  "email": "ahmed@example.com"
}
```

**Response:**
```json
{
  "ok": true,
  "message": "OTP sent to your registered phone number.",
  "messageKey": "auth.otpSent",
  "data": {
    "message": "OTP sent to your registered phone number.",
    "otpSent": true,
    "phone": "0551234567"
  }
}
```

### 7. Reset Password
```http
POST /api/users/reset-password
Content-Type: application/json

{
  "phone": "0551234567",
  "otp": "123456",
  "newPassword": "NewSecurePass123!"
}
```

**Response:**
```json
{
  "ok": true,
  "message": "Password reset successfully.",
  "messageKey": "auth.passwordResetSuccess",
  "data": {
    "message": "Password reset successfully. You can now login with your new password."
  }
}
```

## Security Features

### 1. Cryptographically Secure OTP Generation
- Uses `crypto.randomBytes()` for true random OTP generation
- 6-digit codes provide 1 million possible combinations

### 2. Time-Based Expiration
- OTPs expire after 10 minutes (configurable)
- Automatic cleanup via Redis TTL

### 3. Attempt Limiting
- Max 5 verification attempts per OTP
- Constant-time comparison to prevent timing attacks
- Rate limiting at multiple levels

### 4. Rate Limiting
- Per-phone rate limiting for OTP sending
- Per-IP+phone rate limiting for verification
- Configurable windows and limits

### 5. Account State Management
- Users remain inactive until OTP verification
- Prevents unverified users from logging in
- Device tracking for new device detection

## Error Handling

### Common Errors

| Error Key | HTTP Code | Description |
|-----------|-----------|-------------|
| `errors.otpExpired` | 400 | OTP has expired |
| `errors.otpInvalid` | 400 | Invalid OTP code |
| `errors.otpMaxAttemptsExceeded` | 400 | Too many failed attempts |
| `errors.otpResendLimitExceeded` | 429 | Resend limit reached |
| `errors.rateLimitExceeded` | 429 | Rate limit exceeded |
| `errors.smsSendFailed` | 500 | SMS sending failed |
| `errors.accountNotVerified` | 403 | Account not verified |
| `errors.userNotFound` | 404 | User not found |

### Example Error Response
```json
{
  "ok": false,
  "message": "OTP has expired. Please request a new one.",
  "messageKey": "errors.otpExpired",
  "statusCode": 400
}
```

## Development Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp env.example .env
```

Edit `.env`:
```env
# Redis (Required)
REDIS_HOST=localhost
REDIS_PORT=6379

# OTP Configuration
OTP_LENGTH=6
OTP_EXPIRY_MINUTES=10
OTP_MAX_RESEND_ATTEMPTS=3
OTP_RESEND_COOLDOWN_MINUTES=15

# SMS Provider (Development)
SMS_PROVIDER=console
```

### 3. Start Redis
```bash
# Using Docker
docker run -d -p 6379:6379 redis:alpine

# Or install locally
redis-server
```

### 4. Run Application
```bash
npm run dev
```

## Production Deployment

### 1. SMS Provider Setup

#### Option A: Twilio
```env
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
SMS_FROM_NUMBER=+966XXXXXXXXXX
```

#### Option B: AWS SNS
```env
SMS_PROVIDER=aws
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
```

#### Option C: Custom Gateway
```env
SMS_PROVIDER=custom
CUSTOM_SMS_GATEWAY_URL=https://api.your-provider.com/send
CUSTOM_SMS_API_KEY=your_api_key
```

### 2. Redis Configuration
```env
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
```

### 3. Security Settings
```env
NODE_ENV=production
JWT_SECRET=your-very-secure-secret-key-change-this
JWT_REFRESH_SECRET=your-very-secure-refresh-secret-key
```

## Testing

### Manual Testing with cURL

#### 1. Register
```bash
curl -X POST http://localhost:4000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "password": "TestPass123!",
    "phone": "0551234567"
  }'
```

#### 2. Get OTP (Development Mode)
Check console logs for OTP or use Redis CLI:
```bash
redis-cli
> GET otp:email_verification:0551234567
```

#### 3. Verify OTP
```bash
curl -X POST http://localhost:4000/api/users/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "0551234567",
    "otp": "123456"
  }'
```

## Monitoring & Logs

### Log Events
```javascript
// OTP Service logs
[INFO] OTP stored for email_verification:0551234567
[INFO] OTP verified successfully for email_verification:0551234567
[WARN] Invalid OTP attempt for email_verification:0551234567 (3/5)

// SMS Service logs
[INFO] SMS sent via Twilio: { messageId: 'SM...', to: '+9665...', status: 'sent' }
[ERROR] Twilio SMS error: { code: 21211, message: 'Invalid To phone number' }

// Rate Limiter logs
[WARN] OTP send rate limit exceeded for phone: 0551234567
[WARN] Multiple OTP failures for user 1 { attempts: 5 }
```

### Redis Keys
```
otp:email_verification:0551234567      # OTP code
otp:email_verification:0551234567:meta # Metadata (attempts, created_at)
otp:resend:0551234567                  # Resend counter
ratelimit:otp:send:0551234567          # Rate limit counter
ratelimit:otp:verify:0551234567:IP     # Verify rate limit
```

## Best Practices

### 1. Security
- ✅ Never log OTP codes in production
- ✅ Use HTTPS in production
- ✅ Implement device fingerprinting for better security
- ✅ Monitor for suspicious patterns
- ✅ Set up alerts for high failure rates

### 2. User Experience
- ✅ Clear error messages
- ✅ Countdown timers for resend
- ✅ Auto-detect OTP from SMS (frontend)
- ✅ Provide alternative verification methods
- ✅ Support for multiple languages (i18n)

### 3. Operations
- ✅ Monitor SMS delivery rates
- ✅ Track OTP success/failure metrics
- ✅ Set up Redis backup/failover
- ✅ Implement SMS cost alerts
- ✅ Log all authentication events

## Troubleshooting

### OTP Not Received
1. Check SMS provider status
2. Verify phone number format
3. Check Redis connectivity
4. Review rate limiting status
5. Check SMS logs for errors

### OTP Invalid
1. Verify OTP hasn't expired (10 min)
2. Check for typos in phone number
3. Ensure OTP matches phone number
4. Check attempt count (max 5)

### Rate Limit Exceeded
1. Wait for cooldown period
2. Check Redis for rate limit keys
3. Admin can reset rate limits if needed

## Future Enhancements

- [ ] Email OTP as backup
- [ ] WhatsApp OTP integration
- [ ] Biometric authentication
- [ ] Remember trusted devices
- [ ] Admin dashboard for OTP analytics
- [ ] Fraud detection system
- [ ] Multi-factor authentication (MFA)

## Support

For issues or questions:
- Check logs in `logs/` directory
- Review error messages
- Contact development team

---

**Last Updated:** 2025-10-23  
**Version:** 1.0.0

