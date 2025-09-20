'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('product_categories', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      parent_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'product_categories',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
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
    await queryInterface.addIndex('product_categories', ['name'], {
      name: 'product_categories_name_idx',
    });

    await queryInterface.addIndex('product_categories', ['parent_id'], {
      name: 'product_categories_parent_id_idx',
    });

    await queryInterface.addIndex('product_categories', ['created_at'], {
      name: 'product_categories_created_at_idx',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('product_categories');
  },
};
