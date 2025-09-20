'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('products', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      sku: {
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
      category_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'product_categories',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      uom_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'units_of_measure',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      type: {
        type: Sequelize.ENUM('raw_material', 'work_in_progress', 'finished_good', 'consumable', 'service'),
        allowNull: false,
        defaultValue: 'raw_material',
      },
      cost_price: {
        type: Sequelize.DECIMAL(15, 4),
        allowNull: false,
        defaultValue: 0,
      },
      selling_price: {
        type: Sequelize.DECIMAL(15, 4),
        allowNull: false,
        defaultValue: 0,
      },
      min_stock_level: {
        type: Sequelize.DECIMAL(15, 4),
        allowNull: false,
        defaultValue: 0,
      },
      max_stock_level: {
        type: Sequelize.DECIMAL(15, 4),
        allowNull: false,
        defaultValue: 0,
      },
      reorder_point: {
        type: Sequelize.DECIMAL(15, 4),
        allowNull: false,
        defaultValue: 0,
      },
      lead_time_days: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      specifications: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      attachments: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: false,
        defaultValue: [],
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
    await queryInterface.addIndex('products', ['sku'], {
      unique: true,
      name: 'products_sku_unique',
    });

    await queryInterface.addIndex('products', ['name'], {
      name: 'products_name_idx',
    });

    await queryInterface.addIndex('products', ['type'], {
      name: 'products_type_idx',
    });

    await queryInterface.addIndex('products', ['category_id'], {
      name: 'products_category_id_idx',
    });

    await queryInterface.addIndex('products', ['uom_id'], {
      name: 'products_uom_id_idx',
    });

    await queryInterface.addIndex('products', ['is_active'], {
      name: 'products_is_active_idx',
    });

    await queryInterface.addIndex('products', ['cost_price'], {
      name: 'products_cost_price_idx',
    });

    await queryInterface.addIndex('products', ['selling_price'], {
      name: 'products_selling_price_idx',
    });

    await queryInterface.addIndex('products', ['created_at'], {
      name: 'products_created_at_idx',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('products');
  },
};
