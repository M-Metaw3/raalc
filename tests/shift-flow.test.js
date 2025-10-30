/**
 * Shift Management Flow Test Script
 * 
 * Comprehensive test for the shift management system
 * Tests all scenarios: check-in, break requests, approvals, check-out
 * 
 * Usage: node -r module-alias/register tests/shift-flow.test.js
 */

const axios = require('axios');

// Configuration
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:4000';
const API_URL = `${BASE_URL}/api`;

// Colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m'
};

// State
let testResults = {
  passed: 0,
  failed: 0,
  total: 0
};

let testData = {
  // Admin
  adminToken: null,
  
  // Agent
  agentId: null,
  agentToken: null,
  agentEmail: `agent_${Date.now()}@test.com`,
  agentPassword: 'Agent@123456',
  
  // Session
  sessionId: null,
  
  // Break requests
  shortBreakId: null,
  longBreakId: null,
  
  // Shift & Department
  shiftId: null,
  departmentId: null
};

// Helper Functions
function print(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function test(name, fn) {
  testResults.total++;
  const startTime = Date.now();
  
  try {
    await fn();
    const duration = Date.now() - startTime;
    print(`✅ [${duration}ms] ${name}`, 'green');
    testResults.passed++;
  } catch (error) {
    print(`❌ ${name}`, 'red');
    print(`   Error: ${error.message}`, 'red');
    if (error.response?.data) {
      print(`   Response: ${JSON.stringify(error.response.data, null, 2)}`, 'yellow');
    }
    testResults.failed++;
  }
}

// Test Functions

/**
 * Step 1: Admin Login
 */
async function testAdminLogin() {
  const response = await axios.post(`${API_URL}/admins/login`, {
    email: 'superadmin@raalc.com',
    password: 'SuperAdmin@123!'
  });

  if (!response.data.data.tokens.accessToken) {
    throw new Error('No access token received');
  }

  testData.adminToken = response.data.data.tokens.accessToken;
  print(`   Token: ${testData.adminToken.substring(0, 30)}...`, 'cyan');
}

/**
 * Step 2: Get Departments
 */
async function testGetDepartments() {
  const response = await axios.get(`${API_URL}/admins/departments`, {
    headers: { Authorization: `Bearer ${testData.adminToken}` }
  });

  if (response.data.data.count === 0) {
    throw new Error('No departments found. Run seeders first: npm run seed');
  }

  testData.departmentId = response.data.data.departments[0].id;
  print(`   Departments: ${response.data.data.count}`, 'cyan');
  print(`   Using Department ID: ${testData.departmentId}`, 'cyan');
}

/**
 * Step 3: Get Shifts
 */
async function testGetShifts() {
  const response = await axios.get(`${API_URL}/admins/shifts`, {
    headers: { Authorization: `Bearer ${testData.adminToken}` }
  });

  if (response.data.data.count === 0) {
    throw new Error('No shifts found. Run seeders first: npm run seed');
  }

  // Find a suitable shift for testing (prefer Morning or first available)
  const morningShift = response.data.data.shifts.find(s => s.name === 'Morning');
  const selectedShift = morningShift || response.data.data.shifts[0];
  
  testData.shiftId = selectedShift.id;
  print(`   Shifts: ${response.data.data.count}`, 'cyan');
  print(`   Using Shift: ${selectedShift.name} (${selectedShift.startTime}-${selectedShift.endTime})`, 'cyan');
}

/**
 * Step 4: Create Test Agent
 */
async function testCreateAgent() {
  const response = await axios.post(`${API_URL}/agents/register`, {
    firstName: 'Test',
    lastName: 'Agent',
    email: testData.agentEmail,
    phone: '0501234567',
    password: testData.agentPassword,
    confirmPassword: testData.agentPassword
  });

  testData.agentId = response.data.data.agent.id;
  print(`   Agent ID: ${testData.agentId}`, 'cyan');
  print(`   Email: ${testData.agentEmail}`, 'cyan');
}

/**
 * Step 5: Approve Agent
 */
async function testApproveAgent() {
  await axios.post(`${API_URL}/agents/${testData.agentId}/approve`, {}, {
    headers: { Authorization: `Bearer ${testData.adminToken}` }
  });
  
  print(`   Agent approved`, 'cyan');
}

/**
 * Step 6: Assign Shift to Agent
 */
async function testAssignShift() {
  await axios.put(`${API_URL}/agents/${testData.agentId}`, {
    shiftId: testData.shiftId,
    departmentId: testData.departmentId
  }, {
    headers: { Authorization: `Bearer ${testData.adminToken}` }
  });
  
  print(`   Shift assigned`, 'cyan');
}

/**
 * Step 7: Agent Login
 */
async function testAgentLogin() {
  const response = await axios.post(`${API_URL}/agents/login`, {
    identifier: testData.agentEmail,
    password: testData.agentPassword,
    deviceId: 'test-device-123'
  });

  testData.agentToken = response.data.data.tokens.accessToken;
  print(`   Agent logged in`, 'cyan');
}

/**
 * Step 8: Agent Check-in
 */
async function testCheckIn() {
  const response = await axios.post(`${API_URL}/agents/check-in`, {
    location: {
      lat: 24.7136,
      lng: 46.6753
    }
  }, {
    headers: { Authorization: `Bearer ${testData.agentToken}` }
  });

  testData.sessionId = response.data.data.session.id;
  print(`   Session ID: ${testData.sessionId}`, 'cyan');
  print(`   Status: ${response.data.data.status}`, 'cyan');
  print(`   Late minutes: ${response.data.data.lateMinutes}`, 'cyan');
}

/**
 * Step 9: Get Session Status
 */
async function testGetSessionStatus() {
  const response = await axios.get(`${API_URL}/agents/session/status`, {
    headers: { Authorization: `Bearer ${testData.agentToken}` }
  });

  if (!response.data.data.hasActiveSession) {
    throw new Error('No active session found');
  }

  print(`   Status: ${response.data.data.currentStatus}`, 'cyan');
  print(`   Work minutes: ${response.data.data.todayStats.workMinutes}`, 'cyan');
}

/**
 * Step 10: Request Short Break (Auto-approved)
 */
async function testRequestShortBreak() {
  const response = await axios.post(`${API_URL}/agents/break/request`, {
    type: 'short',
    requestedDuration: 15,
    reason: 'Coffee break'
  }, {
    headers: { Authorization: `Bearer ${testData.agentToken}` }
  });

  testData.shortBreakId = response.data.data.breakRequest.id;
  print(`   Break ID: ${testData.shortBreakId}`, 'cyan');
  print(`   Status: ${response.data.data.breakRequest.status}`, 'cyan');
  print(`   Auto-approved: ${response.data.data.breakRequest.autoApproved}`, 'cyan');
}

/**
 * Step 11: End Short Break
 */
async function testEndShortBreak() {
  await sleep(2000); // Wait 2 seconds
  
  const response = await axios.post(`${API_URL}/agents/break/end`, {}, {
    headers: { Authorization: `Bearer ${testData.agentToken}` }
  });

  print(`   Actual duration: ${response.data.data.actualDuration} minutes`, 'cyan');
}

/**
 * Step 12: Request Long Break (Needs Approval)
 */
async function testRequestLongBreak() {
  const response = await axios.post(`${API_URL}/agents/break/request`, {
    type: 'lunch',
    requestedDuration: 30,
    reason: 'Lunch break'
  }, {
    headers: { Authorization: `Bearer ${testData.agentToken}` }
  });

  testData.longBreakId = response.data.data.breakRequest.id;
  print(`   Break ID: ${testData.longBreakId}`, 'cyan');
  print(`   Status: ${response.data.data.breakRequest.status}`, 'cyan');
  print(`   Requires approval: ${response.data.data.requiresApproval}`, 'cyan');
}

/**
 * Step 13: Get Pending Break Requests (Admin)
 */
async function testGetPendingRequests() {
  const response = await axios.get(`${API_URL}/admins/break-requests/pending`, {
    headers: { Authorization: `Bearer ${testData.adminToken}` }
  });

  print(`   Pending requests: ${response.data.data.count}`, 'cyan');
}

/**
 * Step 14: Approve Break Request
 */
async function testApproveBreak() {
  await axios.post(
    `${API_URL}/admins/break-requests/${testData.longBreakId}/approve`,
    { notes: 'Approved by test' },
    { headers: { Authorization: `Bearer ${testData.adminToken}` } }
  );

  print(`   Break approved`, 'cyan');
}

/**
 * Step 15: End Long Break
 */
async function testEndLongBreak() {
  await sleep(2000);
  
  const response = await axios.post(`${API_URL}/agents/break/end`, {}, {
    headers: { Authorization: `Bearer ${testData.agentToken}` }
  });

  print(`   Actual duration: ${response.data.data.actualDuration} minutes`, 'cyan');
}

/**
 * Step 16: Get Today's Breaks
 */
async function testGetTodayBreaks() {
  const response = await axios.get(`${API_URL}/agents/breaks/today`, {
    headers: { Authorization: `Bearer ${testData.agentToken}` }
  });

  print(`   Total breaks today: ${response.data.data.count}`, 'cyan');
}

/**
 * Step 17: Get Activity Logs
 */
async function testGetActivityLogs() {
  const response = await axios.get(`${API_URL}/agents/activity-logs?limit=10`, {
    headers: { Authorization: `Bearer ${testData.agentToken}` }
  });

  print(`   Activity logs: ${response.data.data.count}`, 'cyan');
  print(`   Last activity: ${response.data.data.logs[0]?.type}`, 'cyan');
}

/**
 * Step 18: Check-out
 */
async function testCheckOut() {
  const response = await axios.post(`${API_URL}/agents/check-out`, {}, {
    headers: { Authorization: `Bearer ${testData.agentToken}` }
  });

  print(`   Work minutes: ${response.data.data.summary.workMinutes}`, 'cyan');
  print(`   Break minutes: ${response.data.data.summary.breakMinutes}`, 'cyan');
  print(`   Number of breaks: ${response.data.data.summary.numberOfBreaks}`, 'cyan');
}

/**
 * Step 19: Get Session History
 */
async function testGetSessionHistory() {
  const response = await axios.get(`${API_URL}/agents/sessions/history`, {
    headers: { Authorization: `Bearer ${testData.agentToken}` }
  });

  print(`   Sessions: ${response.data.data.sessions.length}`, 'cyan');
  print(`   Total work minutes: ${response.data.data.summary.totalWorkMinutes}`, 'cyan');
}

/**
 * Step 20: Admin View Sessions
 */
async function testAdminViewSessions() {
  const today = new Date().toISOString().split('T')[0];
  const response = await axios.get(
    `${API_URL}/admins/sessions?startDate=${today}&endDate=${today}`,
    { headers: { Authorization: `Bearer ${testData.adminToken}` } }
  );

  print(`   Total sessions: ${response.data.data.sessions.length}`, 'cyan');
}

/**
 * Step 21: Admin Dashboard Stats
 */
async function testAdminDashboardStats() {
  const response = await axios.get(`${API_URL}/admins/dashboard/stats`, {
    headers: { Authorization: `Bearer ${testData.adminToken}` }
  });

  print(`   Active agents: ${response.data.data.today.activeAgents}`, 'cyan');
  print(`   Completed: ${response.data.data.today.completed}`, 'cyan');
  print(`   Pending approvals: ${response.data.data.pendingApprovals}`, 'cyan');
}

// Print Final Report
function printFinalReport() {
  print('\n' + '='.repeat(60), 'cyan');
  print('  📊 FINAL TEST REPORT', 'bright');
  print('='.repeat(60), 'cyan');
  print('');
  print(`Total Tests: ${testResults.total}`, 'bright');
  print(`✅ Passed: ${testResults.passed}`, 'green');
  print(`❌ Failed: ${testResults.failed}`, 'red');
  print(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(2)}%`, 'cyan');
  print('='.repeat(60), 'cyan');
  print('');

  if (testResults.failed > 0) {
    print('❌ Some tests failed!', 'red');
    process.exit(1);
  } else {
    print('🎉 ALL TESTS PASSED! 🎉', 'green');
    process.exit(0);
  }
}

// Main Test Runner
async function runTests() {
  print('\n' + colors.bright + '🚀 Starting Shift Management Flow Tests' + colors.reset);
  print(colors.cyan + `Target: ${BASE_URL}` + colors.reset);
  print(colors.cyan + `Time: ${new Date().toISOString()}` + colors.reset);
  print('');

  try {
    // Setup
    print(colors.cyan + '\n' + '='.repeat(60) + colors.reset);
    print(colors.bright + '  📦 SETUP: Admin & Agent Preparation' + colors.reset);
    print(colors.cyan + '='.repeat(60) + '\n' + colors.reset);

    await test('Admin Login', testAdminLogin);
    await test('Get Departments', testGetDepartments);
    await test('Get Shifts', testGetShifts);
    await test('Create Test Agent', testCreateAgent);
    await test('Approve Agent', testApproveAgent);
    await test('Assign Shift to Agent', testAssignShift);
    await test('Agent Login', testAgentLogin);

    // Agent Flow
    print(colors.cyan + '\n' + '='.repeat(60) + colors.reset);
    print(colors.bright + '  👤 AGENT FLOW: Check-in, Breaks, Check-out' + colors.reset);
    print(colors.cyan + '='.repeat(60) + '\n' + colors.reset);

    await test('Agent Check-in', testCheckIn);
    await test('Get Session Status', testGetSessionStatus);
    await test('Request Short Break (Auto-approved)', testRequestShortBreak);
    await test('End Short Break', testEndShortBreak);
    await test('Request Long Break (Needs Approval)', testRequestLongBreak);

    // Admin Approval
    print(colors.cyan + '\n' + '='.repeat(60) + colors.reset);
    print(colors.bright + '  👨‍💼 ADMIN FLOW: Approvals' + colors.reset);
    print(colors.cyan + '='.repeat(60) + '\n' + colors.reset);

    await test('Get Pending Break Requests', testGetPendingRequests);
    await test('Approve Break Request', testApproveBreak);

    // Continue Agent Flow
    print(colors.cyan + '\n' + '='.repeat(60) + colors.reset);
    print(colors.bright + '  👤 AGENT FLOW: Continue & Check-out' + colors.reset);
    print(colors.cyan + '='.repeat(60) + '\n' + colors.reset);

    await test('End Long Break', testEndLongBreak);
    await test('Get Today\'s Breaks', testGetTodayBreaks);
    await test('Get Activity Logs', testGetActivityLogs);
    await test('Agent Check-out', testCheckOut);
    await test('Get Session History', testGetSessionHistory);

    // Admin Reports
    print(colors.cyan + '\n' + '='.repeat(60) + colors.reset);
    print(colors.bright + '  📊 ADMIN FLOW: Reports & Dashboard' + colors.reset);
    print(colors.cyan + '='.repeat(60) + '\n' + colors.reset);

    await test('Admin View Sessions', testAdminViewSessions);
    await test('Admin Dashboard Stats', testAdminDashboardStats);

  } catch (error) {
    print('\n❌ Test suite failed with critical error:', 'red');
    print(error.message, 'red');
    if (error.stack) {
      print(error.stack, 'yellow');
    }
    printFinalReport();
  }

  printFinalReport();
}

// Run tests
runTests().catch(error => {
  print('\n❌ Unhandled error:', 'red');
  print(error.message, 'red');
  process.exit(1);
});


