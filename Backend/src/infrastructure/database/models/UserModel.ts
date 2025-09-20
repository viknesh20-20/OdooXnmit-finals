import { DataTypes, Model, Sequelize } from 'sequelize';

export interface UserAttributes {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  phone?: string;
  status: string;
  role_id?: string;
  email_verified: boolean;
  email_verification_token?: string;
  email_verification_expires?: Date;
  password_reset_token?: string;
  password_reset_expires?: Date;
  last_login?: Date;
  failed_login_attempts: number;
  locked_until?: Date;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface UserCreationAttributes extends Omit<UserAttributes, 'id' | 'created_at' | 'updated_at'> {
  id?: string;
}

export class UserModel extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: string;
  public username!: string;
  public email!: string;
  public password_hash!: string;
  public first_name!: string;
  public last_name!: string;
  public phone?: string;
  public status!: string;
  public role_id?: string;
  public email_verified!: boolean;
  public email_verification_token?: string;
  public email_verification_expires?: Date;
  public password_reset_token?: string;
  public password_reset_expires?: Date;
  public last_login?: Date;
  public failed_login_attempts!: number;
  public locked_until?: Date;
  public metadata!: Record<string, unknown>;
  public created_at!: Date;
  public updated_at!: Date;

  // Associations
  public role?: any;
  public refreshTokens?: any[];
  public manufacturingOrders?: any[];

  public static associate(models: any): void {
    UserModel.belongsTo(models.RoleModel, {
      foreignKey: 'role_id',
      as: 'role',
    });

    UserModel.hasMany(models.RefreshTokenModel, {
      foreignKey: 'user_id',
      as: 'refreshTokens',
    });

    UserModel.hasMany(models.ManufacturingOrderModel, {
      foreignKey: 'created_by',
      as: 'createdManufacturingOrders',
    });

    UserModel.hasMany(models.ManufacturingOrderModel, {
      foreignKey: 'assigned_to',
      as: 'assignedManufacturingOrders',
    });
  }
}

export const initUserModel = (sequelize: Sequelize): typeof UserModel => {
  UserModel.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      username: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        validate: {
          len: [3, 50],
          isAlphanumeric: true,
        },
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      password_hash: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      first_name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
          len: [1, 50],
        },
      },
      last_name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
          len: [1, 50],
        },
      },
      phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
        validate: {
          is: {
            args: /^\+?[\d\s\-\(\)]+$/,
            msg: 'Phone number must be in valid format'
          }
        },
        set(value: string | null) {
          // Convert empty string to null to avoid validation on empty values
          this.setDataValue('phone', value === '' ? null : value);
        }
      },
      status: {
        type: DataTypes.ENUM('active', 'inactive', 'suspended'),
        allowNull: false,
        defaultValue: 'active',
      },
      role_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'roles',
          key: 'id',
        },
      },
      email_verified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      email_verification_token: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      email_verification_expires: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      password_reset_token: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      password_reset_expires: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      last_login: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      failed_login_attempts: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
      locked_until: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'users',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ['username'],
        },
        {
          unique: true,
          fields: ['email'],
        },
        {
          fields: ['status'],
        },
        {
          fields: ['role_id'],
        },
        {
          fields: ['email_verification_token'],
        },
        {
          fields: ['password_reset_token'],
        },
        {
          fields: ['created_at'],
        },
      ],
    }
  );

  return UserModel;
};
