import { DataTypes, Model, Sequelize } from 'sequelize';

export interface WorkCenterAttributes {
  id: string;
  code: string;
  name: string;
  description?: string;
  cost_per_hour: number;
  capacity: number;
  efficiency: number;
  status: string;
  utilization: number;
  location?: string;
  availability: number;
  maintenance_schedule?: string;
  next_maintenance?: Date;
  operator_ids: string[];
  capabilities: string[];
  working_hours: Record<string, unknown>;
  oee_score?: number;
  downtime_hours: number;
  productive_hours: number;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface WorkCenterCreationAttributes extends Omit<WorkCenterAttributes, 'id' | 'created_at' | 'updated_at'> {
  id?: string;
}

export class WorkCenterModel extends Model<WorkCenterAttributes, WorkCenterCreationAttributes> implements WorkCenterAttributes {
  public id!: string;
  public code!: string;
  public name!: string;
  public description?: string;
  public cost_per_hour!: number;
  public capacity!: number;
  public efficiency!: number;
  public status!: string;
  public utilization!: number;
  public location?: string;
  public availability!: number;
  public maintenance_schedule?: string;
  public next_maintenance?: Date;
  public operator_ids!: string[];
  public capabilities!: string[];
  public working_hours!: Record<string, unknown>;
  public oee_score?: number;
  public downtime_hours!: number;
  public productive_hours!: number;
  public metadata!: Record<string, unknown>;
  public created_at!: Date;
  public updated_at!: Date;

  // Associations
  public operators?: any[];
  public workOrders?: any[];
  public bomOperations?: any[];

  public static associate(models: any): void {
    // Many-to-many relationship with users (operators)
    WorkCenterModel.belongsToMany(models.UserModel, {
      through: 'work_center_operators',
      foreignKey: 'work_center_id',
      otherKey: 'user_id',
      as: 'operators',
    });

    WorkCenterModel.hasMany(models.WorkOrderModel, {
      foreignKey: 'work_center_id',
      as: 'workOrders',
    });

    WorkCenterModel.hasMany(models.BOMOperationModel, {
      foreignKey: 'work_center_id',
      as: 'bomOperations',
    });
  }
}

export const initWorkCenterModel = (sequelize: Sequelize): typeof WorkCenterModel => {
  WorkCenterModel.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        validate: {
          len: [1, 50],
        },
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          len: [1, 255],
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      cost_per_hour: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
        validate: {
          min: 0,
        },
      },
      capacity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
          min: 1,
        },
      },
      efficiency: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 100.00,
        validate: {
          min: 0,
          max: 100,
        },
      },
      status: {
        type: DataTypes.ENUM('active', 'maintenance', 'inactive'),
        allowNull: false,
        defaultValue: 'active',
      },
      utilization: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0.00,
        validate: {
          min: 0,
          max: 100,
        },
      },
      location: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      availability: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 100.00,
        validate: {
          min: 0,
          max: 100,
        },
      },
      maintenance_schedule: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      next_maintenance: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      operator_ids: {
        type: DataTypes.ARRAY(DataTypes.UUID),
        allowNull: false,
        defaultValue: [],
      },
      capabilities: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
        defaultValue: [],
      },
      working_hours: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {
          monday: { start: '08:00', end: '17:00', isWorking: true },
          tuesday: { start: '08:00', end: '17:00', isWorking: true },
          wednesday: { start: '08:00', end: '17:00', isWorking: true },
          thursday: { start: '08:00', end: '17:00', isWorking: true },
          friday: { start: '08:00', end: '17:00', isWorking: true },
          saturday: { start: '08:00', end: '12:00', isWorking: false },
          sunday: { start: '08:00', end: '12:00', isWorking: false },
        },
      },
      oee_score: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        validate: {
          min: 0,
          max: 100,
        },
      },
      downtime_hours: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: false,
        defaultValue: 0.00,
        validate: {
          min: 0,
        },
      },
      productive_hours: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: false,
        defaultValue: 0.00,
        validate: {
          min: 0,
        },
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
      modelName: 'WorkCenter',
      tableName: 'work_centers',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ['code'],
        },
        {
          fields: ['name'],
        },
        {
          fields: ['status'],
        },
        {
          fields: ['location'],
        },
        {
          fields: ['utilization'],
        },
        {
          fields: ['efficiency'],
        },
        {
          fields: ['created_at'],
        },
        {
          fields: ['status', 'utilization'],
        },
      ],
    }
  );

  return WorkCenterModel;
};
