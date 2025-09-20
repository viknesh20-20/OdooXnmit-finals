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
