const axios = require('axios');

async function testDashboardDirect() {
  console.log('🔍 Testing Dashboard API Direct Access');
  console.log('=====================================');
  
  try {
    // Step 1: Login to get token
    console.log('1. Logging in...');
    const loginResponse = await axios.post('http://localhost:3000/api/v1/auth/login', {
      usernameOrEmail: 'admin@manufacturing.com',
      password: 'admin123'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:5174'
      }
    });
    
    if (!loginResponse.data.success) {
      throw new Error('Login failed: ' + loginResponse.data.error?.message);
    }
    
    const token = loginResponse.data.data.accessToken;
    console.log('✅ Login successful, token obtained:', token.substring(0, 20) + '...');
    
    // Step 2: Test token validation
    console.log('\n2. Validating token...');
    const validateResponse = await axios.get('http://localhost:3000/api/v1/auth/validate', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:5174'
      }
    });
    
    if (!validateResponse.data.success) {
      throw new Error('Token validation failed: ' + validateResponse.data.error?.message);
    }
    
    console.log('✅ Token validation successful');
    
    // Step 3: Test other protected endpoints first
    console.log('\n3. Testing other protected endpoints...');
    
    const productsResponse = await axios.get('http://localhost:3000/api/v1/products', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:5174'
      }
    });
    
    console.log('✅ Products API:', productsResponse.data.success ? 'SUCCESS' : 'FAILED');
    
    const workOrdersResponse = await axios.get('http://localhost:3000/api/v1/work-orders', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:5174'
      }
    });
    
    console.log('✅ Work Orders API:', workOrdersResponse.data.success ? 'SUCCESS' : 'FAILED');
    
    // Step 4: Test dashboard endpoint
    console.log('\n4. Testing dashboard endpoint...');
    
    try {
      const dashboardResponse = await axios.get('http://localhost:3000/api/v1/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Origin': 'http://localhost:5174'
        },
        timeout: 10000 // 10 second timeout
      });
      
      if (dashboardResponse.data.success) {
        console.log('✅ Dashboard API: SUCCESS');
        console.log('📊 Dashboard data keys:', Object.keys(dashboardResponse.data.data));
        
        const data = dashboardResponse.data.data;
        console.log('👤 User:', data.user?.username);
        console.log('📈 Manufacturing Orders:', data.summary?.manufacturingOrders?.total || 0);
        console.log('⚙️ Work Orders:', data.summary?.workOrders?.total || 0);
        console.log('🏢 Work Centers:', data.summary?.workCenters?.total || 0);
        console.log('📦 Products:', data.summary?.products?.total || 0);
        console.log('🚨 Alerts:', data.alerts?.length || 0);
      } else {
        console.log('❌ Dashboard API: FAILED');
        console.log('Error:', dashboardResponse.data.error);
      }
      
    } catch (dashboardError) {
      console.log('❌ Dashboard API: ERROR');
      console.log('Error details:', dashboardError.response?.data || dashboardError.message);
      
      // Additional debugging
      if (dashboardError.response) {
        console.log('Status:', dashboardError.response.status);
        console.log('Headers:', dashboardError.response.headers);
      }
    }
    
    // Step 5: Test with different token formats
    console.log('\n5. Testing token format variations...');
    
    // Test without Bearer prefix
    try {
      const testResponse1 = await axios.get('http://localhost:3000/api/v1/dashboard', {
        headers: {
          'Authorization': token, // Without "Bearer "
          'Content-Type': 'application/json',
          'Origin': 'http://localhost:5174'
        }
      });
      console.log('Without Bearer prefix:', testResponse1.data.success ? 'SUCCESS' : 'FAILED');
    } catch (e) {
      console.log('Without Bearer prefix: ERROR -', e.response?.data?.error?.message || e.message);
    }
    
    // Test with extra spaces
    try {
      const testResponse2 = await axios.get('http://localhost:3000/api/v1/dashboard', {
        headers: {
          'Authorization': `Bearer  ${token}`, // Extra space
          'Content-Type': 'application/json',
          'Origin': 'http://localhost:5174'
        }
      });
      console.log('With extra space:', testResponse2.data.success ? 'SUCCESS' : 'FAILED');
    } catch (e) {
      console.log('With extra space: ERROR -', e.response?.data?.error?.message || e.message);
    }
    
    console.log('\n🎯 Dashboard API Test Complete');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testDashboardDirect().catch(console.error);
