'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('stock_movements', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
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
      type: {
        type: Sequelize.ENUM('in', 'out', 'transfer', 'adjustment'),
        allowNull: false,
      },
      quantity: {
        type: Sequelize.DECIMAL(15, 4),
        allowNull: false,
        validate: {
          min: 0.0001,
        },
      },
      unit: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      unit_cost: {
        type: Sequelize.DECIMAL(15, 4),
        allowNull: true,
        validate: {
          min: 0,
        },
      },
      total_value: {
        type: Sequelize.DECIMAL(15, 4),
        allowNull: true,
        validate: {
          min: 0,
        },
      },
      reference: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      reference_type: {
        type: Sequelize.ENUM('manufacturing-order', 'purchase', 'adjustment', 'transfer', 'sale', 'return'),
        allowNull: false,
      },
      from_location: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      to_location: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      processed_by: {
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
      batch_number: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      expiry_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      running_balance: {
        type: Sequelize.DECIMAL(15, 4),
        allowNull: false,
        defaultValue: 0,
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
    await queryInterface.addIndex('stock_movements', ['product_id'], {
      name: 'stock_movements_product_id_idx',
    });

    await queryInterface.addIndex('stock_movements', ['type'], {
      name: 'stock_movements_type_idx',
    });

    await queryInterface.addIndex('stock_movements', ['reference'], {
      name: 'stock_movements_reference_idx',
    });

    await queryInterface.addIndex('stock_movements', ['reference_type'], {
      name: 'stock_movements_reference_type_idx',
    });

    await queryInterface.addIndex('stock_movements', ['timestamp'], {
      name: 'stock_movements_timestamp_idx',
    });

    await queryInterface.addIndex('stock_movements', ['processed_by'], {
      name: 'stock_movements_processed_by_idx',
    });

    await queryInterface.addIndex('stock_movements', ['batch_number'], {
      name: 'stock_movements_batch_number_idx',
    });

    await queryInterface.addIndex('stock_movements', ['expiry_date'], {
      name: 'stock_movements_expiry_date_idx',
    });

    await queryInterface.addIndex('stock_movements', ['created_at'], {
      name: 'stock_movements_created_at_idx',
    });

    await queryInterface.addIndex('stock_movements', ['product_id', 'timestamp'], {
      name: 'stock_movements_product_timestamp_idx',
    });

    await queryInterface.addIndex('stock_movements', ['product_id', 'type'], {
      name: 'stock_movements_product_type_idx',
    });

    await queryInterface.addIndex('stock_movements', ['reference', 'reference_type'], {
      name: 'stock_movements_reference_full_idx',
    });

    await queryInterface.addIndex('stock_movements', ['type', 'timestamp'], {
      name: 'stock_movements_type_timestamp_idx',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('stock_movements');
  },
};
