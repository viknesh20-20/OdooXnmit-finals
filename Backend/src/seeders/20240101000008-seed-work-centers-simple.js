'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const workCenters = [
      {
        id: uuidv4(),
        code: 'WC-LATHE-001',
        name: 'CNC Lathe Station 1',
        description: 'High precision CNC lathe for turning operations',
        location: 'Production Floor - Section A',
        cost_per_hour: 45.00,
        capacity: 1,
        efficiency: 95.5,
        status: 'active',
        utilization: 78.5,
        availability: 92.0,
        maintenance_schedule: 'Weekly - Monday 6:00 AM',
        next_maintenance: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        operator_ids: [],
        capabilities: ['turning','threading','drilling','boring'],
        working_hours: JSON.stringify({
          monday: {start: "08:00", end: "17:00", isWorking: true},
          tuesday: {start: "08:00", end: "17:00", isWorking: true},
          wednesday: {start: "08:00", end: "17:00", isWorking: true},
          thursday: {start: "08:00", end: "17:00", isWorking: true},
          friday: {start: "08:00", end: "17:00", isWorking: true},
          saturday: {start: "08:00", end: "12:00", isWorking: true},
          sunday: {start: "00:00", end: "00:00", isWorking: false}
        }),
        oee_score: 74.5,
        downtime_hours: 15.2,
        productive_hours: 162.8,
        metadata: JSON.stringify({}),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        code: 'WC-MILL-001',
        name: 'CNC Milling Center 1',
        description: '3-axis CNC milling machine for precision milling',
        location: 'Production Floor - Section B',
        cost_per_hour: 52.00,
        capacity: 1,
        efficiency: 88.5,
        status: 'active',
        utilization: 85.2,
        availability: 89.0,
        maintenance_schedule: 'Bi-weekly - Friday 18:00',
        next_maintenance: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        operator_ids: [],
        capabilities: ['milling','drilling','tapping','boring'],
        working_hours: JSON.stringify({
          monday: {start: "08:00", end: "20:00", isWorking: true},
          tuesday: {start: "08:00", end: "20:00", isWorking: true},
          wednesday: {start: "08:00", end: "20:00", isWorking: true},
          thursday: {start: "08:00", end: "20:00", isWorking: true},
          friday: {start: "08:00", end: "20:00", isWorking: true},
          saturday: {start: "08:00", end: "16:00", isWorking: true},
          sunday: {start: "00:00", end: "00:00", isWorking: false}
        }),
        oee_score: 76.8,
        downtime_hours: 18.5,
        productive_hours: 185.5,
        metadata: JSON.stringify({}),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        code: 'WC-ASSM-001',
        name: 'Assembly Line 1',
        description: 'Final product assembly station',
        location: 'Assembly Area - Line 1',
        cost_per_hour: 28.00,
        capacity: 4,
        efficiency: 96.8,
        status: 'active',
        utilization: 89.5,
        availability: 97.2,
        maintenance_schedule: 'Weekly - Sunday 7:00 AM',
        next_maintenance: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        operator_ids: [],
        capabilities: ['assembly','testing','packaging','quality_check'],
        working_hours: JSON.stringify({
          monday: {start: "08:00", end: "17:00", isWorking: true},
          tuesday: {start: "08:00", end: "17:00", isWorking: true},
          wednesday: {start: "08:00", end: "17:00", isWorking: true},
          thursday: {start: "08:00", end: "17:00", isWorking: true},
          friday: {start: "08:00", end: "17:00", isWorking: true},
          saturday: {start: "00:00", end: "00:00", isWorking: false},
          sunday: {start: "00:00", end: "00:00", isWorking: false}
        }),
        oee_score: 86.7,
        downtime_hours: 8.5,
        productive_hours: 171.5,
        metadata: JSON.stringify({}),
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    await queryInterface.bulkInsert('work_centers', workCenters);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('work_centers', null, {});
  }
};