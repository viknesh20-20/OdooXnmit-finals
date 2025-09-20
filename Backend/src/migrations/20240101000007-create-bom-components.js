'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('bom_components', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      bom_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'boms',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      component_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'products',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
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
      scrap_factor: {
        type: Sequelize.DECIMAL(5, 4),
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
          max: 1,
        },
      },
      sequence_number: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
        },
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
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
    await queryInterface.addIndex('bom_components', ['bom_id', 'component_id'], {
      unique: true,
      name: 'bom_components_bom_component_unique',
    });

    await queryInterface.addIndex('bom_components', ['bom_id'], {
      name: 'bom_components_bom_id_idx',
    });

    await queryInterface.addIndex('bom_components', ['component_id'], {
      name: 'bom_components_component_id_idx',
    });

    await queryInterface.addIndex('bom_components', ['sequence_number'], {
      name: 'bom_components_sequence_number_idx',
    });

    await queryInterface.addIndex('bom_components', ['bom_id', 'sequence_number'], {
      name: 'bom_components_bom_sequence_idx',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('bom_components');
  },
};
