import React, { useState, useEffect } from "react";
import { RefreshCw, Activity, Cpu, Sparkles } from "lucide-react";
import { copilotApi } from "../../api/copilot";
import { LoadingState, ErrorState } from "./components/StateStates";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";

const COLORS = ["#10B981", "#3B82F6", "#F59E0B", "#EF4444"];

export default function AIAnalytics() {
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await copilotApi.getAnalytics();
      setAnalytics(res);
    } catch (err: any) {
      console.error(err);
      setError("Failed to load AI analytics dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) return <LoadingState message="Recompiling AI session and token metrics..." />;
  if (error || !analytics) return <ErrorState message={error || ""} retry={fetchAnalytics} />;

  return (
    <div className="space-y-6 py-2 select-text font-mono text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-[10px] text-slate-450 dark:text-slate-500 uppercase tracking-widest mb-1.5">
            GRID COPIOT ANALYTICS MONITOR
          </p>
          <h1 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-[#F8FAFC]">
            Copilot Infrastructure Analytics
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-sans">
            Monitor API token consumption, response latency spikes, and session parameters.
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          className="flex items-center justify-center p-2 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-[#2A313C] rounded-[4px] hover:bg-slate-50 dark:hover:bg-[#11161D] transition w-fit"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5 shadow-sm">
          <span className="text-slate-400 block mb-1">Total Copilot Queries</span>
          <span className="text-2xl font-bold text-slate-900 dark:text-[#F8FAFC]">
            {analytics.total_requests} Requests
          </span>
        </div>

        <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5 shadow-sm">
          <span className="text-slate-400 block mb-1">Average Response Latency</span>
          <span className="text-2xl font-bold text-slate-900 dark:text-[#F8FAFC]">
            {analytics.average_response_time}s
          </span>
        </div>

        <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5 shadow-sm">
          <span className="text-slate-400 block mb-1">Tokens Consumed</span>
          <span className="text-2xl font-bold text-emerald-500">
            {analytics.total_tokens_consumed.toLocaleString()}
          </span>
        </div>

        <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5 shadow-sm">
          <span className="text-slate-400 block mb-1">Active AI Sessions</span>
          <span className="text-2xl font-bold text-slate-900 dark:text-[#F8FAFC]">
            {analytics.active_sessions} Sessions
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily trend chart */}
        <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5">
          <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-[#F8FAFC] pb-3 border-b border-slate-100 dark:border-[#2A313C] mb-4">
            Daily Request & Token Utilization Trends
          </h3>
          <div className="h-60 text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.daily_trends}>
                <XAxis dataKey="date" stroke="#64748B" fontSize={10} tickLine={false} />
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
                  dataKey="requests"
                  stroke="#10B981"
                  strokeWidth={2}
                  name="Requests"
                />
                <Line
                  type="monotone"
                  dataKey="tokens"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  name="Tokens (est)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Model distribution chart */}
        <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5">
          <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-[#F8FAFC] pb-3 border-b border-slate-100 dark:border-[#2A313C] mb-4">
            Active LLM Model Distribution
          </h3>
          <div className="h-60 text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.model_usage_distribution}>
                <XAxis dataKey="model" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={10} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1E293B",
                    border: "none",
                    color: "#F8FAFC",
                    borderRadius: "4px",
                  }}
                />
                <Bar dataKey="count" fill="#3B82F6" radius={[2, 2, 0, 0]} name="API Requests">
                  {analytics.model_usage_distribution.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
