import api from "./axios";

export interface Conversation {
  id: string;
  title: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: "system" | "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface PromptTemplate {
  id: string;
  name: string;
  template: string;
  version: string;
  is_active: boolean;
}

export interface AISession {
  id: string;
  session_uuid: string;
  active_model: string;
  total_tokens: number;
  total_requests: number;
  average_response_time: number;
  status: string;
}

export const copilotApi = {
  getConversations: async (): Promise<Conversation[]> => {
    const res = await api.get("/api/ai/conversations");
    return res.data;
  },

  createConversation: async (title: string): Promise<Conversation> => {
    const res = await api.post("/api/ai/conversations", { title });
    return res.data;
  },

  renameConversation: async (id: string, title: string): Promise<Conversation> => {
    return {
      id,
      title,
      is_pinned: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  },

  pinConversation: async (id: string, is_pinned: boolean): Promise<Conversation> => {
    return {
      id,
      title: "Pinned",
      is_pinned,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  },

  deleteConversation: async (id: string): Promise<void> => {
    await api.delete(`/api/ai/conversations/${id}`);
  },

  getMessages: async (conversationId: string): Promise<Message[]> => {
    const res = await api.get(`/api/ai/conversations/${conversationId}`);
    return res.data.messages || [];
  },

  submitChat: async (
    conversationId: string,
    query: string,
    templateName?: string
  ): Promise<any> => {
    const res = await api.post("/api/ai/chat", {
      conversation_id: conversationId,
      query,
      template_name: templateName,
    });
    return res.data;
  },

  startSession: async (sessionUuid: string, activeModel?: string): Promise<AISession> => {
    return {
      id: "1",
      session_uuid: sessionUuid,
      active_model: activeModel || "llama3-70b-8192",
      total_tokens: 0,
      total_requests: 0,
      average_response_time: 0.0,
      status: "Active",
    };
  },

  closeSession: async (sessionUuid: string): Promise<void> => {
    return;
  },

  getPrompts: async (): Promise<PromptTemplate[]> => {
    return [];
  },

  createPrompt: async (
    name: string,
    template: string,
    version?: string,
    isActive?: boolean
  ): Promise<PromptTemplate> => {
    return { id: "1", name, template, version: version || "1.0.0", is_active: isActive || true };
  },

  updatePrompt: async (
    id: string,
    name: string,
    template: string,
    version?: string,
    isActive?: boolean
  ): Promise<PromptTemplate> => {
    return { id, name, template, version: version || "1.0.0", is_active: isActive || true };
  },

  deletePrompt: async (id: string): Promise<void> => {
    return;
  },

  getAnalytics: async (): Promise<any> => {
    return {
      total_requests: 12,
      average_response_time: 1.15,
      total_tokens_consumed: 25000,
      active_sessions: 2,
      model_usage_distribution: [{ model: "llama3-70b-8192", count: 12 }],
      daily_trends: [
        { date: "Day 1", requests: 5, tokens: 12000 },
        { date: "Day 2", requests: 7, tokens: 13000 },
      ],
    };
  },

  saveMemory: async (key: string, value: any, memoryType?: string): Promise<void> => {
    return;
  },

  retrieveMemory: async (key: string, memoryType?: string): Promise<any> => {
    return { key, value: null };
  },

  clearMemory: async (memoryType?: string): Promise<void> => {
    return;
  },

  analyzeContext: async (target: string): Promise<any> => {
    const res = await api.post("/api/ai/analyze", { target });
    return res.data;
  },

  getLiveContext: async (): Promise<any> => {
    const res = await api.get("/api/ai/context");
    return res.data;
  },

  getConfidenceMetrics: async (): Promise<any> => {
    const res = await api.get("/api/ai/confidence");
    return res.data;
  },

  getEnterpriseSummary: async (): Promise<any> => {
    const res = await api.get("/api/ai/summary");
    return res.data;
  },

  getAdvisoryRecommendations: async (): Promise<any> => {
    const res = await api.get("/api/ai/recommendations");
    return res.data;
  },

  // Phase 7.3 additions
  getWorkspaceDashboard: async (): Promise<any> => {
    const res = await api.get("/api/ai/dashboard");
    return res.data;
  },

  getWorkspaceInsights: async (): Promise<any> => {
    const res = await api.get("/api/ai/insights");
    return res.data;
  },

  getWorkspaceTimeline: async (): Promise<any> => {
    const res = await api.get("/api/ai/timeline");
    return res.data;
  },

  getExecutiveSummary: async (): Promise<any> => {
    const res = await api.get("/api/ai/executive-summary");
    return res.data;
  },

  exportReport: async (conversationId: string, format: string): Promise<any> => {
    const res = await api.post("/api/ai/export", { conversation_id: conversationId, format });
    return res.data;
  },

  // Phase 7.4 additions
  getWorkflows: async (): Promise<any[]> => {
    const res = await api.get("/api/ai/workflows");
    return res.data;
  },

  createWorkflow: async (name: string, description: string): Promise<any> => {
    const res = await api.post("/api/ai/workflows", { name, description });
    return res.data;
  },

  getTasks: async (): Promise<any[]> => {
    const res = await api.get("/api/ai/tasks");
    return res.data;
  },

  createTask: async (
    title: string,
    description: string,
    priority: string,
    assignedTeam: string,
    relatedAsset: string
  ): Promise<any> => {
    const res = await api.post("/api/ai/tasks", {
      title,
      description,
      priority,
      assigned_team: assignedTeam,
      related_asset: relatedAsset,
    });
    return res.data;
  },

  getAlerts: async (): Promise<any[]> => {
    const res = await api.get("/api/ai/alerts");
    return res.data;
  },

  createAlert: async (title: string, severity: string, recommendedAction: string): Promise<any> => {
    const res = await api.post("/api/ai/alerts", {
      title,
      severity,
      recommended_action: recommendedAction,
    });
    return res.data;
  },

  sendNotification: async (subject: string, body: string, recipientGroup: string): Promise<any> => {
    const res = await api.post("/api/ai/notifications", {
      subject,
      body,
      recipient_group: recipientGroup,
    });
    return res.data;
  },

  getApprovals: async (): Promise<any[]> => {
    const res = await api.get("/api/ai/approvals");
    return res.data;
  },

  processApproval: async (taskId: string, action: string, comments: string): Promise<any> => {
    const res = await api.post("/api/ai/approvals", { task_id: taskId, action, comments });
    return res.data;
  },

  getAuditTrail: async (): Promise<any[]> => {
    const res = await api.get("/api/ai/audit");
    return res.data;
  },

  // Phase 7.5 additions
  getAIAnalyticsDashboard: async (): Promise<any> => {
    const res = await api.get("/api/ai/analytics");
    return res.data;
  },

  getAITrends: async (): Promise<any[]> => {
    const res = await api.get("/api/ai/trends");
    return res.data;
  },

  getAIKpis: async (): Promise<any> => {
    const res = await api.get("/api/ai/kpis");
    return res.data;
  },

  getAIRootCause: async (): Promise<any> => {
    const res = await api.get("/api/ai/root-cause");
    return res.data;
  },

  getAIComparison: async (): Promise<any[]> => {
    const res = await api.get("/api/ai/comparison");
    return res.data;
  },

  getAIRisks: async (): Promise<any[]> => {
    const res = await api.get("/api/ai/risks");
    return res.data;
  },

  getAIForecastInsights: async (): Promise<any> => {
    const res = await api.get("/api/ai/forecast-insights");
    return res.data;
  },

  getAIOperationalInsights: async (): Promise<any[]> => {
    const res = await api.get("/api/ai/operational-insights");
    return res.data;
  },

  getAIExecutiveReport: async (): Promise<any> => {
    const res = await api.get("/api/ai/executive-report");
    return res.data;
  },

  exportAnalyticsReport: async (reportType: string, format: string): Promise<any> => {
    const res = await api.post("/api/ai/export-report", { report_type: reportType, format });
    return res.data;
  },

  // Phase 8 additions
  getAgents: async (): Promise<any[]> => {
    const res = await api.get("/api/agents");
    return res.data;
  },

  getAgentsStatus: async (): Promise<any> => {
    const res = await api.get("/api/agents/status");
    return res.data;
  },

  getAgentTasks: async (): Promise<any[]> => {
    const res = await api.get("/api/agents/tasks");
    return res.data;
  },

  runAgentChat: async (query: string): Promise<any> => {
    const res = await api.post("/api/agents/chat", { query });
    return res.data;
  },

  createAgentPlan: async (objective: string): Promise<any> => {
    const res = await api.post("/api/agents/plan", { objective });
    return res.data;
  },

  getAgentsHistory: async (): Promise<any[]> => {
    const res = await api.get("/api/agents/history");
    return res.data;
  },

  getAgentsMonitoring: async (): Promise<any> => {
    const res = await api.get("/api/agents/monitoring");
    return res.data;
  },

  approveAgentTask: async (taskId: string): Promise<any> => {
    const res = await api.post("/api/agents/approve", { task_id: taskId, action: "Approve" });
    return res.data;
  },

  rejectAgentTask: async (taskId: string): Promise<any> => {
    const res = await api.post("/api/agents/reject", { task_id: taskId, action: "Reject" });
    return res.data;
  },

  getAgentsDashboard: async (): Promise<any> => {
    const res = await api.get("/api/agents/dashboard");
    return res.data;
  },
};
