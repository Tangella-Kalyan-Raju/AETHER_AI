import React, { useState, useEffect } from "react";
import {
  Sparkles,
  TrendingUp,
  BarChart2,
  AlertTriangle,
  FileText,
  Download,
  GitPullRequest,
} from "lucide-react";
import { copilotApi } from "../../api/copilot";
import { LoadingState, ErrorState } from "./components/StateStates";

export default function AIAnalyticsWorkspace() {
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [kpis, setKpis] = useState<any | null>(null);
  const [rootCause, setRootCause] = useState<any | null>(null);
  const [comparison, setComparison] = useState<any[]>([]);
  const [risks, setRisks] = useState<any[]>([]);
  const [forecasts, setForecasts] = useState<any | null>(null);
  const [operations, setOperations] = useState<any[]>([]);
  const [report, setReport] = useState<any | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Export states
  const [reportType, setReportType] = useState("kpi");
  const [exportFormat, setExportFormat] = useState("pdf");
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [anRes, trRes, kpRes, rcRes, compRes, rkRes, fcRes, opRes, repRes] = await Promise.all([
        copilotApi.getAIAnalyticsDashboard(),
        copilotApi.getAITrends(),
        copilotApi.getAIKpis(),
        copilotApi.getAIRootCause(),
        copilotApi.getAIComparison(),
        copilotApi.getAIRisks(),
        copilotApi.getAIForecastInsights(),
        copilotApi.getAIOperationalInsights(),
        copilotApi.getAIExecutiveReport(),
      ]);
      setAnalytics(anRes);
      setTrends(trRes);
      setKpis(kpRes);
      setRootCause(rcRes);
      setComparison(compRes);
      setRisks(rkRes);
      setForecasts(fcRes);
      setOperations(opRes);
      setReport(repRes);
    } catch (err: any) {
      console.error(err);
      setError("Failed to compile AI Analytics data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const handleExport = async () => {
    try {
      const res = await copilotApi.exportAnalyticsReport(reportType, exportFormat);
      setExportStatus(`Successfully compiled: ${res.report_id} (${res.format.toUpperCase()})`);
    } catch (err) {
      console.error(err);
      setExportStatus("Export generation failed.");
    }
  };

  if (loading) return <LoadingState message="Compiling AI Business Analytics..." />;
  if (error || !analytics) return <ErrorState message={error || ""} retry={fetchAnalyticsData} />;

  return (
    <div className="space-y-6 py-2 select-text font-mono text-xs text-slate-800 dark:text-slate-200">
      {/* Header */}
      <div>
        <p className="text-[10px] text-slate-450 dark:text-slate-500 uppercase tracking-widest mb-1.5">
          AI STRATEGIC INSIGHTS
        </p>
        <h1 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-[#F8FAFC]">
          Business Analytics Workspace
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-sans">
          Analyses system KPIs, root cause logs, forecast anomalies, and outputs executive decision
          sheets.
        </p>
      </div>

      {/* KPI summaries cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5 shadow-sm">
          <span className="text-slate-400 block mb-1">Grid Efficiency</span>
          <span className="text-2xl font-bold text-slate-900 dark:text-[#F8FAFC]">
            {analytics.grid_efficiency}%
          </span>
        </div>

        <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5 shadow-sm">
          <span className="text-slate-400 block mb-1">Reliability Score</span>
          <span className="text-2xl font-bold text-emerald-500">
            {analytics.system_reliability_score}%
          </span>
        </div>

        <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5 shadow-sm">
          <span className="text-slate-400 block mb-1">Renewable Share</span>
          <span className="text-2xl font-bold text-slate-900 dark:text-[#F8FAFC]">
            {analytics.renewable_contribution}%
          </span>
        </div>

        <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-slate-400 block mb-1">Active Risk Warnings</span>
            <span className="text-2xl font-bold text-amber-500">
              {analytics.active_risks_count} Alerts
            </span>
          </div>
          {risks && risks.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-[#2A313C] flex flex-col gap-1.5">
              {risks.slice(0, 3).map((r, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 text-[10px] text-slate-600 dark:text-slate-400"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                  <span className="truncate" title={r.risk_type}>
                    {r.risk_type}
                  </span>
                </div>
              ))}
              {risks.length > 3 && (
                <span className="text-[10px] text-slate-500 ml-3">+{risks.length - 3} more...</span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 columns: Root Cause, Trends, Comparisons */}
        <div className="lg:col-span-2 space-y-6">
          {/* Root Cause Explorer */}
          {rootCause && (
            <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5 space-y-4">
              <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-[#F8FAFC] pb-2 border-b border-slate-100 dark:border-[#2A313C] flex items-center gap-1.5">
                <GitPullRequest className="w-4 h-4 text-rose-500" />
                Root Cause Failure Diagnostics
              </h3>
              <div className="space-y-3">
                <div>
                  <span className="font-bold text-slate-900 dark:text-[#F8FAFC] block">
                    Primary Cause
                  </span>
                  <p className="text-slate-500 dark:text-slate-400 mt-1 font-sans">
                    {rootCause.primary_cause}
                  </p>
                </div>
                <div>
                  <span className="font-bold text-slate-900 dark:text-[#F8FAFC] block">
                    Contributing Factors
                  </span>
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    {rootCause.contributing_factors.map((f: string, idx: number) => (
                      <span
                        key={idx}
                        className="bg-slate-100 dark:bg-[#11161D] px-2 py-0.5 rounded-[2px]"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="font-bold text-slate-900 dark:text-[#F8FAFC] block">
                    Recommended Action
                  </span>
                  <p className="text-slate-500 dark:text-slate-400 mt-1 font-sans text-rose-500">
                    {rootCause.recommended_actions}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Trend Analysis */}
          <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5 space-y-4">
            <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-[#F8FAFC] pb-2 border-b border-slate-100 dark:border-[#2A313C] flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              Operational Trend Explorer
            </h3>
            <div className="space-y-3.5">
              {trends.map((t, idx) => (
                <div
                  key={idx}
                  className="p-3 border border-slate-200 dark:border-[#2A313C] rounded-[2px] bg-slate-50/50 dark:bg-[#11161D]/50 flex justify-between items-start gap-4"
                >
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">
                      {t.dimension}
                    </span>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 font-sans">
                      {t.explanation}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${t.trend === "Increasing" ? "bg-amber-500/10 text-amber-500" : "bg-emerald-500/10 text-emerald-500"}`}
                  >
                    {t.trend}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Comparative Analytics */}
          <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5 space-y-4">
            <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-[#F8FAFC] pb-2 border-b border-slate-100 dark:border-[#2A313C] flex items-center gap-1.5">
              <BarChart2 className="w-4 h-4 text-slate-400" />
              Regional Comparisons index
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-255 dark:border-[#2A313C] text-slate-400">
                    <th className="pb-2 font-bold">Region</th>
                    <th className="pb-2 font-bold">Efficiency</th>
                    <th className="pb-2 font-bold text-right">Renewable Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#2A313C]">
                  {comparison.map((c, idx) => (
                    <tr key={idx} className="text-slate-800 dark:text-slate-200">
                      <td className="py-2.5 font-bold">{c.region}</td>
                      <td className="py-2.5">{c.efficiency}%</td>
                      <td className="py-2.5 text-right font-bold text-emerald-500">
                        {c.renewable_share}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right column: Risk logs, Forecast insights, Exporter */}
        <div className="lg:col-span-1 space-y-6">
          {/* Risks warning deck */}
          <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5 space-y-4">
            <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-[#F8FAFC] pb-2 border-b border-slate-100 dark:border-[#2A313C] flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Risk Analysis Board
            </h3>
            <div className="space-y-3">
              {risks.map((r, idx) => (
                <div
                  key={idx}
                  className="p-3 border-l-2 border-amber-500 bg-amber-500/5 rounded-[2px] space-y-2"
                >
                  <span className="font-bold text-slate-900 dark:text-[#F8FAFC] block">
                    {r.risk_type}
                  </span>
                  <div className="flex gap-2 text-[10px] text-slate-400">
                    <span>Severity: {r.severity}</span>
                    <span>Probability: {r.probability}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-sans">
                    <strong>Mitigation:</strong> {r.mitigation}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Forecast Insights */}
          {forecasts && (
            <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5 space-y-4">
              <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-[#F8FAFC] pb-2 border-b border-slate-100 dark:border-[#2A313C] flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-slate-400" />
                Forecast Explanations
              </h3>
              <div className="space-y-2.5">
                <div>
                  <span className="block font-bold">Demand shift cause:</span>
                  <p className="text-slate-500 dark:text-slate-400 font-sans mt-0.5">
                    {forecasts.demand_shift_reason}
                  </p>
                </div>
                <div>
                  <span className="block font-bold">Renewable influence:</span>
                  <p className="text-slate-500 dark:text-slate-400 font-sans mt-0.5">
                    {forecasts.renewable_influence}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
