import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ShieldAlert,
  RefreshCw,
  BarChart3,
  TrendingUp,
  Cpu,
  Activity,
  DollarSign,
  Clock,
} from "lucide-react";
import { assetApi } from "../../api/assets";
import { LoadingState, ErrorState } from "./components/StateStates";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
  LineChart,
  Line,
} from "recharts";

const COLORS = ["#10B981", "#3B82F6", "#EF4444", "#F59E0B", "#8B5CF6", "#EC4899", "#14B8A6"];

export default function AssetLifecycleCenter() {
  const [activeTab, setActiveTab] = useState<
    "lifecycle" | "performance" | "criticality" | "benchmark"
  >("lifecycle");

  // Telemetry states
  const [lifecycleSummary, setLifecycleSummary] = useState<any | null>(null);
  const [performanceSummary, setPerformanceSummary] = useState<any | null>(null);
  const [criticalitySummary, setCriticalitySummary] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Benchmarking State Selection
  const [benchmarkMetric, setBenchmarkMetric] = useState<
    "performance_benchmark" | "availability" | "lifecycle_cost" | "maintenance_cost"
  >("performance_benchmark");

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const lcSum = await assetApi.getLifecycleSummary();
      const perfSum = await assetApi.getPerformanceSummary();
      const critSum = await assetApi.getCriticalitySummary();

      setLifecycleSummary(lcSum);
      setPerformanceSummary(perfSum);
      setCriticalitySummary(critSum);
    } catch (err: any) {
      console.error(err);
      setError("Failed to load asset lifecycle intelligence metrics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading)
    return <LoadingState message="Recompiling asset lifecycle and benchmarking telemetry..." />;
  if (error || !lifecycleSummary || !performanceSummary || !criticalitySummary) {
    return <ErrorState message={error || ""} retry={fetchData} />;
  }

  // Parse stage distribution for chart
  const stageChartData = Object.entries(lifecycleSummary.stage_distribution).map(([key, val]) => ({
    name: key,
    count: val,
  }));

  // Parse benchmark data
  const benchmarkChartData = performanceSummary.all_assets.map((a: any) => ({
    name: a.name,
    value: a[benchmarkMetric],
  }));

  return (
    <div className="space-y-6 py-2 select-text font-mono text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-[10px] text-slate-450 dark:text-slate-500 uppercase tracking-widest mb-1.5">
            GRID ASSET LIFECYCLE MANAGEMENT SYSTEM
          </p>
          <h1 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-[#F8FAFC]">
            Asset Lifecycle & Performance Intelligence
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-sans">
            Track asset ages, replacement values, downtime curves, and run benchmarking analytics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="flex items-center justify-center p-2 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-[#2A313C] rounded-[4px] hover:bg-slate-50 dark:hover:bg-[#11161D] transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            to="/asset-intelligence"
            className="px-3 py-2 bg-slate-100 dark:bg-[#1C222B] text-slate-700 dark:text-slate-350 border border-slate-250 dark:border-[#2A313C] hover:bg-slate-200 dark:hover:bg-[#252D37] rounded-[4px] text-xs transition"
          >
            Asset Center
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-[#2A313C] flex flex-wrap gap-2">
        {(["lifecycle", "performance", "criticality", "benchmark"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 border-b-2 font-bold transition text-xs capitalize ${
              activeTab === tab
                ? "border-emerald-500 text-emerald-500"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-[#F8FAFC]"
            }`}
          >
            {tab === "criticality" ? "Critical & Risk Assets" : `${tab} Dashboard`}
          </button>
        ))}
      </div>

      {/* Lifecycle Dashboard */}
      {activeTab === "lifecycle" && (
        <div className="space-y-6">
          {/* Executive counts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5 shadow-sm space-y-1">
              <span className="text-slate-450 uppercase text-[10px] block">
                Asset Replacement Value
              </span>
              <span className="text-2xl font-bold text-slate-900 dark:text-[#F8FAFC]">
                ${(lifecycleSummary.total_replacement_cost / 1000000).toFixed(1)}M
              </span>
              <span className="text-[9px] text-slate-400 block">
                Total capital liability in service
              </span>
            </div>

            <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5 shadow-sm space-y-1">
              <span className="text-slate-450 uppercase text-[10px] block">Average Fleet Age</span>
              <span className="text-2xl font-bold text-slate-900 dark:text-[#F8FAFC]">
                {lifecycleSummary.average_age} Years
              </span>
              <span className="text-[9px] text-slate-400 block">Active operational lifetime</span>
            </div>

            <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5 shadow-sm space-y-1">
              <span className="text-slate-450 uppercase text-[10px] block">
                Total Forced Downtime
              </span>
              <span className="text-2xl font-bold text-rose-500">
                {lifecycleSummary.total_downtime} Hrs
              </span>
              <span className="text-[9px] text-slate-400 block">Forced outages recorded</span>
            </div>

            <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5 shadow-sm space-y-1">
              <span className="text-slate-450 uppercase text-[10px] block">
                Assets Near End-of-Life
              </span>
              <span className="text-2xl font-bold text-amber-500">
                {lifecycleSummary.assets_near_eol_count} Units
              </span>
              <span className="text-[9px] text-slate-400 block">RUL rating under 3 years</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Stage Distribution Chart */}
            <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5">
              <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-[#F8FAFC] pb-3 border-b border-slate-100 dark:border-[#2A313C] mb-4">
                Lifecycle Stage Distribution
              </h3>
              <div className="h-56 text-xs font-mono">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stageChartData}>
                    <XAxis dataKey="name" stroke="#64748B" fontSize={10} tickLine={false} />
                    <YAxis stroke="#64748B" fontSize={10} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1E293B",
                        border: "none",
                        color: "#F8FAFC",
                        borderRadius: "4px",
                      }}
                    />
                    <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                      {stageChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Age Distribution List */}
            <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5 space-y-4">
              <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-[#F8FAFC] pb-2 border-b border-slate-100 dark:border-[#2A313C]">
                Grid Assets Aging Curve
              </h3>
              <div className="overflow-y-auto max-h-48 pr-1 space-y-3">
                {performanceSummary.all_assets.map((a: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center border-b border-slate-100 dark:border-[#2A313C]/50 pb-1.5"
                  >
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{a.name}</span>
                      <span className="text-[10px] text-slate-400 block">{a.type}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-700 dark:text-slate-350">
                        Uptime Availability
                      </span>
                      <span className="text-emerald-500 font-bold block">{a.availability}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Asset Performance Dashboard */}
      {activeTab === "performance" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top performing assets */}
            <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5 space-y-4">
              <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-[#2A313C]">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-[#F8FAFC]">
                  Top Performing Assets (Benchmark)
                </h3>
              </div>

              <div className="space-y-3">
                {performanceSummary.top_performing.map((a: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-[4px] flex justify-between items-center"
                  >
                    <div>
                      <span className="font-bold text-slate-900 dark:text-[#F8FAFC]">{a.name}</span>
                      <span className="text-[10px] text-slate-450 block">{a.type}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Performance Index</span>
                      <span className="text-emerald-500 font-bold text-lg">
                        {a.performance_benchmark}/100
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Lowest performing assets */}
            <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5 space-y-4">
              <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-[#2A313C]">
                <ShieldAlert className="w-4 h-4 text-rose-500 animate-pulse" />
                <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-[#F8FAFC]">
                  Lowest Performing Assets (Action Items)
                </h3>
              </div>

              <div className="space-y-3">
                {performanceSummary.lowest_performing.map((a: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 bg-rose-500/5 border border-rose-500/10 rounded-[4px] flex justify-between items-center"
                  >
                    <div>
                      <span className="font-bold text-slate-900 dark:text-[#F8FAFC]">{a.name}</span>
                      <span className="text-[10px] text-slate-450 block">{a.type}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Performance Index</span>
                      <span className="text-rose-500 font-bold text-lg">
                        {a.performance_benchmark}/100
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Efficiency trend chart */}
          <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5">
            <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-[#F8FAFC] pb-3 border-b border-slate-100 dark:border-[#2A313C] mb-4">
              Asset Efficiency Performance curves
            </h3>
            <div className="h-64 text-xs font-mono">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceSummary.all_assets}>
                  <XAxis dataKey="name" stroke="#64748B" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1E293B",
                      border: "none",
                      color: "#F8FAFC",
                      borderRadius: "4px",
                    }}
                  />
                  <Bar
                    dataKey="efficiency_trend"
                    fill="#3B82F6"
                    radius={[2, 2, 0, 0]}
                    name="Efficiency Shift (%/Year)"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Critical & Risk Assets */}
      {activeTab === "criticality" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-mono text-xs">
            {/* Critical Assets */}
            <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5 space-y-4">
              <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-[#F8FAFC] pb-2 border-b border-slate-100 dark:border-[#2A313C] flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-amber-500" />
                Critical Grid Elements (Rank 7+)
              </h3>
              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {criticalitySummary.critical_assets.map((a: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center border-b border-slate-100 dark:border-[#2A313C]/50 pb-2"
                  >
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{a.name}</span>
                      <span className="text-[10px] text-slate-400 block">{a.type}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block">Criticality Rank</span>
                      <span className="font-bold text-amber-500">{a.criticality_ranking}/10</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* High risk assets */}
            <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5 space-y-4">
              <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-[#F8FAFC] pb-2 border-b border-slate-100 dark:border-[#2A313C] flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-500" />
                High Risk Failure Assets (Rank 7+)
              </h3>
              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {criticalitySummary.high_risk_assets.map((a: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center border-b border-slate-100 dark:border-[#2A313C]/50 pb-2"
                  >
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{a.name}</span>
                      <span className="text-[10px] text-slate-400 block">{a.type}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block">Risk Rank</span>
                      <span className="font-bold text-rose-500">{a.risk_ranking}/10</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Near end of life */}
            <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5 space-y-4">
              <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-[#F8FAFC] pb-2 border-b border-slate-100 dark:border-[#2A313C] flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-500" />
                Assets Approaching End of Life (RUL &le; 3 yrs)
              </h3>
              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {criticalitySummary.near_eol_assets.map((a: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center border-b border-slate-100 dark:border-[#2A313C]/50 pb-2"
                  >
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{a.name}</span>
                      <span className="text-[10px] text-slate-400 block">{a.type}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block">Remaining Useful Life</span>
                      <span className="font-bold text-rose-500">
                        {a.remaining_useful_life} Years
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* High maintenance costs */}
            <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5 space-y-4">
              <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-[#F8FAFC] pb-2 border-b border-slate-100 dark:border-[#2A313C] flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-500" />
                High Maintenance Cost Assets (&ge; $4,000)
              </h3>
              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {criticalitySummary.high_maintenance_cost_assets.map((a: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center border-b border-slate-100 dark:border-[#2A313C]/50 pb-2"
                  >
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{a.name}</span>
                      <span className="text-[10px] text-slate-400 block">{a.type}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block">Maintenance Cost</span>
                      <span className="font-bold text-emerald-500">
                        ${a.maintenance_cost.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Asset Benchmark Dashboard */}
      {activeTab === "benchmark" && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-[#11161D] border border-slate-200 dark:border-[#2A313C] rounded-[4px] w-fit">
            {(
              [
                "performance_benchmark",
                "availability",
                "lifecycle_cost",
                "maintenance_cost",
              ] as const
            ).map((metric) => (
              <button
                key={metric}
                onClick={() => setBenchmarkMetric(metric)}
                className={`px-3 py-1 font-bold text-[10px] uppercase rounded-[2px] transition ${
                  benchmarkMetric === metric
                    ? "bg-emerald-500 text-white"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-[#F8FAFC]"
                }`}
              >
                {metric.replace("_", " ")}
              </button>
            ))}
          </div>

          <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5">
            <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-[#F8FAFC] pb-3 border-b border-slate-100 dark:border-[#2A313C] mb-4">
              Cross-Asset Benchmarking Comparison
            </h3>
            <div className="h-72 text-xs font-mono">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={benchmarkChartData}>
                  <XAxis dataKey="name" stroke="#64748B" fontSize={9} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1E293B",
                      border: "none",
                      color: "#F8FAFC",
                      borderRadius: "4px",
                    }}
                  />
                  <Bar
                    dataKey="value"
                    radius={[2, 2, 0, 0]}
                    name={benchmarkMetric.replace("_", " ").toUpperCase()}
                  >
                    {benchmarkChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
