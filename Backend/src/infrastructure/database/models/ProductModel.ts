import { DataTypes, Model, Sequelize } from 'sequelize';

export interface ProductAttributes {
  id: string;
  sku: string;
  name: string;
  description?: string;
  category_id?: string;
  uom_id: string;
  type: string;
  cost_price: number;
  selling_price: number;
  min_stock_level: number;
  max_stock_level: number;
  reorder_point: number;
  lead_time_days: number;
  is_active: boolean;
  specifications: Record<string, unknown>;
  attachments: string[];
  created_at: Date;
  updated_at: Date;
}

export interface ProductCreationAttributes extends Omit<ProductAttributes, 'id' | 'created_at' | 'updated_at'> {
  id?: string;
}

export class ProductModel extends Model<ProductAttributes, ProductCreationAttributes> implements ProductAttributes {
  public id!: string;
  public sku!: string;
  public name!: string;
  public description?: string;
  public category_id?: string;
  public uom_id!: string;
  public type!: string;
  public cost_price!: number;
  public selling_price!: number;
  public min_stock_level!: number;
  public max_stock_level!: number;
  public reorder_point!: number;
  public lead_time_days!: number;
  public is_active!: boolean;
  public specifications!: Record<string, unknown>;
  public attachments!: string[];
  public created_at!: Date;
  public updated_at!: Date;

  // Associations
  public category?: any;
  public unitOfMeasure?: any;
  public manufacturingOrders?: any[];
  public bomComponents?: any[];
  public stockLedgerEntries?: any[];

  public static associate(models: any): void {
    ProductModel.belongsTo(models.ProductCategoryModel, {
      foreignKey: 'category_id',
      as: 'category',
    });

    ProductModel.belongsTo(models.UnitOfMeasureModel, {
      foreignKey: 'uom_id',
      as: 'unitOfMeasure',
    });

    ProductModel.hasMany(models.ManufacturingOrderModel, {
      foreignKey: 'product_id',
      as: 'manufacturingOrders',
    });

    ProductModel.hasMany(models.BOMComponentModel, {
      foreignKey: 'component_id',
      as: 'bomComponents',
    });

    ProductModel.hasMany(models.StockLedgerModel, {
      foreignKey: 'product_id',
      as: 'stockLedgerEntries',
    });

    ProductModel.hasMany(models.BOMModel, {
      foreignKey: 'product_id',
      as: 'boms',
    });
  }
}

export const initProductModel = (sequelize: Sequelize): typeof ProductModel => {
  ProductModel.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      sku: {
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
      category_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'product_categories',
          key: 'id',
        },
      },
      uom_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'units_of_measure',
          key: 'id',
        },
      },
      type: {
        type: DataTypes.ENUM('raw_material', 'work_in_progress', 'finished_good', 'consumable', 'service'),
        allowNull: false,
        defaultValue: 'raw_material',
      },
      cost_price: {
        type: DataTypes.DECIMAL(15, 4),
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
      selling_price: {
        type: DataTypes.DECIMAL(15, 4),
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
      min_stock_level: {
        type: DataTypes.DECIMAL(15, 4),
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
      max_stock_level: {
        type: DataTypes.DECIMAL(15, 4),
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
      reorder_point: {
        type: DataTypes.DECIMAL(15, 4),
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
      lead_time_days: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      specifications: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      attachments: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
        defaultValue: [],
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
      modelName: 'Product',
      tableName: 'products',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ['sku'],
        },
        {
          fields: ['name'],
        },
        {
          fields: ['type'],
        },
        {
          fields: ['category_id'],
        },
        {
          fields: ['uom_id'],
        },
        {
          fields: ['is_active'],
        },
        {
          fields: ['cost_price'],
        },
        {
          fields: ['selling_price'],
        },
        {
          fields: ['created_at'],
        },
      ],
    }
  );

  return ProductModel;
};
