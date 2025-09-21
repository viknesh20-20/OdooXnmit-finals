#!/usr/bin/env node

const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

const BASE_URL = 'http://localhost:3000/api/v1';

// Test configuration
const testUser = {
  username: 'testuser' + Date.now(),
  email: `testuser${Date.now()}@example.com`,
  password: 'TestPassword123',
  firstName: 'Test',
  lastName: 'User'
};

async function testLogin() {
  console.log('\n=== Testing Login (Existing User) ===');
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      usernameOrEmail: 'admin@manufacturing.com',
      password: 'admin123'
    });
    
    console.log('✅ Login successful');
    console.log('User:', response.data.data.user.email);
    return response.data.data.accessToken;
  } catch (error) {
    console.log('❌ Login failed:', error.response?.data?.error?.message || error.message);
    return null;
  }
}

async function testRegistration() {
  console.log('\n=== Testing User Registration ===');
  try {
    const response = await axios.post(`${BASE_URL}/auth/register`, testUser, {
      timeout: 10000 // 10 second timeout
    });
    
    console.log('✅ Registration successful');
    console.log('User:', response.data.data.user.email);
    return response.data.data.accessToken;
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      console.log('❌ Registration timed out - endpoint may be hanging');
    } else {
      console.log('❌ Registration failed:', error.response?.data?.error?.message || error.message);
      if (error.response?.data?.error?.details) {
        console.log('Validation errors:', error.response.data.error.details);
      }
    }
    return null;
  }
}

async function testNewUserLogin(token) {
  if (!token) {
    console.log('\n=== Skipping New User Login (no token from registration) ===');
    return null;
  }
  
  console.log('\n=== Testing New User Login ===');
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      usernameOrEmail: testUser.email,
      password: testUser.password
    });
    
    console.log('✅ New user login successful');
    return response.data.data.accessToken;
  } catch (error) {
    console.log('❌ New user login failed:', error.response?.data?.error?.message || error.message);
    return null;
  }
}

async function testDataConsistency(token) {
  if (!token) {
    console.log('\n=== Skipping Data Consistency Tests (no token) ===');
    return;
  }
  
  console.log('\n=== Testing Data Consistency Fixes ===');
  
  // Test Manufacturing Orders API response format
  try {
    const response = await axios.get(`${BASE_URL}/manufacturing-orders`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Manufacturing Orders API accessible');
    
    const orders = response.data.data.manufacturingOrders || [];
    if (orders.length > 0) {
      const order = orders[0];
      console.log('📋 Sample Manufacturing Order fields:');
      console.log('  - id:', order.id ? '✅' : '❌');
      console.log('  - reference:', order.reference ? '✅' : '❌');
      console.log('  - productName:', order.productName ? '✅' : '❌');
      console.log('  - startDate:', order.startDate ? '✅' : '❌');
      console.log('  - dueDate:', order.dueDate ? '✅' : '❌');
      console.log('  - status:', order.status ? '✅' : '❌');
      console.log('  - workOrders array:', Array.isArray(order.workOrders) ? '✅' : '❌');
    } else {
      console.log('📋 No manufacturing orders found (empty database)');
    }
  } catch (error) {
    console.log('❌ Manufacturing Orders API failed:', error.response?.data?.error?.message || error.message);
  }
  
  // Test Products API response format
  try {
    const response = await axios.get(`${BASE_URL}/products`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Products API accessible');
    
    const products = response.data.data.products || [];
    if (products.length > 0) {
      const product = products[0];
      console.log('📦 Sample Product fields:');
      console.log('  - id:', product.id ? '✅' : '❌');
      console.log('  - name:', product.name ? '✅' : '❌');
      console.log('  - sku:', product.sku ? '✅' : '❌');
      console.log('  - isActive:', product.isActive !== undefined ? '✅' : '❌');
    } else {
      console.log('📦 No products found');
    }
  } catch (error) {
    console.log('❌ Products API failed:', error.response?.data?.error?.message || error.message);
  }
  
  // Test Work Centers API response format
  try {
    const response = await axios.get(`${BASE_URL}/work-centers`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Work Centers API accessible');
    
    const workCenters = response.data.data.workCenters || [];
    if (workCenters.length > 0) {
      const workCenter = workCenters[0];
      console.log('🏭 Sample Work Center fields:');
      console.log('  - id:', workCenter.id ? '✅' : '❌');
      console.log('  - name:', workCenter.name ? '✅' : '❌');
      console.log('  - code:', workCenter.code ? '✅' : '❌');
      console.log('  - status:', workCenter.status ? '✅' : '❌');
    } else {
      console.log('🏭 No work centers found');
    }
  } catch (error) {
    console.log('❌ Work Centers API failed:', error.response?.data?.error?.message || error.message);
  }
}

async function runTests() {
  console.log('🧪 Starting Manufacturing ERP Fix Verification Tests');
  console.log('================================================');
  
  // Test existing login
  const adminToken = await testLogin();
  
  // Test user registration
  const newUserToken = await testRegistration();
  
  // Test new user login
  const loginToken = await testNewUserLogin(newUserToken);
  
  // Test data consistency with admin token
  await testDataConsistency(adminToken);
  
  console.log('\n================================================');
  console.log('🏁 Test Summary:');
  console.log('- Admin Login:', adminToken ? '✅ PASS' : '❌ FAIL');
  console.log('- User Registration:', newUserToken ? '✅ PASS' : '❌ FAIL');
  console.log('- New User Login:', loginToken ? '✅ PASS' : '❌ FAIL');
  console.log('- Data APIs:', adminToken ? '✅ TESTED' : '❌ SKIPPED');
  
  if (adminToken && newUserToken && loginToken) {
    console.log('\n🎉 ALL TESTS PASSED - Both issues appear to be fixed!');
  } else if (adminToken && !newUserToken) {
    console.log('\n⚠️  PARTIAL SUCCESS - Login works but registration needs more work');
  } else {
    console.log('\n❌ TESTS FAILED - Issues still need to be resolved');
  }
}

// Run the tests
runTests().catch(error => {
  console.error('💥 Test runner failed:', error.message);
  process.exit(1);
});
