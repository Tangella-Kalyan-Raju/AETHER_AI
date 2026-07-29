import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Calendar, RefreshCw, AlertTriangle, Clock, ListChecks } from "lucide-react";
import { assetApi } from "../../api/assets";
import { LoadingState, ErrorState } from "./components/StateStates";

export default function MaintenanceDashboard() {
  const [summary, setSummary] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMaintenance = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await assetApi.getMaintenanceSummary();
      setSummary(res);
    } catch (err: any) {
      console.error(err);
      setError("Failed to fetch upcoming maintenance logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaintenance();
  }, []);

  if (loading) return <LoadingState message="Compiling maintenance schedule records..." />;
  if (error || !summary) return <ErrorState message={error || ""} retry={fetchMaintenance} />;

  return (
    <div className="space-y-6 py-2 select-text">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
            GRID MAINTENANCE & OPERATIONS
          </p>
          <h1 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-[#F8FAFC]">
            Maintenance Planner Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track upcoming scheduled works, overdue service requests, and priority tasks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchMaintenance}
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

      {/* Priority counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(summary.by_priority).map(([prio, count]: any) => (
          <div
            key={prio}
            className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5 shadow-sm"
          >
            <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
              {prio} Priority Tasks
            </p>
            <h3
              className={`font-heading text-2xl font-bold ${
                prio.toLowerCase() === "critical"
                  ? "text-rose-500"
                  : prio.toLowerCase() === "high"
                    ? "text-amber-500"
                    : "text-slate-900 dark:text-[#F8FAFC]"
              }`}
            >
              {count}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Active tickets flagged
            </p>
          </div>
        ))}
      </div>

      {/* Overdue Maintenance */}
      <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5 shadow-sm">
        <div className="flex items-center gap-1.5 pb-3 border-b border-slate-100 dark:border-[#2A313C] mb-4">
          <AlertTriangle className="w-4 h-4 text-rose-500 animate-pulse" />
          <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-[#F8FAFC]">
            Overdue Maintenance Activities (Immediate Dispatch Required)
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
                <th className="py-2.5">Criticality</th>
                <th className="py-2.5">Target Date</th>
                <th className="py-2.5 text-right">Priority</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-55 dark:divide-[#2A313C] text-slate-700 dark:text-slate-300">
              {summary.overdue_maintenance.map((maint: any) => (
                <tr key={maint.id} className="hover:bg-slate-50/50 dark:hover:bg-[#1c2431]/20">
                  <td className="py-2.5">{maint.asset_id}</td>
                  <td className="py-2.5 font-bold text-slate-900 dark:text-[#F8FAFC]">
                    <Link
                      to={`/asset-intelligence/assets/${maint.id}`}
                      className="hover:underline hover:text-emerald-500"
                    >
                      {maint.name}
                    </Link>
                  </td>
                  <td className="py-2.5">{maint.type}</td>
                  <td className="py-2.5">{maint.region}</td>
                  <td className="py-2.5 text-rose-500 font-bold">
                    {maint.criticality_score.toFixed(0)}/100
                  </td>
                  <td className="py-2.5 text-rose-455 font-bold">
                    {new Date(maint.schedule).toLocaleDateString()}
                  </td>
                  <td className="py-2.5 text-right">
                    <span
                      className={`px-1.5 py-0.5 rounded-[4px] border text-[9px] ${
                        maint.priority.toLowerCase() === "critical"
                          ? "border-rose-500/20 bg-rose-500/10 text-rose-500"
                          : "border-amber-500/20 bg-amber-500/10 text-amber-500"
                      }`}
                    >
                      {maint.priority}
                    </span>
                  </td>
                </tr>
              ))}
              {summary.overdue_maintenance.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-450">
                    No overdue maintenance tasks. All schedules nominal.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upcoming Scheduled Maintenance */}
      <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5 shadow-sm">
        <div className="flex items-center gap-1.5 pb-3 border-b border-slate-100 dark:border-[#2A313C] mb-4">
          <Calendar className="w-4 h-4 text-emerald-500" />
          <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-[#F8FAFC]">
            Upcoming Scheduled Maintenance Tasks
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
                <th className="py-2.5">Failure Prob.</th>
                <th className="py-2.5">Scheduled Date</th>
                <th className="py-2.5 text-right">Priority</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-55 dark:divide-[#2A313C] text-slate-700 dark:text-slate-300">
              {summary.upcoming_maintenance.map((maint: any) => (
                <tr key={maint.id} className="hover:bg-slate-50/50 dark:hover:bg-[#1c2431]/20">
                  <td className="py-2.5">{maint.asset_id}</td>
                  <td className="py-2.5 font-bold text-slate-900 dark:text-[#F8FAFC]">
                    <Link
                      to={`/asset-intelligence/assets/${maint.id}`}
                      className="hover:underline hover:text-emerald-500"
                    >
                      {maint.name}
                    </Link>
                  </td>
                  <td className="py-2.5">{maint.type}</td>
                  <td className="py-2.5">{maint.region}</td>
                  <td className="py-2.5">{(maint.failure_probability * 100).toFixed(0)}%</td>
                  <td className="py-2.5">{new Date(maint.schedule).toLocaleDateString()}</td>
                  <td className="py-2.5 text-right">
                    <span
                      className={`px-1.5 py-0.5 rounded-[4px] border text-[9px] ${
                        maint.priority.toLowerCase() === "critical"
                          ? "border-rose-500/20 bg-rose-500/10 text-rose-500"
                          : maint.priority.toLowerCase() === "high"
                            ? "border-amber-500/20 bg-amber-500/10 text-amber-500"
                            : "border-slate-200 bg-slate-50 dark:bg-[#11161D] text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {maint.priority}
                    </span>
                  </td>
                </tr>
              ))}
              {summary.upcoming_maintenance.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-450">
                    No upcoming maintenance schedules recorded.
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
