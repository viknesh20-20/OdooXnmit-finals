import apiClient, { ApiResponse, PaginatedResponse } from '../api';

// Work Center Types
export interface WorkCenter {
  id: string;
  code: string;
  name: string;
  description?: string;
  costPerHour: number;
  capacity: number;
  efficiency: number;
  status: 'active' | 'inactive' | 'maintenance';
  utilization: number;
  location?: string;
  availability: number;
  maintenanceSchedule?: string;
  nextMaintenance?: string;
  operatorIds: string[];
  capabilities: string[];
  workingHours: {
    [key: string]: {
      start: string;
      end: string;
      isWorking: boolean;
    };
  };
  oeeScore: number;
  downtimeHours: number;
  productiveHours: number;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkCenterRequest {
  code: string;
  name: string;
  description?: string;
  cost_per_hour: number;
  capacity: number;
  efficiency?: number;
  status?: 'active' | 'inactive' | 'maintenance';
  utilization?: number;
  location?: string;
  availability?: number;
  maintenance_schedule?: string;
  next_maintenance?: string;
  operator_ids?: string[];
  capabilities?: string[];
  working_hours?: Record<string, any>;
  oee_score?: number;
  downtime_hours?: number;
  productive_hours?: number;
  metadata?: Record<string, any>;
}

export interface UpdateWorkCenterRequest extends Partial<CreateWorkCenterRequest> {}

export interface GetWorkCentersParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'active' | 'inactive' | 'maintenance';
  location?: string;
  sortBy?: 'name' | 'code' | 'status' | 'utilization' | 'efficiency' | 'created_at';
  sortOrder?: 'asc' | 'desc';
}

export interface WorkCentersResponse {
  workCenters: WorkCenter[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface UtilizationUpdateRequest {
  utilization: number;
  oee_score?: number;
  downtime_hours?: number;
  productive_hours?: number;
}

class WorkCenterService {
  private readonly basePath = '/work-centers';

  /**
   * Get all work centers with optional filtering and pagination
   */
  async getWorkCenters(params?: GetWorkCentersParams): Promise<WorkCentersResponse> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const queryString = queryParams.toString();
    const url = queryString ? `${this.basePath}?${queryString}` : this.basePath;
    
    const response: PaginatedResponse<WorkCenter> = await apiClient.get(url);
    return {
      workCenters: (response.data as any).workCenters || [],
      pagination: response.data.pagination
    };
  }

  /**
   * Get a single work center by ID
   */
  async getWorkCenter(id: string): Promise<WorkCenter> {
    const response: ApiResponse<{ workCenter: WorkCenter }> = await apiClient.get(`${this.basePath}/${id}`);
    return response.data!.workCenter;
  }

  /**
   * Create a new work center
   */
  async createWorkCenter(workCenterData: CreateWorkCenterRequest): Promise<WorkCenter> {
    const response: ApiResponse<{ workCenter: WorkCenter }> = await apiClient.post(this.basePath, workCenterData);
    return response.data!.workCenter;
  }

  /**
   * Update an existing work center
   */
  async updateWorkCenter(id: string, workCenterData: UpdateWorkCenterRequest): Promise<WorkCenter> {
    const response: ApiResponse<{ workCenter: WorkCenter }> = await apiClient.put(`${this.basePath}/${id}`, workCenterData);
    return response.data!.workCenter;
  }

  /**
   * Delete a work center (soft delete - sets status to inactive)
   */
  async deleteWorkCenter(id: string): Promise<void> {
    await apiClient.delete(`${this.basePath}/${id}`);
  }

  /**
   * Update work center utilization metrics
   */
  async updateUtilization(id: string, utilizationData: UtilizationUpdateRequest): Promise<WorkCenter> {
    const response: ApiResponse<{ workCenter: WorkCenter }> = await apiClient.put(
      `${this.basePath}/${id}/utilization`,
      utilizationData
    );
    return response.data!.workCenter;
  }

  /**
   * Get active work centers only
   */
  async getActiveWorkCenters(): Promise<WorkCenter[]> {
    const response = await this.getWorkCenters({ status: 'active' });
    return response.workCenters;
  }

  /**
   * Get work centers by status
   */
  async getWorkCentersByStatus(status: 'active' | 'inactive' | 'maintenance'): Promise<WorkCenter[]> {
    const response = await this.getWorkCenters({ status });
    return response.workCenters;
  }

  /**
   * Get work centers by location
   */
  async getWorkCentersByLocation(location: string): Promise<WorkCenter[]> {
    const response = await this.getWorkCenters({ location });
    return response.workCenters;
  }

  /**
   * Search work centers by name or code
   */
  async searchWorkCenters(searchTerm: string, limit: number = 20): Promise<WorkCenter[]> {
    const response = await this.getWorkCenters({ search: searchTerm, limit });
    return response.workCenters;
  }

  /**
   * Get work center utilization data for charts
   */
  async getUtilizationData(): Promise<Array<{
    id: string;
    name: string;
    utilization: number;
    efficiency: number;
    oeeScore: number;
    status: string;
  }>> {
    const response = await this.getWorkCenters({ status: 'active' });
    return response.workCenters.map(wc => ({
      id: wc.id,
      name: wc.name,
      utilization: wc.utilization,
      efficiency: wc.efficiency,
      oeeScore: wc.oeeScore,
      status: wc.status,
    }));
  }

  /**
   * Get work center statistics
   */
  async getWorkCenterStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    maintenance: number;
    averageUtilization: number;
    averageEfficiency: number;
    averageOEE: number;
  }> {
    const response = await this.getWorkCenters({ limit: 1000 });
    const workCenters = response.workCenters;

    const stats = workCenters.reduce(
      (acc, wc) => {
        acc.total++;
        if (wc.status === 'active') acc.active++;
        else if (wc.status === 'inactive') acc.inactive++;
        else if (wc.status === 'maintenance') acc.maintenance++;

        acc.totalUtilization += wc.utilization;
        acc.totalEfficiency += wc.efficiency;
        acc.totalOEE += wc.oeeScore;
        return acc;
      },
      {
        total: 0,
        active: 0,
        inactive: 0,
        maintenance: 0,
        totalUtilization: 0,
        totalEfficiency: 0,
        totalOEE: 0,
      }
    );

    return {
      total: stats.total,
      active: stats.active,
      inactive: stats.inactive,
      maintenance: stats.maintenance,
      averageUtilization: stats.total > 0 ? stats.totalUtilization / stats.total : 0,
      averageEfficiency: stats.total > 0 ? stats.totalEfficiency / stats.total : 0,
      averageOEE: stats.total > 0 ? stats.totalOEE / stats.total : 0,
    };
  }

  /**
   * Get work centers with high utilization (above threshold)
   */
  async getHighUtilizationWorkCenters(threshold: number = 80): Promise<WorkCenter[]> {
    const response = await this.getWorkCenters({ status: 'active' });
    return response.workCenters.filter(wc => wc.utilization >= threshold);
  }

  /**
   * Get work centers requiring maintenance
   */
  async getMaintenanceRequiredWorkCenters(): Promise<WorkCenter[]> {
    const response = await this.getWorkCenters();
    const now = new Date();
    
    return response.workCenters.filter(wc => {
      if (wc.status === 'maintenance') return true;
      if (wc.nextMaintenance) {
        const maintenanceDate = new Date(wc.nextMaintenance);
        return maintenanceDate <= now;
      }
      return false;
    });
  }
}

// Export singleton instance
export const workCenterService = new WorkCenterService();
export default workCenterService;
