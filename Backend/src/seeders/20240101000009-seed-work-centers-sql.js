'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      INSERT INTO work_centers (
        id, code, name, description, location, cost_per_hour, capacity, 
        efficiency, status, utilization, availability, maintenance_schedule, 
        next_maintenance, operator_ids, capabilities, working_hours, 
        oee_score, downtime_hours, productive_hours, metadata, 
        created_at, updated_at
      ) VALUES 
      (
        '${uuidv4()}', 'WC-LATHE-001', 'CNC Lathe Station 1',
        'High precision CNC lathe for turning operations',
        'Production Floor - Section A', 45.00, 1, 95.5, 'active',
        78.5, 92.0, 'Weekly - Monday 6:00 AM',
        '${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()}',
        ARRAY[]::uuid[], 
        ARRAY['turning','threading','drilling','boring'],
        '{"monday":{"start":"08:00","end":"17:00","isWorking":true},"tuesday":{"start":"08:00","end":"17:00","isWorking":true},"wednesday":{"start":"08:00","end":"17:00","isWorking":true},"thursday":{"start":"08:00","end":"17:00","isWorking":true},"friday":{"start":"08:00","end":"17:00","isWorking":true},"saturday":{"start":"08:00","end":"12:00","isWorking":true},"sunday":{"start":"00:00","end":"00:00","isWorking":false}}',
        74.5, 15.2, 162.8, '{}',
        NOW(), NOW()
      ),
      (
        '${uuidv4()}', 'WC-MILL-001', 'CNC Milling Center 1',
        '3-axis CNC milling machine for precision milling',
        'Production Floor - Section B', 52.00, 1, 88.5, 'active',
        85.2, 89.0, 'Bi-weekly - Friday 18:00',
        '${new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString()}',
        ARRAY[]::uuid[],
        ARRAY['milling','drilling','tapping','boring'],
        '{"monday":{"start":"08:00","end":"20:00","isWorking":true},"tuesday":{"start":"08:00","end":"20:00","isWorking":true},"wednesday":{"start":"08:00","end":"20:00","isWorking":true},"thursday":{"start":"08:00","end":"20:00","isWorking":true},"friday":{"start":"08:00","end":"20:00","isWorking":true},"saturday":{"start":"08:00","end":"16:00","isWorking":true},"sunday":{"start":"00:00","end":"00:00","isWorking":false}}',
        76.8, 18.5, 185.5, '{}',
        NOW(), NOW()
      ),
      (
        '${uuidv4()}', 'WC-ASSM-001', 'Assembly Line 1',
        'Final product assembly station',
        'Assembly Area - Line 1', 28.00, 4, 96.8, 'active',
        89.5, 97.2, 'Weekly - Sunday 7:00 AM',
        '${new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()}',
        ARRAY[]::uuid[],
        ARRAY['assembly','testing','packaging','quality_check'],
        '{"monday":{"start":"08:00","end":"17:00","isWorking":true},"tuesday":{"start":"08:00","end":"17:00","isWorking":true},"wednesday":{"start":"08:00","end":"17:00","isWorking":true},"thursday":{"start":"08:00","end":"17:00","isWorking":true},"friday":{"start":"08:00","end":"17:00","isWorking":true},"saturday":{"start":"00:00","end":"00:00","isWorking":false},"sunday":{"start":"00:00","end":"00:00","isWorking":false}}',
        86.7, 8.5, 171.5, '{}',
        NOW(), NOW()
      );
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('work_centers', null, {});
  }
};