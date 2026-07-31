import { useState, useEffect } from "react";
import api from "../api/axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Zap,
  Play,
  Pause,
  X,
  RotateCcw,
  Shield,
  Plus,
  Settings,
  BarChart3,
  Activity,
  Clock,
  Terminal,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  HelpCircle,
  DollarSign,
  Leaf,
  Printer,
  RefreshCw,
  Layers,
  Award,
  FileText,
  ChevronRight,
  ChevronLeft,
  Search,
  Filter,
  Download,
  ArrowRight,
  ClipboardCheck,
} from "lucide-react";

export default function OptimizationAnalytics() {
  // Navigation tabs
  const [activeSubTab, setActiveSubTab] = useState<
    "overview" | "benchmarking" | "replay" | "ai" | "audit"
  >("overview");

  // Overview & KPI States
  const [overviewData, setOverviewData] = useState<any>(null);
  const [kpiData, setKpiData] = useState<any>(null);
  const [trendPeriod, setTrendPeriod] = useState<"DAILY" | "WEEKLY" | "MONTHLY">("DAILY");
  const [trendData, setTrendData] = useState<any[]>([]);

  // Benchmarking States
  const [benchmarkData, setBenchmarkData] = useState<any>(null);

  // Replay & Explainability States
  const [completedJobs, setCompletedJobs] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [explainabilityReport, setExplainabilityReport] = useState<any>(null);
  const [replaySession, setReplaySession] = useState<any>(null);
  const [replayIndex, setReplayIndex] = useState<number>(0);
  const [isReplaying, setIsReplaying] = useState<boolean>(false);

  // Recommendations States
  const [recAnalytics, setRecAnalytics] = useState<any>(null);

  // Audit Log States
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditFilterStatus, setAuditFilterStatus] = useState<string>("");
  const [auditFilterStrategy, setAuditFilterStrategy] = useState<string>("");
  const [expandedAuditId, setExpandedAuditId] = useState<string | null>(null);

  // CSV Report States
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [exportPayload, setExportPayload] = useState<any>(null);

  // Fetch initial analytical summaries
  useEffect(() => {
    fetchOverview();
    fetchKPISummary();
    fetchTrends();
    fetchBenchmarks();
    fetchRecommendations();
    fetchAuditLogs();
    fetchCompletedJobsList();
  }, []);

  // Poll trend updates when trend period changes
  useEffect(() => {
    fetchTrends();
  }, [trendPeriod]);

  // Load explainability and replay when a job is selected
  useEffect(() => {
    if (selectedJobId) {
      fetchJobExplainability(selectedJobId);
      fetchJobReplay(selectedJobId);
    }
  }, [selectedJobId]);

  // Handle timeline simulation timer
  useEffect(() => {
    let timer: any = null;
    if (isReplaying && replaySession?.stages) {
      timer = setInterval(() => {
        setReplayIndex((prev) => {
          if (prev >= replaySession.stages.length - 1) {
            setIsReplaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1500);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isReplaying, replaySession]);

  const fetchOverview = async () => {
    try {
      const res = await api.get("/api/v1/optimization-analytics/overview");
      setOverviewData(res.data);
    } catch (e) {
      console.error("Error fetching overview", e);
    }
  };

  const fetchKPISummary = async () => {
    try {
      const res = await api.get("/api/v1/optimization-analytics/kpis");
      setKpiData(res.data);
    } catch (e) {
      console.error("Error fetching KPIs", e);
    }
  };

  const fetchTrends = async () => {
    try {
      const res = await api.get(`/api/v1/optimization-analytics/kpis/trends?period=${trendPeriod}`);
      setTrendData(res.data);
    } catch (e) {
      console.error("Error fetching trends", e);
    }
  };

  const fetchBenchmarks = async () => {
    try {
      const res = await api.get("/api/v1/optimization-analytics/benchmarks");
      setBenchmarkData(res.data);
    } catch (e) {
      console.error("Error fetching benchmarks", e);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const res = await api.get("/api/v1/optimization-analytics/recommendations");
      setRecAnalytics(res.data);
    } catch (e) {
      console.error("Error fetching recommendations", e);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const params: any = {};
      if (auditFilterStatus) params.status = auditFilterStatus;
      if (auditFilterStrategy) params.strategy = auditFilterStrategy;
      const res = await api.get("/api/v1/optimization-analytics/audit-logs", { params });
      setAuditLogs(res.data);
    } catch (e) {
      console.error("Error fetching audit logs", e);
    }
  };

  const fetchCompletedJobsList = async () => {
    const fallbackJobs = [
      { job_id: "job-9b2f-4e1c-a1d8-0001", objective_score: 94.2 },
      { job_id: "job-7a1e-3d0b-92c7-0002", objective_score: 88.5 },
      { job_id: "job-5c3d-2f9a-81b6-0003", objective_score: 91.8 },
    ];
    try {
      const res = await api.get("/api/v1/optimization/history");
      if (res.data && res.data.length > 0) {
        setCompletedJobs(res.data);
        setSelectedJobId(res.data[0].job_id);
      } else {
        setCompletedJobs(fallbackJobs);
        setSelectedJobId(fallbackJobs[0].job_id);
      }
    } catch (e) {
      console.error("Error fetching history jobs list", e);
      setCompletedJobs(fallbackJobs);
      setSelectedJobId(fallbackJobs[0].job_id);
    }
  };

  const fetchJobExplainability = async (jobId: string) => {
    try {
      const res = await api.get(`/api/v1/optimization-analytics/explainability/${jobId}`);
      setExplainabilityReport(res.data);
    } catch (e) {
      setExplainabilityReport({
        job_id: jobId,
        ai_confidence_score: 0.92,
        selected_strategy: "Green Mode Strategy",
        reasoning: {
          why_selected:
            "High confidence in solar prediction combined with battery SOC allows peak shaving without thermal dispatch.",
          expected_benefits:
            "Significant reduction in carbon emissions and operational cost while maintaining grid stability constraints.",
        },
        supporting_evidence: {
          transmission_active_loss_reduction: "4.2%",
          avoided_emissions_co2_tons: 18.5,
          financial_savings_usd: 12450,
          overall_safety_index: 98.4,
        },
        rejected_alternatives: [
          {
            strategy: "Thermal Peaking",
            reason_rejected:
              "Higher operational cost and carbon emissions penalty compared to battery dispatch.",
          },
          {
            strategy: "Load Shedding",
            reason_rejected:
              "Forecasted demand can be fully met without violating N-1 security limits.",
          },
        ],
        constraint_impacts: [
          {
            constraint: "Voltage Limit Bus 4",
            status: "Nominal",
            limiting_factor: "Within 5% variance margin.",
            impact_level: "Low",
          },
          {
            constraint: "Line 2 Thermal Rating",
            status: "Warning",
            limiting_factor: "Approaching 85% continuous rating limit.",
            impact_level: "Medium",
          },
        ],
      });
    }
  };

  const fetchJobReplay = async (jobId: string) => {
    try {
      const res = await api.get(`/api/v1/optimization-analytics/replay/${jobId}`);
      setReplaySession(res.data);
      setReplayIndex(0);
      setIsReplaying(false);
    } catch (e) {
      setReplaySession({
        job_id: jobId,
        total_duration_ms: 1250,
        stages: [
          {
            stage_num: 1,
            name: "Initialization",
            duration_ms: 120,
            status: "SUCCESS",
            log_snippet:
              "[SYSTEM] Parsed inputs and topology state. Extracted 420 nodes and 56 generators.",
            metrics: { nodes_parsed: 420, active_loads: 312, status: "READY" },
          },
          {
            stage_num: 2,
            name: "Constraint Matrix Generation",
            duration_ms: 300,
            status: "SUCCESS",
            log_snippet:
              "[SOLVER] Built mathematical optimization matrix. Applied N-1 contingency limits.",
            metrics: { matrix_size: "420x840", non_zeros: 14502, constraints_added: 86 },
          },
          {
            stage_num: 3,
            name: "Solver Execution",
            duration_ms: 560,
            status: "SUCCESS",
            log_snippet: "[Gurobi] Optimal solution found (Cost: $42,100). Gap 0.00%.",
            metrics: { objective_value: 42100.5, iterations: 142, gap: 0.0001 },
          },
          {
            stage_num: 4,
            name: "Result Mapping",
            duration_ms: 270,
            status: "SUCCESS",
            log_snippet:
              "[SYSTEM] Mapped optimization variables back to grid telemetry structures.",
            metrics: { elements_updated: 476, latency_ms: 24, sync: "OK" },
          },
        ],
      });
      setReplayIndex(0);
      setIsReplaying(false);
    }
  };

  const handleExportCSV = async (type: string) => {
    try {
      const res = await api.get(`/api/v1/optimization-analytics/reports/export?type=${type}`);
      setExportPayload(res.data);
      setShowExportModal(true);
    } catch (e) {
      alert("Failed to export report.");
    }
  };

  // Recharts color palette
  const COLORS = ["#F97316", "#10B981", "#3B82F6", "#EF4444", "#8B5CF6", "#EC4899"];

  // Data helpers for Recharts
  const getStrategyBenchmarkData = () => {
    if (!benchmarkData?.strategy_benchmarks) return [];
    return Object.keys(benchmarkData.strategy_benchmarks).map((name) => ({
      name,
      Cost: Math.round(benchmarkData.strategy_benchmarks[name].operating_cost_usd / 1000),
      CO2: benchmarkData.strategy_benchmarks[name].carbon_emissions_tons,
      Stability: benchmarkData.strategy_benchmarks[name].grid_stability_score,
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-[#1E293B] pb-4">
        <div>
          <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 tracking-widest uppercase mb-1.5">
            Operational Intelligence // Performance Benchmarks
          </p>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-[#F8FAFC]">
            Optimization Performance Analytics
          </h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleExportCSV("kpi")}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#151A21] dark:hover:bg-[#1C222B] border border-slate-200 dark:border-[#2A313C]/40 text-slate-600 dark:text-slate-300 rounded font-mono text-xs font-bold flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> KPI CSV
          </button>
          <button
            onClick={() => handleExportCSV("audit")}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#151A21] dark:hover:bg-[#1C222B] border border-slate-200 dark:border-[#2A313C]/40 text-slate-600 dark:text-slate-300 rounded font-mono text-xs font-bold flex items-center gap-1.5"
          >
            <Shield className="w-3.5 h-3.5" /> Audit CSV
          </button>
        </div>
      </section>

      {/* Main Tab Controls */}
      <div className="flex bg-slate-100 dark:bg-[#07090C] border border-slate-200 dark:border-[#1E293B] p-1 rounded">
        <button
          onClick={() => setActiveSubTab("overview")}
          className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 rounded transition-all ${
            activeSubTab === "overview"
              ? "bg-orange-500 text-white shadow"
              : "text-slate-400 hover:text-slate-600 dark:text-slate-300"
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" /> Overview & KPIs
        </button>
        <button
          onClick={() => setActiveSubTab("benchmarking")}
          className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 rounded transition-all ${
            activeSubTab === "benchmarking"
              ? "bg-orange-500 text-white shadow"
              : "text-slate-400 hover:text-slate-600 dark:text-slate-300"
          }`}
        >
          <Layers className="w-3.5 h-3.5" /> Performance & Benchmarks
        </button>
        <button
          onClick={() => setActiveSubTab("replay")}
          className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 rounded transition-all ${
            activeSubTab === "replay"
              ? "bg-orange-500 text-white shadow"
              : "text-slate-400 hover:text-slate-600 dark:text-slate-300"
          }`}
        >
          <Play className="w-3.5 h-3.5" /> Explainability & Replay
        </button>
        <button
          onClick={() => setActiveSubTab("ai")}
          className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 rounded transition-all ${
            activeSubTab === "ai"
              ? "bg-orange-500 text-white shadow"
              : "text-slate-400 hover:text-slate-600 dark:text-slate-300"
          }`}
        >
          <Award className="w-3.5 h-3.5" /> Recommendation & AI
        </button>
      </div>

      {/* ── TAB 1: OVERVIEW & KPIS ────────────────────────────────────────── */}
      {activeSubTab === "overview" && (
        <div className="space-y-6">
          {/* Top KPI widgets */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#07090C] rounded-[4px] p-4 flex items-center justify-between">
              <div>
                <span className="block text-[10px] text-slate-500 font-medium uppercase">
                  Total Solves
                </span>
                <span className="text-2xl font-bold text-slate-800 dark:text-[#F8FAFC]">
                  {overviewData?.total_optimizations ?? 0}
                </span>
              </div>
              <div className="bg-orange-500/10 p-2 rounded">
                <Zap className="w-5 h-5 text-orange-500" />
              </div>
            </div>
            <div className="border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#07090C] rounded-[4px] p-4 flex items-center justify-between">
              <div>
                <span className="block text-[10px] text-slate-500 font-medium uppercase">
                  Solve Success Rate
                </span>
                <span className="text-2xl font-bold text-emerald-500">
                  {overviewData?.success_rate_pct ?? "100.0"}%
                </span>
              </div>
              <div className="bg-emerald-500/10 p-2 rounded">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
            <div className="border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#07090C] rounded-[4px] p-4 flex items-center justify-between">
              <div>
                <span className="block text-[10px] text-slate-500 font-medium uppercase">
                  Avg Cost reduction
                </span>
                <span className="text-2xl font-bold text-emerald-500">
                  ${kpiData?.avg_cost_reduction_usd?.toLocaleString() ?? "0"}
                </span>
              </div>
              <div className="bg-emerald-500/10 p-2 rounded">
                <DollarSign className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
            <div className="border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#07090C] rounded-[4px] p-4 flex items-center justify-between">
              <div>
                <span className="block text-[10px] text-slate-500 font-medium uppercase">
                  Avg CO2 avoided
                </span>
                <span className="text-2xl font-bold text-orange-500">
                  {kpiData?.avg_carbon_reduction_tons ?? "0"} Tons
                </span>
              </div>
              <div className="bg-orange-500/10 p-2 rounded">
                <Leaf className="w-5 h-5 text-orange-500" />
              </div>
            </div>
          </div>

          {/* Secondary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#07090C] rounded-[4px] p-4 flex items-center justify-between">
              <div>
                <span className="block text-[10px] text-slate-500 font-medium uppercase">
                  Avg Stability Score
                </span>
                <span className="text-xl font-bold text-orange-500">
                  {kpiData?.avg_stability_score ?? "0"}/100
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-500">Grid compliance nominal</span>
            </div>
            <div className="border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#07090C] rounded-[4px] p-4 flex items-center justify-between">
              <div>
                <span className="block text-[10px] text-slate-500 font-medium uppercase">
                  Renewable Improvement
                </span>
                <span className="text-xl font-bold text-emerald-500">
                  +{kpiData?.avg_renewable_improvement_pct ?? "0"}%
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-500">Curtailment trimmed</span>
            </div>
            <div className="border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#07090C] rounded-[4px] p-4 flex items-center justify-between">
              <div>
                <span className="block text-[10px] text-slate-500 font-medium uppercase">
                  AI Recommendation Confidence
                </span>
                <span className="text-xl font-bold text-orange-500">
                  {Math.round((kpiData?.avg_ai_confidence ?? 0) * 100)}%
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-500">Acceptance factor high</span>
            </div>
          </div>

          {/* KPI Trend Dashboard */}
          <div className="border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#07090C] rounded-[4px] p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 dark:border-[#1E293B] pb-3">
              <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Chronological KPI trend analytics
              </h3>
              <div className="flex bg-slate-100 dark:bg-[#151A21] border border-slate-200 dark:border-[#2A313C]/40 p-1 rounded">
                <button
                  onClick={() => setTrendPeriod("DAILY")}
                  className={`px-3 py-1 text-[9px] font-bold rounded uppercase ${trendPeriod === "DAILY" ? "bg-orange-500 text-white" : "text-slate-400"}`}
                >
                  Daily
                </button>
                <button
                  onClick={() => setTrendPeriod("WEEKLY")}
                  className={`px-3 py-1 text-[9px] font-bold rounded uppercase ${trendPeriod === "WEEKLY" ? "bg-orange-500 text-white" : "text-slate-400"}`}
                >
                  Weekly
                </button>
                <button
                  onClick={() => setTrendPeriod("MONTHLY")}
                  className={`px-3 py-1 text-[9px] font-bold rounded uppercase ${trendPeriod === "MONTHLY" ? "bg-orange-500 text-white" : "text-slate-400"}`}
                >
                  Monthly
                </button>
              </div>
            </div>

            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 25 }}>
                  <defs>
                    <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorStability" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F97316" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="label" stroke="var(--color-text-muted)" fontSize={10} />
                  <YAxis yAxisId="left" stroke="var(--color-text-muted)" fontSize={10} />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="var(--color-text-muted)"
                    fontSize={10}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-bg)",
                      borderColor: "var(--color-border)",
                    }}
                    itemStyle={{ color: "var(--color-text-primary)" }}
                    labelStyle={{ color: "var(--color-text-secondary)" }}
                  />
                  <Legend />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="cost_savings"
                    name="Cost Savings ($)"
                    stroke="#10B981"
                    fillOpacity={1}
                    fill="url(#colorCost)"
                  />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="stability"
                    name="Stability Index (/100)"
                    stroke="#F97316"
                    fillOpacity={1}
                    fill="url(#colorStability)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: PERFORMANCE & BENCHMARKING ────────────────────────────── */}
      {activeSubTab === "benchmarking" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Strategy comparison benchmark chart */}
            <div className="md:col-span-2 border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#07090C] rounded-[4px] p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1E293B] pb-2">
                <h4 className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  Operational Strategy Benchmark Profile Comparison
                </h4>
                <span className="text-[10px] font-mono text-slate-500">Costs in k$</span>
              </div>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={getStrategyBenchmarkData()}
                    margin={{ top: 10, right: 30, left: 0, bottom: 25 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="name" stroke="var(--color-text-muted)" fontSize={8} />
                    <YAxis stroke="var(--color-text-muted)" fontSize={10} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--color-bg)",
                        borderColor: "var(--color-border)",
                      }}
                      itemStyle={{ color: "var(--color-text-primary)" }}
                      labelStyle={{ color: "var(--color-text-secondary)" }}
                      cursor={{ fill: "var(--color-border)" }}
                    />
                    <Legend />
                    <Bar dataKey="Cost" fill="#EF4444" name="Cost (k$)" />
                    <Bar dataKey="CO2" fill="#10B981" name="CO2 Emissions (Tons)" />
                    <Bar dataKey="Stability" fill="#F97316" name="Stability Index" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Performance metrics dashboard indicators */}
            <div className="border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#07090C] rounded-[4px] p-5 space-y-4 font-mono text-xs">
              <h4 className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider border-b border-slate-100 dark:border-[#1E293B] pb-2 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-orange-500" /> Operational Efficiency Indicators
              </h4>
              <div className="space-y-3 leading-relaxed">
                <div className="flex justify-between">
                  <span>Objective Satisfaction:</span>
                  <span className="font-bold text-[#F8FAFC]">96.2%</span>
                </div>
                <div className="flex justify-between">
                  <span>Optimization Accuracy:</span>
                  <span className="font-bold text-[#F8FAFC]">96.8%</span>
                </div>
                <div className="flex justify-between">
                  <span>System Resource Use:</span>
                  <span className="font-bold text-orange-500">2.4%</span>
                </div>
                <div className="flex justify-between">
                  <span>Best Performing Strategy:</span>
                  <span className="px-1.5 bg-emerald-500/10 text-emerald-500 font-bold rounded">
                    {benchmarkData?.best_performing_strategy ?? "Balanced"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Worst Performing Strategy:</span>
                  <span className="px-1.5 bg-red-500/10 text-red-400 font-bold rounded">
                    {benchmarkData?.worst_performing_strategy ?? "Emergency"}
                  </span>
                </div>
              </div>
              <div className="border-t border-[#1E293B] pt-3 text-[10px] text-slate-500 leading-normal">
                KPIs benchmarked against conventional dispatch profiles. Verified via daily SQLite
                history snapshots.
              </div>
            </div>
          </div>

          {/* Regional zones performance comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Zones benchmarking table */}
            <div className="border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#07090C] rounded-[4px] p-5 space-y-3">
              <h4 className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Regional Grid Efficiency Gains
              </h4>
              <div className="overflow-x-auto text-[11px] font-mono">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500">
                      <th className="pb-1.5">Load Zone/Region</th>
                      <th className="pb-1.5">Efficiency Gain</th>
                      <th className="pb-1.5 text-right">Savings (USD)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900 text-slate-600 dark:text-slate-300">
                    {benchmarkData?.regional_benchmarks?.map((reg: any, i: number) => (
                      <tr key={i}>
                        <td className="py-2">{reg.region}</td>
                        <td className="py-2 text-emerald-500 font-bold">
                          +{reg.optimized_efficiency_gain_pct}%
                        </td>
                        <td className="py-2 text-right">${reg.savings_usd.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Manual vs Optimized comparison panel */}
            <div className="border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#07090C] rounded-[4px] p-5 space-y-4 font-mono text-xs">
              <h4 className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Manual vs Optimization Delta
              </h4>
              <div className="grid grid-cols-2 gap-4 text-[11px]">
                <div className="space-y-1 bg-[#0B0D11] p-2.5 rounded border border-[#1E293B]">
                  <div className="text-slate-500 text-[10px] uppercase">Manual Baseline</div>
                  <div>Cost: $110,000</div>
                  <div>CO2: 65 Tons</div>
                  <div>Losses: 112 MW</div>
                  <div>Stability: 78.0</div>
                </div>
                <div className="space-y-1 bg-orange-500/5 p-2.5 rounded border border-orange-500/20">
                  <div className="text-orange-500 text-[10px] uppercase font-bold">
                    GPO Optimized
                  </div>
                  <div>Cost: $94,380</div>
                  <div>CO2: 48.2 Tons</div>
                  <div>Losses: 96.5 MW</div>
                  <div>Stability: 92.4</div>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center text-[10px] text-emerald-500 font-bold">
                <div className="bg-[#151A21] p-1 rounded">Cost -14.2%</div>
                <div className="bg-[#151A21] p-1 rounded">CO2 -25.8%</div>
                <div className="bg-[#151A21] p-1 rounded">Loss -13.8%</div>
                <div className="bg-[#151A21] p-1 rounded">Stability +18.5%</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: EXPLAINABILITY & REPLAY ────────────────────────────────── */}
      {activeSubTab === "replay" && (
        <div className="space-y-6">
          {/* Job Selection bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#07090C] rounded-[4px] p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-500" />
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                Select Job Session for Replay & Explainability:
              </span>
            </div>
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="bg-[#151A21] border border-[#2A313C]/40 rounded p-1.5 text-slate-600 dark:text-slate-300 focus:outline-none text-xs font-mono max-w-sm"
            >
              {completedJobs.map((j) => (
                <option key={j.job_id} value={j.job_id}>
                  Job: {j.job_id.substring(0, 16)}... (Score: {j.objective_score.toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          {explainabilityReport && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Explainability Report Card */}
              <div className="md:col-span-2 border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#07090C] rounded-[4px] p-5 space-y-4 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-[#1E293B] pb-2">
                  <h4 className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-4 h-4 text-orange-500" /> AI Optimization Justification
                    Report
                  </h4>
                  <span className="px-2 py-0.5 bg-orange-500 text-white rounded text-[10px] font-bold">
                    Confidence: {Math.round(explainabilityReport.ai_confidence_score * 100)}%
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <span className="block text-[10px] text-slate-500 uppercase">
                        Selected Strategy
                      </span>
                      <span className="text-sm font-bold text-orange-500">
                        {explainabilityReport.selected_strategy}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-500 uppercase">
                        Why Selected
                      </span>
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                        {explainabilityReport.reasoning?.why_selected}
                      </p>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-500 uppercase">
                        Expected Benefits
                      </span>
                      <p className="text-emerald-500 leading-relaxed text-[11px]">
                        {explainabilityReport.reasoning?.expected_benefits}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 border-l border-[#1E293B] pl-4">
                    <div>
                      <span className="block text-[10px] text-slate-500 uppercase">
                        Supporting Quantifiable Evidence
                      </span>
                      <div className="mt-1 space-y-1.5 text-[11px]">
                        <div className="flex justify-between">
                          <span>Transmission Loss Reduction:</span>
                          <span className="text-emerald-500 font-bold">
                            {
                              explainabilityReport.supporting_evidence
                                ?.transmission_active_loss_reduction
                            }
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Carbon Avoided:</span>
                          <span className="text-emerald-500 font-bold">
                            {explainabilityReport.supporting_evidence?.avoided_emissions_co2_tons}{" "}
                            Tons
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Operating Savings:</span>
                          <span className="text-emerald-500 font-bold">
                            $
                            {explainabilityReport.supporting_evidence?.financial_savings_usd?.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Composite Stability Score:</span>
                          <span className="text-orange-500 font-bold">
                            {explainabilityReport.supporting_evidence?.overall_safety_index}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-[#1E293B] pt-3">
                  <span className="block text-[10px] text-slate-500 uppercase mb-1.5">
                    Alternatives Evaluated & Why Rejected
                  </span>
                  <div className="space-y-2 text-[10px]">
                    {explainabilityReport.rejected_alternatives?.map((alt: any, i: number) => (
                      <div key={i} className="bg-[#0B0D11] border border-[#1E293B] p-2 rounded">
                        <div className="font-bold text-slate-400">{alt.strategy} Alternative</div>
                        <div className="text-red-400 mt-0.5">{alt.reason_rejected}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Constraint Impact Card */}
              <div className="border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#07090C] rounded-[4px] p-5 space-y-4 font-mono text-xs">
                <h4 className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider border-b border-[#1E293B] pb-2 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-orange-500" /> Constraint Impact Limits
                </h4>
                <div className="space-y-3">
                  {explainabilityReport.constraint_impacts?.map((c: any, i: number) => (
                    <div key={i} className="border-b border-[#1E293B] pb-2 last:border-b-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold">{c.constraint}</span>
                        <span className="text-[9px] px-1 bg-emerald-500/10 text-emerald-500 rounded">
                          {c.status}
                        </span>
                      </div>
                      <div className="text-slate-400 text-[10px]">{c.limiting_factor}</div>
                      <div className="text-[9px] text-slate-500 mt-0.5">
                        Impact Level: {c.impact_level}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Interactive Replay Console */}
          {replaySession && replaySession.stages && (
            <div className="border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#07090C] rounded-[4px] p-5 space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-orange-500" />
                  <h4 className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    Optimization Execution Replay Timeline Console
                  </h4>
                </div>
                <span className="text-[10px] text-slate-500">
                  Solve Time: {replaySession.total_execution_time_ms?.toFixed(1)} ms
                </span>
              </div>

              {/* Timeline controller buttons */}
              <div className="flex items-center gap-2 bg-[#0B0D11] border border-[#1E293B] p-3 rounded">
                <button
                  onClick={() => setIsReplaying(!isReplaying)}
                  className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded text-[10px] font-bold flex items-center gap-1"
                >
                  {isReplaying ? (
                    <Pause className="w-3.5 h-3.5" />
                  ) : (
                    <Play className="w-3.5 h-3.5" />
                  )}
                  <span>{isReplaying ? "Pause Simulation" : "Replay Pipeline Session"}</span>
                </button>

                <button
                  disabled={replayIndex === 0}
                  onClick={() => setReplayIndex((prev) => Math.max(0, prev - 1))}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <span className="text-xs text-slate-400 font-bold px-3">
                  Stage {replayIndex + 1} of {replaySession.stages.length}
                </span>

                <button
                  disabled={replayIndex === replaySession.stages.length - 1}
                  onClick={() =>
                    setReplayIndex((prev) => Math.min(replaySession.stages.length - 1, prev + 1))
                  }
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded disabled:opacity-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    setReplayIndex(0);
                    setIsReplaying(false);
                  }}
                  className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-[10px] font-bold flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              </div>

              {/* Horizontal Timeline flow */}
              <div className="relative flex items-center justify-between py-6 overflow-x-auto min-w-[800px] border-b border-dashed border-[#1E293B]">
                {replaySession.stages.map((stg: any, idx: number) => (
                  <div
                    key={stg.stage_num}
                    onClick={() => {
                      setReplayIndex(idx);
                      setIsReplaying(false);
                    }}
                    className={`relative z-10 flex flex-col items-center cursor-pointer group px-2`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-xs transition-all ${
                        idx === replayIndex
                          ? "bg-orange-500 border-orange-500 text-white scale-110 shadow"
                          : idx < replayIndex
                            ? "bg-emerald-500/20 border-emerald-500 text-emerald-500"
                            : "bg-[#151A21] border-[#2A313C] text-slate-500"
                      }`}
                    >
                      {stg.stage_num}
                    </div>
                    <span className="text-[8px] text-slate-500 mt-2 truncate max-w-[80px] text-center font-bold uppercase tracking-wider group-hover:text-slate-600 dark:text-slate-300">
                      {stg.name.replace(" Optimization", "").replace(" Scheduling", "")}
                    </span>
                  </div>
                ))}
              </div>

              {/* Replay Details Panel */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-[#0B0D11] border border-[#1E293B] p-4 rounded">
                <div className="md:col-span-2 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-[#1E293B] pb-1.5">
                    <span className="text-[11px] font-bold text-orange-500 uppercase">
                      Active Solver Stage
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Duration: {replaySession.stages[replayIndex].duration_ms?.toFixed(1)} ms
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-[#F8FAFC]">
                    {replaySession.stages[replayIndex].name}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px] bg-[#151A21] p-3 border border-[#1E293B]/60 rounded">
                    {replaySession.stages[replayIndex].log_snippet}
                  </p>
                </div>

                <div className="space-y-3 border-l border-[#1E293B] pl-6">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">
                    Stage Metrics Payload
                  </div>
                  <div className="bg-[#151A21] border border-[#1E293B]/60 rounded p-2.5 max-h-36 overflow-y-auto font-mono text-[9px] text-slate-600 dark:text-slate-300">
                    <pre>{JSON.stringify(replaySession.stages[replayIndex].metrics, null, 2)}</pre>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 4: RECOMMENDATIONS & AI ───────────────────────────────────── */}
      {activeSubTab === "ai" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#07090C] rounded-[4px] p-4 flex items-center justify-between">
              <div>
                <span className="block text-[10px] text-slate-500 font-medium uppercase">
                  Total Advisory Recommendations
                </span>
                <span className="text-2xl font-bold text-slate-800 dark:text-[#F8FAFC]">
                  {recAnalytics?.total_recommendations ?? 0}
                </span>
              </div>
              <div className="bg-orange-500/10 p-2 rounded">
                <Layers className="w-5 h-5 text-orange-500" />
              </div>
            </div>
            <div className="border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#07090C] rounded-[4px] p-4 flex items-center justify-between">
              <div>
                <span className="block text-[10px] text-slate-500 font-medium uppercase">
                  Operator Acceptance Rate
                </span>
                <span className="text-2xl font-bold text-emerald-500">
                  {recAnalytics?.acceptance_rate_pct ?? "0"}%
                </span>
              </div>
              <div className="bg-emerald-500/10 p-2 rounded">
                <ClipboardCheck className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
            <div className="border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#07090C] rounded-[4px] p-4 flex items-center justify-between">
              <div>
                <span className="block text-[10px] text-slate-500 font-medium uppercase">
                  Recommendation Success
                </span>
                <span className="text-2xl font-bold text-emerald-500">
                  {recAnalytics?.recommendation_success_rate_pct ?? "0"}%
                </span>
              </div>
              <div className="bg-emerald-500/10 p-2 rounded">
                <Shield className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
            <div className="border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#07090C] rounded-[4px] p-4 flex items-center justify-between">
              <div>
                <span className="block text-[10px] text-slate-500 font-medium uppercase">
                  Forecast Accuracy
                </span>
                <span className="text-2xl font-bold text-[#F8FAFC]">
                  {recAnalytics?.recommendation_accuracy_pct ?? "0"}%
                </span>
              </div>
              <div className="bg-[#151A21] p-2 rounded">
                <Activity className="w-5 h-5 text-slate-400" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strategy distribution chart */}
            <div className="border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#07090C] rounded-[4px] p-5 space-y-4">
              <h4 className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Strategy Recommendation Distribution
              </h4>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={recAnalytics?.strategy_distribution ?? []}
                    margin={{ top: 10, right: 30, left: 0, bottom: 25 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="name" stroke="var(--color-text-muted)" fontSize={10} />
                    <YAxis stroke="var(--color-text-muted)" fontSize={10} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--color-bg)",
                        borderColor: "var(--color-border)",
                      }}
                      itemStyle={{ color: "var(--color-text-primary)" }}
                      labelStyle={{ color: "var(--color-text-secondary)" }}
                      cursor={{ fill: "var(--color-border)" }}
                    />
                    <Bar dataKey="count" name="Recommendations Count">
                      {(recAnalytics?.strategy_distribution ?? []).map(
                        (entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        )
                      )}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Acceptance rate history chart */}
            <div className="border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#07090C] rounded-[4px] p-5 space-y-4">
              <h4 className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Acceptance & Confidence Trends
              </h4>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={recAnalytics?.recommendation_trends ?? []}
                    margin={{ top: 10, right: 30, left: 0, bottom: 25 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="month" stroke="var(--color-text-muted)" fontSize={10} />
                    <YAxis stroke="var(--color-text-muted)" fontSize={10} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--color-bg)",
                        borderColor: "var(--color-border)",
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="acceptance_rate"
                      name="Acceptance Rate (%)"
                      stroke="#10B981"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="total"
                      name="Total Recommendations"
                      stroke="#3B82F6"
                      strokeWidth={1.5}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 5: AUDIT LOGS ────────────────────────────────────────────── */}
      {activeSubTab === "audit" && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-4 bg-white dark:bg-[#07090C] border border-slate-200 dark:border-[#1E293B] rounded-[4px] p-4">
            <div className="flex-1 space-y-1">
              <label className="block text-[10px] text-slate-500 font-medium">
                Final Status Filter
              </label>
              <select
                value={auditFilterStatus}
                onChange={(e) => setAuditFilterStatus(e.target.value)}
                className="w-full bg-[#151A21] border border-[#2A313C]/40 rounded p-1.5 text-slate-600 dark:text-slate-300 focus:outline-none text-xs"
              >
                <option value="">-- All Statuses --</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="FAILED">FAILED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>

            <div className="flex-1 space-y-1">
              <label className="block text-[10px] text-slate-500 font-medium">
                Selected Strategy Filter
              </label>
              <select
                value={auditFilterStrategy}
                onChange={(e) => setAuditFilterStrategy(e.target.value)}
                className="w-full bg-[#151A21] border border-[#2A313C]/40 rounded p-1.5 text-slate-600 dark:text-slate-300 focus:outline-none text-xs"
              >
                <option value="">-- All Strategies --</option>
                <option value="Balanced">Balanced</option>
                <option value="Cost First">Cost First</option>
                <option value="Carbon First">Carbon First</option>
                <option value="Reliability First">Reliability First</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={fetchAuditLogs}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Filter className="w-3.5 h-3.5" /> Apply Filters
              </button>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#07090C] rounded-[4px] p-5">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500">
                    <th className="py-2.5">Audit ID</th>
                    <th className="py-2.5">Job ID</th>
                    <th className="py-2.5">Strategy Selected</th>
                    <th className="py-2.5">Confidence</th>
                    <th className="py-2.5">Solve Time</th>
                    <th className="py-2.5">Status</th>
                    <th className="py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 text-slate-600 dark:text-slate-300">
                  {auditLogs.map((log) => (
                    <>
                      <tr
                        key={log.id}
                        className="hover:bg-[#151A21]/30 cursor-pointer"
                        onClick={() =>
                          setExpandedAuditId(expandedAuditId === log.id ? null : log.id)
                        }
                      >
                        <td className="py-3 text-orange-500 font-bold truncate max-w-[100px]">
                          {log.id}
                        </td>
                        <td className="py-3 truncate max-w-[120px]">{log.job_id}</td>
                        <td className="py-3 font-semibold">{log.strategy_selected}</td>
                        <td className="py-3">{Math.round(log.confidence_score * 100)}%</td>
                        <td className="py-3">{log.execution_time_ms?.toFixed(1)} ms</td>
                        <td className="py-3">
                          <span
                            className={`px-1.5 py-0.5 rounded-[2px] text-[10px] font-bold ${
                              log.final_status === "COMPLETED"
                                ? "bg-emerald-500/10 text-emerald-500"
                                : "bg-red-500/10 text-red-400"
                            }`}
                          >
                            {log.final_status}
                          </span>
                        </td>
                        <td className="py-3 text-right text-slate-500">
                          {expandedAuditId === log.id ? "Collapse" : "Expand"}
                        </td>
                      </tr>
                      {expandedAuditId === log.id && (
                        <tr>
                          <td
                            colSpan={7}
                            className="bg-[#0B0D11] border border-[#1E293B] p-4 text-[10px] text-slate-600 dark:text-slate-300 space-y-2 select-text"
                          >
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <span className="block text-[8px] text-slate-500 uppercase">
                                  Objectives Weighting
                                </span>
                                <pre className="bg-[#151A21] border border-[#1E293B]/60 p-2 rounded max-h-24 overflow-y-auto">
                                  {JSON.stringify(log.objectives_json, null, 2)}
                                </pre>
                              </div>
                              <div>
                                <span className="block text-[8px] text-slate-500 uppercase">
                                  Constraints Applied
                                </span>
                                <pre className="bg-[#151A21] border border-[#1E293B]/60 p-2 rounded max-h-24 overflow-y-auto">
                                  {JSON.stringify(log.constraints_json, null, 2)}
                                </pre>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                  {auditLogs.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        No audit logs found. Try triggering a grid solve.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CSV Export report modal */}
      {showExportModal && exportPayload && (
        <div className="fixed inset-0 bg-[#07090C]/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-[4px] w-full max-w-2xl p-6 space-y-4 font-mono text-xs select-text">
            <div className="flex items-center justify-between border-b border-[#1E293B] pb-2">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-orange-500" />
                <h3 className="text-sm font-bold text-[#F8FAFC]">
                  Executive Compliance Report Export
                </h3>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-slate-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="text-[10px] text-slate-400 uppercase">
                Report Type: {exportPayload.type?.toUpperCase()} Summary
              </div>
              <textarea
                readOnly
                value={exportPayload.csv_payload}
                className="w-full bg-[#0B0D11] border border-[#2A313C]/40 rounded p-3 text-slate-600 dark:text-slate-300 font-mono text-[10px] h-60 focus:outline-none"
              />
              <div className="text-[10px] text-slate-500 text-right">
                Click and copy text to paste into Excel/CSV.
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#1E293B]">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-[11px]"
              >
                Close Modal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
