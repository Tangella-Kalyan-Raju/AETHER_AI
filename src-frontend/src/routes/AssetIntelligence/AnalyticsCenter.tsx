import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  BarChart3,
  RefreshCw,
  Calendar,
  MapPin,
  Database,
  Award,
  ClipboardList,
  Shield,
} from "lucide-react";
import { analyticsApi } from "../../api/analytics";
import { LoadingState, ErrorState } from "./components/StateStates";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export default function AnalyticsCenter() {
  const [activeTab, setActiveTab] = useState<
    "executive" | "kpis" | "historical" | "trends" | "regional" | "logs"
  >("executive");

  // States
  const [dashboard, setDashboard] = useState<any | null>(null);
  const [kpis, setKpis] = useState<any[]>([]);
  const [historical, setHistorical] = useState<any | null>(null);
  const [trends, setTrends] = useState<any | null>(null);
  const [regional, setRegional] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Loading & Error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [regionFilter, setRegionFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [rangeFilter, setRangeFilter] = useState("monthly");
  const [trendSegment, setTrendSegment] = useState("daily");

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all endpoints in parallel — individual failures won't break the entire page
      const [dbres, kpires, histres, trendres, regres, actres, auditres] = await Promise.allSettled(
        [
          analyticsApi.getDashboard({ region: regionFilter, asset_type: typeFilter }),
          analyticsApi.getKpis({ region: regionFilter }),
          analyticsApi.getHistorical({
            range: rangeFilter,
            region: regionFilter,
            asset_type: typeFilter,
          }),
          analyticsApi.getTrends({ segment: trendSegment }),
          analyticsApi.getRegional(),
          analyticsApi.getOperatorActivities(8),
          analyticsApi.getAuditLogs(8),
        ]
      );

      // Set data from fulfilled promises, keep previous state for rejected ones
      if (dbres.status === "fulfilled") setDashboard(dbres.value);
      if (kpires.status === "fulfilled") setKpis(kpires.value);
      if (histres.status === "fulfilled") setHistorical(histres.value);
      if (trendres.status === "fulfilled") setTrends(trendres.value);
      if (regres.status === "fulfilled") setRegional(regres.value);
      if (actres.status === "fulfilled") setActivities(actres.value);
      if (auditres.status === "fulfilled") setAuditLogs(auditres.value);

      // Only show a critical error if the primary dashboard endpoint failed
      const allFailed = [dbres, kpires, histres, trendres, regres, actres, auditres].every(
        (r) => r.status === "rejected"
      );
      if (dbres.status === "rejected" && allFailed) {
        console.error("All analytics endpoints failed:", dbres.reason);
        setError(
          "Failed to connect to grid analytics telemetry backend. Verify backend connectivity."
        );
      } else if (dbres.status === "rejected") {
        console.warn("Dashboard endpoint failed, partial data available:", dbres.reason);
        setError(
          "Executive dashboard data unavailable. Other analytics tabs may still contain data."
        );
      }
    } catch (err: any) {
      console.error(err);
      setError("Failed to compile enterprise grid analytics telemetry.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [regionFilter, typeFilter, rangeFilter, trendSegment]);

  if (loading) return <LoadingState message="Recompiling enterprise asset analytics..." />;
  if (!dashboard && kpis.length === 0 && !historical && !trends && regional.length === 0) {
    return (
      <ErrorState
        message={error || "Failed to connect to grid analytics backend."}
        retry={fetchAnalytics}
      />
    );
  }

  return (
    <div className="space-y-6 py-2 select-text font-mono text-xs">
      {/* Partial failure warning banner */}
      {error && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-[4px] text-amber-500 text-xs font-mono flex items-center justify-between">
          <span>⚠ {error}</span>
          <button
            onClick={fetchAnalytics}
            className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 rounded-[2px] transition text-[10px] font-bold uppercase"
          >
            Retry
          </button>
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
            GRID BUSINESS INTELLIGENCE PLATFORM
          </p>
          <h1 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-[#F8FAFC]">
            Enterprise Analytics Center
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-sans">
            Consolidated grid performance, operating cost savings, carbon balance sheet, and
            operator logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchAnalytics}
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
        {(["executive", "kpis", "historical", "trends", "regional", "logs"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 border-b-2 font-bold transition text-xs capitalize ${
              activeTab === tab
                ? "border-emerald-500 text-emerald-500"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-[#F8FAFC]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Global Filter Bar (Only visible for tabs that support filtering) */}
      {(activeTab === "executive" || activeTab === "historical") && (
        <div className="p-4 bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <span className="text-slate-450 uppercase">Region:</span>
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="bg-slate-50 dark:bg-[#11161D] border border-slate-255 dark:border-[#2A313C] rounded-[4px] px-2.5 py-1 text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="">All Regions</option>
              <option value="West Region">West Region</option>
              <option value="East Region">East Region</option>
              <option value="North Region">North Region</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-450 uppercase">Asset Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-slate-50 dark:bg-[#11161D] border border-slate-255 dark:border-[#2A313C] rounded-[4px] px-2.5 py-1 text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="">All Types</option>
              <option value="Solar Farm">Solar Farm</option>
              <option value="Wind Farm">Wind Farm</option>
              <option value="Battery Energy Storage System">Battery (BESS)</option>
              <option value="Transformer">Transformer</option>
              <option value="Transmission Line">Transmission Line</option>
            </select>
          </div>

          {activeTab === "historical" && (
            <div className="flex items-center gap-2">
              <span className="text-slate-450 uppercase">Range:</span>
              <select
                value={rangeFilter}
                onChange={(e) => setRangeFilter(e.target.value)}
                className="bg-slate-50 dark:bg-[#11161D] border border-slate-255 dark:border-[#2A313C] rounded-[4px] px-2.5 py-1 text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          )}
        </div>
      )}

      {/* Content panes */}
      {activeTab === "executive" && (
        <div className="space-y-6">
          {!dashboard ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400 text-sm">
              Executive dashboard telemetry is currently unavailable. Try switching tabs or click{" "}
              <button onClick={fetchAnalytics} className="text-emerald-500 underline font-bold">
                Retry
              </button>
              .
            </div>
          ) : (
            <>
              {/* Executive stats cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5 shadow-sm">
                  <span className="text-slate-450 uppercase text-[10px] block mb-1">
                    Grid Performance Index
                  </span>
                  <span className="text-2xl font-bold text-slate-900 dark:text-[#F8FAFC]">
                    {dashboard.overall_grid_performance}%
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1">
                    Aggregated asset health index
                  </span>
                </div>

                <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5 shadow-sm">
                  <span className="text-slate-450 uppercase text-[10px] block mb-1">
                    Operational Savings
                  </span>
                  <span className="text-2xl font-bold text-emerald-500">
                    ${(dashboard.estimated_savings / 1000000).toFixed(2)}M
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1">
                    Savings compared to baseline
                  </span>
                </div>

                <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5 shadow-sm">
                  <span className="text-slate-450 uppercase text-[10px] block mb-1">
                    CO₂ Reduction Target
                  </span>
                  <span className="text-2xl font-bold text-slate-900 dark:text-[#F8FAFC]">
                    {dashboard.co2_reduction}%
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1">
                    Renewables displacement ratio
                  </span>
                </div>

                <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5 shadow-sm">
                  <span className="text-slate-450 uppercase text-[10px] block mb-1">
                    Grid System Availability
                  </span>
                  <span className="text-2xl font-bold text-slate-900 dark:text-[#F8FAFC]">
                    {dashboard.grid_availability}%
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1">
                    Uptime telemetry aggregation
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Overview chart */}
                <div className="lg:col-span-2 bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5">
                  <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-[#F8FAFC] pb-3 border-b border-slate-100 dark:border-[#2A313C] mb-4">
                    Operational Efficiency & Asset Uptime trends
                  </h3>
                  <div className="h-60 text-xs font-mono">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={historical ? historical.data : []}>
                        <XAxis dataKey="time" stroke="#64748B" fontSize={10} tickLine={false} />
                        <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1E293B",
                            border: "none",
                            color: "#F8FAFC",
                            borderRadius: "4px",
                          }}
                        />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="AssetPerformance"
                          stroke="#10B981"
                          fill="#10B981"
                          fillOpacity={0.05}
                          name="Uptime %"
                        />
                        <Area
                          type="monotone"
                          dataKey="Weather"
                          stroke="#F59E0B"
                          fill="#F59E0B"
                          fillOpacity={0.05}
                          name="Thermal Stress"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Quick Summary Cards */}
                <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5 space-y-4">
                  <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-[#F8FAFC] pb-2 border-b border-slate-100 dark:border-[#2A313C]">
                    Core Grid Capacity
                  </h3>
                  <div className="space-y-4 text-xs">
                    <div>
                      <span className="text-slate-400 block">Total Scanned Elements</span>
                      <span className="text-lg font-bold text-slate-800 dark:text-slate-200">
                        {dashboard.total_assets} Assets
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Operational Efficiency</span>
                      <span className="text-lg font-bold text-slate-800 dark:text-slate-200">
                        {dashboard.operational_efficiency}%
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Average Asset Utilization</span>
                      <span className="text-lg font-bold text-slate-800 dark:text-slate-200">
                        {dashboard.asset_utilization}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === "kpis" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {kpis.map((kpi, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5 shadow-sm space-y-3"
            >
              <span className="text-slate-450 uppercase text-[10px] tracking-wider block border-b border-slate-100 dark:border-[#2A313C] pb-1.5">
                {kpi.name}
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-slate-900 dark:text-[#F8FAFC]">
                  {typeof kpi.current_value === "number"
                    ? kpi.current_value.toLocaleString()
                    : kpi.current_value}{" "}
                  {kpi.unit}
                </span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-[2px] border ${
                    kpi.trend_direction === "UP" && kpi.name.includes("Cost")
                      ? "border-rose-500/20 bg-rose-500/10 text-rose-500"
                      : kpi.trend_direction === "UP" ||
                          (kpi.trend_direction === "DOWN" && kpi.name.includes("Cost"))
                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
                        : "border-rose-500/20 bg-rose-500/10 text-rose-500"
                  }`}
                >
                  {kpi.percentage_change > 0 ? "+" : ""}
                  {kpi.percentage_change}%
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Prior value: {kpi.previous_value.toLocaleString()} {kpi.unit}
              </p>
            </div>
          ))}
        </div>
      )}

      {activeTab === "historical" && (
        <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#2A313C]">
            <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-[#F8FAFC]">
              Historical Dispatch & Demand Analysis
            </h3>
            <span className="text-[10px] text-slate-400 capitalize">Interval: {rangeFilter}</span>
          </div>

          <div className="h-64 text-xs font-mono">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historical ? historical.data : []}>
                <XAxis dataKey="time" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1E293B",
                    border: "none",
                    color: "#F8FAFC",
                    borderRadius: "4px",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="Demand"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  name="Demand (MW)"
                />
                <Line
                  type="monotone"
                  dataKey="Generation"
                  stroke="#10B981"
                  strokeWidth={2}
                  name="Generation (MW)"
                />
                <Line
                  type="monotone"
                  dataKey="CO2"
                  stroke="#EF4444"
                  strokeWidth={2}
                  name="CO₂ Uptime (Tons)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === "trends" && (
        <div className="space-y-6">
          {/* Trend selector bar */}
          <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-[#11161D] border border-slate-200 dark:border-[#2A313C] rounded-[4px] w-fit">
            {(["daily", "weekly", "monthly"] as const).map((seg) => (
              <button
                key={seg}
                onClick={() => setTrendSegment(seg)}
                className={`px-3 py-1 font-bold text-[10px] uppercase rounded-[2px] transition ${
                  trendSegment === seg
                    ? "bg-emerald-500 text-white"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-[#F8FAFC]"
                }`}
              >
                {seg}
              </button>
            ))}
          </div>

          <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5">
            <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-[#F8FAFC] pb-3 border-b border-slate-100 dark:border-[#2A313C] mb-4">
              Load & Cost Trends Analysis
            </h3>
            <div className="h-64 text-xs font-mono">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trends ? trends.data : []}>
                  <XAxis dataKey="time" stroke="#64748B" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1E293B",
                      border: "none",
                      color: "#F8FAFC",
                      borderRadius: "4px",
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="Demand"
                    fill="#3B82F6"
                    radius={[2, 2, 0, 0]}
                    name="Demand Profile (MW)"
                  />
                  <Bar
                    dataKey="Cost"
                    fill="#EF4444"
                    radius={[2, 2, 0, 0]}
                    name="Operational Cost ($)"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === "regional" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5">
            <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-[#F8FAFC] pb-3 border-b border-slate-100 dark:border-[#2A313C] mb-4">
              Regional Savings & Performance Comparison
            </h3>
            <div className="h-64 text-xs font-mono">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={regional}>
                  <XAxis dataKey="region" stroke="#64748B" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1E293B",
                      border: "none",
                      color: "#F8FAFC",
                      borderRadius: "4px",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="savings" fill="#10B981" radius={[2, 2, 0, 0]} name="Savings ($)" />
                  <Bar
                    dataKey="co2_reduction"
                    fill="#EF4444"
                    radius={[2, 2, 0, 0]}
                    name="CO₂ Reduction %"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Regional Table */}
          <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-[#2A313C] text-slate-400">
                  <th className="py-2.5">Zone Region</th>
                  <th className="py-2.5">Active Assets</th>
                  <th className="py-2.5">Availability Uptime</th>
                  <th className="py-2.5">Operating Cost</th>
                  <th className="py-2.5 text-right">Aggregated Savings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-55 dark:divide-[#2A313C] text-slate-700 dark:text-slate-300">
                {regional.map((r, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-[#1c2431]/20">
                    <td className="py-3 font-bold text-slate-900 dark:text-[#F8FAFC]">
                      {r.region}
                    </td>
                    <td className="py-3">{r.active_assets}</td>
                    <td className="py-3 text-emerald-500 font-bold">{r.availability}%</td>
                    <td className="py-3">${r.cost.toLocaleString()}</td>
                    <td className="py-3 text-right text-emerald-500 font-bold">
                      ${r.savings.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "logs" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Operator Action logs */}
          <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5 space-y-4">
            <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-[#2A313C]">
              <ClipboardList className="w-4 h-4 text-emerald-500" />
              <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-[#F8FAFC]">
                Operator Activities Feed
              </h3>
            </div>

            <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
              {activities.map((act) => (
                <div key={act.id} className="border-l-2 border-emerald-500 pl-3.5 py-0.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {act.action}
                    </span>
                    <span className="text-[10px] text-slate-450">
                      {new Date(act.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    {act.details} (User ID: {act.user_id})
                  </p>
                </div>
              ))}
              {activities.length === 0 && (
                <p className="text-center py-6 text-slate-450">No recent operator activities.</p>
              )}
            </div>
          </div>

          {/* Audit Logs */}
          <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5 space-y-4">
            <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-[#2A313C]">
              <Shield className="w-4 h-4 text-emerald-500" />
              <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-[#F8FAFC]">
                Grid Configuration Audit Trails
              </h3>
            </div>

            <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
              {auditLogs.map((log) => (
                <div key={log.id} className="border-l-2 border-blue-500 pl-3.5 py-0.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {log.action}
                    </span>
                    <span className="text-[10px] text-slate-450">
                      {new Date(log.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Resource: {log.resource} | Status:{" "}
                    <span className="font-bold">{log.status}</span>
                  </p>
                </div>
              ))}
              {auditLogs.length === 0 && (
                <p className="text-center py-6 text-slate-450">No recent configuration changes.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
