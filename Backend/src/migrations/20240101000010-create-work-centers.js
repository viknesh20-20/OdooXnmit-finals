'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('work_centers', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      code: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      cost_per_hour: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
        validate: {
          min: 0,
        },
      },
      capacity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
          min: 1,
        },
      },
      efficiency: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 100.00,
        validate: {
          min: 0,
          max: 100,
        },
      },
      status: {
        type: Sequelize.ENUM('active', 'maintenance', 'inactive'),
        allowNull: false,
        defaultValue: 'active',
      },
      utilization: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0.00,
        validate: {
          min: 0,
          max: 100,
        },
      },
      location: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      availability: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 100.00,
        validate: {
          min: 0,
          max: 100,
        },
      },
      maintenance_schedule: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      next_maintenance: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      operator_ids: {
        type: Sequelize.ARRAY(Sequelize.UUID),
        allowNull: false,
        defaultValue: [],
      },
      capabilities: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: false,
        defaultValue: [],
      },
      working_hours: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {
          monday: { start: '08:00', end: '17:00', isWorking: true },
          tuesday: { start: '08:00', end: '17:00', isWorking: true },
          wednesday: { start: '08:00', end: '17:00', isWorking: true },
          thursday: { start: '08:00', end: '17:00', isWorking: true },
          friday: { start: '08:00', end: '17:00', isWorking: true },
          saturday: { start: '08:00', end: '12:00', isWorking: false },
          sunday: { start: '08:00', end: '12:00', isWorking: false },
        },
      },
      oee_score: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
        validate: {
          min: 0,
          max: 100,
        },
      },
      downtime_hours: {
        type: Sequelize.DECIMAL(8, 2),
        allowNull: false,
        defaultValue: 0.00,
        validate: {
          min: 0,
        },
      },
      productive_hours: {
        type: Sequelize.DECIMAL(8, 2),
        allowNull: false,
        defaultValue: 0.00,
        validate: {
          min: 0,
        },
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // Add indexes
    await queryInterface.addIndex('work_centers', ['code'], {
      unique: true,
      name: 'work_centers_code_unique',
    });

    await queryInterface.addIndex('work_centers', ['name'], {
      name: 'work_centers_name_idx',
    });

    await queryInterface.addIndex('work_centers', ['status'], {
      name: 'work_centers_status_idx',
    });

    await queryInterface.addIndex('work_centers', ['location'], {
      name: 'work_centers_location_idx',
    });

    await queryInterface.addIndex('work_centers', ['utilization'], {
      name: 'work_centers_utilization_idx',
    });

    await queryInterface.addIndex('work_centers', ['efficiency'], {
      name: 'work_centers_efficiency_idx',
    });

    await queryInterface.addIndex('work_centers', ['created_at'], {
      name: 'work_centers_created_at_idx',
    });

    await queryInterface.addIndex('work_centers', ['status', 'utilization'], {
      name: 'work_centers_status_utilization_idx',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('work_centers');
  },
};
