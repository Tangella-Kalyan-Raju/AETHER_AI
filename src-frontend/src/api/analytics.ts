import api from "./axios";

export const analyticsApi = {
  getDashboard: async (params?: { region?: string; asset_type?: string }): Promise<any> => {
    const res = await api.get("/api/v1/analytics/dashboard", { params });
    return res.data;
  },

  getKpis: async (params?: { region?: string }): Promise<any[]> => {
    const res = await api.get("/api/v1/analytics/kpi", { params });
    return res.data;
  },

  getHistorical: async (params?: {
    range?: string;
    region?: string;
    asset_type?: string;
  }): Promise<any> => {
    const res = await api.get("/api/v1/analytics/historical", { params });
    return res.data;
  },

  getTrends: async (params?: { segment?: string }): Promise<any> => {
    const res = await api.get("/api/v1/analytics/trends", { params });
    return res.data;
  },

  getRegional: async (): Promise<any[]> => {
    const res = await api.get("/api/v1/analytics/regional");
    return res.data;
  },

  getOperatorActivities: async (limit?: number): Promise<any[]> => {
    const res = await api.get("/api/v1/analytics/operator-activities", { params: { limit } });
    return res.data;
  },

  getAuditLogs: async (limit?: number): Promise<any[]> => {
    const res = await api.get("/api/v1/analytics/audit-logs", { params: { limit } });
    return res.data;
  },
};
