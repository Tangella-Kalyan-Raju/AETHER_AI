import React, { useState, useEffect } from "react";
import api from "../api/axios";
import {
  Shield,
  Activity,
  Zap,
  Leaf,
  DollarSign,
  Cpu,
  Compass,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Sliders,
  TrendingUp,
  Clock,
  Check,
  Percent,
  BookOpen,
  ArrowRight,
  ArrowDown,
  Sparkles,
  ChevronDown,
} from "lucide-react";

interface GridContext {
  weather_warning: string;
  demand_forecast_peak_mw: number;
  renewable_forecast_yield_mw: number;
  battery_soc_pct: number;
  market_price_usd_mwh: number;
  grid_alert_level: string;
}

interface AIRecommendation {
  id: number;
  current_policy_name: string;
  recommended_policy_id: number;
  recommended_policy_name: string;
  confidence_score: number;
  reasoning: string;
  supporting_evidence: string;
  expected_impact: string;
  possible_risks: string;
  trade_offs: string;
  alternatives: string[];
  grid_context: GridContext;
}

interface Analytics {
  cost_savings_usd: number;
  renewable_penetration_pct: number;
  stability_index_pct: number;
  ai_recommendation_accuracy_pct: number;
  operator_acceptance_rate_pct: number;
  policy_success_rate_pct: number;
  historical_improvements: { month: string; cost_savings: number; acceptance: number }[];
}

interface Transition {
  id: number;
  timestamp: string;
  from_policy: string;
  to_policy: string;
  trigger_event: string;
  autonomy_level: string;
  status: string;
}

