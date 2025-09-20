'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('refresh_tokens', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      token_hash: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      revoked_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      replaced_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'refresh_tokens',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
    });

    // Add indexes
    await queryInterface.addIndex('refresh_tokens', ['token_hash'], {
      unique: true,
      name: 'refresh_tokens_token_hash_unique',
    });

    await queryInterface.addIndex('refresh_tokens', ['user_id'], {
      name: 'refresh_tokens_user_id_idx',
    });

    await queryInterface.addIndex('refresh_tokens', ['expires_at'], {
      name: 'refresh_tokens_expires_at_idx',
    });

    await queryInterface.addIndex('refresh_tokens', ['revoked_at'], {
      name: 'refresh_tokens_revoked_at_idx',
    });

    await queryInterface.addIndex('refresh_tokens', ['user_id', 'revoked_at'], {
      name: 'refresh_tokens_user_revoked_idx',
    });

    await queryInterface.addIndex('refresh_tokens', ['expires_at', 'revoked_at'], {
      name: 'refresh_tokens_expires_revoked_idx',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('refresh_tokens');
  },
};
