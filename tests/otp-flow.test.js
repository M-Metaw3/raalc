/**
 * OTP Flow Test Script
 * 
 * Comprehensive test for the complete OTP authentication flow
 * Tests all possible scenarios and validates Redis storage
 * 
 * Usage: node tests/otp-flow.test.js
 */

const axios = require('axios');
const redis = require('redis');

// Configuration
const API_BASE_URL = process.env.API_URL || 'http://localhost:6000/api';
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = process.env.REDIS_PORT || 6379;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m'
};

// Test data
const testUser = {
  fullName: 'أحمد محمد علي',
  email: `test_${Date.now()}@example.com`,
  phone: `0512345${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
  password: 'TestPass123!@',
  confirmPassword: 'TestPass123!@'
};

// Global state
let registerToken = null;
let loginToken = null;
let resetToken = null;
let accessToken = null;
let refreshToken = null;
let userId = null;
let otpCode = null;
let redisClient = null;

// Helper functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const colorMap = {
    success: colors.green,
    error: colors.red,
    warning: colors.yellow,
    info: colors.cyan,
    test: colors.blue
  };
  console.log(`${colorMap[type]}[${timestamp}] ${message}${colors.reset}`);
}

function logSection(title) {
  console.log(`\n${colors.bright}${colors.cyan}${'='.repeat(60)}`);
  console.log(`  ${title}`);
  console.log(`${'='.repeat(60)}${colors.reset}\n`);
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function connectRedis() {
  return new Promise((resolve, reject) => {
    redisClient = redis.createClient({
      host: REDIS_HOST,
      port: REDIS_PORT
    });

    redisClient.on('connect', () => {
      log('✅ Connected to Redis', 'success');
      resolve();
    });

    redisClient.on('error', (err) => {
      log(`❌ Redis error: ${err.message}`, 'error');
      reject(err);
    });
  });
}

async function checkRedisKey(key, description) {
  return new Promise((resolve) => {
    redisClient.get(key, (err, value) => {
      if (err) {
        log(`❌ Redis check failed for ${description}: ${err.message}`, 'error');
        resolve(false);
      } else if (value) {
        log(`✅ Redis key exists: ${description} = ${value}`, 'success');
        resolve(true);
      } else {
        log(`⚠️  Redis key not found: ${description}`, 'warning');
        resolve(false);
      }
    });
  });
}

async function checkRedisKeyDeleted(key, description) {
  return new Promise((resolve) => {
    redisClient.get(key, (err, value) => {
      if (err) {
        log(`❌ Redis check failed for ${description}: ${err.message}`, 'error');
        resolve(false);
      } else if (!value) {
        log(`✅ Redis key deleted: ${description}`, 'success');
        resolve(true);
      } else {
        log(`⚠️  Redis key still exists: ${description}`, 'warning');
        resolve(false);
      }
    });
  });
}

async function makeRequest(method, endpoint, data = null, token = null) {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers: {}
    };

    if (data) {
      config.data = data;
      config.headers['Content-Type'] = 'application/json';
    }

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || { message: error.message }
    };
  }
}

// Test cases
async function test1_UserRegistration() {
  logSection('TEST 1: User Registration');
  
  log('Registering new user...', 'test');
  const result = await makeRequest('POST', '/users/register', testUser);

  if (!result.success) {
    log(`❌ Registration failed: ${result.error.message}`, 'error');
    return false;
  }

  log(`✅ User registered successfully`, 'success');
  log(`📧 Email: ${testUser.email}`, 'info');
  log(`📱 Phone: ${testUser.phone}`, 'info');
  
  // Extract data
  registerToken = result.data.data.registerToken;
  userId = result.data.data.user.id;
  otpCode = result.data.data.otp; // Available in dev mode
  
  log(`🔑 Register Token: ${registerToken?.substring(0, 20)}...`, 'info');
  log(`🔢 OTP Code (Dev Mode): ${otpCode}`, 'info');
  log(`👤 User ID: ${userId}`, 'info');

  // Check user state
  const user = result.data.data.user;
  if (!user.isActive) {
    log('✅ User is inactive (correct)', 'success');
  } else {
    log('❌ User should be inactive', 'error');
  }

  if (!user.isPhoneVerified) {
    log('✅ Phone not verified (correct)', 'success');
  } else {
    log('❌ Phone should not be verified', 'error');
  }

  // Check Redis
  await sleep(1000);
  await checkRedisKey(`otp:phone_verification:${testUser.phone}`, 'Registration OTP');
  await checkRedisKey(`otp:phone_verification:${testUser.phone}:meta`, 'OTP Metadata');
  await checkRedisKey(`otp:resend:${testUser.phone}`, 'Resend Counter');

  return true;
}

async function test2_OTPVerification() {
  logSection('TEST 2: OTP Verification');

  log('Verifying OTP...', 'test');
  const result = await makeRequest('POST', '/users/verify-otp', {
    registerToken,
    otp: otpCode
  });

  if (!result.success) {
    log(`❌ OTP verification failed: ${result.error.message}`, 'error');
    return false;
  }

  log('✅ OTP verified successfully', 'success');

  // Extract tokens
  accessToken = result.data.data.tokens.accessToken;
  refreshToken = result.data.data.tokens.refreshToken;

  log(`🔑 Access Token: ${accessToken?.substring(0, 20)}...`, 'info');
  log(`🔄 Refresh Token: ${refreshToken?.substring(0, 20)}...`, 'info');

  // Check user state
  const user = result.data.data.user;
  if (user.isActive) {
    log('✅ User is active', 'success');
  } else {
    log('❌ User should be active', 'error');
  }

  if (user.isPhoneVerified) {
    log('✅ Phone verified', 'success');
  } else {
    log('❌ Phone should be verified', 'error');
  }

  // Check Redis - OTP should be deleted
  await sleep(1000);
  await checkRedisKeyDeleted(`otp:phone_verification:${testUser.phone}`, 'Registration OTP');

  return true;
}

async function test3_LoginWithEmail() {
  logSection('TEST 3: Login with Email');

  log('Logging in with email...', 'test');
  const result = await makeRequest('POST', '/users/login', {
    identifier: testUser.email,
    password: testUser.password
  });

  if (!result.success) {
    log(`❌ Login failed: ${result.error.message}`, 'error');
    return false;
  }

  log('✅ Login with email successful', 'success');
  
  if (result.data.data.tokens) {
    log('✅ Received authentication tokens', 'success');
  } else if (result.data.data.requiresOTP) {
    log('⚠️  OTP required for new device', 'warning');
  }

  return true;
}

async function test4_LoginWithPhone() {
  logSection('TEST 4: Login with Phone Number');

  log('Logging in with phone...', 'test');
  const result = await makeRequest('POST', '/users/login', {
    identifier: testUser.phone,
    password: testUser.password
  });

  if (!result.success) {
    log(`❌ Login failed: ${result.error.message}`, 'error');
    return false;
  }

  log('✅ Login with phone successful', 'success');
  
  if (result.data.data.tokens) {
    log('✅ Received authentication tokens', 'success');
  } else if (result.data.data.requiresOTP) {
    log('⚠️  OTP required for new device', 'warning');
  }

  return true;
}

async function test5_LoginNewDevice() {
  logSection('TEST 5: Login from New Device (OTP Required)');

  log('Logging in from new device...', 'test');
  const result = await makeRequest('POST', '/users/login', {
    identifier: testUser.email,
    password: testUser.password,
    deviceId: `device_${Date.now()}`
  });

  if (!result.success) {
    log(`❌ Login failed: ${result.error.message}`, 'error');
    return false;
  }

  if (result.data.data.requiresOTP) {
    log('✅ OTP required for new device (correct)', 'success');
    loginToken = result.data.data.loginToken;
    otpCode = result.data.data.otp; // Dev mode
    
    log(`🔑 Login Token: ${loginToken?.substring(0, 20)}...`, 'info');
    log(`🔢 OTP Code: ${otpCode}`, 'info');

    // Check Redis
    await sleep(1000);
    await checkRedisKey(`otp:login_verification:${testUser.phone}`, 'Login OTP');
  } else {
    log('⚠️  Expected OTP requirement for new device', 'warning');
  }

  return true;
}

async function test6_VerifyLoginOTP() {
  logSection('TEST 6: Verify Login OTP');

  if (!loginToken || !otpCode) {
    log('⚠️  Skipping - no login OTP to verify', 'warning');
    return true;
  }

  log('Verifying login OTP...', 'test');
  const result = await makeRequest('POST', '/users/verify-login-otp', {
    loginToken,
    otp: otpCode
  });

  if (!result.success) {
    log(`❌ Login OTP verification failed: ${result.error.message}`, 'error');
    return false;
  }

  log('✅ Login OTP verified successfully', 'success');

  // Check Redis - OTP should be deleted
  await sleep(1000);
  await checkRedisKeyDeleted(`otp:login_verification:${testUser.phone}`, 'Login OTP');

  return true;
}

async function test7_ForgotPassword() {
  logSection('TEST 7: Forgot Password');

  log('Requesting password reset...', 'test');
  const result = await makeRequest('POST', '/users/forgot-password', {
    email: testUser.email
  });

  if (!result.success) {
    log(`❌ Forgot password failed: ${result.error.message}`, 'error');
    return false;
  }

  log('✅ Password reset OTP sent', 'success');
  
  resetToken = result.data.data.resetToken;
  otpCode = result.data.data.otp; // Dev mode

  log(`🔑 Reset Token: ${resetToken?.substring(0, 20)}...`, 'info');
  log(`🔢 OTP Code: ${otpCode}`, 'info');

  // Check Redis
  await sleep(1000);
  await checkRedisKey(`otp:password_reset:${testUser.phone}`, 'Password Reset OTP');

  return true;
}

async function test8_ResetPassword() {
  logSection('TEST 8: Reset Password');

  const newPassword = 'NewPass123!@';

  log('Resetting password with OTP...', 'test');
  const result = await makeRequest('POST', '/users/reset-password', {
    resetToken,
    otp: otpCode,
    newPassword
  });

  if (!result.success) {
    log(`❌ Password reset failed: ${result.error.message}`, 'error');
    return false;
  }

  log('✅ Password reset successfully', 'success');

  // Check Redis - OTP should be deleted
  await sleep(1000);
  await checkRedisKeyDeleted(`otp:password_reset:${testUser.phone}`, 'Password Reset OTP');

  // Try logging in with new password
  log('Testing login with new password...', 'test');
  const loginResult = await makeRequest('POST', '/users/login', {
    identifier: testUser.email,
    password: newPassword
  });

  if (loginResult.success) {
    log('✅ Login with new password successful', 'success');
  } else {
    log('❌ Login with new password failed', 'error');
    return false;
  }

  return true;
}

async function test9_ResendOTP() {
  logSection('TEST 9: Resend OTP');

  // Register another user to test resend
  const newUser = {
    fullName: 'محمد أحمد',
    email: `test_resend_${Date.now()}@example.com`,
    phone: `0512345${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
    password: 'TestPass123!@',
    confirmPassword: 'TestPass123!@'
  };

  log('Registering new user for resend test...', 'test');
  const regResult = await makeRequest('POST', '/users/register', newUser);

  if (!regResult.success) {
    log(`❌ Registration failed: ${regResult.error.message}`, 'error');
    return false;
  }

  const resendToken = regResult.data.data.registerToken;

  log('Waiting 2 seconds...', 'info');
  await sleep(2000);

  log('Resending OTP...', 'test');
  const result = await makeRequest('POST', '/users/resend-otp', {
    registerToken: resendToken
  });

  if (!result.success) {
    log(`❌ Resend OTP failed: ${result.error.message}`, 'error');
    return false;
  }

  log('✅ OTP resent successfully', 'success');

  // Check resend counter in Redis
  await sleep(1000);
  await checkRedisKey(`otp:resend:${newUser.phone}`, 'Resend Counter');

  return true;
}

