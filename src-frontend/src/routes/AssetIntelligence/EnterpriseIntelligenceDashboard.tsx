import React, { useState, useEffect } from "react";
import {
  RefreshCw,
  Activity,
  ShieldAlert,
  Thermometer,
  Wind,
  Sun,
  Battery,
  Settings,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { copilotApi } from "../../api/copilot";
import { LoadingState, ErrorState } from "./components/StateStates";

export default function EnterpriseIntelligenceDashboard() {
  const [context, setContext] = useState<any | null>(null);
  const [confidence, setConfidence] = useState<any | null>(null);
  const [recs, setRecs] = useState<any[]>([]);
  const [analysis, setAnalysis] = useState<any | null>(null);
  const [target, setTarget] = useState("Sierra Substation");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [ctxRes, confRes, recsRes, analRes] = await Promise.all([
        copilotApi.getLiveContext(),
        copilotApi.getConfidenceMetrics(),
        copilotApi.getAdvisoryRecommendations(),
        copilotApi.analyzeContext(target),
      ]);
      setContext(ctxRes);
      setConfidence(confRes);
      setRecs(recsRes);
      setAnalysis(analRes.analysis);
    } catch (err: any) {
      console.error(err);
      setError("Failed to load Enterprise Intelligence telemetry.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 5000);
    return () => clearInterval(interval);
  }, [target]);

  if (loading && !context) return <LoadingState message="Aggregating live Grid context..." />;
  if (error && !context) return <ErrorState message={error || ""} retry={fetchDashboardData} />;

  return (
    <div className="space-y-6 py-2 select-text font-mono text-xs text-slate-800 dark:text-slate-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-[10px] text-slate-450 dark:text-slate-500 uppercase tracking-widest mb-1.5">
            ENTERPRISE GRID CO-PILOT
          </p>
          <h1 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-[#F8FAFC]">
            Enterprise Decision Support
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-sans">
            Explainable AI recommendations compiled from live assets, policies, weather, and
            optimization metrics.
          </p>
        </div>

        <button
          onClick={fetchDashboardData}
          className="flex items-center justify-center p-2 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-[#2A313C] rounded-[4px] hover:bg-slate-50 dark:hover:bg-[#11161D] transition w-fit"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-emerald-500" : ""}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Context Panel */}
        <div className="lg:col-span-1 space-y-5">
          {/* Grid telemetry summary */}
          <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5 space-y-4">
            <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-[#F8FAFC] pb-2 border-b border-slate-100 dark:border-[#2A313C] flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-500" />
              Live Telemetry Context
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-450 uppercase text-[10px]">Grid Frequency</span>
                <span className="font-bold text-emerald-500">
                  {context.grid_status.frequency} Hz
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-450 uppercase text-[10px]">Registered Assets</span>
                <span className="font-bold">{context.assets.total_count} Units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-450 uppercase text-[10px]">Average Fleet Health</span>
                <span className="font-bold text-emerald-500">{context.assets.average_health}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-450 uppercase text-[10px]">Cost Savings Today</span>
                <span className="font-bold">
                  ${context.optimization.cost_savings_today.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Environmental metrics */}
          <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5 space-y-4">
            <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-[#F8FAFC] pb-2 border-b border-slate-100 dark:border-[#2A313C] flex items-center gap-1.5">
              <Sun className="w-4 h-4 text-amber-500" />
              Environmental Metrics
            </h3>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 bg-slate-50 dark:bg-[#11161D] border border-slate-200 dark:border-[#2A313C] rounded-[2px]">
                <Thermometer className="w-4 h-4 text-rose-500 mx-auto mb-1" />
                <span className="block text-[8px] uppercase text-slate-450">Temp</span>
                <span className="font-bold">{context.weather.temperature}°C</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-[#11161D] border border-slate-200 dark:border-[#2A313C] rounded-[2px]">
                <Wind className="w-4 h-4 text-sky-500 mx-auto mb-1" />
                <span className="block text-[8px] uppercase text-slate-450">Wind</span>
                <span className="font-bold">{context.weather.wind_speed} m/s</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-[#11161D] border border-slate-200 dark:border-[#2A313C] rounded-[2px]">
                <Sun className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                <span className="block text-[8px] uppercase text-slate-450">Solar</span>
                <span className="font-bold">{context.weather.solar_irradiance} W</span>
              </div>
            </div>
          </div>

          {/* Reliability completeness check */}
          <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5 space-y-4">
            <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-[#F8FAFC] pb-2 border-b border-slate-100 dark:border-[#2A313C] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Context Reliability Score
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-450 uppercase text-[10px]">Data Completeness</span>
                <span className="font-bold text-emerald-500">{confidence.completeness_score}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-450 uppercase text-[10px]">Reliability Index</span>
                <span className="font-bold text-emerald-500 uppercase">
                  {confidence.reliability_index}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Explainable AI Report Card */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#2A313C] pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-500" />
                <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-[#F8FAFC]">
                  Explainable Advisory Dispatch
                </h3>
              </div>
              <select
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="bg-slate-50 dark:bg-[#11161D] border border-slate-255 dark:border-[#2A313C] rounded-[4px] px-2 py-1 text-[11px] focus:outline-none"
              >
                <option value="Sierra Substation">Sierra Substation</option>
                <option value="West Region Grid">West Region Grid</option>
              </select>
            </div>

            {analysis && (
              <div className="space-y-4 select-text">
                <div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-bold">
                    Situation
                  </span>
                  <p className="text-slate-800 dark:text-slate-300 mt-1 font-sans text-xs">
                    {analysis.Situation}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-bold">
                    Analysis
                  </span>
                  <p className="text-slate-800 dark:text-slate-300 mt-1 font-sans text-xs">
                    {analysis.Analysis}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-bold">
                    Reasoning
                  </span>
                  <p className="text-slate-800 dark:text-slate-300 mt-1 font-sans text-xs">
                    {analysis.Reasoning}
                  </p>
                </div>
                <div className="p-4 border border-emerald-500/15 bg-emerald-500/5 rounded-[2px]">
                  <span className="text-[10px] text-emerald-500 uppercase tracking-wider font-bold">
                    Recommendation
                  </span>
                  <p className="text-slate-800 dark:text-slate-200 mt-1 font-bold font-sans text-xs">
                    {analysis.Recommendation}
                  </p>
                </div>
                <div className="p-4 border border-rose-500/15 bg-rose-500/5 rounded-[2px]">
                  <span className="text-[10px] text-rose-500 uppercase tracking-wider font-bold flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4" />
                    Identified Operational Risks
                  </span>
                  <p className="text-slate-800 dark:text-slate-200 mt-1 font-sans text-xs">
                    {analysis.Risks}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
