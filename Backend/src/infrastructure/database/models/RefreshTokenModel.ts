import { DataTypes, Model, Sequelize } from 'sequelize';

export interface RefreshTokenAttributes {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  created_at: Date;
  revoked_at?: Date;
  replaced_by?: string;
}

export interface RefreshTokenCreationAttributes extends Omit<RefreshTokenAttributes, 'id' | 'created_at'> {
  id?: string;
}

export class RefreshTokenModel extends Model<RefreshTokenAttributes, RefreshTokenCreationAttributes> implements RefreshTokenAttributes {
  public id!: string;
  public user_id!: string;
  public token_hash!: string;
  public expires_at!: Date;
  public created_at!: Date;
  public revoked_at?: Date;
  public replaced_by?: string;

  // Associations
  public user?: any;

  public static associate(models: any): void {
    RefreshTokenModel.belongsTo(models.UserModel, {
      foreignKey: 'user_id',
      as: 'user',
    });

    RefreshTokenModel.belongsTo(RefreshTokenModel, {
      foreignKey: 'replaced_by',
      as: 'replacedByToken',
    });
  }

  // Instance methods
  public isActive(): boolean {
    return !this.revoked_at && this.expires_at > new Date();
  }

  public isExpired(): boolean {
    return this.expires_at <= new Date();
  }

  public isRevoked(): boolean {
    return !!this.revoked_at;
  }
}

export const initRefreshTokenModel = (sequelize: Sequelize): typeof RefreshTokenModel => {
  RefreshTokenModel.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      token_hash: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      revoked_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      replaced_by: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'refresh_tokens',
          key: 'id',
        },
      },
    },
    {
      sequelize,
      modelName: 'RefreshToken',
      tableName: 'refresh_tokens',
      timestamps: false, // We handle timestamps manually
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ['token_hash'],
        },
        {
          fields: ['user_id'],
        },
        {
          fields: ['expires_at'],
        },
        {
          fields: ['revoked_at'],
        },
        {
          fields: ['user_id', 'revoked_at'],
        },
        {
          fields: ['expires_at', 'revoked_at'],
        },
      ],
    }
  );

  return RefreshTokenModel;
};
