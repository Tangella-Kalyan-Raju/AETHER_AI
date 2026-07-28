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
} from "recharts";
import {
  Zap,
  Play,
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
} from "lucide-react";

export default function OptimizationDashboard() {
  const [configs, setConfigs] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);

  // Create config fields
  const [configName, setConfigName] = useState("Economic Grid Dispatch");
  const [mode, setMode] = useState("ECONOMIC");
  const [costWeight, setCostWeight] = useState(0.6);
  const [carbonWeight, setCarbonWeight] = useState(0.2);
  const [stabilityWeight, setStabilityWeight] = useState(0.2);

  // Selected config/job/results for detail
  const [selectedConfigId, setSelectedConfigId] = useState("");
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [detailedResults, setDetailedResults] = useState<any | null>(null);
  const [financialResults, setFinancialResults] = useState<any | null>(null);
  const [decisionResults, setDecisionResults] = useState<any | null>(null);
  const [activeLogs, setActiveLogs] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"jobs" | "history">("jobs");
  const [resultsTab, setResultsTab] = useState<"engineering" | "financial" | "decisions">(
    "engineering"
  );

  // What-If Sandbox states
  const [whatIfSituation, setWhatIfSituation] = useState("solar_drop");
  const [whatIfChange, setWhatIfChange] = useState(-25);
  const [whatIfLoading, setWhatIfLoading] = useState(false);
  const [whatIfResult, setWhatIfResult] = useState<any | null>(null);

  // Export report states
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportPayload, setExportPayload] = useState<any | null>(null);

  useEffect(() => {
    fetchConfigs();
    fetchJobs();
    fetchHistory();
  }, []);

  // Poll running jobs status
  useEffect(() => {
    const interval = setInterval(() => {
      const runningJobs = jobs.some((j) => j.status === "RUNNING" || j.status === "QUEUED");
      if (runningJobs) {
        fetchJobs();
        fetchHistory();
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [jobs]);

  // Retrieve logs and results for selected job
  useEffect(() => {
    if (selectedJobId) {
      const match = history.find((h) => h.job_id === selectedJobId);
      if (match) {
        fetchLogs(match.id);
      }
      fetchDetailedResults(selectedJobId);
      fetchFinancialResults(selectedJobId);
      fetchDecisionResults(selectedJobId);
    } else {
      setDetailedResults(null);
      setFinancialResults(null);
      setDecisionResults(null);
      setActiveLogs("Select an active job or history record to load process parameters.");
    }
  }, [selectedJobId, history]);

  const fetchConfigs = async () => {
    try {
      const res = await api.get("/api/v1/optimization/configs");
      setConfigs(res.data);
      if (res.data.length > 0 && !selectedConfigId) {
        setSelectedConfigId(res.data[0].id);
      }
    } catch (e) {
      console.error("Error fetching configs", e);
    }
  };

  const fetchJobs = async () => {
    try {
      const res = await api.get("/api/v1/optimization/jobs");
      setJobs(res.data);
    } catch (e) {
      console.error("Error fetching jobs", e);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await api.get("/api/v1/optimization/history");
      setHistory(res.data);
    } catch (e) {
      console.error("Error fetching history", e);
    }
  };

  const fetchLogs = async (historyId: string) => {
    try {
      const res = await api.get(`/api/v1/optimization/history/${historyId}/logs`);
      setActiveLogs(res.data.logs || "No process logs available.");
    } catch (e) {
      console.error("Error fetching logs", e);
    }
  };

  const fetchDetailedResults = async (jobId: string) => {
    try {
      const res = await api.get(`/api/v1/optimization/results/${jobId}`);
      setDetailedResults(res.data);
    } catch (e) {
      setDetailedResults(null);
    }
  };

  const fetchFinancialResults = async (jobId: string) => {
    try {
      const res = await api.get(`/api/v1/optimization/results/financial/${jobId}`);
      setFinancialResults(res.data);
    } catch (e) {
      setFinancialResults(null);
    }
  };

  const fetchDecisionResults = async (jobId: string) => {
    try {
      const res = await api.get(`/api/v1/optimization/results/decisions/${jobId}`);
      setDecisionResults(res.data);
    } catch (e) {
      setDecisionResults(null);
    }
  };

  const handleCreateConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configName) return;
    setLoading(true);
    try {
      const payload = {
        name: configName,
        mode: mode,
        constraints: ["Frequency", "Voltage", "ThermalLimits", "CarbonCeiling", "BatterySOC"],
        objectives: [
          { name: "CostMinimization", weight: costWeight },
          { name: "CarbonReduction", weight: carbonWeight },
          { name: "GridStability", weight: stabilityWeight },
        ],
      };
      const res = await api.post("/api/v1/optimization/configs", payload);
      await fetchConfigs();
      setSelectedConfigId(res.data.config_id);
      alert("Solver configuration registered successfully.");
      setConfigName("");
    } catch (e) {
      alert("Failed to save configuration.");
    } finally {
      setLoading(false);
    }
  };

  const handleLaunchJob = async () => {
    if (!selectedConfigId) {
      alert("Please select a solver configuration first.");
      return;
    }
    try {
      const res = await api.post("/api/v1/optimization/jobs", {
        config_id: selectedConfigId,
        priority: "HIGH",
      });
      const jobId = res.data.job_id;
      await api.post(`/api/v1/optimization/jobs/${jobId}/start`);
      setSelectedJobId(jobId);
      await fetchJobs();
    } catch (e) {
      alert("Failed to queue optimization task.");
    }
  };

  const handleCancelJob = async (jobId: string) => {
    try {
      await api.post(`/api/v1/optimization/jobs/${jobId}/cancel`);
      await fetchJobs();
    } catch (e) {
      alert("Failed to cancel running job.");
    }
  };

  const handleRestartJob = async (jobId: string) => {
    try {
      const res = await api.post(`/api/v1/optimization/jobs/${jobId}/restart`);
      setSelectedJobId(res.data.job_id);
      await fetchJobs();
    } catch (e) {
      alert("Failed to restart job.");
    }
  };

  // Trigger individual sub-solver modules on-demand
  const handleTriggerSolver = async (module: string) => {
    try {
      const res = await api.post(`/api/v1/optimization/execute/${module}`);
      setActiveLogs(
        `[ON-DEMAND RUN: ${module.toUpperCase()}]\n` + JSON.stringify(res.data, null, 2)
      );
    } catch (e) {
      alert(`Failed to trigger ${module} solver.`);
    }
  };

  // Trigger What-If analysis
  const handleTriggerWhatIf = async () => {
    setWhatIfLoading(true);
    try {
      const res = await api.post(
        `/api/v1/optimization/execute/what-if?situation=${whatIfSituation}&value_change_pct=${whatIfChange}`
      );
      setWhatIfResult(res.data);
    } catch (e) {
      alert("Failed to evaluate sandbox what-if scenario.");
    } finally {
      setWhatIfLoading(false);
    }
  };

  // Fetch exportable decision report
  const handleExportReport = async () => {
    if (!selectedJobId) return;
    try {
      const res = await api.get(`/api/v1/optimization/reports/decision/${selectedJobId}/export`);
      setExportPayload(res.data);
      setShowExportModal(true);
    } catch (e) {
      alert("Failed to fetch decision export report.");
    }
  };

  // Data helpers for Recharts (Engineering Panel)
  const getFeederData = () => {
    if (!detailedResults?.load_balancing?.feeders) return [];
    return detailedResults.load_balancing.feeders.map((f: any) => ({
      name: f.name.replace(" Feeder", ""),
      Current: f.current_load,
      Optimized: f.optimized_load,
    }));
  };

  const getBatterySOCData = () => {
    let schedules = [];
    if (Array.isArray(detailedResults?.battery_schedules)) {
      schedules = detailedResults.battery_schedules;
    } else if (Array.isArray(detailedResults?.battery_schedules?.battery_schedules)) {
      schedules = detailedResults.battery_schedules.battery_schedules;
    }

    if (schedules.length === 0) return [];
    const b = schedules[0]; // Render first battery
    return b.hourly_soc_pct.map((soc: number, hour: number) => ({
      hour: `${hour}:00`,
      SOC: soc,
      Action: b.hourly_schedule_mw[hour],
    }));
  };

  const getPeakShavingData = () => {
    if (!detailedResults?.peak_shaving?.hourly_load_profile) return [];
    const p = detailedResults.peak_shaving.hourly_load_profile;
    return p.unshaved_mw.map((val: number, hour: number) => ({
      hour: `${hour}:00`,
      Baseline: val,
      Optimized: p.shaved_mw[hour],
    }));
  };

  // Data helpers for Recharts (Financial Panel)
  const getCarbonFootprintData = () => {
    if (!financialResults?.carbon_optimization?.regional_footprints) return [];
    return financialResults.carbon_optimization.regional_footprints.map((rf: any) => ({
      region: rf.region.replace(" Feeder Zone", "").replace(" Load Hub", ""),
      Baseline: rf.co2_before_tons,
      Optimized: rf.co2_after_tons,
    }));
  };

  const getMarketPriceArbitrageData = () => {
    if (!financialResults?.market_price_profile?.hourly_prices_usd) return [];
    const prices = financialResults.market_price_profile.hourly_prices_usd;

    let schedules = [];
    if (Array.isArray(detailedResults?.battery_schedules)) {
      schedules = detailedResults.battery_schedules;
    } else if (Array.isArray(detailedResults?.battery_schedules?.battery_schedules)) {
      schedules = detailedResults.battery_schedules.battery_schedules;
    }

    const batActions = schedules.length ? schedules[0].hourly_schedule_mw : Array(24).fill(0);

    return prices.map((price: number, hour: number) => ({
      hour: `${hour}:00`,
      Price: price,
      BatteryAction: batActions[hour],
    }));
  };

  // Data helpers for Recharts (Decision Panel)
  const getStrategyComparisonData = () => {
    if (!decisionResults?.strategies) return [];
    return decisionResults.strategies.map((s: any) => ({
      name: s.name,
      Cost: Math.round(s.operating_cost_usd / 1000),
      CO2: s.carbon_emissions_tons,
      Stability: s.grid_stability_score,
      Reliability: s.reliability_score,
    }));
  };

  const [selectedStrategy, setSelectedStrategy] = useState<string | null>("Economic Cost");

  const handleSelectStrategy = (strat: string, modeVal: string) => {
    setSelectedStrategy(strat);
    setMode(modeVal);
    // Pre-configure solver weights depending on strategy chosen
    if (modeVal === "ECONOMIC") {
      setCostWeight(0.8);
      setCarbonWeight(0.1);
      setStabilityWeight(0.1);
    } else if (modeVal === "CARBON") {
      setCostWeight(0.2);
      setCarbonWeight(0.7);
      setStabilityWeight(0.1);
    } else {
      setCostWeight(0.2);
      setCarbonWeight(0.2);
      setStabilityWeight(0.6);
    }

    // Auto-select config matching the mode
    const matched = configs.find(
      (c) => c.mode === modeVal || (modeVal === "CARBON" && c.mode === "GREEN")
    );
    if (matched) {
      setSelectedConfigId(matched.id);
    }
  };

  return (
    <div className="space-y-6 text-slate-300 font-sans select-text">
      {/* Header */}
      <section className="border-b border-slate-200 dark:border-[#1E293B] pb-4">
        <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 tracking-widest uppercase mb-1.5">
          Operational Optimization // Multi-Objective Decision Engine
        </p>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-[#F8FAFC]">
          Multi-Objective Solver Dashboard
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Select an active optimization strategy below to align solver goals, customize weights, and
          initiate runs.
        </p>
      </section>

      {/* Strategy selector cards at the top */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Economic Card */}
        <div
          onClick={() => handleSelectStrategy("Economic Cost", "ECONOMIC")}
          className={`p-4 border rounded-[4px] cursor-pointer transition-all space-y-2.5 ${selectedStrategy === "Economic Cost" ? "border-orange-500 bg-orange-500/5 shadow-md" : "border-slate-200 dark:border-[#1E293B]/60 bg-white dark:bg-[#07090C]/40 hover:border-slate-350 dark:hover:border-slate-700"}`}
        >
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${selectedStrategy === "Economic Cost" ? "bg-orange-500 text-white" : "bg-orange-500/10 text-orange-500"}`}
            >
              <DollarSign className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-slate-850 dark:text-slate-200 uppercase tracking-wider font-mono">
              Economic Load Dispatch
            </h3>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
            Optimize power generation dispatch profiles across all active generators to minimize
            total system marginal costs.
          </p>
          <div className="border-t border-slate-850/60 pt-2 text-[10px] text-slate-400">
            <span className="font-bold text-orange-500">Advantage:</span> Minimizes generator
            fuel-cost, reducing operational dispatch and line congestion costs.
          </div>
        </div>

        {/* Carbon Card */}
        <div
          onClick={() => handleSelectStrategy("Carbon Emissions", "CARBON")}
          className={`p-4 border rounded-[4px] cursor-pointer transition-all space-y-2.5 ${selectedStrategy === "Carbon Emissions" ? "border-emerald-500 bg-emerald-500/5 shadow-md" : "border-slate-200 dark:border-[#1E293B]/60 bg-white dark:bg-[#07090C]/40 hover:border-slate-350 dark:hover:border-slate-700"}`}
        >
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${selectedStrategy === "Carbon Emissions" ? "bg-emerald-500 text-white" : "bg-emerald-500/10 text-emerald-500"}`}
            >
              <Leaf className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-slate-850 dark:text-slate-200 uppercase tracking-wider font-mono">
              Carbon Emissions Reduction
            </h3>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
            Prioritize carbon-free wind and solar dispatch. Keep fossil fuel peaker units offline
            within network constraints.
          </p>
          <div className="border-t border-slate-850/60 pt-2 text-[10px] text-slate-400">
            <span className="font-bold text-emerald-500">Advantage:</span> Maximizes renewable
            energy utilization, significantly reducing total carbon tax penalties.
          </div>
        </div>

        {/* Line Congestion / Stability Card */}
        <div
          onClick={() => handleSelectStrategy("Line Load / Stability", "STABILITY")}
          className={`p-4 border rounded-[4px] cursor-pointer transition-all space-y-2.5 ${selectedStrategy === "Line Load / Stability" ? "border-purple-500 bg-purple-500/5 shadow-md" : "border-slate-200 dark:border-[#1E293B]/60 bg-white dark:bg-[#07090C]/40 hover:border-slate-350 dark:hover:border-slate-700"}`}
        >
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${selectedStrategy === "Line Load / Stability" ? "bg-purple-500 text-white" : "bg-purple-500/10 text-purple-500"}`}
            >
              <Zap className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-slate-850 dark:text-slate-200 uppercase tracking-wider font-mono">
              Line Congestion Alleviation
            </h3>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
            Mitigate overload risks on Tahoe transmission lines and stabilize reactive voltage
            profiles.
          </p>
          <div className="border-t border-slate-850/60 pt-2 text-[10px] text-slate-400">
            <span className="font-bold text-purple-500">Advantage:</span> Safely alleviates
            transmission congestion and guarantees NERC frequency margins.
          </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Column 1: Config Panel & Solver Actions */}
        <div className="lg:col-span-1 space-y-6">
          <div className="border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#07090C] rounded-[4px] p-5 space-y-5">
            <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Settings className="w-4 h-4 text-orange-500" /> Solver Configurations
            </h3>

            {/* Launch Selector */}
            <div className="space-y-3">
              <label className="block text-[10px] text-slate-400 font-medium">
                Select Target Config
              </label>
              <select
                value={selectedConfigId}
                onChange={(e) => setSelectedConfigId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#151A21] border border-slate-200 dark:border-[#2A313C]/40 rounded-[3px] p-2 text-xs text-slate-300 focus:outline-none"
              >
                <option value="">-- Choose Solver Config --</option>
                {configs.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.mode})
                  </option>
                ))}
              </select>
              <button
                onClick={handleLaunchJob}
                className="w-full px-4 py-2 bg-orange-500 hover:bg-orange-600 font-bold text-xs rounded text-white flex items-center justify-center gap-2 shadow-sm"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Run Grid Solver</span>
              </button>
            </div>

            {/* Config Creation Form */}
            <form
              onSubmit={handleCreateConfig}
              className="border-t border-slate-100 dark:border-[#1E293B] pt-4 space-y-3"
            >
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Create Solver Config
              </div>
              <div>
                <input
                  type="text"
                  placeholder="e.g. Balanced Load Solver"
                  value={configName}
                  onChange={(e) => setConfigName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#151A21] border border-slate-200 dark:border-[#2A313C]/40 rounded-[3px] p-2 text-xs text-slate-300 focus:outline-none"
                />
              </div>
              <div>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#151A21] border border-slate-200 dark:border-[#2A313C]/40 rounded-[3px] p-2 text-xs text-slate-300 focus:outline-none"
                >
                  <option value="BALANCED">Balanced Mode</option>
                  <option value="ECONOMIC">Economic Dispatch</option>
                  <option value="GREEN">Renewable Maximization</option>
                  <option value="STABILITY">Grid Stabilization</option>
                </select>
              </div>

              {/* Weight sliders */}
              <div className="space-y-3 pt-1">
                <div>
                  <div className="flex justify-between text-[9px] text-slate-400 mb-1">
                    <span>Cost Minimization</span>
                    <span>{Math.round(costWeight * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={costWeight}
                    onChange={(e) => setCostWeight(parseFloat(e.target.value))}
                    className="w-full accent-orange-500 bg-slate-200 dark:bg-[#1C222B]"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[9px] text-slate-400 mb-1">
                    <span>Carbon Reduction</span>
                    <span>{Math.round(carbonWeight * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={carbonWeight}
                    onChange={(e) => setCarbonWeight(parseFloat(e.target.value))}
                    className="w-full accent-orange-500 bg-slate-200 dark:bg-[#1C222B]"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[9px] text-slate-400 mb-1">
                    <span>Grid Stability</span>
                    <span>{Math.round(stabilityWeight * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={stabilityWeight}
                    onChange={(e) => setStabilityWeight(parseFloat(e.target.value))}
                    className="w-full accent-orange-500 bg-slate-200 dark:bg-[#1C222B]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded border border-slate-700 text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Save Solver Profile</span>
              </button>
            </form>
          </div>

          {/* Trigger Sub-Solvers directly */}
          <div className="border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#07090C] rounded-[4px] p-5 space-y-3">
            <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Cpu className="w-4 h-4 text-orange-500" /> Modular Solvers
            </h3>
            <p className="text-[10px] text-slate-500">
              Trigger individual solvers directly inside twin sandbox
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => handleTriggerSolver("load-balancing")}
                className="px-2 py-1 bg-slate-100 dark:bg-[#151A21] border border-slate-200 dark:border-[#2A313C]/40 text-[9px] text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1C222B] rounded"
              >
                Load Balance
              </button>
              <button
                onClick={() => handleTriggerSolver("power-flow")}
                className="px-2 py-1 bg-slate-100 dark:bg-[#151A21] border border-slate-200 dark:border-[#2A313C]/40 text-[9px] text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1C222B] rounded"
              >
                Power Flow
              </button>
              <button
                onClick={() => handleTriggerSolver("battery")}
                className="px-2 py-1 bg-slate-100 dark:bg-[#151A21] border border-slate-200 dark:border-[#2A313C]/40 text-[9px] text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1C222B] rounded"
              >
                Battery Sch
              </button>
              <button
                onClick={() => handleTriggerSolver("renewable")}
                className="px-2 py-1 bg-slate-100 dark:bg-[#151A21] border border-slate-200 dark:border-[#2A313C]/40 text-[9px] text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1C222B] rounded"
              >
                Renewables
              </button>
              <button
                onClick={() => handleTriggerSolver("cost-optimization")}
                className="px-2 py-1 bg-slate-100 dark:bg-[#151A21] border border-slate-200 dark:border-[#2A313C]/40 text-[9px] text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1C222B] rounded"
              >
                Economic Disp
              </button>
              <button
                onClick={() => handleTriggerSolver("carbon-optimization")}
                className="px-2 py-1 bg-slate-100 dark:bg-[#151A21] border border-slate-200 dark:border-[#2A313C]/40 text-[9px] text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1C222B] rounded"
              >
                CO2 Offset
              </button>
              <button
                onClick={() => handleTriggerSolver("multi-objective")}
                className="px-2 py-1 bg-slate-100 dark:bg-[#151A21] border border-slate-200 dark:border-[#2A313C]/40 text-[9px] text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1C222B] rounded"
              >
                Multi-Obj
              </button>
            </div>
          </div>
        </div>

        {/* Column 2 & 3 & 4: Live Results & Analytics */}
        <div className="lg:col-span-3 space-y-6">
          {/* Toggle between Engineering, Financials, and Multi-Objective Decisions */}
          <div className="flex bg-slate-100 dark:bg-[#07090C] border border-slate-200 dark:border-[#1E293B] p-1 rounded">
            <button
              onClick={() => setResultsTab("engineering")}
              className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 rounded transition-all ${
                resultsTab === "engineering"
                  ? "bg-orange-500 text-white shadow"
                  : "text-slate-400 hover:text-slate-300"
              }`}
            >
              <Cpu className="w-3.5 h-3.5" /> Grid (Physics)
            </button>
            <button
              onClick={() => setResultsTab("financial")}
              className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 rounded transition-all ${
                resultsTab === "financial"
                  ? "bg-orange-500 text-white shadow"
                  : "text-slate-400 hover:text-slate-300"
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" /> Cost/Carbon
            </button>
            <button
              onClick={() => setResultsTab("decisions")}
              className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 rounded transition-all ${
                resultsTab === "decisions"
                  ? "bg-orange-500 text-white shadow"
                  : "text-slate-400 hover:text-slate-300"
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> Multi-Objective (Decisions)
            </button>
          </div>

          {/* ── ENGINEERING RESULTS PANEL ───────────────────────────────── */}
          {resultsTab === "engineering" && (
            <div className="space-y-6">
              {detailedResults && (
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#07090C] rounded-[4px] p-4 flex items-center justify-between">
                    <div>
                      <span className="block text-[10px] text-slate-500 font-medium uppercase">
                        Stability Score
                      </span>
                      <span className="text-2xl font-bold text-orange-500">
                        {detailedResults.overall_score}/100
                      </span>
                    </div>
                    <div className="bg-orange-500/10 p-2 rounded">
                      <Activity className="w-5 h-5 text-orange-500" />
                    </div>
                  </div>
                  <div className="border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#07090C] rounded-[4px] p-4 flex items-center justify-between">
                    <div>
                      <span className="block text-[10px] text-slate-500 font-medium uppercase">
                        Active losses
                      </span>
                      <span className="text-2xl font-bold text-emerald-500">
                        -{detailedResults.power_flow?.metrics?.active_losses_reduction_pct}%
                      </span>
                    </div>
                    <div className="bg-emerald-500/10 p-2 rounded">
                      <Cpu className="w-5 h-5 text-emerald-500" />
                    </div>
                  </div>
                  <div className="border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#07090C] rounded-[4px] p-4 flex items-center justify-between">
                    <div>
                      <span className="block text-[10px] text-slate-500 font-medium uppercase">
                        Peak Trimmed
                      </span>
                      <span className="text-2xl font-bold text-orange-500">
                        {detailedResults.peak_shaving?.shaving_contributions?.total_shaving_mw} MW
                      </span>
                    </div>
                    <div className="bg-orange-500/10 p-2 rounded">
                      <Zap className="w-5 h-5 text-orange-500" />
                    </div>
                  </div>
                  <div className="border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#07090C] rounded-[4px] p-4 flex items-center justify-between">
                    <div>
                      <span className="block text-[10px] text-slate-500 font-medium uppercase">
                        NERC compliance
                      </span>
                      <span
                        className={`text-lg font-bold ${detailedResults.reserve_margin?.metrics?.is_nerc_compliant ? "text-emerald-500" : "text-yellow-500"}`}
                      >
                        {detailedResults.reserve_margin?.metrics?.is_nerc_compliant
                          ? "COMPLIANT"
                          : "WARNING"}
                      </span>
                    </div>
                    <div className="bg-emerald-500/10 p-2 rounded">
                      <Shield className="w-5 h-5 text-emerald-500" />
                    </div>
                  </div>
                </div>
              )}

              {detailedResults?.ai_explanation && (
                <div className="bg-[#1E293B]/20 border border-[#1E293B] rounded-[4px] p-4 flex items-start gap-3">
                  <Activity className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                      AI Decision Explainability
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed font-mono">
                      {detailedResults.ai_explanation}
                    </p>
                  </div>
                </div>
              )}

              {detailedResults ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#07090C] rounded-[4px] p-4 space-y-3">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Load Balancing Feeder comparison (MW)
                    </h4>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={getFeederData()}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#2A313C" />
                          <XAxis dataKey="name" stroke="#64748B" fontSize={10} />
                          <YAxis stroke="#64748B" fontSize={10} />
                          <Tooltip
                            contentStyle={{ backgroundColor: "#0F172A", borderColor: "#1E293B" }}
                          />
                          <Legend />
                          <Bar dataKey="Current" fill="#64748B" />
                          <Bar dataKey="Optimized" fill="#F97316" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#07090C] rounded-[4px] p-4 space-y-3">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Peak Shaving Profile (MW)
                    </h4>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={getPeakShavingData()}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#2A313C" />
                          <XAxis dataKey="hour" stroke="#64748B" fontSize={8} />
                          <YAxis stroke="#64748B" fontSize={10} />
                          <Tooltip
                            contentStyle={{ backgroundColor: "#0F172A", borderColor: "#1E293B" }}
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="Baseline"
                            stroke="#64748B"
                            strokeWidth={1.5}
                            dot={false}
                          />
                          <Line
                            type="monotone"
                            dataKey="Optimized"
                            stroke="#F97316"
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#07090C] rounded-[4px] p-4 space-y-3">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Battery 24h SOC Schedule (%)
                    </h4>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={getBatterySOCData()}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#2A313C" />
                          <XAxis dataKey="hour" stroke="#64748B" fontSize={8} />
                          <YAxis stroke="#64748B" fontSize={10} />
                          <Tooltip
                            contentStyle={{ backgroundColor: "#0F172A", borderColor: "#1E293B" }}
                          />
                          <Legend />
                          <Area
                            type="monotone"
                            dataKey="SOC"
                            stroke="#F97316"
                            fill="rgba(249, 115, 22, 0.1)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#07090C] rounded-[4px] p-4 space-y-3">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Feeder Congestion Levels
                    </h4>
                    <div className="overflow-y-auto h-48 text-[11px] font-mono">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-500">
                            <th className="pb-1">Line Name</th>
                            <th className="pb-1">Baseline</th>
                            <th className="pb-1">Optimized</th>
                            <th className="pb-1">Cap</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-900 text-slate-300">
                          {detailedResults.power_flow?.transmission_lines?.map((line: any) => (
                            <tr key={line.id}>
                              <td className="py-1.5">{line.name}</td>
                              <td className="py-1.5">{line.loading_pct_before}%</td>
                              <td
                                className={`py-1.5 font-bold ${line.loading_pct_after > 85 ? "text-red-400" : "text-emerald-500"}`}
                              >
                                {line.loading_pct_after}%
                              </td>
                              <td className="py-1.5">{line.rating_mva} MVA</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#07090C] rounded-[4px] p-12 text-center text-slate-500 font-mono text-xs">
                  Select an optimization job in completed state to display the interactive 11-stage
                  grid comparative analytics.
                </div>
              )}
            </div>
          )}

          {/* ── FINANCIAL & SUSTAINABILITY RESULTS PANEL ────────────────── */}
          {resultsTab === "financial" && (
            <div className="space-y-6">
              {financialResults && (
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#07090C] rounded-[4px] p-4 flex items-center justify-between">
                    <div>
                      <span className="block text-[10px] text-slate-500 font-medium uppercase">
                        Total Savings
                      </span>
                      <span className="text-xl font-bold text-emerald-500">
                        $
                        {financialResults.cost_optimization?.metrics?.total_savings_usd?.toLocaleString()}
                      </span>
                    </div>
                    <div className="bg-emerald-500/10 p-2 rounded">
                      <DollarSign className="w-5 h-5 text-emerald-500" />
                    </div>
                  </div>
                  <div className="border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#07090C] rounded-[4px] p-4 flex items-center justify-between">
                    <div>
                      <span className="block text-[10px] text-slate-500 font-medium uppercase">
                        Avoided Emissions
                      </span>
                      <span className="text-xl font-bold text-orange-500">
                        {financialResults.carbon_optimization?.emissions?.co2_avoided_tons?.toLocaleString()}{" "}
                        tons
                      </span>
                    </div>
                    <div className="bg-orange-500/10 p-2 rounded">
                      <Leaf className="w-5 h-5 text-orange-500" />
                    </div>
                  </div>
                  <div className="border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#07090C] rounded-[4px] p-4 flex items-center justify-between">
                    <div>
                      <span className="block text-[10px] text-slate-500 font-medium uppercase">
                        Arbitrage Profit
                      </span>
                      <span className="text-xl font-bold text-orange-500">
                        $
                        {financialResults.cost_optimization?.battery_arbitrage?.arbitrage_savings_usd?.toLocaleString()}
                      </span>
                    </div>
                    <div className="bg-orange-500/10 p-2 rounded">
                      <Zap className="w-5 h-5 text-orange-500" />
                    </div>
                  </div>
                  <div className="border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#07090C] rounded-[4px] p-4 flex items-center justify-between">
                    <div>
                      <span className="block text-[10px] text-slate-500 font-medium uppercase">
                        Carbon Tax Credits
                      </span>
                      <span className="text-xl font-bold text-emerald-500">
                        $
                        {financialResults.carbon_optimization?.carbon_tax_credits?.tax_offset_credits_usd?.toLocaleString()}
                      </span>
                    </div>
                    <div className="bg-emerald-500/10 p-2 rounded">
                      <Shield className="w-5 h-5 text-emerald-500" />
                    </div>
                  </div>
                </div>
              )}

              {financialResults?.ai_financial_explanation && (
                <div className="bg-[#1E293B]/20 border border-[#1E293B] rounded-[4px] p-4 flex items-start gap-3">
                  <Leaf className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Financial & Carbon AI Explanation
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed font-mono">
                      {financialResults.ai_financial_explanation}
                    </p>
                  </div>
                </div>
              )}

              {financialResults ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Chart 1: Market pricing vs Battery Arbitrage */}
                  <div className="border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#07090C] rounded-[4px] p-4 space-y-3">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Market Price vs Storage Dispatch
                    </h4>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={getMarketPriceArbitrageData()}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#2A313C" />
                          <XAxis dataKey="hour" stroke="#64748B" fontSize={8} />
                          <YAxis
                            yAxisId="left"
                            stroke="#64748B"
                            fontSize={10}
                            label={{
                              value: "Price ($/MWh)",
                              angle: -90,
                              position: "insideLeft",
                              style: { fill: "#64748B" },
                            }}
                          />
                          <YAxis
                            yAxisId="right"
                            orientation="right"
                            stroke="#F97316"
                            fontSize={10}
                            label={{
                              value: "Battery (MW)",
                              angle: 90,
                              position: "insideRight",
                              style: { fill: "#F97316" },
                            }}
                          />
                          <Tooltip
                            contentStyle={{ backgroundColor: "#0F172A", borderColor: "#1E293B" }}
                          />
                          <Legend />
                          <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="Price"
                            stroke="#10B981"
                            strokeWidth={2}
                            dot={false}
                          />
                          <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="BatteryAction"
                            stroke="#F97316"
                            strokeWidth={1.5}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Chart 2: Regional Carbon Footprint comparison */}
                  <div className="border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#07090C] rounded-[4px] p-4 space-y-3">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Regional CO2 Footprint (Tons)
                    </h4>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={getCarbonFootprintData()}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#2A313C" />
                          <XAxis dataKey="region" stroke="#64748B" fontSize={10} />
                          <YAxis stroke="#64748B" fontSize={10} />
                          <Tooltip
                            contentStyle={{ backgroundColor: "#0F172A", borderColor: "#1E293B" }}
                          />
                          <Legend />
                          <Bar dataKey="Baseline" fill="#64748B" />
                          <Bar dataKey="Optimized" fill="#10B981" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Cost & Carbon report panel */}
                  <div className="border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#07090C] rounded-[4px] p-5 md:col-span-2 space-y-4 font-mono text-xs select-text">
                    <div className="flex items-center justify-between border-b border-[#1E293B] pb-2">
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                        <Printer className="w-4 h-4 text-orange-500" /> Cost & Carbon Reconciliation
                        Report
                      </h4>
                      <span className="text-[10px] text-slate-500">
                        Job: {financialResults.job_id}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-[11px] leading-relaxed">
                      <div className="space-y-2 border-r border-[#1E293B] pr-4">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Generation Cost Details
                        </div>
                        <div className="flex justify-between">
                          <span>Baseline Thermal Cost:</span>
                          <span>
                            $
                            {financialResults.cost_optimization?.economic_dispatch?.baseline_conventional_cost_usd?.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Optimized Thermal Cost:</span>
                          <span>
                            $
                            {financialResults.cost_optimization?.economic_dispatch?.optimized_conventional_cost_usd?.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between font-bold text-emerald-500 border-t border-dashed border-[#1E293B] pt-1">
                          <span>Total Fuel Savings:</span>
                          <span>
                            -$
                            {financialResults.cost_optimization?.economic_dispatch?.conventional_savings_usd?.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Avoided Emissions & Offsets
                        </div>
                        <div className="flex justify-between">
                          <span>Baseline CO2 Footprint:</span>
                          <span>
                            {financialResults.carbon_optimization?.emissions?.co2_emissions_before_tons?.toLocaleString()}{" "}
                            tons
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Optimized CO2 Footprint:</span>
                          <span>
                            {financialResults.carbon_optimization?.emissions?.co2_emissions_after_tons?.toLocaleString()}{" "}
                            tons
                          </span>
                        </div>
                        <div className="flex justify-between font-bold text-emerald-500 border-t border-dashed border-[#1E293B] pt-1">
                          <span>Carbon Tax Offset Gain:</span>
                          <span>
                            +$
                            {financialResults.carbon_optimization?.carbon_tax_credits?.tax_offset_credits_usd?.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#07090C] rounded-[4px] p-12 text-center text-slate-500 font-mono text-xs">
                  Select an optimization job in completed state to display the interactive business
                  cost & carbon reconciliations.
                </div>
              )}
            </div>
          )}

          {/* ── MULTI-OBJECTIVE DECISION PANEL ──────────────────────────── */}
          {resultsTab === "decisions" && (
            <div className="space-y-6">
              {/* AI Recommended Strategy Card */}
              {decisionResults?.ai_recommendation && (
                <div className="border border-[#FF7A1A]/40 bg-orange-500/5 rounded-[4px] p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-[#FF7A1A]/20 pb-2">
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-orange-500" />
                      <h3 className="text-sm font-bold text-[#F8FAFC]">
                        AI Decision Recommendation:{" "}
                        {decisionResults.ai_recommendation.selected_strategy} Strategy
                      </h3>
                    </div>
                    <span className="px-2 py-0.5 rounded-[2px] text-[10px] font-bold bg-orange-500 text-white font-mono">
                      Confidence Score:{" "}
                      {Math.round(decisionResults.ai_recommendation.confidence_score * 100)}%
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
                    <div className="sm:col-span-2 space-y-3">
                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase">
                          Why Selected
                        </span>
                        <p className="text-slate-300 leading-relaxed font-mono text-[11px] mt-0.5">
                          {decisionResults.ai_recommendation.why_selected}
                        </p>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase">
                          Expected Benefits
                        </span>
                        <p className="text-slate-300 leading-relaxed font-mono text-[11px] mt-0.5">
                          {decisionResults.ai_recommendation.expected_benefits}
                        </p>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase">
                          Risks & Caveats
                        </span>
                        <p className="text-yellow-400 font-mono text-[11px] mt-0.5">
                          {decisionResults.ai_recommendation.risks}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-3 border-l border-[#1E293B] pl-6 select-text">
                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                          Execution Steps
                        </span>
                        <ul className="space-y-1.5 text-[11px] text-slate-300 font-mono list-decimal pl-4">
                          {decisionResults.ai_recommendation.implementation_steps?.map(
                            (step: string, i: number) => (
                              <li key={i}>{step}</li>
                            )
                          )}
                        </ul>
                      </div>
                      <button
                        onClick={handleExportReport}
                        className="w-full py-1.5 bg-[#FF7A1A] hover:bg-orange-600 text-white rounded text-[10px] font-bold flex items-center justify-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" /> Export Executive PDF/CSV
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {decisionResults ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Strategy comparisons side-by-side (Grouped Recharts or Table) */}
                  <div className="md:col-span-2 border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#07090C] rounded-[4px] p-4 space-y-4">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                      <span>Competing Strategy Profiles comparison</span>
                      <span className="text-[9px] text-slate-500 font-normal">
                        Costs normalized to k$
                      </span>
                    </h4>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={getStrategyComparisonData()}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#2A313C" />
                          <XAxis dataKey="name" stroke="#64748B" fontSize={8} />
                          <YAxis stroke="#64748B" fontSize={10} />
                          <Tooltip
                            contentStyle={{ backgroundColor: "#0F172A", borderColor: "#1E293B" }}
                          />
                          <Legend />
                          <Bar dataKey="Cost" fill="#EF4444" name="Cost (k$)" />
                          <Bar dataKey="CO2" fill="#10B981" name="CO2 (Tons)" />
                          <Bar dataKey="Stability" fill="#F97316" name="Stability" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Trade-off matrices */}
                  <div className="border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#07090C] rounded-[4px] p-4 space-y-3">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Operational Tradeoff Matrix
                    </h4>
                    <div className="overflow-y-auto h-48 space-y-3 text-[10px] font-mono">
                      {Object.keys(decisionResults.trade_offs || {}).map((strategyName) => (
                        <div
                          key={strategyName}
                          className="border-b border-[#1E293B] pb-2 last:border-b-0"
                        >
                          <div className="font-bold text-orange-500 text-[11px] mb-1">
                            {strategyName} Profile
                          </div>
                          <div className="text-slate-300 mb-1">
                            <span className="text-slate-500">Pro:</span>{" "}
                            {decisionResults.trade_offs[strategyName].benefits}
                          </div>
                          <div className="text-slate-300">
                            <span className="text-slate-500">Con:</span>{" "}
                            {decisionResults.trade_offs[strategyName].drawbacks}
                          </div>
                          <div className="flex gap-2 mt-1.5 text-[9px]">
                            <span className="px-1 bg-[#1E293B] rounded">
                              Cost: {decisionResults.trade_offs[strategyName].impacts.financial}
                            </span>
                            <span className="px-1 bg-[#1E293B] rounded">
                              CO2: {decisionResults.trade_offs[strategyName].impacts.environmental}
                            </span>
                            <span className="px-1 bg-[#1E293B] rounded">
                              Reliability:{" "}
                              {decisionResults.trade_offs[strategyName].impacts.reliability}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sensitivity variables */}
                  <div className="border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#07090C] rounded-[4px] p-4 space-y-3">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Input Sensitivity Gradients
                    </h4>
                    <div className="overflow-y-auto h-48 text-[11px] font-mono">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-500">
                            <th className="pb-1">Variable</th>
                            <th className="pb-1">Delta</th>
                            <th className="pb-1">Gradient</th>
                            <th className="pb-1">Impact</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-900 text-slate-300">
                          {decisionResults.sensitivities?.map((s: any, i: number) => (
                            <tr key={i}>
                              <td className="py-1.5">{s.input_variable}</td>
                              <td className="py-1.5">+{s.variance_pct}%</td>
                              <td className="py-1.5">{s.response_variable}</td>
                              <td
                                className={`py-1.5 font-bold ${s.impact_gradient === "HIGH" ? "text-red-400" : "text-emerald-500"}`}
                              >
                                {s.impact_gradient}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* What-If Sandbox Simulator (Interactive) */}
                  <div className="border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#07090C] rounded-[4px] p-4 md:col-span-2 space-y-4 font-mono text-xs">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Terminal className="w-4 h-4 text-orange-500" /> Multi-Objective What-If
                      Sandbox
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <div className="space-y-3">
                        <div>
                          <label className="block text-[10px] text-slate-500 mb-1">
                            Select Scenario Override
                          </label>
                          <select
                            value={whatIfSituation}
                            onChange={(e) => setWhatIfSituation(e.target.value)}
                            className="w-full bg-[#151A21] border border-[#2A313C]/40 rounded p-1.5 text-slate-300 focus:outline-none text-[11px]"
                          >
                            <option value="solar_drop">Renewable Solar Drop (%)</option>
                            <option value="battery_increase">Battery Capacity Increase (%)</option>
                            <option value="demand_rise">Grid Peak Demand Spike (%)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-500 mb-1">
                            Variance Magnitude: {whatIfChange}%
                          </label>
                          <input
                            type="range"
                            min={whatIfSituation === "battery_increase" ? "5" : "-50"}
                            max={whatIfSituation === "battery_increase" ? "50" : "50"}
                            value={whatIfChange}
                            onChange={(e) => setWhatIfChange(parseInt(e.target.value))}
                            className="w-full accent-orange-500"
                          />
                        </div>
                        <button
                          onClick={handleTriggerWhatIf}
                          disabled={whatIfLoading}
                          className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-[10px] font-bold"
                        >
                          {whatIfLoading ? "Evaluating..." : "Run Sandbox Sandbox Solve"}
                        </button>
                      </div>

                      <div className="sm:col-span-2 bg-[#0B0D11] border border-[#1E293B] rounded p-3 text-slate-300 space-y-3">
                        {whatIfResult ? (
                          <>
                            <div className="flex justify-between items-center border-b border-[#1E293B] pb-1 text-[10px] text-slate-500 font-bold uppercase">
                              <span>What-If Projected Outcomes</span>
                              <span className="text-yellow-400">
                                Risk: {whatIfResult.projected.risk_level}
                              </span>
                            </div>
                            <div className="grid grid-cols-4 gap-2 text-center">
                              <div className="bg-[#151A21] p-1.5 rounded">
                                <span className="block text-[8px] text-slate-500 uppercase">
                                  Stability
                                </span>
                                <span className="text-[11px] font-bold text-orange-500">
                                  {whatIfResult.projected.grid_stability_score}/100
                                </span>
                              </div>
                              <div className="bg-[#151A21] p-1.5 rounded">
                                <span className="block text-[8px] text-slate-500 uppercase">
                                  Cost
                                </span>
                                <span className="text-[11px] font-bold text-emerald-500">
                                  ${whatIfResult.projected.operating_cost_usd?.toLocaleString()}
                                </span>
                              </div>
                              <div className="bg-[#151A21] p-1.5 rounded">
                                <span className="block text-[8px] text-slate-500 uppercase">
                                  CO2
                                </span>
                                <span className="text-[11px] font-bold text-orange-500">
                                  {whatIfResult.projected.carbon_emissions_tons} t
                                </span>
                              </div>
                              <div className="bg-[#151A21] p-1.5 rounded">
                                <span className="block text-[8px] text-slate-500 uppercase">
                                  Reliability
                                </span>
                                <span className="text-[11px] font-bold text-emerald-500">
                                  {whatIfResult.projected.reliability_score}%
                                </span>
                              </div>
                            </div>
                            <p className="text-[10px] text-slate-300 leading-relaxed font-mono border-t border-dashed border-[#1E293B] pt-1.5">
                              {whatIfResult.ai_projected_recommendation}
                            </p>
                          </>
                        ) : (
                          <div className="text-slate-600 text-center py-8">
                            Configure variance sliders and execute hypothetical sandboxing.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#07090C] rounded-[4px] p-12 text-center text-slate-500 font-mono text-xs">
                  Select an optimization job in completed state to display side-by-side strategy
                  comparisons.
                </div>
              )}
            </div>
          )}

          {/* Queue & History lists */}
          <div className="border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#07090C] rounded-[4px] p-5">
            <div className="flex border-b border-slate-100 dark:border-[#1E293B]/40 pb-2 mb-4">
              <button
                onClick={() => setActiveTab("jobs")}
                className={`px-4 py-1.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
                  activeTab === "jobs"
                    ? "border-[#FF7A1A] text-orange-500"
                    : "border-transparent text-slate-500"
                }`}
              >
                Active Jobs Queue
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`px-4 py-1.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
                  activeTab === "history"
                    ? "border-[#FF7A1A] text-orange-500"
                    : "border-transparent text-slate-500"
                }`}
              >
                Execution Archive
              </button>
            </div>

            {/* Active Jobs Queue */}
            {activeTab === "jobs" && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-[#1E293B] text-slate-500 font-medium">
                      <th className="py-2">Job ID</th>
                      <th className="py-2">Config Profile</th>
                      <th className="py-2">Progress</th>
                      <th className="py-2">Status</th>
                      <th className="py-2 text-right">Dispatch Control</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#1E293B]/40 text-slate-300">
                    {jobs.map((j) => (
                      <tr
                        key={j.id}
                        onClick={() => setSelectedJobId(j.id)}
                        className={`hover:bg-slate-50 dark:hover:bg-[#151A21]/30 cursor-pointer ${
                          selectedJobId === j.id ? "bg-orange-500/5" : ""
                        }`}
                      >
                        <td className="py-3 font-mono text-[11px] truncate max-w-[120px]">
                          {j.id}
                        </td>
                        <td className="py-3 font-semibold">{j.config_name}</td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] w-8">
                              {Math.round(j.progress)}%
                            </span>
                            <div className="w-20 bg-slate-100 dark:bg-[#151A21] h-1.5 rounded-[2px] overflow-hidden">
                              <div
                                className="bg-orange-500 h-full transition-all duration-300"
                                style={{ width: `${j.progress}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3">
                          <span
                            className={`px-1.5 py-0.5 rounded-[2px] text-[10px] font-bold ${
                              j.status === "COMPLETED"
                                ? "bg-emerald-500/10 text-emerald-500"
                                : j.status === "RUNNING"
                                  ? "bg-blue-500/10 text-blue-500"
                                  : j.status === "QUEUED"
                                    ? "bg-yellow-500/10 text-yellow-500"
                                    : "bg-red-500/10 text-red-500"
                            }`}
                          >
                            {j.status}
                          </span>
                        </td>
                        <td className="py-3 text-right space-x-2">
                          {j.status === "RUNNING" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCancelJob(j.id);
                              }}
                              className="text-slate-500 hover:text-red-400"
                            >
                              <X className="w-4 h-4 inline" />
                            </button>
                          )}
                          {["COMPLETED", "FAILED", "CANCELLED"].includes(j.status) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRestartJob(j.id);
                              }}
                              className="text-slate-500 hover:text-orange-500"
                            >
                              <RotateCcw className="w-3.5 h-3.5 inline" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {jobs.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-500">
                          No active queue.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Execution Archive */}
            {activeTab === "history" && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-[#1E293B] text-slate-500 font-medium">
                      <th className="py-2">History ID</th>
                      <th className="py-2">Job ID</th>
                      <th className="py-2">Solve Time</th>
                      <th className="py-2">Objective Score</th>
                      <th className="py-2">Generated At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#1E293B]/40 text-slate-300">
                    {history.map((h) => (
                      <tr
                        key={h.id}
                        onClick={() => {
                          setSelectedJobId(h.job_id);
                          fetchLogs(h.id);
                        }}
                        className="hover:bg-slate-50 dark:hover:bg-[#151A21]/30 cursor-pointer"
                      >
                        <td className="py-3 font-mono text-[11px] truncate max-w-[120px]">
                          {h.id}
                        </td>
                        <td className="py-3 font-mono text-[11px] truncate max-w-[120px]">
                          {h.job_id}
                        </td>
                        <td className="py-3 font-mono">{h.execution_time_ms.toFixed(1)} ms</td>
                        <td className="py-3 font-mono font-bold text-orange-500">
                          {h.objective_score.toFixed(2)}
                        </td>
                        <td className="py-3 text-slate-400">
                          {new Date(h.created_at).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                    {history.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-500">
                          No logs committed.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Solver Console Output Logs */}
          <div className="border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#07090C] rounded-[4px] p-5">
            <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-orange-500" /> Solver Process Output
            </h3>
            <div className="bg-[#0B0D11] border border-[#1E293B] rounded-[3px] p-3 font-mono text-[11px] text-slate-300 h-48 overflow-y-auto space-y-1 select-text">
              {selectedJobId ? (
                activeLogs ? (
                  activeLogs.split("\n").map((line, i) => (
                    <div
                      key={i}
                      className={
                        line.includes("CRITICAL") || line.includes("violation")
                          ? "text-red-400"
                          : line.includes("Stage")
                            ? "text-blue-400"
                            : line.includes("compliance")
                              ? "text-emerald-400"
                              : ""
                      }
                    >
                      {line}
                    </div>
                  ))
                ) : (
                  <div className="text-slate-600 text-center py-12">
                    Job details loaded. Click start if queue is pending.
                  </div>
                )
              ) : (
                <div className="text-slate-600 text-center py-12">
                  Select an active job or history record to stream solver outputs.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Decision Report Export Modal */}
      {showExportModal && exportPayload && (
        <div className="fixed inset-0 bg-[#07090C]/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-[4px] w-full max-w-2xl p-6 space-y-4 font-mono text-xs select-text">
            <div className="flex items-center justify-between border-b border-[#1E293B] pb-2">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-orange-500" />
                <h3 className="text-sm font-bold text-[#F8FAFC]">
                  Executive Decision Report Export
                </h3>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-slate-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              <div className="space-y-1 bg-[#0B0D11] p-3 rounded border border-[#1E293B]">
                <div className="text-orange-500 font-bold uppercase tracking-wider text-[10px]">
                  1. Executive Summary
                </div>
                <div>
                  <span className="text-slate-500">Selected Strategy:</span>{" "}
                  {exportPayload.executive_summary.selected_strategy} (
                  {Math.round(exportPayload.executive_summary.confidence_score * 100)}% Confidence)
                </div>
                <div className="mt-1 text-slate-300">
                  {exportPayload.executive_summary.why_selected}
                </div>
                <div className="text-slate-300">
                  {exportPayload.executive_summary.expected_benefits}
                </div>
              </div>

              <div className="space-y-2 bg-[#0B0D11] p-3 rounded border border-[#1E293B]">
                <div className="text-orange-500 font-bold uppercase tracking-wider text-[10px]">
                  2. Strategy Comparison CSV Export
                </div>
                <textarea
                  readOnly
                  value={exportPayload.csv_export}
                  className="w-full bg-[#151A21] border border-[#2A313C]/40 rounded p-2 text-slate-300 font-mono text-[10px] h-24 focus:outline-none"
                />
                <div className="text-[10px] text-slate-500 text-right">
                  Click textarea, Ctrl+A, Ctrl+C to copy.
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#1E293B]">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-[11px]"
              >
                Dismiss Modal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
