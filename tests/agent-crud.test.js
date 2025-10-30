const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

/**
 * Agent CRUD Complete Test Script
 * 
 * Tests all agent endpoints including:
 * - Public registration
 * - Admin creation
 * - Avatar upload/delete
 * - Profile updates (self & admin)
 * - Featured agents
 * - Approval/rejection
 * - Activation/deactivation
 */

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:4000/api';
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

// Test data storage
const testData = {
  adminToken: null,
  agentToken: null,
  publicAgentId: null,
  publicAgentEmail: `agent_public_${Date.now()}@test.com`,
  adminCreatedAgentId: null,
  adminCreatedAgentEmail: `agent_admin_${Date.now()}@test.com`,
  departmentId: null,
  shiftId: null,
  testImagePath: null
};

// Statistics
const stats = {
  passed: 0,
  failed: 0,
  total: 0
};

// Helper functions
function print(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

async function test(name, fn) {
  stats.total++;
  try {
    await fn();
    stats.passed++;
    print(`✅ [${Date.now() - startTime}ms] ${name}`, 'green');
  } catch (error) {
    stats.failed++;
    print(`❌ ${name}`, 'red');
    print(`   Error: ${error.message}`, 'yellow');
    if (error.response?.data) {
      print(`   Response: ${JSON.stringify(error.response.data, null, 2)}`, 'yellow');
    }
  }
}

// Create test image
function createTestImage() {
  const testDir = path.join(__dirname, 'temp');
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  
  testData.testImagePath = path.join(testDir, 'test-avatar.jpg');
  
  // Create a simple 1x1 pixel JPEG
  const jpegBuffer = Buffer.from([
    0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
    0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
    0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
    0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
    0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
    0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
    0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
    0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x14, 0x00, 0x01,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x03, 0xFF, 0xC4, 0x00, 0x14, 0x10, 0x01, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3F, 0x00,
    0xFE, 0x8A, 0x28, 0xFF, 0xD9
  ]);
  
  fs.writeFileSync(testData.testImagePath, jpegBuffer);
  print('   Test image created', 'cyan');
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
 * Step 2: Get Departments & Shifts
 */
async function testGetDepartments() {
  const response = await axios.get(`${API_URL}/admins/departments`, {
    headers: { Authorization: `Bearer ${testData.adminToken}` }
  });

  testData.departmentId = response.data.data.departments[0].id;
  print(`   Using Department ID: ${testData.departmentId}`, 'cyan');
}

async function testGetShifts() {
  const response = await axios.get(`${API_URL}/admins/shifts`, {
    headers: { Authorization: `Bearer ${testData.adminToken}` }
  });

  testData.shiftId = response.data.data.shifts[0].id;
  print(`   Using Shift ID: ${testData.shiftId}`, 'cyan');
}

/**
 * Step 3: Public Agent Registration
 */
async function testPublicAgentRegistration() {
  const response = await axios.post(`${API_URL}/agents/register`, {
    fullName: 'Test Agent Public',
    email: testData.publicAgentEmail,
    phone: '0501234567',
    password: 'Agent@123456',
    confirmPassword: 'Agent@123456',
    licenseNumber: 'LIC-12345',
    agencyName: 'Test Agency'
  });

  testData.publicAgentId = response.data.data.agent.id;
  print(`   Agent ID: ${testData.publicAgentId}`, 'cyan');
  print(`   Email: ${testData.publicAgentEmail}`, 'cyan');
}

/**
 * Step 4: Admin Creates Agent
 */
async function testAdminCreateAgent() {
  const response = await axios.post(`${API_URL}/agents/create`, {
    fullName: 'Test Agent Admin Created',
    email: testData.adminCreatedAgentEmail,
    phone: '0509876543',
    password: 'Agent@123456',
    shiftId: testData.shiftId,
    departmentId: testData.departmentId,
    licenseNumber: 'LIC-67890',
    agencyName: 'Admin Agency'
  }, {
    headers: { Authorization: `Bearer ${testData.adminToken}` }
  });

  testData.adminCreatedAgentId = response.data.data.agent.id;
  print(`   Agent ID: ${testData.adminCreatedAgentId}`, 'cyan');
  print(`   Auto-approved: ${response.data.data.agent.isActive}`, 'cyan');
}

/**
 * Step 5: Approve Public Agent
 */
async function testApproveAgent() {
  await axios.post(`${API_URL}/agents/${testData.publicAgentId}/approve`, {}, {
    headers: { Authorization: `Bearer ${testData.adminToken}` }
  });

  print(`   Agent ${testData.publicAgentId} approved`, 'cyan');
}

/**
 * Step 6: Agent Login
 */
async function testAgentLogin() {
  const response = await axios.post(`${API_URL}/agents/login`, {
    identifier: testData.publicAgentEmail,
    password: 'Agent@123456'
  });

  testData.agentToken = response.data.data.tokens.accessToken;
  print(`   Agent logged in`, 'cyan');
}

/**
 * Step 7: Get Agent Profile
 */
async function testGetAgentProfile() {
  const response = await axios.get(`${API_URL}/agents/me`, {
    headers: { Authorization: `Bearer ${testData.agentToken}` }
  });

  print(`   Profile retrieved: ${response.data.data.agent.fullName}`, 'cyan');
}

/**
 * Step 8: Agent Update Own Profile
 */
async function testAgentUpdateProfile() {
  const response = await axios.put(`${API_URL}/agents/profile`, {
    fullName: 'Test Agent Updated',
    licenseNumber: 'LIC-UPDATED'
  }, {
    headers: { Authorization: `Bearer ${testData.agentToken}` }
  });

  print(`   Profile updated: ${response.data.data.agent.fullName}`, 'cyan');
}

/**
 * Step 9: Upload Agent Avatar
 */
async function testUploadAgentAvatar() {
  const formData = new FormData();
  formData.append('avatar', fs.createReadStream(testData.testImagePath));

  const response = await axios.post(`${API_URL}/agents/avatar`, formData, {
    headers: {
      ...formData.getHeaders(),
      Authorization: `Bearer ${testData.agentToken}`
    }
  });

  print(`   Avatar URL: ${response.data.data.agent.avatar}`, 'cyan');
}

/**
 * Step 10: Delete Agent Avatar
 */
async function testDeleteAgentAvatar() {
  await axios.delete(`${API_URL}/agents/avatar`, {
    headers: { Authorization: `Bearer ${testData.agentToken}` }
  });

  print(`   Avatar deleted`, 'cyan');
}

/**
 * Step 11: Admin Update Agent
 */
async function testAdminUpdateAgent() {
  const response = await axios.put(`${API_URL}/agents/${testData.publicAgentId}`, {
    featured: false,
    shiftId: testData.shiftId,
    departmentId: testData.departmentId
  }, {
    headers: { Authorization: `Bearer ${testData.adminToken}` }
  });

  print(`   Agent updated by admin`, 'cyan');
}

/**
 * Step 12: Toggle Featured Status
 */
async function testToggleFeatured() {
  await axios.patch(`${API_URL}/agents/${testData.adminCreatedAgentId}/featured`, {
    featured: true
  }, {
    headers: { Authorization: `Bearer ${testData.adminToken}` }
  });

  print(`   Agent marked as featured`, 'cyan');
}

/**
 * Step 13: Get Featured Agents (Public)
 */
async function testGetFeaturedAgents() {
  const response = await axios.get(`${API_URL}/agents/featured?page=1&limit=10`);

  print(`   Featured agents: ${response.data.data.agents.length}`, 'cyan');
}

/**
 * Step 14: Get All Agents (Admin)
 */
async function testGetAllAgents() {
  const response = await axios.get(`${API_URL}/agents/list?page=1&limit=10`, {
    headers: { Authorization: `Bearer ${testData.adminToken}` }
  });

  print(`   Total agents: ${response.data.data.pagination.total}`, 'cyan');
}

/**
 * Step 15: Get Pending Agents
 */
async function testGetPendingAgents() {
  const response = await axios.get(`${API_URL}/agents/pending`, {
    headers: { Authorization: `Bearer ${testData.adminToken}` }
  });

  print(`   Pending agents: ${response.data.data.count}`, 'cyan');
}

/**
 * Step 16: Deactivate Agent
 */
async function testDeactivateAgent() {
  await axios.post(`${API_URL}/agents/${testData.publicAgentId}/deactivate`, {}, {
    headers: { Authorization: `Bearer ${testData.adminToken}` }
  });

  print(`   Agent deactivated`, 'cyan');
}

/**
 * Step 17: Activate Agent
 */
async function testActivateAgent() {
  await axios.post(`${API_URL}/agents/${testData.publicAgentId}/activate`, {}, {
    headers: { Authorization: `Bearer ${testData.adminToken}` }
  });

  print(`   Agent activated`, 'cyan');
}

/**
 * Step 18: Create & Reject Agent
 */
async function testRejectAgent() {
  // Create new agent for rejection
  const createResponse = await axios.post(`${API_URL}/agents/register`, {
    fullName: 'Test Agent To Reject',
    email: `agent_reject_${Date.now()}@test.com`,
    phone: '0507777777',
    password: 'Agent@123456',
    confirmPassword: 'Agent@123456'
  });

  const rejectAgentId = createResponse.data.data.agent.id;

  // Reject the agent
  await axios.post(`${API_URL}/agents/${rejectAgentId}/reject`, {
    reason: 'Test rejection reason'
  }, {
    headers: { Authorization: `Bearer ${testData.adminToken}` }
  });

  print(`   Agent ${rejectAgentId} rejected`, 'cyan');
}

// Main execution
let startTime;

async function runTests() {
  print('\n' + colors.bright + '🚀 Starting Agent CRUD Complete Tests' + colors.reset);
  print(colors.cyan + `Target: ${API_URL}` + colors.reset);
  print(colors.cyan + `Time: ${new Date().toISOString()}` + colors.reset);
  print('\n');

  startTime = Date.now();

  // Create test image
  createTestImage();

  try {
    // Setup
    print(colors.cyan + '\n' + '='.repeat(60) + colors.reset);
    print(colors.bright + '  📦 SETUP: Admin & Prerequisites' + colors.reset);
    print(colors.cyan + '='.repeat(60) + '\n' + colors.reset);

    await test('Admin Login', testAdminLogin);
    await test('Get Departments', testGetDepartments);
    await test('Get Shifts', testGetShifts);

    // Public Registration Flow
    print(colors.cyan + '\n' + '='.repeat(60) + colors.reset);
    print(colors.bright + '  🌐 PUBLIC: Agent Registration & Approval' + colors.reset);
    print(colors.cyan + '='.repeat(60) + '\n' + colors.reset);

    await test('Public Agent Registration', testPublicAgentRegistration);
    await test('Approve Agent', testApproveAgent);
    await test('Agent Login', testAgentLogin);

    // Agent Self-Service
    print(colors.cyan + '\n' + '='.repeat(60) + colors.reset);
    print(colors.bright + '  👤 AGENT: Self-Service Operations' + colors.reset);
    print(colors.cyan + '='.repeat(60) + '\n' + colors.reset);

    await test('Get Agent Profile', testGetAgentProfile);
    await test('Agent Update Own Profile', testAgentUpdateProfile);
    await test('Upload Agent Avatar', testUploadAgentAvatar);
    await test('Delete Agent Avatar', testDeleteAgentAvatar);

    // Admin Operations
    print(colors.cyan + '\n' + '='.repeat(60) + colors.reset);
    print(colors.bright + '  👨‍💼 ADMIN: Agent Management' + colors.reset);
    print(colors.cyan + '='.repeat(60) + '\n' + colors.reset);

    await test('Admin Create Agent', testAdminCreateAgent);
    await test('Admin Update Agent', testAdminUpdateAgent);
    await test('Toggle Featured Status', testToggleFeatured);
    await test('Deactivate Agent', testDeactivateAgent);
    await test('Activate Agent', testActivateAgent);
    await test('Reject Agent', testRejectAgent);

    // Listing & Queries
    print(colors.cyan + '\n' + '='.repeat(60) + colors.reset);
    print(colors.bright + '  📋 QUERIES: Lists & Searches' + colors.reset);
    print(colors.cyan + '='.repeat(60) + '\n' + colors.reset);

    await test('Get Featured Agents (Public)', testGetFeaturedAgents);
    await test('Get All Agents (Admin)', testGetAllAgents);
    await test('Get Pending Agents', testGetPendingAgents);

  } catch (error) {
    print(`\n❌ Fatal error: ${error.message}`, 'red');
  }

  // Cleanup
  if (testData.testImagePath && fs.existsSync(testData.testImagePath)) {
    fs.unlinkSync(testData.testImagePath);
    print('\n   Test image cleaned up', 'cyan');
  }

  // Final Report
  print(colors.cyan + '\n' + '='.repeat(60) + colors.reset);
  print(colors.bright + '  📊 FINAL TEST REPORT' + colors.reset);
  print(colors.cyan + '='.repeat(60) + '\n' + colors.reset);

  print(colors.bright + `Total Tests: ${stats.total}` + colors.reset);
  print(colors.green + `✅ Passed: ${stats.passed}` + colors.reset);
  print(colors.red + `❌ Failed: ${stats.failed}` + colors.reset);
  print(colors.cyan + `Success Rate: ${((stats.passed / stats.total) * 100).toFixed(2)}%` + colors.reset);
  print(colors.cyan + '='.repeat(60) + '\n' + colors.reset);

  if (stats.failed > 0) {
    print('❌ Some tests failed!', 'red');
    process.exit(1);
  } else {
    print('✅ All tests passed!', 'green');
    process.exit(0);
  }
}

// Run tests
runTests();

