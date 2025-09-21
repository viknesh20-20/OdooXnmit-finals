const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api/v1';

async function createWorkOrders() {
  try {
    // Login to get token
    console.log('🔐 Logging in...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      usernameOrEmail: 'admin@manufacturing.com',
      password: 'admin123'
    });

    const token = loginResponse.data.data.accessToken;
    const headers = { Authorization: `Bearer ${token}` };

    // Get manufacturing orders
    console.log('📋 Fetching manufacturing orders...');
    const moResponse = await axios.get(`${API_BASE_URL}/manufacturing-orders`, { headers });
    const manufacturingOrders = moResponse.data.data.manufacturingOrders;

    // Get work centers
    console.log('🏭 Fetching work centers...');
    const wcResponse = await axios.get(`${API_BASE_URL}/work-centers`, { headers });
    const workCenters = wcResponse.data.data.workCenters;

    if (manufacturingOrders.length === 0 || workCenters.length === 0) {
      console.log('❌ No manufacturing orders or work centers found');
      return;
    }

    console.log(`Found ${manufacturingOrders.length} manufacturing orders and ${workCenters.length} work centers`);

    const operations = [
      'Setup Machine',
      'Material Preparation', 
      'Cutting',
      'Drilling',
      'Assembly',
      'Welding',
      'Painting',
      'Quality Check',
      'Packaging',
      'Final Inspection'
    ];

    const operationTypes = ['setup', 'machining', 'assembly', 'quality_control', 'finishing'];
    const statuses = ['pending', 'in_progress', 'paused', 'completed'];
    const priorities = ['low', 'medium', 'high', 'urgent'];

    let workOrdersCreated = 0;

    // Create 2-3 work orders per manufacturing order
    for (const mo of manufacturingOrders.slice(0, 5)) { // Limit to first 5 MOs
      const numWorkOrders = Math.floor(Math.random() * 2) + 2; // 2-3 work orders
      
      for (let i = 0; i < numWorkOrders; i++) {
        const workCenter = workCenters[Math.floor(Math.random() * workCenters.length)];
        const operation = operations[Math.floor(Math.random() * operations.length)];
        const operationType = operationTypes[Math.floor(Math.random() * operationTypes.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const priority = priorities[Math.floor(Math.random() * priorities.length)];
        
        const estimatedDuration = Math.floor(Math.random() * 240) + 30; // 30-270 minutes
        
        const workOrderData = {
          manufacturing_order_id: mo.id,
          work_center_id: workCenter.id,
          operation: operation,
          operation_type: operationType,
          duration: estimatedDuration,
          estimated_duration: estimatedDuration,
          status: status,
          priority: priority,
          sequence: i + 1,
          instructions: `Detailed instructions for ${operation} operation. Follow safety protocols and quality standards.`,
          dependencies: [],
          quality_checks: [],
          time_entries: [],
          metadata: {
            moNumber: mo.moNumber,
            workCenterCode: workCenter.code
          }
        };

        try {
          console.log(`📝 Creating work order: ${operation} for MO ${mo.moNumber}...`);
          const response = await axios.post(`${API_BASE_URL}/work-orders`, workOrderData, { headers });
          workOrdersCreated++;
          console.log(`✅ Created work order: ${response.data.data.workOrder.wo_number}`);
        } catch (error) {
          console.error(`❌ Failed to create work order for ${operation}:`, error.response?.data || error.message);
        }
      }
    }

    console.log(`\n🎉 Successfully created ${workOrdersCreated} work orders!`);

    // Verify by fetching work orders
    console.log('\n🔍 Verifying work orders...');
    const verifyResponse = await axios.get(`${API_BASE_URL}/work-orders`, { headers });
    const workOrders = verifyResponse.data.data.workOrders;
    console.log(`✅ Found ${workOrders.length} work orders in the database`);

    // Show first few work orders
    if (workOrders.length > 0) {
      console.log('\n📋 Sample work orders:');
      workOrders.slice(0, 3).forEach(wo => {
        console.log(`  - ${wo.wo_number}: ${wo.operation} (${wo.status}) - MO: ${wo.manufacturingOrder?.mo_number}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Run the script
createWorkOrders();
