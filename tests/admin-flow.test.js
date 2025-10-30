/**
 * Admin Flow Test Script
 * 
 * Comprehensive testing for Admin API
 * Tests all scenarios including success and error cases
 */

require('module-alias/register');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

// Configuration
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:4000';
const API_URL = `${BASE_URL}/api`;

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Test results tracker
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  tests: []
};

// Test data storage
const testData = {
  superAdmin: {
    email: 'superadmin@raalc.com',
    password: 'SuperAdmin@123!',
    token: null
  },
  newAdmin: {
    firstName: 'Test',
    lastName: 'Admin',
    email: 'testadmin@raalc.com',
    password: 'TestAdmin@123!',
    token: null,
    id: null
  },
  moderator: {
    firstName: 'Test',
    lastName: 'Moderator',
    email: 'testmod@raalc.com',
    password: 'TestMod@123!',
    token: null,
    id: null
  },
  roles: {},
  permissions: {}
};

/**
 * Print colored message
 */
function print(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

/**
 * Print test result
 */
function printTestResult(testName, passed, error = null, duration = 0) {
  testResults.total++;
  
  if (passed) {
    testResults.passed++;
    print(`✅ [${duration}ms] ${testName}`, 'green');
    testResults.tests.push({ name: testName, passed: true, duration });
  } else {
    testResults.failed++;
    print(`❌ ${testName}`, 'red');
    if (error) {
      print(`   Error: ${error.message || error}`, 'red');
      if (error.response?.data) {
        print(`   Response: ${JSON.stringify(error.response.data, null, 2)}`, 'yellow');
      }
    }
    testResults.tests.push({ name: testName, passed: false, error: error?.message, duration });
  }
}

/**
 * Print section header
 */
function printSection(title) {
  print('\n' + '='.repeat(60), 'cyan');
  print(`  ${title}`, 'bright');
  print('='.repeat(60) + '\n', 'cyan');
}

/**
 * Sleep function
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Run seeder
 */
async function runSeeders() {
  printSection('📦 STEP 1: Running Database Seeders');
  
  const startTime = Date.now();
  
  try {
    const { runSeeders } = require('../src/seeders/index');
    await runSeeders();
    
    const duration = Date.now() - startTime;
    printTestResult('Run seeders (Roles, Permissions, Super Admin)', true, null, duration);
    await sleep(1000); // Wait for DB to sync
  } catch (error) {
    printTestResult('Run seeders', false, error);
    throw error;
  }
}

/**
 * Test Super Admin Login
 */
async function testSuperAdminLogin() {
  printSection('🔐 STEP 2: Super Admin Login');
  
  const startTime = Date.now();
  
  try {
    const response = await axios.post(`${API_URL}/admins/login`, {
      email: testData.superAdmin.email,
      password: testData.superAdmin.password
    });
    
    const duration = Date.now() - startTime;
    
    if (response.data.ok && response.data.data.tokens) {
      testData.superAdmin.token = response.data.data.tokens.accessToken;
      testData.superAdmin.id = response.data.data.admin.id;
      printTestResult('Super Admin login successful', true, null, duration);
      print(`   Token: ${testData.superAdmin.token.substring(0, 50)}...`, 'cyan');
    } else {
      throw new Error('No token received');
    }
  } catch (error) {
    printTestResult('Super Admin login', false, error);
    throw error;
  }
}

/**
 * Test Login Error Cases
 */
async function testLoginErrorCases() {
  printSection('❌ STEP 3: Login Error Cases');
  
  // Test 1: Wrong password
  let startTime = Date.now();
  try {
    await axios.post(`${API_URL}/admins/login`, {
      email: testData.superAdmin.email,
      password: 'WrongPassword123!'
    });
    printTestResult('Login with wrong password (should fail)', false, new Error('Expected to fail but succeeded'));
  } catch (error) {
    if (error.response?.status === 401) {
      const duration = Date.now() - startTime;
      printTestResult('Login with wrong password fails correctly', true, null, duration);
    } else {
      printTestResult('Login with wrong password', false, error);
    }
  }
  
  // Test 2: Non-existent user
  startTime = Date.now();
  try {
    await axios.post(`${API_URL}/admins/login`, {
      email: 'nonexistent@example.com',
      password: 'Password123!'
    });
    printTestResult('Login with non-existent user (should fail)', false, new Error('Expected to fail but succeeded'));
  } catch (error) {
    if (error.response?.status === 401) {
      const duration = Date.now() - startTime;
      printTestResult('Login with non-existent user fails correctly', true, null, duration);
    } else {
      printTestResult('Login with non-existent user', false, error);
    }
  }
  
  // Test 3: Missing fields
  startTime = Date.now();
  try {
    await axios.post(`${API_URL}/admins/login`, {
      email: testData.superAdmin.email
    });
    printTestResult('Login without password (should fail)', false, new Error('Expected to fail but succeeded'));
  } catch (error) {
    if (error.response?.status === 400) {
      const duration = Date.now() - startTime;
      printTestResult('Login without password fails correctly', true, null, duration);
    } else {
      printTestResult('Login without password', false, error);
    }
  }
}

/**
 * Test Get Roles and Permissions
 */
async function testGetRolesAndPermissions() {
  printSection('📋 STEP 4: Get Roles and Permissions');
  
  // Get all roles
  let startTime = Date.now();
  try {
    const response = await axios.get(`${API_URL}/rbac/roles`, {
      headers: { Authorization: `Bearer ${testData.superAdmin.token}` }
    });
    
    const duration = Date.now() - startTime;
    
    if (response.data.ok && response.data.data.roles) {
      // Store roles for later use
      response.data.data.roles.forEach(role => {
        testData.roles[role.name] = role;
      });
      
      printTestResult(`Get all roles (${response.data.data.roles.length} roles)`, true, null, duration);
      print(`   Roles: ${response.data.data.roles.map(r => r.name).join(', ')}`, 'cyan');
    } else {
      throw new Error('No roles received');
    }
  } catch (error) {
    printTestResult('Get all roles', false, error);
  }
  
  // Get all permissions
  startTime = Date.now();
  try {
    const response = await axios.get(`${API_URL}/rbac/permissions`, {
      headers: { Authorization: `Bearer ${testData.superAdmin.token}` }
    });
    
    const duration = Date.now() - startTime;
    
    if (response.data.ok && response.data.data.permissions) {
      testData.permissions = response.data.data.permissions;
      const totalPermissions = Object.values(response.data.data.permissions)
        .reduce((sum, group) => sum + group.length, 0);
      
      printTestResult(`Get all permissions (${totalPermissions} permissions)`, true, null, duration);
      print(`   Groups: ${Object.keys(response.data.data.permissions).join(', ')}`, 'cyan');
    } else {
      throw new Error('No permissions received');
    }
  } catch (error) {
    printTestResult('Get all permissions', false, error);
  }
}

/**
 * Test Create Admin
 */
async function testCreateAdmin() {
  printSection('➕ STEP 5: Create New Admin');
  
  const startTime = Date.now();
  
  try {
    const response = await axios.post(`${API_URL}/admins`, {
      firstName: testData.newAdmin.firstName,
      lastName: testData.newAdmin.lastName,
      email: testData.newAdmin.email,
      password: testData.newAdmin.password,
      isActive: true
    }, {
      headers: { Authorization: `Bearer ${testData.superAdmin.token}` }
    });
    
    const duration = Date.now() - startTime;
    
    if (response.data.ok && response.data.data.admin) {
      testData.newAdmin.id = response.data.data.admin.id;
      printTestResult('Create new admin', true, null, duration);
      print(`   Admin ID: ${testData.newAdmin.id}`, 'cyan');
      print(`   Email: ${testData.newAdmin.email}`, 'cyan');
    } else {
      throw new Error('No admin data received');
    }
  } catch (error) {
    printTestResult('Create new admin', false, error);
  }
}

/**
 * Test Create Admin Error Cases
 */
async function testCreateAdminErrorCases() {
  printSection('❌ STEP 6: Create Admin Error Cases');
  
  // Test 1: Duplicate email
  let startTime = Date.now();
  try {
    await axios.post(`${API_URL}/admins`, {
      firstName: 'Duplicate',
      lastName: 'Admin',
      email: testData.newAdmin.email, // Same email
      password: 'Password123!',
      isActive: true
    }, {
      headers: { Authorization: `Bearer ${testData.superAdmin.token}` }
    });
    printTestResult('Create admin with duplicate email (should fail)', false, new Error('Expected to fail but succeeded'));
  } catch (error) {
    if (error.response?.status === 409) {
      const duration = Date.now() - startTime;
      printTestResult('Create admin with duplicate email fails correctly', true, null, duration);
    } else {
      printTestResult('Create admin with duplicate email', false, error);
    }
  }
  
  // Test 2: Weak password
  startTime = Date.now();
  try {
    await axios.post(`${API_URL}/admins`, {
      firstName: 'Weak',
      lastName: 'Password',
      email: 'weakpass@example.com',
      password: '123', // Weak password
      isActive: true
    }, {
      headers: { Authorization: `Bearer ${testData.superAdmin.token}` }
    });
    printTestResult('Create admin with weak password (should fail)', false, new Error('Expected to fail but succeeded'));
  } catch (error) {
    if (error.response?.status === 400) {
      const duration = Date.now() - startTime;
      printTestResult('Create admin with weak password fails correctly', true, null, duration);
    } else {
      printTestResult('Create admin with weak password', false, error);
    }
  }
  
  // Test 3: Without authentication
  startTime = Date.now();
  try {
    await axios.post(`${API_URL}/admins`, {
      firstName: 'No',
      lastName: 'Auth',
      email: 'noauth@example.com',
      password: 'Password123!',
      isActive: true
    });
    printTestResult('Create admin without auth (should fail)', false, new Error('Expected to fail but succeeded'));
  } catch (error) {
    if (error.response?.status === 401) {
      const duration = Date.now() - startTime;
      printTestResult('Create admin without auth fails correctly', true, null, duration);
    } else {
      printTestResult('Create admin without auth', false, error);
    }
  }
}

/**
 * Test Assign Roles to Admin
 */
async function testAssignRolesToAdmin() {
  printSection('🎭 STEP 7: Assign Roles to Admin');
  
  const startTime = Date.now();
  
  try {
    const adminRoleId = testData.roles['Admin']?.id;
    
    if (!adminRoleId) {
      throw new Error('Admin role not found');
    }
    
    const response = await axios.post(
      `${API_URL}/admins/${testData.newAdmin.id}/roles`,
      { roleIds: [adminRoleId] },
      { headers: { Authorization: `Bearer ${testData.superAdmin.token}` } }
    );
    
    const duration = Date.now() - startTime;
    
    if (response.data.ok) {
      printTestResult('Assign "Admin" role to new admin', true, null, duration);
      print(`   Roles: ${response.data.data.roles?.map(r => r.name).join(', ')}`, 'cyan');
    } else {
      throw new Error('Failed to assign role');
    }
  } catch (error) {
    printTestResult('Assign roles to admin', false, error);
  }
}

/**
 * Test New Admin Login
 */
async function testNewAdminLogin() {
  printSection('🔐 STEP 8: New Admin Login');
  
  const startTime = Date.now();
  
  try {
    const response = await axios.post(`${API_URL}/admins/login`, {
      email: testData.newAdmin.email,
      password: testData.newAdmin.password
    });
    
    const duration = Date.now() - startTime;
    
    if (response.data.ok && response.data.data.tokens) {
      testData.newAdmin.token = response.data.data.tokens.accessToken;
      printTestResult('New admin login successful', true, null, duration);
      print(`   Token: ${testData.newAdmin.token.substring(0, 50)}...`, 'cyan');
      print(`   Roles: ${response.data.data.admin.roles?.join(', ')}`, 'cyan');
    } else {
      throw new Error('No token received');
    }
  } catch (error) {
    printTestResult('New admin login', false, error);
  }
}

/**
 * Test Profile Management
 */
async function testProfileManagement() {
  printSection('👤 STEP 9: Profile Management');
  
  // Get profile
  let startTime = Date.now();
  try {
    const response = await axios.get(`${API_URL}/admins/profile`, {
      headers: { Authorization: `Bearer ${testData.newAdmin.token}` }
    });
    
    const duration = Date.now() - startTime;
    
    if (response.data.ok && response.data.data.admin) {
      printTestResult('Get admin profile', true, null, duration);
      print(`   Name: ${response.data.data.admin.firstName} ${response.data.data.admin.lastName}`, 'cyan');
    } else {
      throw new Error('No profile data received');
    }
  } catch (error) {
    printTestResult('Get admin profile', false, error);
  }
  
  // Update profile
  startTime = Date.now();
  try {
    const response = await axios.patch(`${API_URL}/admins/profile`, {
      firstName: 'Updated',
      phone: '0501234567'
    }, {
      headers: { Authorization: `Bearer ${testData.newAdmin.token}` }
    });
    
    const duration = Date.now() - startTime;
    
    if (response.data.ok) {
      printTestResult('Update admin profile', true, null, duration);
      print(`   New name: ${response.data.data.admin.firstName}`, 'cyan');
    } else {
      throw new Error('Failed to update profile');
    }
  } catch (error) {
    printTestResult('Update admin profile', false, error);
  }
}

/**
 * Test Permission-Based Access
 */
async function testPermissionBasedAccess() {
  printSection('🔒 STEP 10: Permission-Based Access Control');
  
  // Test 1: Super Admin can access everything
  let startTime = Date.now();
  try {
    const response = await axios.get(`${API_URL}/admins`, {
      headers: { Authorization: `Bearer ${testData.superAdmin.token}` }
    });
    
    const duration = Date.now() - startTime;
    
    if (response.data.ok) {
      printTestResult('Super Admin can list all admins', true, null, duration);
      print(`   Total admins: ${response.data.data.count}`, 'cyan');
    } else {
      throw new Error('Failed to list admins');
    }
  } catch (error) {
    printTestResult('Super Admin list admins', false, error);
  }
  
  // Test 2: Regular Admin can also list (has permission)
  startTime = Date.now();
  try {
    const response = await axios.get(`${API_URL}/admins`, {
      headers: { Authorization: `Bearer ${testData.newAdmin.token}` }
    });
    
    const duration = Date.now() - startTime;
    
    if (response.data.ok) {
      printTestResult('Admin role can list admins', true, null, duration);
    } else {
      throw new Error('Failed to list admins');
    }
  } catch (error) {
    printTestResult('Admin role list admins', false, error);
  }
}

/**
 * Test Role Management (CRUD)
 */
async function testRoleManagement() {
  printSection('🎭 STEP 11: Role Management (CRUD)');
  
  let createdRoleId = null;
  
  // Create role
  let startTime = Date.now();
  try {
    const response = await axios.post(`${API_URL}/rbac/roles`, {
      name: 'Test Role',
      slug: 'test-role',
      description: 'Role created by test script',
      isActive: true
    }, {
      headers: { Authorization: `Bearer ${testData.superAdmin.token}` }
    });
    
    const duration = Date.now() - startTime;
    
    if (response.data.ok && response.data.data.role) {
      createdRoleId = response.data.data.role.id;
      printTestResult('Create new role', true, null, duration);
      print(`   Role ID: ${createdRoleId}`, 'cyan');
    } else {
      throw new Error('No role data received');
    }
  } catch (error) {
    printTestResult('Create new role', false, error);
  }
  
  // Get role by ID
  if (createdRoleId) {
    startTime = Date.now();
    try {
      const response = await axios.get(`${API_URL}/rbac/roles/${createdRoleId}`, {
        headers: { Authorization: `Bearer ${testData.superAdmin.token}` }
      });
      
      const duration = Date.now() - startTime;
      
      if (response.data.ok) {
        printTestResult('Get role by ID', true, null, duration);
      } else {
        throw new Error('Failed to get role');
      }
    } catch (error) {
      printTestResult('Get role by ID', false, error);
    }
    
    // Update role
    startTime = Date.now();
    try {
      const response = await axios.patch(`${API_URL}/rbac/roles/${createdRoleId}`, {
        description: 'Updated by test script'
      }, {
        headers: { Authorization: `Bearer ${testData.superAdmin.token}` }
      });
      
      const duration = Date.now() - startTime;
      
      if (response.data.ok) {
        printTestResult('Update role', true, null, duration);
      } else {
        throw new Error('Failed to update role');
      }
    } catch (error) {
      printTestResult('Update role', false, error);
    }
    
    // Delete role
    startTime = Date.now();
    try {
      const response = await axios.delete(`${API_URL}/rbac/roles/${createdRoleId}`, {
        headers: { Authorization: `Bearer ${testData.superAdmin.token}` }
      });
      
      const duration = Date.now() - startTime;
      
      if (response.data.ok) {
        printTestResult('Delete role', true, null, duration);
      } else {
        throw new Error('Failed to delete role');
      }
    } catch (error) {
      printTestResult('Delete role', false, error);
    }
  }
}

/**
 * Test Admin Management
 */
async function testAdminManagement() {
  printSection('👥 STEP 12: Admin Management (CRUD)');
  
  // Get all admins
  let startTime = Date.now();
  try {
    const response = await axios.get(`${API_URL}/admins`, {
      headers: { Authorization: `Bearer ${testData.superAdmin.token}` }
    });
    
    const duration = Date.now() - startTime;
    
    if (response.data.ok) {
      printTestResult('Get all admins', true, null, duration);
      print(`   Total: ${response.data.data.count}`, 'cyan');
    } else {
      throw new Error('Failed to get admins');
    }
  } catch (error) {
    printTestResult('Get all admins', false, error);
  }
  
  // Get admin by ID
  startTime = Date.now();
  try {
    const response = await axios.get(`${API_URL}/admins/${testData.newAdmin.id}`, {
      headers: { Authorization: `Bearer ${testData.superAdmin.token}` }
    });
    
    const duration = Date.now() - startTime;
    
    if (response.data.ok) {
      printTestResult('Get admin by ID', true, null, duration);
    } else {
      throw new Error('Failed to get admin');
    }
  } catch (error) {
    printTestResult('Get admin by ID', false, error);
  }
  
  // Update admin
  startTime = Date.now();
  try {
    const response = await axios.patch(`${API_URL}/admins/${testData.newAdmin.id}`, {
      firstName: 'Modified'
    }, {
      headers: { Authorization: `Bearer ${testData.superAdmin.token}` }
    });
    
    const duration = Date.now() - startTime;
    
    if (response.data.ok) {
      printTestResult('Update admin', true, null, duration);
    } else {
      throw new Error('Failed to update admin');
    }
  } catch (error) {
    printTestResult('Update admin', false, error);
  }
  
  // Deactivate admin
  startTime = Date.now();
  try {
    const response = await axios.patch(`${API_URL}/admins/${testData.newAdmin.id}/status`, {
      isActive: false
    }, {
      headers: { Authorization: `Bearer ${testData.superAdmin.token}` }
    });
    
    const duration = Date.now() - startTime;
    
    if (response.data.ok) {
      printTestResult('Deactivate admin', true, null, duration);
    } else {
      throw new Error('Failed to deactivate admin');
    }
  } catch (error) {
    printTestResult('Deactivate admin', false, error);
  }
  
  // Test login with deactivated account
  startTime = Date.now();
  try {
    await axios.post(`${API_URL}/admins/login`, {
      email: testData.newAdmin.email,
      password: testData.newAdmin.password
    });
    printTestResult('Login with deactivated account (should fail)', false, new Error('Expected to fail but succeeded'));
  } catch (error) {
    if (error.response?.status === 403) {
      const duration = Date.now() - startTime;
      printTestResult('Login with deactivated account fails correctly', true, null, duration);
    } else {
      printTestResult('Login with deactivated account', false, error);
    }
  }
  
  // Reactivate admin
  startTime = Date.now();
  try {
    const response = await axios.patch(`${API_URL}/admins/${testData.newAdmin.id}/status`, {
      isActive: true
    }, {
      headers: { Authorization: `Bearer ${testData.superAdmin.token}` }
    });
    
    const duration = Date.now() - startTime;
    
    if (response.data.ok) {
      printTestResult('Reactivate admin', true, null, duration);
    } else {
      throw new Error('Failed to reactivate admin');
    }
  } catch (error) {
    printTestResult('Reactivate admin', false, error);
  }
}

/**
 * Test Token Refresh
 */
async function testTokenRefresh() {
  printSection('🔄 STEP 13: Token Refresh');
  
  // Login to get refresh token
  let refreshToken = null;
  
  const startTime = Date.now();
  try {
    const loginResponse = await axios.post(`${API_URL}/admins/login`, {
      email: testData.newAdmin.email,
      password: testData.newAdmin.password
    });
    
    if (loginResponse.data.ok && loginResponse.data.data.tokens) {
      refreshToken = loginResponse.data.data.tokens.refreshToken;
      
      // Test refresh
      const refreshResponse = await axios.post(`${API_URL}/admins/refresh-token`, {
        refreshToken
      });
      
      const duration = Date.now() - startTime;
      
      if (refreshResponse.data.ok && refreshResponse.data.data.tokens) {
        printTestResult('Refresh access token', true, null, duration);
      } else {
        throw new Error('No tokens received');
      }
    } else {
      throw new Error('Failed to login');
    }
  } catch (error) {
    printTestResult('Refresh access token', false, error);
  }
}

/**
 * Test Change Password
 */
async function testChangePassword() {
  printSection('🔑 STEP 14: Change Password');
  
  // Re-login to get fresh token
  let adminToken = null;
  try {
    const loginResponse = await axios.post(`${API_URL}/admins/login`, {
      email: testData.newAdmin.email,
      password: testData.newAdmin.password
    });
    adminToken = loginResponse.data.data.tokens.accessToken;
  } catch (error) {
    printTestResult('Re-login before password change', false, error);
    return;
  }
  
  const newPassword = 'NewPassword123!';
  
  // Change password
  let startTime = Date.now();
  try {
    const response = await axios.post(`${API_URL}/admins/change-password`, {
      currentPassword: testData.newAdmin.password,
      newPassword: newPassword,
      confirmPassword: newPassword
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    const duration = Date.now() - startTime;
    
    if (response.data.ok) {
      printTestResult('Change password', true, null, duration);
      
      // Test login with new password
      startTime = Date.now();
      const loginResponse = await axios.post(`${API_URL}/admins/login`, {
        email: testData.newAdmin.email,
        password: newPassword
      });
      
      const loginDuration = Date.now() - startTime;
      
      if (loginResponse.data.ok) {
        printTestResult('Login with new password', true, null, loginDuration);
        
        // Change back to original password
        await axios.post(`${API_URL}/admins/change-password`, {
          currentPassword: newPassword,
          newPassword: testData.newAdmin.password,
          confirmPassword: testData.newAdmin.password
        }, {
          headers: { Authorization: `Bearer ${loginResponse.data.data.tokens.accessToken}` }
        });
        
        printTestResult('Reset password to original', true);
      } else {
        throw new Error('Login with new password failed');
      }
    } else {
      throw new Error('Failed to change password');
    }
  } catch (error) {
    printTestResult('Change password', false, error);
  }
}

/**
 * Test Assign Permissions to Role
 */
async function testAssignPermissionsToRole() {
  printSection('🔐 STEP 15: Assign Permissions to Role');
  
  const adminRoleId = testData.roles['Admin']?.id;
  
  if (!adminRoleId) {
    printTestResult('Get Admin role for permission test', false, new Error('Admin role not found'));
    return;
  }
  
  const startTime = Date.now();
  
  try {
    // Get some permission IDs
    const permissionsResponse = await axios.get(`${API_URL}/rbac/permissions?groupBy=resource`, {
      headers: { Authorization: `Bearer ${testData.superAdmin.token}` }
    });
    
    const allPermissions = [];
    Object.values(permissionsResponse.data.data.permissions).forEach(group => {
      group.forEach(p => allPermissions.push(p.id));
    });
    
    // Assign first 5 permissions
    const permissionIds = allPermissions.slice(0, 5);
    
    const response = await axios.post(
      `${API_URL}/rbac/roles/${adminRoleId}/permissions`,
      { permissionIds },
      { headers: { Authorization: `Bearer ${testData.superAdmin.token}` } }
    );
    
    const duration = Date.now() - startTime;
    
    if (response.data.ok) {
      printTestResult(`Assign ${permissionIds.length} permissions to role`, true, null, duration);
    } else {
      throw new Error('Failed to assign permissions');
    }
  } catch (error) {
    printTestResult('Assign permissions to role', false, error);
  }
}

/**
 * Test Search and Filters
 */
async function testSearchAndFilters() {
  printSection('🔍 STEP 16: Search and Filters');
  
  // Test search
  let startTime = Date.now();
  try {
    const response = await axios.get(`${API_URL}/admins?search=test`, {
      headers: { Authorization: `Bearer ${testData.superAdmin.token}` }
    });
    
    const duration = Date.now() - startTime;
    
    if (response.data.ok) {
      printTestResult('Search admins by name', true, null, duration);
      print(`   Results: ${response.data.data.count}`, 'cyan');
    } else {
      throw new Error('Failed to search');
    }
  } catch (error) {
    printTestResult('Search admins', false, error);
  }
  
  // Test filter by active status
  startTime = Date.now();
  try {
    const response = await axios.get(`${API_URL}/admins?isActive=true`, {
      headers: { Authorization: `Bearer ${testData.superAdmin.token}` }
    });
    
    const duration = Date.now() - startTime;
    
    if (response.data.ok) {
      printTestResult('Filter admins by active status', true, null, duration);
      print(`   Active admins: ${response.data.data.count}`, 'cyan');
    } else {
      throw new Error('Failed to filter');
    }
  } catch (error) {
    printTestResult('Filter admins', false, error);
  }
}

/**
 * Print final report
 */
function printFinalReport() {
  printSection('📊 FINAL TEST REPORT');
  
  print(`Total Tests: ${testResults.total}`, 'bright');
  print(`✅ Passed: ${testResults.passed}`, 'green');
  print(`❌ Failed: ${testResults.failed}`, 'red');
  print(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(2)}%`, 'cyan');
  
  const totalDuration = testResults.tests.reduce((sum, test) => sum + (test.duration || 0), 0);
  print(`Total Duration: ${totalDuration}ms (${(totalDuration / 1000).toFixed(2)}s)`, 'yellow');
  
  if (testResults.failed > 0) {
    print('\n❌ Failed Tests:', 'red');
    testResults.tests.filter(t => !t.passed).forEach(test => {
      print(`   - ${test.name}`, 'red');
      if (test.error) {
        print(`     Error: ${test.error}`, 'yellow');
      }
    });
  }
  
  print('\n' + '='.repeat(60), 'cyan');
}

/**
 * Main test runner
 */
async function runTests() {
  print('\n🚀 Starting Admin Flow Tests', 'bright');
  print(`Target: ${BASE_URL}`, 'cyan');
  print(`Time: ${new Date().toISOString()}\n`, 'cyan');
  
  try {
    await runSeeders();
    await testSuperAdminLogin();
    await testLoginErrorCases();
    await testGetRolesAndPermissions();
    await testCreateAdmin();
    await testCreateAdminErrorCases();
    await testAssignRolesToAdmin();
    await testNewAdminLogin();
    await testProfileManagement();
    await testPermissionBasedAccess();
    await testRoleManagement();
    await testAdminManagement();
    await testTokenRefresh();
    await testChangePassword();
    await testAssignPermissionsToRole();
    await testSearchAndFilters();
    
    printFinalReport();
    
    // Exit with appropriate code
    process.exit(testResults.failed > 0 ? 1 : 0);
  } catch (error) {
    print('\n❌ Test suite failed with critical error:', 'red');
    print(error.message, 'red');
    if (error.stack) {
      print(error.stack, 'yellow');
    }
    
    printFinalReport();
    process.exit(1);
  }
}

// Start tests (run directly like OTP flow test)
(async () => {
  runTests().catch(error => {
    print('\n❌ Unhandled error:', 'red');
    print(error.message, 'red');
    if (error.stack) {
      print(error.stack, 'yellow');
    }
    process.exit(1);
  });
})();

