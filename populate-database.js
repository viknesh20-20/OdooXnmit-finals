#!/usr/bin/env node

const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

const BASE_URL = 'http://localhost:3000/api/v1';

// Get authentication token
async function getAuthToken() {
  try {
    const { stdout } = await execAsync(`curl -s -X POST ${BASE_URL}/auth/login -H "Content-Type: application/json" -d '{"usernameOrEmail":"admin@manufacturing.com","password":"admin123"}'`);
    const response = JSON.parse(stdout);
    return response.data.accessToken;
  } catch (error) {
    console.error('Failed to get auth token:', error);
    return null;
  }
}

// Get existing data
async function getExistingData(token) {
  try {
    const [productsResult, workCentersResult, usersResult] = await Promise.all([
      execAsync(`curl -s -X GET ${BASE_URL}/products -H "Authorization: Bearer ${token}"`),
      execAsync(`curl -s -X GET ${BASE_URL}/work-centers -H "Authorization: Bearer ${token}"`),
      execAsync(`curl -s -X POST ${BASE_URL}/auth/login -H "Content-Type: application/json" -d '{"usernameOrEmail":"admin@manufacturing.com","password":"admin123"}'`)
    ]);

    const products = JSON.parse(productsResult.stdout).data.products;
    const workCenters = JSON.parse(workCentersResult.stdout).data.workCenters;
    const userResponse = JSON.parse(usersResult.stdout);
    const userId = userResponse.data.user.id;

    return { products, workCenters, userId };
  } catch (error) {
    console.error('Failed to get existing data:', error);
    return { products: [], workCenters: [], userId: null };
  }
}

