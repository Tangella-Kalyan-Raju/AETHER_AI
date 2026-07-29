import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Brain,
  Clock,
  ShieldAlert,
  FileOutput,
  Play,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { copilotApi } from "../../api/copilot";
import { LoadingState, ErrorState } from "./components/StateStates";

export default function AIWorkspaceDashboard() {
  const [dashboard, setDashboard] = useState<any | null>(null);
  const [insights, setInsights] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [exec, setExec] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Export options
  const [exportFormat, setExportFormat] = useState("markdown");
  const [exportResult, setExportResult] = useState<string | null>(null);

  const fetchWorkspaceData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [dashRes, insRes, timeRes, execRes] = await Promise.all([
        copilotApi.getWorkspaceDashboard(),
        copilotApi.getWorkspaceInsights(),
        copilotApi.getWorkspaceTimeline(),
        copilotApi.getExecutiveSummary(),
      ]);
      setDashboard(dashRes);
      setInsights(insRes);
      setTimeline(timeRes);
      setExec(execRes);
    } catch (err: any) {
      console.error(err);
      setError("Failed to compile AI Workspace details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaceData();
  }, []);

  const handleExport = async () => {
    try {
      const res = await copilotApi.exportReport("default", exportFormat);
      setExportResult(
        `Successfully generated report: ${res.report_id} (${res.format.toUpperCase()})`
      );
    } catch (err) {
      console.error(err);
      setExportResult("Report compilation failed.");
    }
  };

  const handleAction = (title: string, detail: string) => {
    const newEvent = {
      timestamp: new Date().toISOString(),
      type: "Action",
      title: title,
      detail: detail,
    };
    setTimeline((prev) => [newEvent, ...prev]);
  };

  if (loading) return <LoadingState message="Connecting to AI command centre..." />;
  if (error || !dashboard) return <ErrorState message={error || ""} retry={fetchWorkspaceData} />;

  return (
    <div className="space-y-6 py-2 select-text font-mono text-xs text-slate-800 dark:text-slate-200">
      {/* Header */}
      <div>
        <p className="text-[10px] text-slate-450 dark:text-slate-500 uppercase tracking-widest mb-1.5">
          AI COMMAND CENTRE
        </p>
        <h1 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-[#F8FAFC]">
          AI Operational Workspace
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-sans">
          Central workspace catalog for triggering dispatches, auditing logs, and compiling
          executive summaries.
        </p>
      </div>

      {/* Quick metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5 shadow-sm">
          <span className="text-slate-400 block mb-1">System State</span>
          <span className="text-2xl font-bold text-emerald-500 uppercase flex items-center gap-1.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            {dashboard.system_status}
          </span>
        </div>

        <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5 shadow-sm">
          <span className="text-slate-400 block mb-1">Daily Query Count</span>
          <span className="text-2xl font-bold text-slate-900 dark:text-[#F8FAFC]">
            {dashboard.daily_queries} Tasks
          </span>
        </div>

        <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5 shadow-sm">
          <span className="text-slate-400 block mb-1">Savings Aggregation</span>
          <span className="text-2xl font-bold text-slate-900 dark:text-[#F8FAFC]">
            ${dashboard.savings_today.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Insights & Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Commands */}
          <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5 space-y-4">
            <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-[#F8FAFC] pb-2 border-b border-slate-100 dark:border-[#2A313C]">
              AI Action Panel
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() =>
                  handleAction(
                    "Insulators Review Triggered",
                    "Standard wash inspection dispatch initiated."
                  )
                }
                className="flex items-center justify-between p-3.5 border border-slate-200 dark:border-[#2A313C] hover:border-emerald-500 rounded-[2px] transition text-left"
              >
                <div>
                  <span className="block font-bold">Trigger Insulators Review</span>
                  <span className="text-[10px] text-slate-400">
                    Trigger standard wash inspection dispatches
                  </span>
                </div>
                <Play className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() =>
                  handleAction(
                    "Battery Limits Verified",
                    "Quick constraints verification checks completed."
                  )
                }
                className="flex items-center justify-between p-3.5 border border-slate-200 dark:border-[#2A313C] hover:border-emerald-500 rounded-[2px] transition text-left"
              >
                <div>
                  <span className="block font-bold">Verify Battery Limits</span>
                  <span className="text-[10px] text-slate-400">
                    Run quick constraints verification checks
                  </span>
                </div>
                <Play className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5 space-y-4">
            <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-[#F8FAFC] pb-2 border-b border-slate-100 dark:border-[#2A313C] flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-400" />
              Workspace Timeline
            </h3>

            <div className="relative border-l border-slate-200 dark:border-[#2A313C] ml-2.5 pl-5 space-y-5">
              {timeline.map((t, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-[26px] top-1.5 w-3 h-3 rounded-full bg-slate-200 dark:bg-[#2A313C]" />
                  <span className="text-[9px] text-slate-400 block mb-0.5">
                    {new Date(t.timestamp).toLocaleString()}
                  </span>
                  <span className="font-bold text-slate-800 dark:text-[#F8FAFC]">{t.title}</span>
                  <p className="text-slate-500 dark:text-slate-400 mt-1 font-sans text-xs">
                    {t.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Export & Exec Summary */}
        <div className="lg:col-span-1 space-y-6">
          {/* Executive Summary Card */}
          {exec && (
            <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5 space-y-4">
              <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-[#F8FAFC] pb-2 border-b border-slate-100 dark:border-[#2A313C]">
                Executive Grid Summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Outage Risk</span>
                  <span className="font-bold text-emerald-500">{exec.critical_outage_risk}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Savings</span>
                  <span className="font-bold">${exec.savings_total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">CO₂ Avoided</span>
                  <span className="font-bold text-emerald-500">{exec.co2_reduced_tons} Tons</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