export default function AdaptivePolicyWorkspace() {
  const [autonomyMode, setAutonomyMode] = useState("MANUAL");
  const [recommendation, setRecommendation] = useState<AIRecommendation | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [transitions, setTransitions] = useState<Transition[]>([]);

  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [explainData, setExplainData] = useState<any>(null);
  const [loadingExplain, setLoadingExplain] = useState(false);
  const [explainError, setExplainError] = useState<string | null>(null);

  const fetchExplainRecommendations = async () => {
    setLoadingExplain(true);
    setExplainError(null);
    try {
      const res = await api.get("/api/v1/policies/recommendations/explain");
      setExplainData(res.data?.data || res.data || null);
    } catch (err: any) {
      console.error("Error loading explainable AI recommendations:", err);
      setExplainError("Failed to fetch explainable AI recommendations.");
    } finally {
      setLoadingExplain(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      const modeRes = await api.get("/api/v1/policies/adaptive/mode");
      setAutonomyMode(modeRes.data.mode);

      const recRes = await api.get("/api/v1/policies/adaptive/recommendations");
      setRecommendation(recRes.data);

      const anaRes = await api.get("/api/v1/policies/adaptive/analytics");
      setAnalytics(anaRes.data);

      const transRes = await api.get("/api/v1/policies/adaptive/transitions");
      setTransitions(transRes.data);

      fetchExplainRecommendations();
    } catch (err: any) {
      setError("Failed to fetch adaptive policy indicators.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMode = async (mode: string) => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await api.post("/api/v1/policies/adaptive/mode", { mode });
      setAutonomyMode(res.data.mode);
      setSuccess(`Autonomy mode updated to: ${res.data.mode}`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError("Autonomy configurations permission check failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveRecommendation = async () => {
    if (!recommendation) return;
    setActionLoading(true);
    setError(null);
    try {
      const res = await api.post(`/api/v1/policies/adaptive/approve/${recommendation.id}`);
      setSuccess(res.data.message);

      // Refresh transitions and recommendations
      const recRes = await api.get("/api/v1/policies/adaptive/recommendations");
      setRecommendation(recRes.data);

      const transRes = await api.get("/api/v1/policies/adaptive/transitions");
      setTransitions(transRes.data);

      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError("Failed to deploy recommended policy.");
    } finally {
      setActionLoading(false);
    }
  };

  const getAutonomyBadgeColor = (level: string) => {
    switch (level) {
      case "FULLY_AUTONOMOUS":
        return "bg-purple-500 text-white font-mono text-[9px] font-bold rounded-[2px] uppercase px-1.5 py-0.5";
      case "SEMI_AUTO":
        return "bg-sky-500 text-white font-mono text-[9px] font-bold rounded-[2px] uppercase px-1.5 py-0.5";
      default:
        return "bg-slate-500 text-white font-mono text-[9px] font-bold rounded-[2px] uppercase px-1.5 py-0.5";
    }
  };

  return (
    <div className="space-y-6 select-text font-sans">
      {/* Toast Alert alerts */}
      {error && (
        <div className="p-3 border border-red-500/25 bg-red-500/10 rounded-[3px] text-xs text-red-500 font-mono flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-3 border border-emerald-500/25 bg-emerald-500/10 rounded-[3px] text-xs text-emerald-500 font-mono flex items-center gap-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Header section */}
      <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 dark:border-[#1E293B] pb-4 gap-4 flex-shrink-0">
        <div>
          <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1.5">
            Operational Clearance // Central Brain
          </p>
          <h1 className="text-xl sm:text-2xl font-heading font-bold tracking-tight text-slate-900 dark:text-[#F8FAFC]">
            Intelligent Adaptive Policy Engine
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchInitialData}
            disabled={loading}
            className="p-1.5 rounded-[2px] border border-slate-200 dark:border-[#2A313C] bg-white dark:bg-[#151A21]/50 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </section>

      {/* Main Layout: Recs vs Context (Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column 2: Recommendation & Telemetry */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Recommendation Center */}
          {/* AI Recommendation Panel */}
          {loadingExplain ? (
            <div className="p-12 border border-slate-200 dark:border-[#1E293B] rounded-[4px] text-center bg-white dark:bg-[#07090C] space-y-4">
              <RefreshCw className="w-8 h-8 mx-auto text-orange-500 animate-spin" />
              <p className="text-xs font-mono text-slate-400">
                Loading explainable AI recommendations...
              </p>
            </div>
          ) : explainError ? (
            <div className="p-4 border border-red-500/25 bg-red-500/10 rounded-[3px] text-xs text-red-500 font-mono">
              {explainError}
            </div>
          ) : explainData ? (
            <div className="space-y-6">
              {/* Primary Recommendation Card */}
              <div className="p-5 border border-purple-500/40 bg-purple-500/5 rounded-[4px] space-y-4 relative shadow-sm">
                <div className="border-b border-purple-500/20 pb-3 flex justify-between items-center">
                  <h3 className="text-xs font-bold text-purple-300 font-mono uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" /> Primary AI
                    Recommendation
                  </h3>
                  <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono text-[9px] font-bold rounded-[2px] uppercase tracking-wider">
                    {explainData.primary.confidence}% Confidence
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-baseline gap-2">
                    <h4 className="text-base sm:text-lg font-bold text-slate-100 uppercase tracking-tight">
                      {explainData.primary.name}
                    </h4>
                    <span className="text-xs font-mono text-purple-400 font-medium">
                      Primary Objective Clearance
                    </span>
                  </div>
                  <p className="text-xs text-slate-350 leading-relaxed font-mono">
                    "{explainData.primary.reason}"
                  </p>
                </div>

                {/* Primary Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="p-2 border border-purple-500/20 bg-purple-500/10 rounded">
                    <span className="text-[9px] text-purple-400 block uppercase">
                      Expected Cost
                    </span>
                    <span className="font-bold text-slate-200">
                      £{explainData.primary.expected_cost?.toLocaleString()}/hr
                    </span>
                  </div>
                  <div className="p-2 border border-purple-500/20 bg-purple-500/10 rounded">
                    <span className="text-[9px] text-purple-400 block uppercase">CO₂ Impact</span>
                    <span className="font-bold text-slate-200">
                      {explainData.primary.expected_co2}
                    </span>
                  </div>
                  <div className="p-2 border border-purple-500/20 bg-purple-500/10 rounded">
                    <span className="text-[9px] text-purple-400 block uppercase">Stability</span>
                    <span className="font-bold text-emerald-400">
                      {explainData.primary.grid_stability}
                    </span>
                  </div>
                  <div className="p-2 border border-purple-500/20 bg-purple-500/10 rounded">
                    <span className="text-[9px] text-purple-400 block uppercase">
                      Overall Impact
                    </span>
                    <span className="font-bold text-purple-300 line-clamp-1">
                      {explainData.primary.overall_impact}
                    </span>
                  </div>
                </div>

                {/* Pros and Cons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                  <div className="p-3 border border-emerald-500/25 bg-emerald-500/5 rounded space-y-1">
                    <strong className="text-[9px] uppercase tracking-wider block text-emerald-400">
                      Pros:
                    </strong>
                    <ul className="space-y-1 list-none pl-0">
                      {explainData.primary.pros?.map((pro: string, i: number) => (
                        <li key={i} className="flex items-start gap-1">
                          <span className="text-emerald-500">•</span>
                          <span className="text-slate-300">{pro}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-3 border border-red-500/25 bg-red-500/5 rounded space-y-1">
                    <strong className="text-[9px] uppercase tracking-wider block text-red-400">
                      Cons:
                    </strong>
                    <ul className="space-y-1 list-none pl-0">
                      {explainData.primary.cons?.map((con: string, i: number) => (
                        <li key={i} className="flex items-start gap-1">
                          <span className="text-red-500">•</span>
                          <span className="text-slate-300">{con}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Explainable Reasoning Chain */}
              <div className="p-5 border border-slate-800 bg-[#0B0E14] rounded-[4px] space-y-4 shadow-sm">
                <h3 className="text-xs font-bold text-slate-400 font-mono uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-purple-400" /> Explainable Reasoning Chain
                </h3>

                <div className="flex flex-col items-center space-y-2 py-2">
                  {explainData.reasoning_chain?.map((step: any, idx: number) => (
                    <div key={idx} className="w-full flex flex-col items-center">
                      <div className="w-full max-w-lg p-3 border border-slate-850 bg-[#161C24]/50 rounded text-center relative">
                        <span className="text-[10px] font-mono text-purple-400 uppercase tracking-widest font-semibold block mb-0.5">
                          {step.title}
                        </span>
                        <p className="text-[11px] text-slate-300 font-mono leading-relaxed px-4">
                          {step.description}
                        </p>
                      </div>
                      {idx < explainData.reasoning_chain.length - 1 && (
                        <ArrowDown className="w-4 h-4 text-purple-500/60 my-1 animate-bounce" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Alternative Recommendations Panel */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 font-mono uppercase tracking-wider">
                  Alternative Dispatch Strategies ({explainData.alternatives?.length})
                </h3>

                <div className="grid grid-cols-1 gap-4">
                  {explainData.alternatives?.map((alt: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-4 border border-slate-800 bg-[#0F131A]/40 rounded-[4px] space-y-4"
                    >
                      <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                        <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                          Alternative Option {idx + 1}: {alt.name}
                        </h4>
                        <span className="px-2 py-0.5 bg-slate-800 text-slate-400 border border-slate-700/50 font-mono text-[9px] font-bold rounded-[2px] uppercase tracking-wider">
                          {alt.confidence}% Confidence
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 leading-relaxed font-mono">
                        "{alt.reason}"
                      </p>

                      {/* Alternative Metrics Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono">
                        <div className="p-1.5 border border-slate-800 bg-[#161C24]/20 rounded">
                          <span className="text-[8px] text-slate-500 block uppercase">
                            Expected Cost
                          </span>
                          <span className="font-bold text-slate-300">
                            £{alt.expected_cost?.toLocaleString()}/hr
                          </span>
                        </div>
                        <div className="p-1.5 border border-slate-800 bg-[#161C24]/20 rounded">
                          <span className="text-[8px] text-slate-500 block uppercase">
                            CO₂ Impact
                          </span>
                          <span className="font-bold text-slate-300">{alt.expected_co2}</span>
                        </div>
                        <div className="p-1.5 border border-slate-800 bg-[#161C24]/20 rounded">
                          <span className="text-[8px] text-slate-500 block uppercase">
                            Stability
                          </span>
                          <span className="font-bold text-slate-300">{alt.grid_stability}</span>
                        </div>
                        <div className="p-1.5 border border-slate-800 bg-[#161C24]/20 rounded">
                          <span className="text-[8px] text-slate-500 block uppercase">
                            Overall Impact
                          </span>
                          <span className="font-bold text-slate-350 line-clamp-1">
                            {alt.overall_impact}
                          </span>
                        </div>
                      </div>

                      {/* Pros & Cons */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                        <div className="text-emerald-450">
                          <span className="text-[9px] text-emerald-500 font-bold block uppercase tracking-wider">
                            Pros
                          </span>
                          <ul className="list-none pl-0 mt-0.5 space-y-0.5">
                            {alt.pros?.map((p: string, i: number) => (
                              <li key={i} className="flex items-start gap-1">
                                <span>•</span>
                                <span>{p}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="text-red-400">
                          <span className="text-[9px] text-red-500 font-bold block uppercase tracking-wider">
                            Cons
                          </span>
                          <ul className="list-none pl-0 mt-0.5 space-y-0.5">
                            {alt.cons?.map((c: string, i: number) => (
                              <li key={i} className="flex items-start gap-1">
                                <span>•</span>
                                <span>{c}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {/* Context Telemetry Dashboard */}
          {recommendation?.grid_context && (
            <div className="p-5 border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#07090C] rounded-[4px] space-y-4">
              <h3 className="text-xs font-bold text-slate-400 font-mono uppercase tracking-wider border-b border-[#2A313C]/40 pb-2 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-orange-500" /> Context Intelligence Telemetry
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 font-mono text-xs">
                <div className="p-3 border border-[#2A313C]/45 bg-[#151A21]/15 rounded">
                  <span className="text-[9px] text-slate-500 uppercase block">
                    Weather Forecast
                  </span>
                  <span className="font-bold text-slate-300 block mt-1 line-clamp-1">
                    {recommendation.grid_context.weather_warning}
                  </span>
                </div>
                <div className="p-3 border border-[#2A313C]/45 bg-[#151A21]/15 rounded">
                  <span className="text-[9px] text-slate-500 uppercase block">
                    Peak Load Forecast
                  </span>
                  <span className="font-bold text-slate-300 block mt-1">
                    {recommendation.grid_context.demand_forecast_peak_mw.toLocaleString()} MW
                  </span>
                </div>
                <div className="p-3 border border-[#2A313C]/45 bg-[#151A21]/15 rounded">
                  <span className="text-[9px] text-slate-500 uppercase block">
                    Renewable Forecast
                  </span>
                  <span className="font-bold text-slate-300 block mt-1">
                    {recommendation.grid_context.renewable_forecast_yield_mw.toLocaleString()} MW
                  </span>
                </div>
                <div className="p-3 border border-[#2A313C]/45 bg-[#151A21]/15 rounded">
                  <span className="text-[9px] text-slate-500 uppercase block">Energy SoC</span>
                  <span className="font-bold text-slate-300 block mt-1">
                    {recommendation.grid_context.battery_soc_pct}%
                  </span>
                </div>
                <div className="p-3 border border-[#2A313C]/45 bg-[#151A21]/15 rounded">
                  <span className="text-[9px] text-slate-500 uppercase block">
                    Spot Electricity Price
                  </span>
                  <span className="font-bold text-slate-300 block mt-1">
                    ${recommendation.grid_context.market_price_usd_mwh.toFixed(2)} /MWh
                  </span>
                </div>
                <div className="p-3 border border-[#2A313C]/45 bg-[#151A21]/15 rounded">
                  <span className="text-[9px] text-slate-500 uppercase block">
                    Grid Alert Level
                  </span>
                  <span className="font-bold text-red-500 block mt-1">
                    {recommendation.grid_context.grid_alert_level}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column 1: Autonomy & Transitions timeline */}
        <div className="space-y-6">
          {/* Autonomy Setting toggles */}
          <div className="p-5 border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#07090C] rounded-[4px] space-y-4">
            <h3 className="text-xs font-bold text-slate-400 font-mono uppercase tracking-wider border-b border-[#2A313C]/40 pb-2">
              Autonomy Configuration
            </h3>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleUpdateMode("MANUAL")}
                className={`w-full py-2 px-3 text-left border rounded text-xs font-semibold flex justify-between items-center transition-all ${
                  autonomyMode === "MANUAL"
                    ? "border-orange-500 bg-orange-500/5 text-orange-500"
                    : "border-slate-700 hover:border-slate-550 text-slate-400"
                }`}
              >
                <span>Manual (AI Advisor Only)</span>
                {autonomyMode === "MANUAL" && <Check className="w-4 h-4" />}
              </button>
              <button
                onClick={() => handleUpdateMode("SEMI_AUTO")}
                className={`w-full py-2 px-3 text-left border rounded text-xs font-semibold flex justify-between items-center transition-all ${
                  autonomyMode === "SEMI_AUTO"
                    ? "border-orange-500 bg-orange-500/5 text-orange-500"
                    : "border-slate-700 hover:border-slate-550 text-slate-400"
                }`}
              >
                <span>Semi-Autonomous</span>
                {autonomyMode === "SEMI_AUTO" && <Check className="w-4 h-4" />}
              </button>
              <button
                onClick={() => handleUpdateMode("FULLY_AUTONOMOUS")}
                className={`w-full py-2 px-3 text-left border rounded text-xs font-semibold flex justify-between items-center transition-all ${
                  autonomyMode === "FULLY_AUTONOMOUS"
                    ? "border-orange-500 bg-orange-500/5 text-orange-500"
                    : "border-slate-700 hover:border-slate-550 text-slate-400"
                }`}
              >
                <span>Fully Autonomous Dispatch</span>
                {autonomyMode === "FULLY_AUTONOMOUS" && <Check className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Transitions timeline */}
          <div className="p-5 border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#07090C] rounded-[4px] space-y-4">
            <h3 className="text-xs font-bold text-slate-400 font-mono uppercase tracking-wider border-b border-[#2A313C]/40 pb-2 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-orange-500" /> Transition Audit Trail
            </h3>

            <div className="space-y-3.5 max-h-60 overflow-y-auto pr-1 text-xs font-mono">
              {transitions.map((t) => (
                <div
                  key={t.id}
                  className="p-2.5 border border-[#2A313C]/45 bg-[#151A21]/15 rounded space-y-1"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-500">
                      {new Date(t.timestamp).toLocaleTimeString()}
                    </span>
                    {getAutonomyBadgeColor(t.autonomy_level)}
                  </div>
                  <div className="flex items-center gap-1.5 font-bold text-slate-200">
                    <span>{t.from_policy}</span>
                    <ArrowRight className="w-3 h-3 text-slate-500" />
                    <span>{t.to_policy}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block">
                    Trigger: "{t.trigger_event}"
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Learning Analytics Deck */}
      {analytics && (
        <div className="p-5 border border-slate-200 dark:border-[#1E293B] bg-[#07090C] rounded-[4px] space-y-4">
          <h3 className="text-xs font-bold text-slate-400 font-mono uppercase tracking-wider border-b border-[#2A313C]/40 pb-2">
            Continuous Learning & Policy Analytics
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 font-mono text-xs text-center">
            <div className="p-3 border border-[#2A313C]/35 rounded bg-slate-500/5">
              <span className="text-[9px] text-slate-500 block uppercase">OpEx Savings</span>
              <span className="font-bold text-emerald-500 text-sm mt-1 block">
                ${analytics.cost_savings_usd.toLocaleString()}
              </span>
            </div>
            <div className="p-3 border border-[#2A313C]/35 rounded bg-slate-500/5">
              <span className="text-[9px] text-slate-500 block uppercase">Clean Penetration</span>
              <span className="font-bold text-slate-350 text-sm mt-1 block">
                {analytics.renewable_penetration_pct}%
              </span>
            </div>
            <div className="p-3 border border-[#2A313C]/35 rounded bg-slate-500/5">
              <span className="text-[9px] text-slate-500 block uppercase">Stability Index</span>
              <span className="font-bold text-slate-350 text-sm mt-1 block">
                {analytics.stability_index_pct}%
              </span>
            </div>
            <div className="p-3 border border-[#2A313C]/35 rounded bg-slate-500/5">
              <span className="text-[9px] text-slate-500 block uppercase">AI Model Accuracy</span>
              <span className="font-bold text-orange-400 text-sm mt-1 block">
                {analytics.ai_recommendation_accuracy_pct}%
              </span>
            </div>
            <div className="p-3 border border-[#2A313C]/35 rounded bg-slate-500/5">
              <span className="text-[9px] text-slate-500 block uppercase">Acceptance rate</span>
              <span className="font-bold text-orange-400 text-sm mt-1 block">
                {analytics.operator_acceptance_rate_pct}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