// Create BOMs
async function createBOMs(token, products, workCenters, userId) {
  console.log('Creating BOMs...');
  const boms = [];

  for (let i = 0; i < Math.min(3, products.length); i++) {
    const product = products[i];
    const bomData = {
      product_id: product.id,
      name: `${product.name} BOM v1.0`,
      version: '1.0',
      description: `Bill of Materials for ${product.name}`,
      is_active: true,
      is_default: true,
      created_by: userId
    };

    try {
      const { stdout } = await execAsync(`curl -s -X POST ${BASE_URL}/boms -H "Content-Type: application/json" -H "Authorization: Bearer ${token}" -d '${JSON.stringify(bomData)}'`);
      const response = JSON.parse(stdout);
      if (response.success) {
        boms.push(response.data.bom);
        console.log(`✅ Created BOM: ${bomData.name}`);
      } else {
        console.log(`❌ Failed to create BOM: ${response.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.log(`❌ Error creating BOM for ${product.name}:`, error.message);
    }
  }

  return boms;
}

// Create Manufacturing Orders
async function createManufacturingOrders(token, products, boms, userId) {
  console.log('Creating Manufacturing Orders...');
  const orders = [];

  const statuses = ['planned', 'in-progress', 'completed', 'on-hold'];
  const priorities = ['low', 'medium', 'high', 'urgent'];

  for (let i = 0; i < Math.min(5, products.length, boms.length); i++) {
    const product = products[i];
    const bom = boms[i] || boms[0]; // Use first BOM if not enough BOMs

    const startDate = new Date();
    startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 30) - 15); // Random date ±15 days
    
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 14) + 1); // 1-14 days duration

    const orderData = {
      product_id: product.id,
      bom_id: bom.id,
      quantity: Math.floor(Math.random() * 100) + 10, // 10-110 quantity
      quantity_unit: 'pcs',
      status: statuses[Math.floor(Math.random() * statuses.length)],
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      planned_start_date: startDate.toISOString(),
      planned_end_date: endDate.toISOString(),
      created_by: userId,
      assigned_to: userId,
      notes: `Manufacturing order for ${product.name} - Batch ${i + 1}`
    };

    try {
      const { stdout } = await execAsync(`curl -s -X POST ${BASE_URL}/manufacturing-orders -H "Content-Type: application/json" -H "Authorization: Bearer ${token}" -d '${JSON.stringify(orderData)}'`);
      const response = JSON.parse(stdout);
      if (response.success) {
        orders.push(response.data.manufacturingOrder);
        console.log(`✅ Created Manufacturing Order: ${response.data.manufacturingOrder.reference || response.data.manufacturingOrder.id}`);
      } else {
        console.log(`❌ Failed to create Manufacturing Order: ${response.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.log(`❌ Error creating Manufacturing Order for ${product.name}:`, error.message);
    }
  }

  return orders;
}

// Create Work Orders
async function createWorkOrders(token, manufacturingOrders, workCenters, userId) {
  console.log('Creating Work Orders...');
  const workOrders = [];

  const operations = ['Setup', 'Machining', 'Assembly', 'Quality Check', 'Packaging'];
  const statuses = ['pending', 'in-progress', 'completed', 'on-hold'];

  for (const mo of manufacturingOrders.slice(0, 3)) { // Create work orders for first 3 MOs
    for (let i = 0; i < 2; i++) { // 2 work orders per MO
      const workCenter = workCenters[Math.floor(Math.random() * workCenters.length)];
      const operation = operations[Math.floor(Math.random() * operations.length)];

      const workOrderData = {
        manufacturing_order_id: mo.id,
        work_center_id: workCenter.id,
        operation_name: operation,
        sequence: i + 1,
        planned_duration: Math.floor(Math.random() * 480) + 60, // 1-8 hours in minutes
        status: statuses[Math.floor(Math.random() * statuses.length)],
        assigned_to: userId,
        notes: `${operation} operation for ${mo.reference || mo.id}`
      };

      try {
        const { stdout } = await execAsync(`curl -s -X POST ${BASE_URL}/work-orders -H "Content-Type: application/json" -H "Authorization: Bearer ${token}" -d '${JSON.stringify(workOrderData)}'`);
        const response = JSON.parse(stdout);
        if (response.success) {
          workOrders.push(response.data.workOrder);
          console.log(`✅ Created Work Order: ${operation} for ${mo.reference || mo.id}`);
        } else {
          console.log(`❌ Failed to create Work Order: ${response.error?.message || 'Unknown error'}`);
        }
      } catch (error) {
        console.log(`❌ Error creating Work Order:`, error.message);
      }
    }
  }

  return workOrders;
}

// Create Stock Movements
async function createStockMovements(token, products, userId) {
  console.log('Creating Stock Movements...');
  const movements = [];

  const movementTypes = ['in', 'out', 'adjustment', 'transfer'];
  const references = ['PO-001', 'SO-001', 'ADJ-001', 'TRF-001'];

  for (let i = 0; i < Math.min(8, products.length * 2); i++) {
    const product = products[Math.floor(Math.random() * products.length)];
    const movementType = movementTypes[Math.floor(Math.random() * movementTypes.length)];
    
    const movementData = {
      product_id: product.id,
      movement_type: movementType,
      quantity: Math.floor(Math.random() * 50) + 1, // 1-50 quantity
      unit_cost: Math.random() * 100 + 10, // $10-$110
      reference: `${references[Math.floor(Math.random() * references.length)]}-${String(i + 1).padStart(3, '0')}`,
      notes: `${movementType.toUpperCase()} movement for ${product.name}`,
      created_by: userId
    };

    try {
      const { stdout } = await execAsync(`curl -s -X POST ${BASE_URL}/stock-movements -H "Content-Type: application/json" -H "Authorization: Bearer ${token}" -d '${JSON.stringify(movementData)}'`);
      const response = JSON.parse(stdout);
      if (response.success) {
        movements.push(response.data.stockMovement);
        console.log(`✅ Created Stock Movement: ${movementData.reference}`);
      } else {
        console.log(`❌ Failed to create Stock Movement: ${response.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.log(`❌ Error creating Stock Movement:`, error.message);
    }
  }

  return movements;
}

// Main function
async function populateDatabase() {
  console.log('🚀 Starting Database Population...');
  console.log('=====================================');

  const token = await getAuthToken();
  if (!token) {
    console.error('❌ Failed to authenticate');
    return;
  }

  console.log('✅ Authentication successful');

  const { products, workCenters, userId } = await getExistingData(token);
  console.log(`📊 Found ${products.length} products, ${workCenters.length} work centers`);

  if (products.length === 0) {
    console.log('❌ No products found. Please ensure products are seeded first.');
    return;
  }

  // Create data in sequence
  const boms = await createBOMs(token, products, workCenters, userId);
  const manufacturingOrders = await createManufacturingOrders(token, products, boms, userId);
  const workOrders = await createWorkOrders(token, manufacturingOrders, workCenters, userId);
  const stockMovements = await createStockMovements(token, products, userId);

  console.log('\n🎉 Database Population Complete!');
  console.log('================================');
  console.log(`✅ Created ${boms.length} BOMs`);
  console.log(`✅ Created ${manufacturingOrders.length} Manufacturing Orders`);
  console.log(`✅ Created ${workOrders.length} Work Orders`);
  console.log(`✅ Created ${stockMovements.length} Stock Movements`);
  console.log('\n🔍 The system now has comprehensive sample data for testing!');
}

// Run the population
populateDatabase().catch(error => {
  console.error('💥 Database population failed:', error.message);
  process.exit(1);
});
