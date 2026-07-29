import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { BrainCircuit, RefreshCw, AlertOctagon, ShieldAlert, Sparkles } from "lucide-react";
import { assetApi } from "../../api/assets";
import { LoadingState, ErrorState } from "./components/StateStates";

export default function AssetIntelligenceDashboard() {
  const [summary, setSummary] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAISummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await assetApi.getAISummary();
      setSummary(res);
    } catch (err: any) {
      console.error(err);
      setError("Failed to fetch AI recommendation aggregates.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAISummary();
  }, []);

  if (loading) return <LoadingState message="Connecting to GPO AI decision nodes..." />;
  if (error || !summary) return <ErrorState message={error || ""} retry={fetchAISummary} />;

  return (
    <div className="space-y-6 py-2 select-text">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
            GRID AI DECISION SUPPORT SYSTEM
          </p>
          <h1 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-[#F8FAFC]">
            Explainable AI Asset Intelligence
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Explainable recommendations, root cause analyses, and operational warnings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchAISummary}
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

      {/* Overview stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5 shadow-sm">
          <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
            Average Asset Uptime Health
          </p>
          <h3 className="font-heading text-2xl font-bold text-slate-900 dark:text-[#F8FAFC]">
            {summary.average_health}%
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Aggregated health across all categories
          </p>
        </div>

        <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5 shadow-sm">
          <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
            Active High-Priority AI Insights
          </p>
          <h3 className="font-heading text-2xl font-bold text-rose-500">
            {summary.high_risk_assets.length}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Urgent actions required by operators
          </p>
        </div>

        <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5 shadow-sm">
          <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
            AI Total Scanned Nodes
          </p>
          <h3 className="font-heading text-2xl font-bold text-slate-900 dark:text-[#F8FAFC]">
            {summary.recent_insights.length}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Grid components analyzed
          </p>
        </div>
      </div>

      {/* Urgent AI actions */}
      <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5 shadow-sm">
        <div className="flex items-center gap-1.5 pb-3 border-b border-slate-100 dark:border-[#2A313C] mb-4">
          <ShieldAlert className="w-4 h-4 text-rose-500 animate-pulse" />
          <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-[#F8FAFC]">
            Urgent AI Recommendations
          </h3>
        </div>

        <div className="space-y-4">
          {summary.recommended_actions.map((act: any) => (
            <div
              key={act.id}
              className="p-4 border border-rose-500/20 bg-rose-500/5 rounded-[4px] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 font-mono text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded-[2px] bg-rose-500 text-white text-[9px] uppercase tracking-wider font-bold">
                    {act.priority}
                  </span>
                  <Link
                    to={`/asset-intelligence/assets/${act.id}`}
                    className="font-bold text-slate-900 dark:text-[#F8FAFC] hover:underline"
                  >
                    {act.name} ({act.asset_id})
                  </Link>
                </div>
                <p className="text-slate-800 dark:text-slate-200">
                  <span className="font-bold">Action:</span> {act.action}
                </p>
                <p className="text-slate-500 dark:text-slate-400 text-[10px]">
                  <span className="font-bold">Root Cause:</span> {act.reason}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <span className="text-[10px] text-slate-400 uppercase block">Expected Impact</span>
                <span className="font-bold text-emerald-500">{act.impact}</span>
              </div>
            </div>
          ))}
          {summary.recommended_actions.length === 0 && (
            <p className="text-center py-6 text-slate-450 font-mono text-xs">
              No urgent AI action items detected.
            </p>
          )}
        </div>
      </div>

      {/* Recent insights */}
      <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5 shadow-sm">
        <div className="flex items-center gap-1.5 pb-3 border-b border-slate-100 dark:border-[#2A313C] mb-4">
          <BrainCircuit className="w-4 h-4 text-emerald-500" />
          <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-[#F8FAFC]">
            Recent AI Insight Records
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-[#2A313C] text-slate-400 dark:text-slate-500">
                <th className="py-2.5">Asset</th>
                <th className="py-2.5">Recommendation</th>
                <th className="py-2.5">Health</th>
                <th className="py-2.5">Confidence</th>
                <th className="py-2.5 text-right">Priority</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-55 dark:divide-[#2A313C] text-slate-700 dark:text-slate-300">
              {summary.recent_insights.map((ins: any) => (
                <tr key={ins.id} className="hover:bg-slate-50/50 dark:hover:bg-[#1c2431]/20">
                  <td className="py-3 font-bold text-slate-900 dark:text-[#F8FAFC]">
                    <Link
                      to={`/asset-intelligence/assets/${ins.id}`}
                      className="hover:underline hover:text-emerald-500"
                    >
                      {ins.name}
                    </Link>
                  </td>
                  <td className="py-3 max-w-sm truncate" title={ins.recommendation}>
                    {ins.recommendation}
                  </td>
                  <td className="py-3">{ins.health_score}%</td>
                  <td className="py-3">{(ins.confidence_score * 100).toFixed(0)}%</td>
                  <td className="py-3 text-right">
                    <span
                      className={`px-1.5 py-0.5 rounded-[4px] border text-[9px] ${
                        ins.priority.toLowerCase() === "critical"
                          ? "border-rose-500/20 bg-rose-500/10 text-rose-500"
                          : ins.priority.toLowerCase() === "high"
                            ? "border-amber-500/20 bg-amber-500/10 text-amber-500"
                            : "border-slate-200 bg-slate-50 dark:bg-[#11161D] text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      {ins.priority}
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
