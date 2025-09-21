import { Request, Response } from 'express';
import { AuthenticatedRequest } from '@presentation/middleware/AuthMiddleware';
import { UserModel } from '@infrastructure/database/models/UserModel';
import { ManufacturingOrderModel } from '@infrastructure/database/models/ManufacturingOrderModel';
import { ProductModel } from '@infrastructure/database/models/ProductModel';
import { WorkOrderModel } from '@infrastructure/database/models/WorkOrderModel';
import { WorkCenterModel } from '@infrastructure/database/models/WorkCenterModel';

export interface DashboardData {
  user: {
    id: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    fullName: string;
    role?: {
      id: string;
      name: string;
      permissions: string[];
    };
  };
  summary: {
    manufacturingOrders: {
      total: number;
      completed: number;
      inProgress: number;
      planned: number;
      delayed: number;
    };
    workOrders: {
      total: number;
      active: number;
      pending: number;
      completed: number;
    };
    workCenters: {
      total: number;
      active: number;
      maintenance: number;
      utilization: number;
    };
    products: {
      total: number;
      lowStock: number;
      outOfStock: number;
    };
    stockMovements: {
      recent: Array<{
        id: string;
        productName: string;
        type: 'in' | 'out';
        quantity: number;
        timestamp: string;
        reference?: string;
      }>;
    };
  };
  recentActivity: {
    manufacturingOrders: Array<{
      id: string;
      productName: string;
      quantity: number;
      status: string;
      dueDate: string;
      createdAt: string;
    }>;
    workOrders: Array<{
      id: string;
      operation: string;
      workCenter: string;
      status: string;
      assignee?: string;
    }>;
  };
  alerts: Array<{
    type: 'warning' | 'error' | 'info';
    message: string;
    count?: number;
    action?: string;
  }>;
}

export class DashboardController {
  constructor() {}

  async getDashboardData(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      console.log('Fetching dashboard data for user:', userId);

      // Fetch available data in parallel for better performance
      const [
        user,
        manufacturingOrders,
        products,
        workOrders,
        workCenters
      ] = await Promise.all([
        UserModel.findByPk(userId, {
          include: [{ association: 'role' }]
        }),
        ManufacturingOrderModel.findAll({
          limit: 100
        }),
        ProductModel.findAll({
          where: { is_active: true },
          limit: 100
        }),
        WorkOrderModel.findAll({
          limit: 100
        }),
        WorkCenterModel.findAll({
          limit: 50
        })
      ]);

      // Mock data for stock movements (to be implemented when inventory system is added)
      const stockMovements: any[] = [];

      if (!user) {
        res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found'
          }
        });
        return;
      }

      // Calculate manufacturing order statistics
      const now = new Date();
      const moStats = {
        total: manufacturingOrders.length,
        completed: manufacturingOrders.filter(mo => mo.status === 'completed').length,
        inProgress: manufacturingOrders.filter(mo => mo.status === 'in-progress').length,
        planned: manufacturingOrders.filter(mo => mo.status === 'planned').length,
        delayed: manufacturingOrders.filter(mo => {
          const dueDate = new Date(mo.planned_end_date || mo.created_at);
          return mo.status !== 'completed' && dueDate < now;
        }).length
      };

      // Calculate work order statistics
      const woStats = {
        total: workOrders.length,
        active: workOrders.filter(wo => wo.status === 'in-progress').length,
        pending: workOrders.filter(wo => wo.status === 'pending').length,
        completed: workOrders.filter(wo => wo.status === 'completed').length
      };

      // Calculate work center statistics
      const wcStats = {
        total: workCenters.length,
        active: workCenters.filter(wc => wc.status === 'active').length,
        maintenance: workCenters.filter(wc => wc.status === 'maintenance').length,
        utilization: workCenters.length > 0 
          ? Math.round(workCenters.reduce((sum, wc) => sum + (wc.utilization || 0), 0) / workCenters.length)
          : 0
      };

      // Calculate product statistics
      const productStats = {
        total: products.length || 0,
        lowStock: products.filter(p => (p.reorder_point || 0) <= (p.min_stock_level || 0)).length || 0,
        outOfStock: products.filter(p => (p.reorder_point || 0) === 0).length || 0
      };

      // Prepare recent activity data
      const recentMOs = manufacturingOrders
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)
        .map(mo => ({
          id: mo.id,
          productName: mo.product?.name || 'Unknown Product',
          quantity: mo.quantity,
          status: mo.status,
          dueDate: (mo.planned_end_date || mo.created_at)?.toISOString() || new Date().toISOString(),
          createdAt: mo.created_at?.toISOString() || new Date().toISOString()
        }));

      const recentWOs = workOrders
        .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
        .slice(0, 5)
        .map(wo => ({
          id: wo.id,
          operation: wo.operation || 'Unknown Operation',
          workCenter: wo.workCenter?.name || 'Unknown Work Center',
          status: wo.status,
          assignee: wo.assigned_to
        }));

      // Prepare stock movements data
      const recentMovements = stockMovements.slice(0, 5).map(sm => ({
        id: sm.id,
        productName: sm.productName || 'Unknown Product',
        type: sm.type as 'in' | 'out',
        quantity: sm.quantity,
        timestamp: sm.createdAt,
        reference: sm.reference
      }));

      // Generate alerts
      const alerts: DashboardData['alerts'] = [];
      
      if (moStats.delayed > 0) {
        alerts.push({
          type: 'error',
          message: `${moStats.delayed} manufacturing order${moStats.delayed > 1 ? 's' : ''} overdue`,
          count: moStats.delayed,
          action: 'Review Orders'
        });
      }

      if (productStats.lowStock > 0) {
        alerts.push({
          type: 'warning',
          message: `${productStats.lowStock} product${productStats.lowStock > 1 ? 's' : ''} below minimum stock`,
          count: productStats.lowStock,
          action: 'Review Inventory'
        });
      }

      if (wcStats.maintenance > 0) {
        alerts.push({
          type: 'warning',
          message: `${wcStats.maintenance} work center${wcStats.maintenance > 1 ? 's' : ''} under maintenance`,
          count: wcStats.maintenance,
          action: 'Check Status'
        });
      }

      const dashboardData: DashboardData = {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          fullName: `${user.first_name} ${user.last_name}`,
          role: user.role ? {
            id: user.role.id,
            name: user.role.name,
            permissions: user.role.permissions || []
          } : undefined
        },
        summary: {
          manufacturingOrders: moStats,
          workOrders: woStats,
          workCenters: wcStats,
          products: productStats,
          stockMovements: {
            recent: recentMovements
          }
        },
        recentActivity: {
          manufacturingOrders: recentMOs,
          workOrders: recentWOs
        },
        alerts
      };

      console.log('Dashboard data fetched successfully', {
        userId,
        dataPoints: {
          manufacturingOrders: moStats.total,
          workOrders: woStats.total,
          workCenters: wcStats.total,
          products: productStats.total,
          alerts: alerts.length
        }
      });

      res.status(200).json({
        success: true,
        data: dashboardData
      });

    } catch (error) {
      console.error('Error fetching dashboard data', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.userId
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'DASHBOARD_ERROR',
          message: 'Failed to fetch dashboard data'
        }
      });
    }
  }
}