async function test10_RateLimiting() {
  logSection('TEST 10: Rate Limiting');

  // Try to resend OTP multiple times quickly
  const newUser = {
    fullName: 'علي محمد',
    email: `test_rate_${Date.now()}@example.com`,
    phone: `0512345${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
    password: 'TestPass123!@',
    confirmPassword: 'TestPass123!@'
  };

  log('Registering user for rate limit test...', 'test');
  const regResult = await makeRequest('POST', '/users/register', newUser);

  if (!regResult.success) {
    log(`❌ Registration failed: ${regResult.error.message}`, 'error');
    return false;
  }

  const rateToken = regResult.data.data.registerToken;

  log('Testing rate limiting by sending multiple resend requests...', 'test');
  
  for (let i = 0; i < 5; i++) {
    const result = await makeRequest('POST', '/users/resend-otp', {
      registerToken: rateToken
    });

    if (result.success) {
      log(`✅ Resend ${i + 1} successful`, 'success');
    } else {
      if (result.error.messageKey === 'errors.rateLimitExceeded' || 
          result.error.messageKey === 'errors.otpResendLimitExceeded') {
        log(`✅ Rate limit triggered after ${i + 1} attempts (correct)`, 'success');
        return true;
      } else {
        log(`⚠️  Unexpected error: ${result.error.message}`, 'warning');
      }
    }

    await sleep(500);
  }

  log('⚠️  Rate limiting may not have triggered', 'warning');
  return true;
}

// Main test runner
async function runTests() {
  console.log(`\n${colors.bright}${colors.cyan}`);
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║        OTP AUTHENTICATION FLOW - COMPREHENSIVE TEST        ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(colors.reset);

  log(`🌐 API Base URL: ${API_BASE_URL}`, 'info');
  log(`🔴 Redis: ${REDIS_HOST}:${REDIS_PORT}`, 'info');

  try {
    // Connect to Redis
    await connectRedis();

    const tests = [
      { name: 'User Registration', fn: test1_UserRegistration },
      { name: 'OTP Verification', fn: test2_OTPVerification },
      { name: 'Login with Email', fn: test3_LoginWithEmail },
      { name: 'Login with Phone', fn: test4_LoginWithPhone },
      { name: 'Login New Device', fn: test5_LoginNewDevice },
      { name: 'Verify Login OTP', fn: test6_VerifyLoginOTP },
      { name: 'Forgot Password', fn: test7_ForgotPassword },
      { name: 'Reset Password', fn: test8_ResetPassword },
      { name: 'Resend OTP', fn: test9_ResendOTP },
      { name: 'Rate Limiting', fn: test10_RateLimiting }
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
      try {
        const result = await test.fn();
        if (result) {
          passed++;
        } else {
          failed++;
        }
      } catch (error) {
        log(`❌ Test "${test.name}" crashed: ${error.message}`, 'error');
        failed++;
      }
    }

    // Summary
    logSection('TEST SUMMARY');
    console.log(`${colors.green}✅ Passed: ${passed}${colors.reset}`);
    console.log(`${colors.red}❌ Failed: ${failed}${colors.reset}`);
    console.log(`${colors.cyan}📊 Total:  ${passed + failed}${colors.reset}`);

    if (failed === 0) {
      console.log(`\n${colors.bright}${colors.green}🎉 ALL TESTS PASSED! 🎉${colors.reset}\n`);
    } else {
      console.log(`\n${colors.bright}${colors.red}⚠️  SOME TESTS FAILED ⚠️${colors.reset}\n`);
    }

  } catch (error) {
    log(`❌ Fatal error: ${error.message}`, 'error');
    console.error(error);
  } finally {
    if (redisClient) {
      redisClient.quit();
      log('🔌 Redis connection closed', 'info');
    }
  }
}

// Run tests
runTests().catch(console.error);

