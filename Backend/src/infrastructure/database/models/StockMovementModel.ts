import { DataTypes, Model, Sequelize } from 'sequelize';

export interface StockMovementAttributes {
  id: string;
  product_id: string;
  type: string;
  quantity: number;
  unit: string;
  unit_cost?: number;
  total_value?: number;
  reference: string;
  reference_type: string;
  from_location?: string;
  to_location?: string;
  timestamp: Date;
  processed_by?: string;
  notes?: string;
  batch_number?: string;
  expiry_date?: Date;
  running_balance: number;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface StockMovementCreationAttributes extends Omit<StockMovementAttributes, 'id' | 'created_at' | 'updated_at'> {
  id?: string;
}

export class StockMovementModel extends Model<StockMovementAttributes, StockMovementCreationAttributes> implements StockMovementAttributes {
  public id!: string;
  public product_id!: string;
  public type!: string;
  public quantity!: number;
  public unit!: string;
  public unit_cost?: number;
  public total_value?: number;
  public reference!: string;
  public reference_type!: string;
  public from_location?: string;
  public to_location?: string;
  public timestamp!: Date;
  public processed_by?: string;
  public notes?: string;
  public batch_number?: string;
  public expiry_date?: Date;
  public running_balance!: number;
  public metadata!: Record<string, unknown>;
  public created_at!: Date;
  public updated_at!: Date;

  // Associations
  public product?: any;
  public processor?: any;

  public static associate(models: any): void {
    StockMovementModel.belongsTo(models.ProductModel, {
      foreignKey: 'product_id',
      as: 'product',
    });

    StockMovementModel.belongsTo(models.UserModel, {
      foreignKey: 'processed_by',
      as: 'processor',
    });
  }
}

export const initStockMovementModel = (sequelize: Sequelize): typeof StockMovementModel => {
  StockMovementModel.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      product_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'products',
          key: 'id',
        },
      },
      type: {
        type: DataTypes.ENUM('in', 'out', 'transfer', 'adjustment'),
        allowNull: false,
      },
      quantity: {
        type: DataTypes.DECIMAL(15, 4),
        allowNull: false,
        validate: {
          min: 0.0001,
        },
      },
      unit: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
          len: [1, 20],
        },
      },
      unit_cost: {
        type: DataTypes.DECIMAL(15, 4),
        allowNull: true,
        validate: {
          min: 0,
        },
      },
      total_value: {
        type: DataTypes.DECIMAL(15, 4),
        allowNull: true,
        validate: {
          min: 0,
        },
      },
      reference: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          len: [1, 100],
        },
      },
      reference_type: {
        type: DataTypes.ENUM('manufacturing-order', 'purchase', 'adjustment', 'transfer', 'sale', 'return'),
        allowNull: false,
      },
      from_location: {
        type: DataTypes.STRING(255),
        allowNull: true,
        validate: {
          len: [1, 255],
        },
      },
      to_location: {
        type: DataTypes.STRING(255),
        allowNull: true,
        validate: {
          len: [1, 255],
        },
      },
      timestamp: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      processed_by: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      batch_number: {
        type: DataTypes.STRING(100),
        allowNull: true,
        validate: {
          len: [1, 100],
        },
      },
      expiry_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      running_balance: {
        type: DataTypes.DECIMAL(15, 4),
        allowNull: false,
        defaultValue: 0,
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
      modelName: 'StockMovement',
      tableName: 'stock_movements',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          fields: ['product_id'],
        },
        {
          fields: ['type'],
        },
        {
          fields: ['reference'],
        },
        {
          fields: ['reference_type'],
        },
        {
          fields: ['timestamp'],
        },
        {
          fields: ['processed_by'],
        },
        {
          fields: ['batch_number'],
        },
        {
          fields: ['expiry_date'],
        },
        {
          fields: ['created_at'],
        },
        {
          fields: ['product_id', 'timestamp'],
        },
        {
          fields: ['product_id', 'type'],
        },
        {
          fields: ['reference', 'reference_type'],
        },
        {
          fields: ['type', 'timestamp'],
        },
      ],
    }
  );

  return StockMovementModel;
};
