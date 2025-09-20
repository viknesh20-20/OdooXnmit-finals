'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('bom_operations', {
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
      operation: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      operation_type: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      work_center_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'work_centers',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      duration: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
        },
      },
      setup_time: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
      teardown_time: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
      cost_per_hour: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
        validate: {
          min: 0,
        },
      },
      total_cost: {
        type: Sequelize.DECIMAL(15, 4),
        allowNull: false,
        defaultValue: 0.00,
        validate: {
          min: 0,
        },
      },
      sequence: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
        },
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      instructions: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      quality_requirements: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: [],
      },
      tools_required: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: false,
        defaultValue: [],
      },
      skills_required: {
        type: Sequelize.ARRAY(Sequelize.STRING),
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
    await queryInterface.addIndex('bom_operations', ['bom_id'], {
      name: 'bom_operations_bom_id_idx',
    });

    await queryInterface.addIndex('bom_operations', ['work_center_id'], {
      name: 'bom_operations_work_center_id_idx',
    });

    await queryInterface.addIndex('bom_operations', ['sequence'], {
      name: 'bom_operations_sequence_idx',
    });

    await queryInterface.addIndex('bom_operations', ['operation'], {
      name: 'bom_operations_operation_idx',
    });

    await queryInterface.addIndex('bom_operations', ['operation_type'], {
      name: 'bom_operations_operation_type_idx',
    });

    await queryInterface.addIndex('bom_operations', ['created_at'], {
      name: 'bom_operations_created_at_idx',
    });

    await queryInterface.addIndex('bom_operations', ['bom_id', 'sequence'], {
      unique: true,
      name: 'bom_operations_bom_sequence_unique',
    });

    await queryInterface.addIndex('bom_operations', ['work_center_id', 'operation'], {
      name: 'bom_operations_wc_operation_idx',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('bom_operations');
  },
};
