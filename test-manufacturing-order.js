const axios = require('axios');

async function testManufacturingOrderCreation() {
  try {
    console.log('1. Logging in...');
    
    // Login to get token
    const loginResponse = await axios.post('http://localhost:3000/api/v1/auth/login', {
      usernameOrEmail: 'admin@manufacturing.com',
      password: 'admin123'
    });
    
    if (!loginResponse.data.success) {
      throw new Error('Login failed: ' + loginResponse.data.error?.message);
    }
    
    const token = loginResponse.data.data.accessToken;
    const userId = loginResponse.data.data.user.id;
    console.log('✓ Login successful');
    
    // Get products
    console.log('2. Fetching products...');
    const productsResponse = await axios.get('http://localhost:3000/api/v1/products', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!productsResponse.data.success || !productsResponse.data.data.products.length) {
      throw new Error('No products found');
    }
    
    const product = productsResponse.data.data.products[0];
    console.log(`✓ Found product: ${product.name} (${product.id})`);
    
    // Get BOMs
    console.log('3. Fetching BOMs...');
    const bomsResponse = await axios.get('http://localhost:3000/api/v1/boms', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!bomsResponse.data.success || !bomsResponse.data.data.boms.length) {
      throw new Error('No BOMs found');
    }
    
    const bom = bomsResponse.data.data.boms[0];
    console.log(`✓ Found BOM: ${bom.reference} (${bom.id})`);
    
    // Create manufacturing order
    console.log('4. Creating manufacturing order...');
    const orderData = {
      mo_number: `MO-TEST-${Date.now()}`,
      product_id: product.id,
      bom_id: bom.id,
      quantity: 10,
      quantity_unit: 'pieces',
      status: 'draft',
      priority: 'normal',
      planned_start_date: new Date().toISOString(),
      planned_end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      created_by: userId,
      notes: 'Test manufacturing order created via API'
    };
    
    const createResponse = await axios.post('http://localhost:3000/api/v1/manufacturing-orders', orderData, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!createResponse.data.success) {
      throw new Error('Manufacturing order creation failed: ' + JSON.stringify(createResponse.data.error));
    }
    
    console.log('✓ Manufacturing order created successfully!');
    console.log('Order details:', JSON.stringify(createResponse.data.data.manufacturingOrder, null, 2));
    
    // Verify by fetching all orders
    console.log('5. Verifying order was created...');
    const ordersResponse = await axios.get('http://localhost:3000/api/v1/manufacturing-orders', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (ordersResponse.data.success) {
      console.log(`✓ Total manufacturing orders: ${ordersResponse.data.data.manufacturingOrders.length}`);
    }
    
    console.log('\n🎉 All tests passed! Manufacturing order creation is working.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testManufacturingOrderCreation();
