'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('boms', {
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
        onDelete: 'CASCADE',
      },
      version: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      is_default: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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
      approved_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      approved_at: {
        type: Sequelize.DATE,
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
    await queryInterface.addIndex('boms', ['product_id', 'version'], {
      unique: true,
      name: 'boms_product_version_unique',
    });

    await queryInterface.addIndex('boms', ['product_id'], {
      name: 'boms_product_id_idx',
    });

    await queryInterface.addIndex('boms', ['is_active'], {
      name: 'boms_is_active_idx',
    });

    await queryInterface.addIndex('boms', ['is_default'], {
      name: 'boms_is_default_idx',
    });

    await queryInterface.addIndex('boms', ['created_by'], {
      name: 'boms_created_by_idx',
    });

    await queryInterface.addIndex('boms', ['approved_by'], {
      name: 'boms_approved_by_idx',
    });

    await queryInterface.addIndex('boms', ['created_at'], {
      name: 'boms_created_at_idx',
    });

    await queryInterface.addIndex('boms', ['product_id', 'is_active', 'is_default'], {
      name: 'boms_product_active_default_idx',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('boms');
  },
};
