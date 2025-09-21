const { Sequelize } = require('sequelize');
const path = require('path');

// Database configuration
const config = {
  username: 'postgres',
  password: 'Thalha*7258',
  database: 'ERPDB',
  host: 'localhost',
  port: 5432,
  dialect: 'postgres',
  logging: false
};

const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  port: config.port,
  dialect: config.dialect,
  logging: config.logging
});

async function verifyDatabaseData() {
  console.log('🔍 Manufacturing ERP Database Verification');
  console.log('==========================================');
  
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');
    
    // Define all tables to check
    const tables = [
      'users',
      'roles', 
      'permissions',
      'role_permissions',
      'products',
      'work_centers',
      'boms',
      'bom_components',
      'manufacturing_orders',
      'work_orders',
      'stock_movements',
      'reports'
    ];
    
    console.log('\n📊 Table Record Counts:');
    console.log('========================');
    
    const tableCounts = {};
    
    for (const table of tables) {
      try {
        const [results] = await sequelize.query(`SELECT COUNT(*) as count FROM ${table}`);
        const count = parseInt(results[0].count);
        tableCounts[table] = count;
        
        const status = count > 0 ? '✅' : '⚠️';
        console.log(`${status} ${table.padEnd(20)}: ${count} records`);
      } catch (error) {
        console.log(`❌ ${table.padEnd(20)}: Error - ${error.message}`);
        tableCounts[table] = 0;
      }
    }
    
    // Detailed verification for key tables
    console.log('\n🔍 Detailed Data Verification:');
    console.log('===============================');
    
    // Check Users
    try {
      const [users] = await sequelize.query(`
        SELECT u.username, u.email, u.first_name, u.last_name, r.name as role_name, u.email_verified
        FROM users u 
        LEFT JOIN roles r ON u.role_id = r.id 
        ORDER BY u.created_at
      `);
      
      console.log(`\n👥 Users (${users.length}):`);
      users.forEach(user => {
        const verified = user.email_verified ? '✅' : '❌';
        console.log(`   ${verified} ${user.username} (${user.email}) - ${user.role_name || 'No Role'}`);
      });
    } catch (error) {
      console.log(`❌ Users verification failed: ${error.message}`);
    }
    
    // Check Products
    try {
      const [products] = await sequelize.query(`
        SELECT name, sku, category, unit_price, stock_quantity, status
        FROM products 
        ORDER BY created_at
        LIMIT 10
      `);
      
      console.log(`\n📦 Products (showing first 10 of ${tableCounts.products}):`);
      products.forEach(product => {
        const status = product.status === 'active' ? '✅' : '⚠️';
        console.log(`   ${status} ${product.name} (${product.sku}) - $${product.unit_price} - Stock: ${product.stock_quantity}`);
      });
    } catch (error) {
      console.log(`❌ Products verification failed: ${error.message}`);
    }
    
    // Check Manufacturing Orders
    try {
      const [manufacturingOrders] = await sequelize.query(`
        SELECT mo.mo_number, p.name as product_name, mo.quantity, mo.status, mo.priority
        FROM manufacturing_orders mo
        LEFT JOIN products p ON mo.product_id = p.id
        ORDER BY mo.created_at
        LIMIT 10
      `);
      
      console.log(`\n🏭 Manufacturing Orders (showing first 10 of ${tableCounts.manufacturing_orders}):`);
      manufacturingOrders.forEach(mo => {
        const statusIcon = mo.status === 'completed' ? '✅' : mo.status === 'in-progress' ? '🔄' : '📋';
        console.log(`   ${statusIcon} ${mo.mo_number} - ${mo.product_name} (Qty: ${mo.quantity}) - ${mo.status} - ${mo.priority}`);
      });
    } catch (error) {
      console.log(`❌ Manufacturing Orders verification failed: ${error.message}`);
    }
    
    // Check Work Orders
    try {
      const [workOrders] = await sequelize.query(`
        SELECT wo.wo_number, wo.operation, wc.name as work_center_name, wo.status, wo.priority
        FROM work_orders wo
        LEFT JOIN work_centers wc ON wo.work_center_id = wc.id
        ORDER BY wo.created_at
        LIMIT 10
      `);
      
      console.log(`\n⚙️ Work Orders (showing first 10 of ${tableCounts.work_orders}):`);
      workOrders.forEach(wo => {
        const statusIcon = wo.status === 'completed' ? '✅' : wo.status === 'in-progress' ? '🔄' : '📋';
        console.log(`   ${statusIcon} ${wo.wo_number} - ${wo.operation} @ ${wo.work_center_name} - ${wo.status}`);
      });
    } catch (error) {
      console.log(`❌ Work Orders verification failed: ${error.message}`);
    }
    
    // Check Work Centers
    try {
      const [workCenters] = await sequelize.query(`
        SELECT name, type, capacity, efficiency, status
        FROM work_centers
        ORDER BY created_at
      `);
      
      console.log(`\n🏢 Work Centers (${workCenters.length}):`);
      workCenters.forEach(wc => {
        const status = wc.status === 'active' ? '✅' : '⚠️';
        console.log(`   ${status} ${wc.name} (${wc.type}) - Capacity: ${wc.capacity}, Efficiency: ${wc.efficiency}%`);
      });
    } catch (error) {
      console.log(`❌ Work Centers verification failed: ${error.message}`);
    }
    
    // Check BOMs
    try {
      const [boms] = await sequelize.query(`
        SELECT b.name, p.name as product_name, b.version, b.is_active, b.is_default
        FROM boms b
        LEFT JOIN products p ON b.product_id = p.id
        ORDER BY b.created_at
      `);
      
      console.log(`\n📋 Bills of Materials (${boms.length}):`);
      boms.forEach(bom => {
        const active = bom.is_active ? '✅' : '❌';
        const defaultBom = bom.is_default ? '⭐' : '';
        console.log(`   ${active} ${bom.name} v${bom.version} - ${bom.product_name} ${defaultBom}`);
      });
    } catch (error) {
      console.log(`❌ BOMs verification failed: ${error.message}`);
    }
    
    // Data Integrity Checks
    console.log('\n🔗 Data Integrity Checks:');
    console.log('==========================');
    
    // Check foreign key relationships
    try {
      // Manufacturing Orders -> Products
      const [moProductCheck] = await sequelize.query(`
        SELECT COUNT(*) as count 
        FROM manufacturing_orders mo 
        LEFT JOIN products p ON mo.product_id = p.id 
        WHERE p.id IS NULL
      `);
      
      const orphanedMOs = parseInt(moProductCheck[0].count);
      if (orphanedMOs === 0) {
        console.log('✅ All Manufacturing Orders have valid Product references');
      } else {
        console.log(`❌ ${orphanedMOs} Manufacturing Orders have invalid Product references`);
      }
      
      // Work Orders -> Manufacturing Orders
      const [woMoCheck] = await sequelize.query(`
        SELECT COUNT(*) as count 
        FROM work_orders wo 
        LEFT JOIN manufacturing_orders mo ON wo.manufacturing_order_id = mo.id 
        WHERE wo.manufacturing_order_id IS NOT NULL AND mo.id IS NULL
      `);
      
      const orphanedWOs = parseInt(woMoCheck[0].count);
      if (orphanedWOs === 0) {
        console.log('✅ All Work Orders have valid Manufacturing Order references');
      } else {
        console.log(`❌ ${orphanedWOs} Work Orders have invalid Manufacturing Order references`);
      }
      
      // Work Orders -> Work Centers
      const [woWcCheck] = await sequelize.query(`
        SELECT COUNT(*) as count 
        FROM work_orders wo 
        LEFT JOIN work_centers wc ON wo.work_center_id = wc.id 
        WHERE wo.work_center_id IS NOT NULL AND wc.id IS NULL
      `);
      
      const orphanedWOsWC = parseInt(woWcCheck[0].count);
      if (orphanedWOsWC === 0) {
        console.log('✅ All Work Orders have valid Work Center references');
      } else {
        console.log(`❌ ${orphanedWOsWC} Work Orders have invalid Work Center references`);
      }
      
    } catch (error) {
      console.log(`❌ Data integrity check failed: ${error.message}`);
    }
    
    // Summary
    console.log('\n📈 Database Summary:');
    console.log('====================');
    
    const totalRecords = Object.values(tableCounts).reduce((sum, count) => sum + count, 0);
    const tablesWithData = Object.values(tableCounts).filter(count => count > 0).length;
    
    console.log(`📊 Total Records: ${totalRecords}`);
    console.log(`📋 Tables with Data: ${tablesWithData}/${tables.length}`);
    console.log(`👥 Users: ${tableCounts.users || 0}`);
    console.log(`📦 Products: ${tableCounts.products || 0}`);
    console.log(`🏭 Manufacturing Orders: ${tableCounts.manufacturing_orders || 0}`);
    console.log(`⚙️ Work Orders: ${tableCounts.work_orders || 0}`);
    console.log(`🏢 Work Centers: ${tableCounts.work_centers || 0}`);
    console.log(`📋 BOMs: ${tableCounts.boms || 0}`);
    
    // Recommendations
    console.log('\n💡 Recommendations:');
    console.log('===================');
    
    if (tableCounts.users === 0) {
      console.log('⚠️ No users found. Run user seeders to create test accounts.');
    }
    
    if (tableCounts.products === 0) {
      console.log('⚠️ No products found. Run product seeders to create sample products.');
    }
    
    if (tableCounts.work_centers === 0) {
      console.log('⚠️ No work centers found. Run work center seeders.');
    }
    
    if (tableCounts.manufacturing_orders === 0) {
      console.log('⚠️ No manufacturing orders found. Create sample manufacturing orders.');
    }
    
    if (tableCounts.work_orders === 0) {
      console.log('⚠️ No work orders found. Create sample work orders.');
    }
    
    if (totalRecords > 1000) {
      console.log('✅ Database has sufficient data for comprehensive testing.');
    } else if (totalRecords > 100) {
      console.log('⚠️ Database has moderate data. Consider adding more records for thorough testing.');
    } else {
      console.log('❌ Database has minimal data. Add more sample data for proper testing.');
    }
    
    console.log('\n🎯 Database verification completed!');
    
  } catch (error) {
    console.error('❌ Database verification failed:', error.message);
  } finally {
    await sequelize.close();
  }
}

// Run the verification
verifyDatabaseData().catch(console.error);
