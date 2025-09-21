'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get manufacturing orders, work centers, and users
    const manufacturingOrders = await queryInterface.sequelize.query(
      'SELECT id, mo_number, status FROM manufacturing_orders LIMIT 10',
      { type: Sequelize.QueryTypes.SELECT }
    );

    const workCenters = await queryInterface.sequelize.query(
      'SELECT id, name, code FROM work_centers WHERE status = $status',
      { 
        bind: { status: 'active' },
        type: Sequelize.QueryTypes.SELECT 
      }
    );

    const users = await queryInterface.sequelize.query(
      'SELECT id, first_name, last_name FROM users LIMIT 5',
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (manufacturingOrders.length === 0 || workCenters.length === 0 || users.length === 0) {
      console.log('No manufacturing orders, work centers, or users found. Skipping work orders seeder.');
      return;
    }

    const statuses = ['pending', 'in_progress', 'paused', 'completed'];
    const priorities = ['low', 'medium', 'high', 'urgent'];
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

    const operationTypes = [
      'setup',
      'machining',
      'assembly',
      'quality_control',
      'finishing'
    ];

    const workOrders = [];
    let woCounter = 1;

    // Create 2-4 work orders per manufacturing order
    for (const mo of manufacturingOrders) {
      const numWorkOrders = Math.floor(Math.random() * 3) + 2; // 2-4 work orders
      
      for (let i = 0; i < numWorkOrders; i++) {
        const workCenter = workCenters[Math.floor(Math.random() * workCenters.length)];
        const user = users[Math.floor(Math.random() * users.length)];
        const operation = operations[Math.floor(Math.random() * operations.length)];
        const operationType = operationTypes[Math.floor(Math.random() * operationTypes.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const priority = priorities[Math.floor(Math.random() * priorities.length)];
        
        // Generate realistic durations
        const estimatedDuration = Math.floor(Math.random() * 240) + 30; // 30-270 minutes
        const actualDuration = status === 'completed' ? 
          Math.floor(estimatedDuration * (0.8 + Math.random() * 0.4)) : // 80-120% of estimated
          null;
        
        // Generate times based on status
        const now = new Date();
        let startTime = null;
        let endTime = null;
        let pauseTime = 0;
        
        if (status === 'in_progress' || status === 'paused' || status === 'completed') {
          startTime = new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000); // Started within last 24 hours
        }
        
        if (status === 'completed') {
          endTime = new Date(startTime.getTime() + (actualDuration * 60 * 1000));
        }
        
        if (status === 'paused') {
          pauseTime = Math.floor(Math.random() * 60) + 5; // 5-65 minutes pause
        }

        // Generate quality checks for some work orders
        const qualityChecks = [];
        if (Math.random() > 0.6) { // 40% chance of having quality checks
          const numChecks = Math.floor(Math.random() * 3) + 1;
          for (let j = 0; j < numChecks; j++) {
            qualityChecks.push({
              id: uuidv4(),
              parameter: ['Dimension', 'Surface Finish', 'Tolerance', 'Color', 'Weight'][j % 5],
              expectedValue: '±0.1mm',
              actualValue: status === 'completed' ? '±0.05mm' : null,
              status: status === 'completed' ? 'pass' : 'pending',
              checkedBy: status === 'completed' ? user.id : null,
              checkedAt: status === 'completed' ? endTime : null
            });
          }
        }

        // Generate time entries for in-progress and completed work orders
        const timeEntries = [];
        if (startTime && (status === 'in_progress' || status === 'completed' || status === 'paused')) {
          timeEntries.push({
            id: uuidv4(),
            userId: user.id,
            startTime: startTime.toISOString(),
            endTime: endTime ? endTime.toISOString() : null,
            duration: actualDuration || Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60)),
            description: `Working on ${operation}`,
            createdAt: startTime.toISOString()
          });
        }

        workOrders.push({
          id: uuidv4(),
          wo_number: `WO-${String(woCounter).padStart(6, '0')}`,
          manufacturing_order_id: mo.id,
          work_center_id: workCenter.id,
          operation: operation,
          operation_type: operationType,
          duration: estimatedDuration,
          estimated_duration: estimatedDuration,
          actual_duration: actualDuration,
          status: status,
          priority: priority,
          assigned_to: Math.random() > 0.3 ? user.id : null, // 70% chance of being assigned
          sequence: i + 1,
          start_time: startTime,
          end_time: endTime,
          pause_time: pauseTime,
          dependencies: '{}', // Empty array for PostgreSQL
          instructions: `Detailed instructions for ${operation} operation. Follow safety protocols and quality standards.`,
          comments: status === 'paused' ? 'Paused due to material shortage' : 
                   status === 'completed' ? 'Completed successfully' : null,
          quality_checks: JSON.stringify(qualityChecks),
          time_entries: JSON.stringify(timeEntries),
          metadata: JSON.stringify({
            createdBy: user.id,
            workCenterCode: workCenter.code,
            moNumber: mo.mo_number
          }),
          created_at: new Date(),
          updated_at: new Date()
        });
        
        woCounter++;
      }
    }

    console.log(`Creating ${workOrders.length} work orders...`);
    await queryInterface.bulkInsert('work_orders', workOrders);
    console.log('Work orders seeded successfully!');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('work_orders', null, {});
  }
};
