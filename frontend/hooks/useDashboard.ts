import { useState, useEffect } from 'react';
import { authService } from '@/lib/services/authService';

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

export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const dashboardData = await authService.getDashboardData();
      setData(dashboardData);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const refetch = () => {
    fetchDashboardData();
  };

  return {
    data,
    loading,
    error,
    refetch
  };
}

export default useDashboard;
