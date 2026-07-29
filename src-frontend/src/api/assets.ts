import api from "./axios";

export interface AssetLocation {
  address?: string;
  region: string;
  zone?: string;
  substation?: string;
  latitude?: number;
  longitude?: number;
}

export interface AssetMetadata {
  voltage_level?: number;
  capacity?: number;
  manufacturer?: string;
  model?: string;
  serial_number?: string;
  owner?: string;
  installation_date?: string;
  commission_date?: string;
  tags?: string[];
  extra_attributes?: Record<string, any>;
}

export interface Asset {
  id: number;
  asset_id: string;
  name: string;
  type: string;
  description?: string;
  status: string;
  region: string;
  zone?: string;
  substation?: string;
  capacity?: number;
  voltage_level?: number;
  manufacturer?: string;
  model?: string;
  owner?: string;
  created_at: string;
  updated_at: string;
  location?: AssetLocation;
  metadata?: AssetMetadata;
}

export interface AssetCategory {
  id: number;
  name: string;
  description?: string;
}

export interface AssetHierarchyNode {
  id: number;
  asset_id: string;
  name: string;
  type: string;
  level: string;
  parent_id?: number;
  parent_name?: string;
}

export interface AssetDashboardData {
  total_assets: number;
  assets_by_category: Record<string, number>;
  assets_by_region: Record<string, number>;
  assets_by_status: Record<string, number>;
  recently_added: {
    id: number;
    asset_id: string;
    name: string;
    type: string;
    region: string;
    status: string;
    created_at: string;
  }[];
  registry_summary: {
    active_percentage: number;
    categories_count: number;
    total_capacity_mw: number;
  };
}

export const assetApi = {
  getDashboard: async (): Promise<AssetDashboardData> => {
    const res = await api.get("/api/v1/assets/dashboard");
    return res.data;
  },

  listAssets: async (params?: {
    page?: number;
    size?: number;
    region?: string;
    type?: string;
    status?: string;
    voltage_level?: number;
    health_status?: string;
    maintenance_status?: string;
    criticality?: string;
    search?: string;
  }): Promise<{ items: Asset[]; total: number; page: number; size: number }> => {
    const res = await api.get("/api/v1/assets", { params });
    return res.data;
  },

  createAsset: async (data: any): Promise<any> => {
    const res = await api.post("/api/v1/assets", data);
    return res.data;
  },

  getAsset: async (id: number): Promise<Asset> => {
    const res = await api.get(`/api/v1/assets/${id}`);
    return res.data;
  },

  updateAsset: async (id: number, data: any): Promise<any> => {
    const res = await api.put(`/api/v1/assets/${id}`, data);
    return res.data;
  },

  deleteAsset: async (id: number): Promise<any> => {
    const res = await api.delete(`/api/v1/assets/${id}`);
    return res.data;
  },

  getCategories: async (): Promise<AssetCategory[]> => {
    const res = await api.get("/api/v1/assets/categories");
    return res.data;
  },

  getHierarchy: async (): Promise<AssetHierarchyNode[]> => {
    const res = await api.get("/api/v1/assets/hierarchy");
    return res.data;
  },

  getMetadata: async (id: number): Promise<AssetMetadata> => {
    const res = await api.get(`/api/v1/assets/${id}/metadata`);
    return res.data;
  },

  getHistory: async (id: number): Promise<any[]> => {
    const res = await api.get(`/api/v1/assets/${id}/history`);
    return res.data;
  },

  getConfiguration: async (): Promise<Record<string, string>> => {
    const res = await api.get("/api/v1/assets/configuration");
    return res.data;
  },

  updateConfiguration: async (configs: { key: string; value: string }[]): Promise<any> => {
    const res = await api.put("/api/v1/assets/configuration", configs);
    return res.data;
  },

  getAssetHealth: async (id: number): Promise<any> => {
    const res = await api.get(`/api/v1/assets/${id}/health`);
    return res.data;
  },

  getAssetTimeline: async (id: number): Promise<any[]> => {
    const res = await api.get(`/api/v1/assets/${id}/timeline`);
    return res.data;
  },

  getInspections: async (id: number): Promise<any[]> => {
    const res = await api.get(`/api/v1/assets/${id}/inspections`);
    return res.data;
  },

  getServices: async (id: number): Promise<any[]> => {
    const res = await api.get(`/api/v1/assets/${id}/services`);
    return res.data;
  },

  getHealthSummary: async (): Promise<any> => {
    const res = await api.get("/api/v1/assets/health/summary");
    return res.data;
  },

  getMaintenanceSummary: async (): Promise<any> => {
    const res = await api.get("/api/v1/assets/maintenance/summary");
    return res.data;
  },

  getAIInsights: async (id: number): Promise<any> => {
    const res = await api.get(`/api/v1/assets/${id}/ai-insights`);
    return res.data;
  },

  getRecommendationsHistory: async (id: number): Promise<any[]> => {
    const res = await api.get(`/api/v1/assets/${id}/recommendations/history`);
    return res.data;
  },

  submitRecommendationAction: async (
    id: number,
    action_taken: string,
    operator_notes?: string
  ): Promise<any> => {
    const res = await api.post(`/api/v1/assets/${id}/recommendations/history`, {
      action_taken,
      operator_notes,
    });
    return res.data;
  },

  getAISummary: async (): Promise<any> => {
    const res = await api.get("/api/v1/assets/ai/summary");
    return res.data;
  },

  getRiskSummary: async (): Promise<any> => {
    const res = await api.get("/api/v1/assets/risk/summary");
    return res.data;
  },

  getAssetLifecycle: async (id: number): Promise<any> => {
    const res = await api.get(`/api/v1/assets/${id}/lifecycle`);
    return res.data;
  },

  getLifecycleSummary: async (): Promise<any> => {
    const res = await api.get("/api/v1/assets/lifecycle/summary");
    return res.data;
  },

  getPerformanceSummary: async (): Promise<any> => {
    const res = await api.get("/api/v1/assets/performance/summary");
    return res.data;
  },

  getCriticalitySummary: async (): Promise<any> => {
    const res = await api.get("/api/v1/assets/criticality/summary");
    return res.data;
  },
};
