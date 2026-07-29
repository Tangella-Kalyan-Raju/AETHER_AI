import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, RefreshCw, BarChart3, TrendingUp, Cpu } from "lucide-react";
import { assetApi } from "../../api/assets";
import { LoadingState, ErrorState } from "./components/StateStates";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const COLORS = ["#EF4444", "#F59E0B", "#10B981"];

export default function RiskDashboard() {
  const [summary, setSummary] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRiskData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await assetApi.getRiskSummary();
      setSummary(res);
    } catch (err: any) {
      console.error(err);
      setError("Failed to fetch grid risk metrics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiskData();
  }, []);

  if (loading) return <LoadingState message="Recompiling probability models and risk indices..." />;
  if (error || !summary) return <ErrorState message={error || ""} retry={fetchRiskData} />;

  // Chart data: High, Med, Low
  const riskCategories = [
    { name: "High Risk", count: summary.high_risk_count },
    { name: "Medium Risk", count: summary.medium_risk_count },
    { name: "Low Risk", count: summary.low_risk_count },
  ];

  return (
    <div className="space-y-6 py-2 select-text">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-[10px] font-mono text-slate-450 dark:text-slate-500 uppercase tracking-widest mb-1.5">
            GRID PROBABILISTIC RELIABILITY
          </p>
          <h1 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-[#F8FAFC]">
            Grid Risk Analyzer
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Outage probability curves, failure distributions, and asset criticality rankings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchRiskData}
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

      {/* Top counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
        <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5 shadow-sm">
          <p className="text-[10px] text-rose-500 uppercase tracking-wider mb-2 font-bold flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            High Risk Elements
          </p>
          <h3 className="font-heading text-2xl font-bold text-rose-500">
            {summary.high_risk_count}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Telemetry indicates warning conditions
          </p>
        </div>

        <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5 shadow-sm">
          <p className="text-[10px] text-amber-500 uppercase tracking-wider mb-2 font-bold flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            Medium Risk Elements
          </p>
          <h3 className="font-heading text-2xl font-bold text-amber-500">
            {summary.medium_risk_count}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Elevated thermal/vibration trends
          </p>
        </div>

        <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5 shadow-sm">
          <p className="text-[10px] text-emerald-500 uppercase tracking-wider mb-2 font-bold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            Low Risk Elements
          </p>
          <h3 className="font-heading text-2xl font-bold text-emerald-500">
            {summary.low_risk_count}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Optimal system operations nominal
          </p>
        </div>
      </div>

      {/* Chart grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Categories */}
        <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5 shadow-sm">
          <div className="flex items-center gap-1.5 pb-3 border-b border-slate-100 dark:border-[#2A313C] mb-4">
            <BarChart3 className="w-4 h-4 text-emerald-500" />
            <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-[#F8FAFC]">
              Grid Component Risk Distribution
            </h3>
          </div>
          <div className="h-48 w-full mt-4 text-xs font-mono">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskCategories}>
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
                <Bar dataKey="count" fill="#3B82F6" radius={[2, 2, 0, 0]}>
                  {riskCategories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Prob distributions */}
        <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5 shadow-sm">
          <div className="flex items-center gap-1.5 pb-3 border-b border-slate-100 dark:border-[#2A313C] mb-4">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-[#F8FAFC]">
              Outage Failure Probability Distribution
            </h3>
          </div>
          <div className="h-48 w-full mt-4 text-xs font-mono">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.failure_probability_distribution}>
                <XAxis dataKey="range" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={10} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1E293B",
                    border: "none",
                    color: "#F8FAFC",
                    borderRadius: "4px",
                  }}
                />
                <Bar dataKey="count" fill="#3B82F6" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Criticality Overview */}
      <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5 shadow-sm">
        <div className="flex items-center gap-1.5 pb-3 border-b border-slate-100 dark:border-[#2A313C] mb-4">
          <Cpu className="w-4 h-4 text-emerald-500" />
          <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-[#F8FAFC]">
            Asset Criticality Rankings
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-[#2A313C] text-slate-400 dark:text-slate-500">
                <th className="py-2.5">Asset ID</th>
                <th className="py-2.5">Name</th>
                <th className="py-2.5">Type</th>
                <th className="py-2.5">Criticality Index</th>
                <th className="py-2.5">Failure Probability</th>
                <th className="py-2.5 text-right">Operational State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-55 dark:divide-[#2A313C] text-slate-700 dark:text-slate-300">
              {summary.criticality_overview.map((c: any) => (
                <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-[#1c2431]/20">
                  <td className="py-2.5">{c.asset_id}</td>
                  <td className="py-2.5 font-bold text-slate-900 dark:text-[#F8FAFC]">
                    <Link
                      to={`/asset-intelligence/assets/${c.id}`}
                      className="hover:underline hover:text-emerald-500"
                    >
                      {c.name}
                    </Link>
                  </td>
                  <td className="py-2.5">{c.type}</td>
                  <td className="py-2.5 font-bold text-amber-500">
                    {c.criticality_score.toFixed(0)}/100
                  </td>
                  <td className="py-2.5">{(c.failure_probability * 100).toFixed(0)}%</td>
                  <td className="py-2.5 text-right">
                    <span
                      className={`px-1.5 py-0.5 rounded-[4px] border text-[9px] ${
                        c.condition.toLowerCase() === "critical"
                          ? "border-rose-500/20 bg-rose-500/10 text-rose-500"
                          : c.condition.toLowerCase() === "warning"
                            ? "border-amber-500/20 bg-amber-500/10 text-amber-500"
                            : "border-slate-200 bg-slate-50 dark:bg-[#11161D] text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      {c.condition}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
