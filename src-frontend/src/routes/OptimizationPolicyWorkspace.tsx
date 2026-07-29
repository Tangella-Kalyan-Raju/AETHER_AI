import React, { useState, useEffect } from "react";
import api from "../api/axios";
import {
  Shield,
  Zap,
  Leaf,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Sliders,
  RefreshCw,
  Cpu,
  Activity,
  Layers,
  ArrowRight,
  TrendingUp,
  Percent,
} from "lucide-react";

interface Policy {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  priority: number;
  objective: string;
  weights: Record<string, number>;
  constraints: Record<string, any>;
  expected_outcome: string;
  ai_explanation: string;
}

interface Recommendation {
  id: string;
  type: string;
  target_policy: string;
  recommended_weights: Record<string, number>;
  confidence_score: number;
  reasoning: string;
  expected_outcome: string;
  trade_offs: string;
  status: string;
}

export default function OptimizationPolicyWorkspace() {
  const [activePolicy, setActivePolicy] = useState<Policy | null>(null);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingWeights, setSavingWeights] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Manual weight configuration sliders state
  const [manualWeights, setManualWeights] = useState<Record<string, number>>({
    cost: 0.25,
    carbon: 0.25,
    stability: 0.25,
    reliability: 0.25,
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAnalyzed, setIsAnalyzed] = useState(false);

  // Simulated live SCADA telemetry metrics for constraint checks
  const [scadaMetrics, setScadaMetrics] = useState({
    voltage_deviation_pct: 1.8,
    max_thermal_loading_pct: 74.0,
    battery_soc_pct: 55.0,
  });

  useEffect(() => {
    fetchActiveAndAllPolicies();
    fetchRecommendations();
  }, []);

  const fetchActiveAndAllPolicies = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/api/v1/policies");
      const policiesData = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
          ? res.data
          : [];
      setPolicies(policiesData);
      const active = policiesData.find((p: Policy) => p.is_active);
      if (active) {
        setActivePolicy(active);
        setManualWeights(active.weights || {});
      } else if (policiesData.length > 0) {
        setActivePolicy(policiesData[0]);
        setManualWeights(policiesData[0].weights || {});
      }
    } catch (err: any) {
      console.error("Error loading policies:", err);
      setError("Failed to connect to active policy database.");
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const res = await api.get("/api/v1/policies/recommendations/weights");
      const recsData = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
          ? res.data
          : [];
      setRecommendations(recsData);
    } catch (err: any) {
      console.error("Error loading AI recommendations:", err);
    }
  };

  const handleWeightChange = (key: string, val: number) => {
    setIsAnalyzed(false);
    setManualWeights((prev) => {
      const updated = { ...prev, [key]: parseFloat(val.toFixed(2)) };
      return updated;
    });
  };

  // Re-normalize manual weights to sum to 100%
  const handleNormalizeWeights = () => {
    const sum = Object.values(manualWeights).reduce((a, b) => a + b, 0);
    if (sum === 0) return;
    const normalized: Record<string, number> = {};
    Object.entries(manualWeights).forEach(([k, v]) => {
      normalized[k] = parseFloat((v / sum).toFixed(2));
    });
    setManualWeights(normalized);
  };

  const handleSaveWeights = async () => {
    if (!activePolicy) return;
    setSavingWeights(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await api.post(`/api/v1/policies/${activePolicy.id}/weights`, {
        weights: manualWeights,
      });
      const updatedPolicy = res.data?.data || res.data;
      setActivePolicy(updatedPolicy);
      setSuccessMsg("Operating objective weights updated successfully.");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to update configuration.");
    } finally {
      setSavingWeights(false);
    }
  };

  const handleAcceptRecommendation = async (recId: string) => {
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await api.post(`/api/v1/policies/recommendations/${recId}/apply`);
      const data = res.data?.data || res.data;
      setActivePolicy(data.policy);
      setManualWeights(data.policy.weights || {});
      setRecommendations((prev) =>
        prev.map((r) => (r.id === recId ? { ...r, status: "applied" } : r))
      );
      setSuccessMsg(data.message);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to apply AI suggestion.");
    }
  };

  const totalWeightPercent = Math.round(
    Object.values(manualWeights).reduce((a, b) => a + b, 0) * 100
  );

  const getObjectiveIcon = (obj: string) => {
    switch (obj) {
      case "MIN_COST":
        return <DollarSign className="w-4 h-4 text-orange-500" />;
      case "MAX_RENEWABLES":
        return <Leaf className="w-4 h-4 text-emerald-500" />;
      case "MAX_RELIABILITY":
        return <Zap className="w-4 h-4 text-purple-500" />;
      case "EMERGENCY_SAFEGUARD":
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Layers className="w-4 h-4 text-sky-500" />;
    }
  };

  return (
    <div className="space-y-6 select-text font-sans">
      {/* Toast Alert logs */}
      {error && (
        <div className="p-3 border border-red-500/25 bg-red-500/10 rounded-[3px] text-xs text-red-500 font-mono flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 animate-pulse" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-3 border border-emerald-500/25 bg-emerald-500/10 rounded-[3px] text-xs text-emerald-500 font-mono flex items-center gap-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Header block */}
      <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 dark:border-[#1E293B] pb-4 gap-4 flex-shrink-0">
        <div>
          <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1.5">
            Operational Clearance // Central Brain
          </p>
          <h1 className="text-xl sm:text-2xl font-heading font-bold tracking-tight text-slate-900 dark:text-[#F8FAFC]">
            Dynamic Policy Optimisation & Weights
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              fetchActiveAndAllPolicies();
              fetchRecommendations();
            }}
            disabled={loading}
            className="p-1.5 rounded-[2px] border border-slate-200 dark:border-[#2A313C] bg-white dark:bg-[#151A21]/50 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1.5 text-xs font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            REFRESH TELEMETRY
          </button>
        </div>
      </section>

      {/* Active Optimization Overview Banner */}
      {activePolicy && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#07090C] rounded-[4px] p-4">
          <div className="space-y-1">
            <span className="text-[9px] font-mono text-slate-400 block uppercase">
              Active Governor Policy
            </span>
            <div className="flex items-center gap-1.5">
              <Shield className="w-4.5 h-4.5 text-emerald-500" />
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {activePolicy.name}
              </span>
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-[9px] font-mono text-slate-400 block uppercase">
              MILP Solver Objective
            </span>
            <div className="flex items-center gap-1.5">
              {getObjectiveIcon(activePolicy.objective)}
              <span className="text-xs font-mono font-bold text-slate-350">
                {activePolicy.objective}
              </span>
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-[9px] font-mono text-slate-400 block uppercase">
              Optimization Health
            </span>
            <div className="flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-bold text-emerald-500">NOMINAL STATE</span>
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-[9px] font-mono text-slate-400 block uppercase">
              Overall Optimisation Score
            </span>
            <div className="text-lg font-bold text-orange-500 font-mono">92.4 / 100</div>
          </div>
        </div>
      )}

      {/* Grid Layout: Controls vs Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Weights Sliders & Constraints */}
        <div className="lg:col-span-2 space-y-6">
          {/* Weight tuning card */}
          <div className="p-5 border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#07090C] rounded-[4px] space-y-5">
            <div className="flex items-center justify-between border-b border-[#2A313C]/40 pb-3">
              <h3 className="text-xs font-bold text-slate-400 font-mono uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-orange-500" /> Weight Coefficient Vectors
              </h3>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                    totalWeightPercent === 100
                      ? "bg-emerald-500/10 text-emerald-500"
                      : "bg-orange-500/10 text-orange-500"
                  }`}
                >
                  Sum: {totalWeightPercent}%
                </span>
                {totalWeightPercent !== 100 && (
                  <button
                    onClick={handleNormalizeWeights}
                    className="text-[9px] font-mono bg-orange-500/10 hover:bg-orange-500/25 border border-orange-500/35 text-orange-500 px-1.5 py-0.5 rounded transition-all"
                  >
                    NORMALIZE
                  </button>
                )}
              </div>
            </div>

            {/* Sliders loop */}
            <div className="space-y-4">
              {Object.entries(manualWeights).map(([key, val]) => (
                <div key={key} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-mono text-slate-350">
                    <span className="capitalize">{key} Optimization Priority</span>
                    <span className="text-orange-500 font-bold">{Math.round(val * 100)}%</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={val}
                      onChange={(e) => handleWeightChange(key, parseFloat(e.target.value))}
                      className="flex-1 accent-orange-500 h-1 bg-slate-100 dark:bg-[#1E293B] rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="pt-2 flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsAnalyzing(true);
                  setTimeout(() => {
                    setIsAnalyzing(false);
                    setIsAnalyzed(true);
                  }, 1200);
                }}
                disabled={isAnalyzing || totalWeightPercent !== 100}
                className="px-4 py-2 border border-sky-500/50 hover:bg-sky-500/10 text-sky-500 font-bold text-xs rounded-[2px] transition-colors flex items-center gap-1.5"
              >
                {isAnalyzing ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Activity className="w-3.5 h-3.5" />
                )}
                {isAnalyzing ? "SIMULATING IMPACT..." : "ANALYZE SCENARIO"}
              </button>

              <button
                onClick={handleSaveWeights}
                disabled={savingWeights || totalWeightPercent !== 100 || !isAnalyzed}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs rounded-[2px] transition-colors"
              >
                {savingWeights ? "SAVING..." : "SAVE WEIGHT PARAMETERS"}
              </button>
            </div>
          </div>

          {/* Intelligent Constraint Monitor */}
          {activePolicy && (
            <div className="p-5 border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#07090C] rounded-[4px] space-y-4">
              <h3 className="text-xs font-bold text-slate-400 font-mono uppercase tracking-wider">
                Intelligent Constraint limits (Real-Time telemetry)
              </h3>
              <div className="space-y-3 font-mono text-xs">
                {/* Voltage constraint */}
                <div className="flex justify-between items-center p-2.5 border border-[#2A313C]/40 bg-[#151A21]/20 rounded">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-300">Voltage Deviation</span>
                    <span className="text-[10px] text-slate-500">
                      Telemetry: {scadaMetrics.voltage_deviation_pct}%
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-500 font-bold">NOMINAL</span>
                    <span className="text-[10px] text-slate-500 block">
                      Max Limit: {activePolicy.constraints?.voltage_deviation_pct || 5.0}%
                    </span>
                  </div>
                </div>

                {/* Thermal loading */}
                <div className="flex justify-between items-center p-2.5 border border-[#2A313C]/40 bg-[#151A21]/20 rounded">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-300">feeder Thermal loading</span>
                    <span className="text-[10px] text-slate-500">
                      Telemetry: {scadaMetrics.max_thermal_loading_pct}%
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-500 font-bold">NOMINAL</span>
                    <span className="text-[10px] text-slate-500 block">
                      Max Limit: {activePolicy.constraints?.thermal_limit_pct || 90.0}%
                    </span>
                  </div>
                </div>

                {/* Battery SOC */}
                <div className="flex justify-between items-center p-2.5 border border-[#2A313C]/40 bg-[#151A21]/20 rounded">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-300">Battery Preservation margin</span>
                    <span className="text-[10px] text-slate-500">
                      Telemetry SOC: {scadaMetrics.battery_soc_pct}%
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-500 font-bold">NOMINAL</span>
                    <span className="text-[10px] text-slate-500 block">
                      Min SOC threshold: {activePolicy.constraints?.min_soc_pct || 20.0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Column: AI weight Recommendations panel */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 font-mono uppercase tracking-wider flex items-center gap-1">
            <Cpu className="w-4 h-4 text-emerald-500" /> AI Weight Recommendation engine
          </h3>

          {/* Dynamic Impact Projection based on manual weights */}
          <div className="p-4 border border-sky-500/20 bg-sky-500/5 rounded-[4px] space-y-3 min-h-[140px] flex flex-col">
            <h4 className="text-[10px] font-mono text-sky-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" /> Simulated Weight Impact
            </h4>

            {isAnalyzing ? (
              <div className="flex-1 flex flex-col items-center justify-center space-y-2 opacity-70">
                <RefreshCw className="w-5 h-5 text-sky-500 animate-spin" />
                <span className="text-[10px] font-mono text-sky-500 animate-pulse">
                  Running Digital Twin Simulation...
                </span>
              </div>
            ) : isAnalyzed ? (
              <>
                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  <div className="space-y-1">
                    <span className="text-slate-500">Proj. OpEx Impact</span>
                    <div
                      className={`font-bold ${manualWeights.cost > 0.3 ? "text-emerald-500" : "text-orange-500"}`}
                    >
                      {manualWeights.cost > 0.3 ? "-12.4%" : "+4.2%"}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-500">Proj. Emissions</span>
                    <div
                      className={`font-bold ${manualWeights.carbon > 0.3 ? "text-emerald-500" : "text-orange-500"}`}
                    >
                      {manualWeights.carbon > 0.3 ? "-18.5%" : "+2.1%"}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-500">Grid Stability Margin</span>
                    <div
                      className={`font-bold ${manualWeights.stability >= 0.25 ? "text-emerald-500" : "text-orange-500"}`}
                    >
                      {manualWeights.stability >= 0.25 ? "High" : "Nominal"}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-500">Reserve Depletion</span>
                    <div
                      className={`font-bold ${manualWeights.reliability >= 0.25 ? "text-emerald-500" : "text-orange-500"}`}
                    >
                      {manualWeights.reliability >= 0.25 ? "Minimal" : "Elevated"}
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 italic mt-auto pt-2">
                  * Simulation completed successfully. Parameters cleared for deployment.
                </p>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-[10px] text-slate-400 font-mono text-center px-4">
                  Adjust coefficient sliders and click <br />
                  <strong className="text-sky-500">ANALYZE SCENARIO</strong>
                  <br /> to preview impact.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                className={`p-4 border rounded-[4px] bg-slate-50/50 dark:bg-[#151A21]/30 space-y-3 ${
                  rec.status === "applied"
                    ? "border-emerald-500 bg-emerald-500/5"
                    : "border-orange-500/20"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-orange-500/10 text-orange-500 font-bold uppercase">
                    {rec.type.replace("_", " ")}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    Conf: {Math.round(rec.confidence_score * 100)}%
                  </span>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed italic">
                  "{rec.reasoning}"
                </p>

                {/* Weights preview */}
                <div className="p-2 border border-[#2A313C]/40 bg-[#151A21]/20 rounded space-y-1 text-[10.5px] font-mono">
                  <span className="text-[9px] text-slate-500 uppercase block">
                    Suggested Weights:
                  </span>
                  <div className="grid grid-cols-2 gap-1.5 text-slate-350">
                    {Object.entries(rec.recommended_weights).map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span className="capitalize">{k}:</span>
                        <strong className="text-orange-500">{Math.round(v * 100)}%</strong>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-[11px] space-y-1">
                  <div className="text-slate-500">
                    <strong>Impact:</strong> {rec.expected_outcome}
                  </div>
                  <div className="text-slate-500">
                    <strong>Trade-offs:</strong> {rec.trade_offs}
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  {rec.status === "applied" ? (
                    <span className="text-xs font-bold text-emerald-500 flex items-center gap-1 font-mono">
                      <CheckCircle className="w-3.5 h-3.5" /> DEPLOYED
                    </span>
                  ) : (
                    <button
                      onClick={() => handleAcceptRecommendation(rec.id)}
                      className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-[10px] rounded-[2px] flex items-center gap-1 transition-colors"
                    >
                      ACCEPT RECOMMENDATION <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {recommendations.length === 0 && (
              <p className="text-xs text-slate-500 text-center font-mono py-6">
                Analyzing forecasts for tuning options...
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
