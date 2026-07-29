import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ListChecks, RefreshCw, Sparkles, AlertOctagon, CheckSquare } from "lucide-react";
import { assetApi } from "../../api/assets";
import { LoadingState, ErrorState } from "./components/StateStates";

export default function MaintenanceRecommendationCenter() {
  const [summary, setSummary] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await assetApi.getAISummary();
      setSummary(res);
    } catch (err: any) {
      console.error(err);
      setError("Failed to fetch maintenance recommendations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  if (loading) return <LoadingState message="Querying active AI recommendation queues..." />;
  if (error || !summary) return <ErrorState message={error || ""} retry={fetchRecommendations} />;

  return (
    <div className="space-y-6 py-2 select-text">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
            GRID MAINTENANCE ADVISORY SYSTEM
          </p>
          <h1 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-[#F8FAFC]">
            Maintenance Recommendation Center
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review suggested inspections, replacements, and operator actions before approval.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchRecommendations}
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

      {/* Grid of advisory actions */}
      <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-[#2A313C]">
          <ListChecks className="w-4 h-4 text-emerald-500" />
          <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-[#F8FAFC]">
            Explainable Maintenance Tasks (Requires Operator Review)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {summary.recent_insights.map((ins: any) => (
            <div
              key={ins.id}
              className="border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-4 flex flex-col justify-between space-y-3 font-mono text-xs"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Link
                    to={`/asset-intelligence/assets/${ins.id}`}
                    className="font-bold text-slate-900 dark:text-[#F8FAFC] hover:underline"
                  >
                    {ins.name}
                  </Link>
                  <span
                    className={`px-1.5 py-0.5 rounded-[4px] border text-[9px] ${
                      ins.priority.toLowerCase() === "critical"
                        ? "border-rose-500/20 bg-rose-500/10 text-rose-500"
                        : ins.priority.toLowerCase() === "high"
                          ? "border-amber-500/20 bg-amber-500/10 text-amber-500"
                          : "border-slate-250 bg-slate-50 dark:bg-[#11161D] text-slate-700 dark:text-slate-350"
                    }`}
                  >
                    {ins.priority} Priority
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-[#11161D] border border-slate-200 dark:border-[#2A313C] rounded-[2px]">
                  <p className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1 mb-1">
                    <Sparkles className="w-3 h-3 text-emerald-500" />
                    AI Recommendation
                  </p>
                  <p className="text-slate-800 dark:text-slate-200">{ins.recommendation}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Expected Impact
                  </span>
                  <span className="text-emerald-500 font-bold">{ins.expected_impact}</span>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-[#2A313C] flex justify-end">
                <Link
                  to={`/asset-intelligence/assets/${ins.id}`}
                  className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[4px] text-[10px] transition"
                >
                  Investigate Detail Panel
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
