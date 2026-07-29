import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Activity, ShieldAlert, Heart, RefreshCw } from "lucide-react";
import { assetApi } from "../../api/assets";
import { FailureHeatmap } from "./components/FailureHeatmap";
import { LoadingState, ErrorState } from "./components/StateStates";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const COLORS = ["#10B981", "#3B82F6", "#F59E0B", "#EF4444"];

export default function AssetHealthDashboard() {
  const [summary, setSummary] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await assetApi.getHealthSummary();
      setSummary(res);
    } catch (err: any) {
      console.error(err);
      setError("Failed to fetch asset health indices.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  if (loading) return <LoadingState message="Recompiling asset health metrics..." />;
  if (error || !summary) return <ErrorState message={error || ""} retry={fetchSummary} />;

  const conditionChartData = Object.entries(summary.by_condition).map(([name, count]) => ({
    name,
    count,
  }));

  return (
    <div className="space-y-6 py-2 select-text">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
            GRID PROGNOSTIC OPERATIONS
          </p>
          <h1 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-[#F8FAFC]">
            Intelligent Health Diagnostics
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time diagnostics, remaining useful life predictions, and efficiency profiles.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchSummary}
            className="flex items-center justify-center p-2 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-[#2A313C] rounded-[4px] hover:bg-slate-50 dark:hover:bg-[#11161D] transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            to="/asset-intelligence"
            className="px-3 py-2 bg-slate-100 dark:bg-[#1C222B] text-slate-700 dark:text-slate-350 border border-slate-250 dark:border-[#2A313C] hover:bg-slate-200 dark:hover:bg-[#252D37] rounded-[4px] font-mono text-xs transition"
          >
            Asset Center
          </Link>
        </div>
      </div>

      {/* Top Diagnostics stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5 shadow-sm">
          <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
            Average Health Score
          </p>
          <h3 className="font-heading text-2xl font-bold text-slate-900 dark:text-[#F8FAFC]">
            {summary.average_health_score}%
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Aggregated grid condition score
          </p>
        </div>

        <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5 shadow-sm">
          <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
            Remaining Useful Life (Avg)
          </p>
          <h3 className="font-heading text-2xl font-bold text-emerald-500">
            {summary.average_remaining_useful_life.toFixed(1)} years
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Est. lifecycle before replacement
          </p>
        </div>

        <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5 shadow-sm">
          <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
            Average Efficiency
          </p>
          <h3 className="font-heading text-2xl font-bold text-slate-900 dark:text-[#F8FAFC]">
            {summary.average_efficiency}%
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Conversion & performance rating
          </p>
        </div>

        <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5 shadow-sm">
          <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
            Grid Availability
          </p>
          <h3 className="font-heading text-2xl font-bold text-slate-900 dark:text-[#F8FAFC]">
            {summary.average_availability}%
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Component uptime telemetry
          </p>
        </div>
      </div>

      {/* Heatmap & Conditions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <FailureHeatmap
            assets={summary.high_risk_assets.concat(
              // Append some dummy assets if empty to display heatmap correctly
              summary.high_risk_assets.length === 0 ? [] : []
            )}
          />
        </div>

        <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5 shadow-sm">
          <div className="flex items-center gap-1.5 pb-3 border-b border-slate-100 dark:border-[#2A313C]">
            <Heart className="w-4 h-4 text-emerald-500" />
            <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-[#F8FAFC]">
              Conditions Breakdown
            </h3>
          </div>
          <div className="h-44 w-full mt-4 text-xs font-mono">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={conditionChartData}>
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
                <Bar dataKey="count" fill="#10B981" radius={[2, 2, 0, 0]}>
                  {conditionChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* High Risk Asset Alerts */}
      <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5 shadow-sm">
        <div className="flex items-center gap-1.5 pb-3 border-b border-slate-100 dark:border-[#2A313C] mb-4">
          <ShieldAlert className="w-4 h-4 text-rose-500 animate-pulse" />
          <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-[#F8FAFC]">
            High-Risk Grid Elements (Requires Attention)
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-[#2A313C] text-slate-400 dark:text-slate-500">
                <th className="py-2.5">Asset ID</th>
                <th className="py-2.5">Name</th>
                <th className="py-2.5">Type</th>
                <th className="py-2.5">Region</th>
                <th className="py-2.5">Health Score</th>
                <th className="py-2.5">Failure Probability</th>
                <th className="py-2.5 text-right">Condition</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-55 dark:divide-[#2A313C] text-slate-700 dark:text-slate-300">
              {summary.high_risk_assets.map((asset: any) => (
                <tr key={asset.id} className="hover:bg-slate-50/50 dark:hover:bg-[#1c2431]/20">
                  <td className="py-2.5">{asset.asset_id}</td>
                  <td className="py-2.5 font-bold text-slate-900 dark:text-[#F8FAFC]">
                    <Link
                      to={`/asset-intelligence/assets/${asset.id}`}
                      className="hover:underline hover:text-emerald-500"
                    >
                      {asset.name}
                    </Link>
                  </td>
                  <td className="py-2.5">{asset.type}</td>
                  <td className="py-2.5">{asset.region}</td>
                  <td className="py-2.5 text-rose-500 font-bold">
                    {asset.health_score.toFixed(0)}%
                  </td>
                  <td className="py-2.5">{(asset.failure_probability * 100).toFixed(0)}%</td>
                  <td className="py-2.5 text-right">
                    <span
                      className={`px-1.5 py-0.5 rounded-[4px] border text-[9px] ${
                        asset.condition.toLowerCase() === "critical"
                          ? "border-rose-500/20 bg-rose-500/10 text-rose-500"
                          : "border-amber-500/20 bg-amber-500/10 text-amber-500"
                      }`}
                    >
                      {asset.condition}
                    </span>
                  </td>
                </tr>
              ))}
              {summary.high_risk_assets.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-450">
                    No high-risk grid assets detected. System is running nominal.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
