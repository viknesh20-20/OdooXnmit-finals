import { DataTypes, Model, Sequelize } from 'sequelize';

export interface ManufacturingOrderAttributes {
  id: string;
  mo_number: string;
  product_id: string;
  bom_id: string;
  quantity: number;
  quantity_unit: string;
  status: string;
  priority: string;
  planned_start_date?: Date;
  planned_end_date?: Date;
  actual_start_date?: Date;
  actual_end_date?: Date;
  created_by: string;
  assigned_to?: string;
  notes?: string;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface ManufacturingOrderCreationAttributes extends Omit<ManufacturingOrderAttributes, 'id' | 'created_at' | 'updated_at'> {
  id?: string;
}

export class ManufacturingOrderModel extends Model<ManufacturingOrderAttributes, ManufacturingOrderCreationAttributes> implements ManufacturingOrderAttributes {
  public id!: string;
  public mo_number!: string;
  public product_id!: string;
  public bom_id!: string;
  public quantity!: number;
  public quantity_unit!: string;
  public status!: string;
  public priority!: string;
  public planned_start_date?: Date;
  public planned_end_date?: Date;
  public actual_start_date?: Date;
  public actual_end_date?: Date;
  public created_by!: string;
  public assigned_to?: string;
  public notes?: string;
  public metadata!: Record<string, unknown>;
  public created_at!: Date;
  public updated_at!: Date;

  // Associations
  public product?: any;
  public bom?: any;
  public creator?: any;
  public assignee?: any;
  public workOrders?: any[];
  public materialReservations?: any[];

  public static associate(models: any): void {
    ManufacturingOrderModel.belongsTo(models.ProductModel, {
      foreignKey: 'product_id',
      as: 'product',
    });

    ManufacturingOrderModel.belongsTo(models.BOMModel, {
      foreignKey: 'bom_id',
      as: 'bom',
    });

    ManufacturingOrderModel.belongsTo(models.UserModel, {
      foreignKey: 'created_by',
      as: 'creator',
    });

    ManufacturingOrderModel.belongsTo(models.UserModel, {
      foreignKey: 'assigned_to',
      as: 'assignee',
    });

    ManufacturingOrderModel.hasMany(models.WorkOrderModel, {
      foreignKey: 'manufacturing_order_id',
      as: 'workOrders',
    });

    // Note: MaterialReservationModel will be added later
    // ManufacturingOrderModel.hasMany(models.MaterialReservationModel, {
    //   foreignKey: 'manufacturing_order_id',
    //   as: 'materialReservations',
    // });
  }
}

export const initManufacturingOrderModel = (sequelize: Sequelize): typeof ManufacturingOrderModel => {
  ManufacturingOrderModel.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      mo_number: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        validate: {
          len: [1, 50],
        },
      },
      product_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'products',
          key: 'id',
        },
      },
      bom_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'boms',
          key: 'id',
        },
      },
      quantity: {
        type: DataTypes.DECIMAL(15, 4),
        allowNull: false,
        validate: {
          min: 0.0001,
        },
      },
      quantity_unit: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
          len: [1, 20],
        },
      },
      status: {
        type: DataTypes.ENUM('draft', 'planned', 'released', 'in_progress', 'paused', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'draft',
      },
      priority: {
        type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
        allowNull: false,
        defaultValue: 'medium',
      },
      planned_start_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      planned_end_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      actual_start_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      actual_end_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      created_by: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      assigned_to: {
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
      modelName: 'ManufacturingOrder',
      tableName: 'manufacturing_orders',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ['mo_number'],
        },
        {
          fields: ['product_id'],
        },
        {
          fields: ['bom_id'],
        },
        {
          fields: ['status'],
        },
        {
          fields: ['priority'],
        },
        {
          fields: ['created_by'],
        },
        {
          fields: ['assigned_to'],
        },
        {
          fields: ['planned_start_date'],
        },
        {
          fields: ['planned_end_date'],
        },
        {
          fields: ['created_at'],
        },
        {
          fields: ['status', 'priority'],
        },
        {
          fields: ['product_id', 'status'],
        },
      ],
    }
  );

  return ManufacturingOrderModel;
};
