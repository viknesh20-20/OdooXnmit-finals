'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('units_of_measure', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      symbol: {
        type: Sequelize.STRING(10),
        allowNull: false,
        unique: true,
      },
      type: {
        type: Sequelize.ENUM('length', 'weight', 'volume', 'area', 'time', 'quantity', 'other'),
        allowNull: false,
      },
      conversion_factor: {
        type: Sequelize.DECIMAL(15, 8),
        allowNull: false,
        defaultValue: 1,
      },
      base_unit_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'units_of_measure',
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
    await queryInterface.addIndex('units_of_measure', ['name'], {
      unique: true,
      name: 'units_of_measure_name_unique',
    });

    await queryInterface.addIndex('units_of_measure', ['symbol'], {
      unique: true,
      name: 'units_of_measure_symbol_unique',
    });

    await queryInterface.addIndex('units_of_measure', ['type'], {
      name: 'units_of_measure_type_idx',
    });

    await queryInterface.addIndex('units_of_measure', ['base_unit_id'], {
      name: 'units_of_measure_base_unit_id_idx',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('units_of_measure');
  },
};
