import { DataTypes, Model, Sequelize } from 'sequelize';

export interface BOMAttributes {
  id: string;
  product_id: string;
  version: string;
  name: string;
  description?: string;
  is_active: boolean;
  is_default: boolean;
  created_by: string;
  approved_by?: string;
  approved_at?: Date;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface BOMCreationAttributes extends Omit<BOMAttributes, 'id' | 'created_at' | 'updated_at'> {
  id?: string;
}

export class BOMModel extends Model<BOMAttributes, BOMCreationAttributes> implements BOMAttributes {
  public id!: string;
  public product_id!: string;
  public version!: string;
  public name!: string;
  public description?: string;
  public is_active!: boolean;
  public is_default!: boolean;
  public created_by!: string;
  public approved_by?: string;
  public approved_at?: Date;
  public metadata!: Record<string, unknown>;
  public created_at!: Date;
  public updated_at!: Date;

  // Associations
  public product?: any;
  public creator?: any;
  public approver?: any;
  public components?: any[];
  public operations?: any[];
  public manufacturingOrders?: any[];

  public static associate(models: any): void {
    BOMModel.belongsTo(models.ProductModel, {
      foreignKey: 'product_id',
      as: 'product',
    });

    BOMModel.belongsTo(models.UserModel, {
      foreignKey: 'created_by',
      as: 'creator',
    });

    BOMModel.belongsTo(models.UserModel, {
      foreignKey: 'approved_by',
      as: 'approver',
    });

    BOMModel.hasMany(models.BOMComponentModel, {
      foreignKey: 'bom_id',
      as: 'components',
    });

    BOMModel.hasMany(models.BOMOperationModel, {
      foreignKey: 'bom_id',
      as: 'operations',
    });

    BOMModel.hasMany(models.ManufacturingOrderModel, {
      foreignKey: 'bom_id',
      as: 'manufacturingOrders',
    });
  }
}

export const initBOMModel = (sequelize: Sequelize): typeof BOMModel => {
  BOMModel.init(
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
      version: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
          len: [1, 20],
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
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      is_default: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      created_by: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      approved_by: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      approved_at: {
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
      modelName: 'BOM',
      tableName: 'boms',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ['product_id', 'version'],
        },
        {
          fields: ['product_id'],
        },
        {
          fields: ['is_active'],
        },
        {
          fields: ['is_default'],
        },
        {
          fields: ['created_by'],
        },
        {
          fields: ['approved_by'],
        },
        {
          fields: ['created_at'],
        },
        {
          fields: ['product_id', 'is_active', 'is_default'],
        },
      ],
    }
  );

  return BOMModel;
};

// BOM Component Model
export interface BOMComponentAttributes {
  id: string;
  bom_id: string;
  component_id: string;
  quantity: number;
  unit: string;
  scrap_factor: number;
  sequence_number: number;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface BOMComponentCreationAttributes extends Omit<BOMComponentAttributes, 'id' | 'created_at' | 'updated_at'> {
  id?: string;
}

export class BOMComponentModel extends Model<BOMComponentAttributes, BOMComponentCreationAttributes> implements BOMComponentAttributes {
  public id!: string;
  public bom_id!: string;
  public component_id!: string;
  public quantity!: number;
  public unit!: string;
  public scrap_factor!: number;
  public sequence_number!: number;
  public notes?: string;
  public created_at!: Date;
  public updated_at!: Date;

  // Associations
  public bom?: any;
  public component?: any;

  public static associate(models: any): void {
    BOMComponentModel.belongsTo(models.BOMModel, {
      foreignKey: 'bom_id',
      as: 'bom',
    });

    BOMComponentModel.belongsTo(models.ProductModel, {
      foreignKey: 'component_id',
      as: 'component',
    });
  }
}

export const initBOMComponentModel = (sequelize: Sequelize): typeof BOMComponentModel => {
  BOMComponentModel.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      bom_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'boms',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      component_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'products',
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
      unit: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
          len: [1, 20],
        },
      },
      scrap_factor: {
        type: DataTypes.DECIMAL(5, 4),
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
          max: 1,
        },
      },
      sequence_number: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
        },
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
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
      modelName: 'BOMComponent',
      tableName: 'bom_components',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ['bom_id', 'component_id'],
        },
        {
          fields: ['bom_id'],
        },
        {
          fields: ['component_id'],
        },
        {
          fields: ['sequence_number'],
        },
        {
          fields: ['bom_id', 'sequence_number'],
        },
      ],
    }
  );

  return BOMComponentModel;
};

// BOM Operation Model
export interface BOMOperationAttributes {
  id: string;
  bom_id: string;
  operation: string;
  operation_type?: string;
  work_center_id?: string;
  duration: number;
  setup_time: number;
  teardown_time: number;
  cost_per_hour: number;
  total_cost: number;
  sequence: number;
  description?: string;
  instructions?: string;
  quality_requirements: Record<string, unknown>[];
  tools_required: string[];
  skills_required: string[];
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface BOMOperationCreationAttributes extends Omit<BOMOperationAttributes, 'id' | 'created_at' | 'updated_at'> {
  id?: string;
}

export class BOMOperationModel extends Model<BOMOperationAttributes, BOMOperationCreationAttributes> implements BOMOperationAttributes {
  public id!: string;
  public bom_id!: string;
  public operation!: string;
  public operation_type?: string;
  public work_center_id?: string;
  public duration!: number;
  public setup_time!: number;
  public teardown_time!: number;
  public cost_per_hour!: number;
  public total_cost!: number;
  public sequence!: number;
  public description?: string;
  public instructions?: string;
  public quality_requirements!: Record<string, unknown>[];
  public tools_required!: string[];
  public skills_required!: string[];
  public metadata!: Record<string, unknown>;
  public created_at!: Date;
  public updated_at!: Date;

  // Associations
  public bom?: any;
  public workCenter?: any;

  public static associate(models: any): void {
    BOMOperationModel.belongsTo(models.BOMModel, {
      foreignKey: 'bom_id',
      as: 'bom',
    });

    BOMOperationModel.belongsTo(models.WorkCenterModel, {
      foreignKey: 'work_center_id',
      as: 'workCenter',
    });
  }
}

export const initBOMOperationModel = (sequelize: Sequelize): typeof BOMOperationModel => {
  BOMOperationModel.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      bom_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'boms',
          key: 'id',
        },
        onDelete: 'CASCADE',
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
      work_center_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'work_centers',
          key: 'id',
        },
      },
      duration: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
        },
      },
      setup_time: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
      teardown_time: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
      cost_per_hour: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
        validate: {
          min: 0,
        },
      },
      total_cost: {
        type: DataTypes.DECIMAL(15, 4),
        allowNull: false,
        defaultValue: 0.00,
        validate: {
          min: 0,
        },
      },
      sequence: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      instructions: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      quality_requirements: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
      },
      tools_required: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
        defaultValue: [],
      },
      skills_required: {
        type: DataTypes.ARRAY(DataTypes.STRING),
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
      modelName: 'BOMOperation',
      tableName: 'bom_operations',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          fields: ['bom_id'],
        },
        {
          fields: ['work_center_id'],
        },
        {
          fields: ['sequence'],
        },
        {
          fields: ['operation'],
        },
        {
          fields: ['operation_type'],
        },
        {
          fields: ['created_at'],
        },
        {
          unique: true,
          fields: ['bom_id', 'sequence'],
        },
        {
          fields: ['work_center_id', 'operation'],
        },
      ],
    }
  );

  return BOMOperationModel;
};
