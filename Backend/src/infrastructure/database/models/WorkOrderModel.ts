import { DataTypes, Model, Sequelize } from 'sequelize';

export interface WorkOrderAttributes {
  id: string;
  wo_number: string;
  manufacturing_order_id: string;
  work_center_id: string;
  operation: string;
  operation_type?: string;
  duration: number;
  estimated_duration?: number;
  actual_duration?: number;
  status: string;
  priority: string;
  assigned_to?: string;
  sequence: number;
  start_time?: Date;
  end_time?: Date;
  pause_time: number;
  dependencies: string[];
  instructions?: string;
  comments?: string;
  quality_checks: Record<string, unknown>[];
  time_entries: Record<string, unknown>[];
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface WorkOrderCreationAttributes extends Omit<WorkOrderAttributes, 'id' | 'created_at' | 'updated_at'> {
  id?: string;
}

export class WorkOrderModel extends Model<WorkOrderAttributes, WorkOrderCreationAttributes> implements WorkOrderAttributes {
  public id!: string;
  public wo_number!: string;
  public manufacturing_order_id!: string;
  public work_center_id!: string;
  public operation!: string;
  public operation_type?: string;
  public duration!: number;
  public estimated_duration?: number;
  public actual_duration?: number;
  public status!: string;
  public priority!: string;
  public assigned_to?: string;
  public sequence!: number;
  public start_time?: Date;
  public end_time?: Date;
  public pause_time!: number;
  public dependencies!: string[];
  public instructions?: string;
  public comments?: string;
  public quality_checks!: Record<string, unknown>[];
  public time_entries!: Record<string, unknown>[];
  public metadata!: Record<string, unknown>;
  public created_at!: Date;
  public updated_at!: Date;

  // Associations
  public manufacturingOrder?: any;
  public workCenter?: any;
  public assignee?: any;

  public static associate(models: any): void {
    WorkOrderModel.belongsTo(models.ManufacturingOrderModel, {
      foreignKey: 'manufacturing_order_id',
      as: 'manufacturingOrder',
    });

    WorkOrderModel.belongsTo(models.WorkCenterModel, {
      foreignKey: 'work_center_id',
      as: 'workCenter',
    });

    WorkOrderModel.belongsTo(models.UserModel, {
      foreignKey: 'assigned_to',
      as: 'assignee',
    });
  }
}

export const initWorkOrderModel = (sequelize: Sequelize): typeof WorkOrderModel => {
  WorkOrderModel.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      wo_number: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        validate: {
          len: [1, 50],
        },
      },
      manufacturing_order_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'manufacturing_orders',
          key: 'id',
        },
      },
      work_center_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'work_centers',
          key: 'id',
        },
      },
      operation: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          len: [1, 255],
        },
      },
      operation_type: {
        type: DataTypes.STRING(100),
        allowNull: true,
        validate: {
          len: [1, 100],
        },
      },
      duration: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
        },
      },
      estimated_duration: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
          min: 1,
        },
      },
      actual_duration: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
          min: 0,
        },
      },
      status: {
        type: DataTypes.ENUM('pending', 'in-progress', 'paused', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending',
      },
      priority: {
        type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
        allowNull: false,
        defaultValue: 'medium',
      },
      assigned_to: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      sequence: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
          min: 1,
        },
      },
      start_time: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      end_time: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      pause_time: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
      dependencies: {
        type: DataTypes.ARRAY(DataTypes.UUID),
        allowNull: false,
        defaultValue: [],
      },
      instructions: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      comments: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      quality_checks: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
      },
      time_entries: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
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
      modelName: 'WorkOrder',
      tableName: 'work_orders',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ['wo_number'],
        },
        {
          fields: ['manufacturing_order_id'],
        },
        {
          fields: ['work_center_id'],
        },
        {
          fields: ['status'],
        },
        {
          fields: ['priority'],
        },
        {
          fields: ['assigned_to'],
        },
        {
          fields: ['sequence'],
        },
        {
          fields: ['start_time'],
        },
        {
          fields: ['end_time'],
        },
        {
          fields: ['created_at'],
        },
        {
          fields: ['manufacturing_order_id', 'sequence'],
        },
        {
          fields: ['status', 'priority'],
        },
        {
          fields: ['work_center_id', 'status'],
        },
      ],
    }
  );

  return WorkOrderModel;
};
