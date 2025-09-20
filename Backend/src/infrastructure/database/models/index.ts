import { Sequelize, DataTypes } from 'sequelize';
import { initUserModel, UserModel } from './UserModel';
import { initProductModel, ProductModel } from './ProductModel';
import { initManufacturingOrderModel, ManufacturingOrderModel } from './ManufacturingOrderModel';
import { initRefreshTokenModel, RefreshTokenModel } from './RefreshTokenModel';
import { initBOMModel, BOMModel, initBOMComponentModel, BOMComponentModel, initBOMOperationModel, BOMOperationModel } from './BOMModel';
import { initWorkCenterModel, WorkCenterModel } from './WorkCenterModel';
import { initWorkOrderModel, WorkOrderModel } from './WorkOrderModel';
import { initStockMovementModel, StockMovementModel } from './StockMovementModel';

// Additional supporting models
export interface RoleAttributes {
  id: string;
  name: string;
  description?: string;
  permissions: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface UnitOfMeasureAttributes {
  id: string;
  name: string;
  symbol: string;
  type: string;
  conversion_factor: number;
  base_unit_id?: string;
  created_at: Date;
  updated_at: Date;
}

export interface ProductCategoryAttributes {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
  created_at: Date;
  updated_at: Date;
}

// Simple model definitions for supporting entities
const initSupportingModels = (sequelize: Sequelize) => {
  const RoleModel = sequelize.define('Role', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    permissions: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
  }, {
    tableName: 'roles',
    timestamps: true,
    underscored: true,
  });

  const UnitOfMeasureModel = sequelize.define('UnitOfMeasure', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    symbol: {
      type: DataTypes.STRING(10),
      allowNull: false,
      unique: true,
    },
    type: {
      type: DataTypes.ENUM('length', 'weight', 'volume', 'area', 'time', 'quantity', 'other'),
      allowNull: false,
    },
    conversion_factor: {
      type: DataTypes.DECIMAL(15, 8),
      allowNull: false,
      defaultValue: 1,
    },
    base_unit_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'units_of_measure',
        key: 'id',
      },
    },
  }, {
    tableName: 'units_of_measure',
    timestamps: true,
    underscored: true,
  });

  const ProductCategoryModel = sequelize.define('ProductCategory', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    parent_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'product_categories',
        key: 'id',
      },
    },
  }, {
    tableName: 'product_categories',
    timestamps: true,
    underscored: true,
  });

  return {
    RoleModel,
    UnitOfMeasureModel,
    ProductCategoryModel,
  };
};

export interface DatabaseModels {
  UserModel: typeof UserModel;
  ProductModel: typeof ProductModel;
  ManufacturingOrderModel: typeof ManufacturingOrderModel;
  RefreshTokenModel: typeof RefreshTokenModel;
  BOMModel: typeof BOMModel;
  BOMComponentModel: typeof BOMComponentModel;
  BOMOperationModel: typeof BOMOperationModel;
  WorkCenterModel: typeof WorkCenterModel;
  WorkOrderModel: typeof WorkOrderModel;
  StockMovementModel: typeof StockMovementModel;
  RoleModel: any;
  UnitOfMeasureModel: any;
  ProductCategoryModel: any;
}

export const initializeModels = (sequelize: Sequelize): DatabaseModels => {
  // Initialize main models
  const userModel = initUserModel(sequelize);
  const productModel = initProductModel(sequelize);
  const manufacturingOrderModel = initManufacturingOrderModel(sequelize);
  const refreshTokenModel = initRefreshTokenModel(sequelize);
  const bomModel = initBOMModel(sequelize);
  const bomComponentModel = initBOMComponentModel(sequelize);
  const bomOperationModel = initBOMOperationModel(sequelize);
  const workCenterModel = initWorkCenterModel(sequelize);
  const workOrderModel = initWorkOrderModel(sequelize);
  const stockMovementModel = initStockMovementModel(sequelize);

  // Initialize supporting models
  const supportingModels = initSupportingModels(sequelize);

  const models: DatabaseModels = {
    UserModel: userModel,
    ProductModel: productModel,
    ManufacturingOrderModel: manufacturingOrderModel,
    RefreshTokenModel: refreshTokenModel,
    BOMModel: bomModel,
    BOMComponentModel: bomComponentModel,
    BOMOperationModel: bomOperationModel,
    WorkCenterModel: workCenterModel,
    WorkOrderModel: workOrderModel,
    StockMovementModel: stockMovementModel,
    ...supportingModels,
  };

  // Set up associations
  Object.values(models).forEach((model: any) => {
    if (model.associate) {
      model.associate(models);
    }
  });

  // Set up additional associations for supporting models
  const { RoleModel, UnitOfMeasureModel, ProductCategoryModel } = supportingModels;

  // UnitOfMeasure self-reference
  UnitOfMeasureModel.belongsTo(UnitOfMeasureModel, {
    foreignKey: 'base_unit_id',
    as: 'baseUnit',
  });

  UnitOfMeasureModel.hasMany(UnitOfMeasureModel, {
    foreignKey: 'base_unit_id',
    as: 'derivedUnits',
  });

  // ProductCategory self-reference
  ProductCategoryModel.belongsTo(ProductCategoryModel, {
    foreignKey: 'parent_id',
    as: 'parent',
  });

  ProductCategoryModel.hasMany(ProductCategoryModel, {
    foreignKey: 'parent_id',
    as: 'children',
  });

  return models;
};

export {
  UserModel,
  ProductModel,
  ManufacturingOrderModel,
  RefreshTokenModel,
  BOMModel,
  BOMComponentModel,
  BOMOperationModel,
  WorkCenterModel,
  WorkOrderModel,
  StockMovementModel,
};
