'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('work_orders', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      wo_number: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      manufacturing_order_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'manufacturing_orders',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      work_center_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'work_centers',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      operation: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      operation_type: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      duration: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
        },
      },
      estimated_duration: {
        type: Sequelize.INTEGER,
        allowNull: true,
        validate: {
          min: 1,
        },
      },
      actual_duration: {
        type: Sequelize.INTEGER,
        allowNull: true,
        validate: {
          min: 0,
        },
      },
      status: {
        type: Sequelize.ENUM('pending', 'in-progress', 'paused', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending',
      },
      priority: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'urgent'),
        allowNull: false,
        defaultValue: 'medium',
      },
      assigned_to: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      sequence: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
          min: 1,
        },
      },
      start_time: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      end_time: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      pause_time: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
      dependencies: {
        type: Sequelize.ARRAY(Sequelize.UUID),
        allowNull: false,
        defaultValue: [],
      },
      instructions: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      comments: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      quality_checks: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: [],
      },
      time_entries: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: [],
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
    await queryInterface.addIndex('work_orders', ['wo_number'], {
      unique: true,
      name: 'work_orders_wo_number_unique',
    });

    await queryInterface.addIndex('work_orders', ['manufacturing_order_id'], {
      name: 'work_orders_manufacturing_order_id_idx',
    });

    await queryInterface.addIndex('work_orders', ['work_center_id'], {
      name: 'work_orders_work_center_id_idx',
    });

    await queryInterface.addIndex('work_orders', ['status'], {
      name: 'work_orders_status_idx',
    });

    await queryInterface.addIndex('work_orders', ['priority'], {
      name: 'work_orders_priority_idx',
    });

    await queryInterface.addIndex('work_orders', ['assigned_to'], {
      name: 'work_orders_assigned_to_idx',
    });

    await queryInterface.addIndex('work_orders', ['sequence'], {
      name: 'work_orders_sequence_idx',
    });

    await queryInterface.addIndex('work_orders', ['start_time'], {
      name: 'work_orders_start_time_idx',
    });

    await queryInterface.addIndex('work_orders', ['end_time'], {
      name: 'work_orders_end_time_idx',
    });

    await queryInterface.addIndex('work_orders', ['created_at'], {
      name: 'work_orders_created_at_idx',
    });

    await queryInterface.addIndex('work_orders', ['manufacturing_order_id', 'sequence'], {
      name: 'work_orders_mo_sequence_idx',
    });

    await queryInterface.addIndex('work_orders', ['status', 'priority'], {
      name: 'work_orders_status_priority_idx',
    });

    await queryInterface.addIndex('work_orders', ['work_center_id', 'status'], {
      name: 'work_orders_wc_status_idx',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('work_orders');
  },
};
