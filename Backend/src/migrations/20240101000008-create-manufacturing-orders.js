'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('manufacturing_orders', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      mo_number: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      product_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'products',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      bom_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'boms',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      quantity: {
        type: Sequelize.DECIMAL(15, 4),
        allowNull: false,
        validate: {
          min: 0.0001,
        },
      },
      quantity_unit: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('draft', 'confirmed', 'in_progress', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'draft',
      },
      priority: {
        type: Sequelize.ENUM('low', 'normal', 'high', 'urgent'),
        allowNull: false,
        defaultValue: 'normal',
      },
      planned_start_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      planned_end_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      actual_start_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      actual_end_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
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
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
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
    await queryInterface.addIndex('manufacturing_orders', ['mo_number'], {
      unique: true,
      name: 'manufacturing_orders_mo_number_unique',
    });

    await queryInterface.addIndex('manufacturing_orders', ['product_id'], {
      name: 'manufacturing_orders_product_id_idx',
    });

    await queryInterface.addIndex('manufacturing_orders', ['bom_id'], {
      name: 'manufacturing_orders_bom_id_idx',
    });

    await queryInterface.addIndex('manufacturing_orders', ['status'], {
      name: 'manufacturing_orders_status_idx',
    });

    await queryInterface.addIndex('manufacturing_orders', ['priority'], {
      name: 'manufacturing_orders_priority_idx',
    });

    await queryInterface.addIndex('manufacturing_orders', ['created_by'], {
      name: 'manufacturing_orders_created_by_idx',
    });

    await queryInterface.addIndex('manufacturing_orders', ['assigned_to'], {
      name: 'manufacturing_orders_assigned_to_idx',
    });

    await queryInterface.addIndex('manufacturing_orders', ['planned_start_date'], {
      name: 'manufacturing_orders_planned_start_date_idx',
    });

    await queryInterface.addIndex('manufacturing_orders', ['planned_end_date'], {
      name: 'manufacturing_orders_planned_end_date_idx',
    });

    await queryInterface.addIndex('manufacturing_orders', ['created_at'], {
      name: 'manufacturing_orders_created_at_idx',
    });

    await queryInterface.addIndex('manufacturing_orders', ['status', 'priority'], {
      name: 'manufacturing_orders_status_priority_idx',
    });

    await queryInterface.addIndex('manufacturing_orders', ['product_id', 'status'], {
      name: 'manufacturing_orders_product_status_idx',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('manufacturing_orders');
  },
};
