import { useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  BarChart3,
  Calendar,
  Download,
  RefreshCw,
  TrendingUp,
  ShieldAlert,
  Zap,
  Leaf,
} from "lucide-react";

const mockData24h = [
  { time: "00:00", stability: 99.4, load: 1200, renewable: 45 },
  { time: "04:00", stability: 99.2, load: 1100, renewable: 52 },
  { time: "08:00", stability: 99.5, load: 1350, renewable: 55 },
  { time: "12:00", stability: 99.8, load: 1540, renewable: 62 },
  { time: "16:00", stability: 99.7, load: 1610, renewable: 48 },
  { time: "20:00", stability: 99.1, load: 1420, renewable: 38 },
];

const mockData7d = [
  { time: "Mon", stability: 99.6, load: 1380, renewable: 42 },
  { time: "Tue", stability: 99.4, load: 1420, renewable: 46 },
  { time: "Wed", stability: 99.5, load: 1390, renewable: 49 },
  { time: "Thu", stability: 99.8, load: 1450, renewable: 51 },
  { time: "Fri", stability: 99.2, load: 1510, renewable: 48 },
  { time: "Sat", stability: 99.7, load: 1280, renewable: 58 },
  { time: "Sun", stability: 99.9, load: 1180, renewable: 64 },
];

export default function Analytics() {
  const [timeframe, setTimeframe] = useState<"24h" | "7d">("24h");
  const [loading, setLoading] = useState(false);

  const data = timeframe === "24h" ? mockData24h : mockData7d;

  const triggerExport = () => {
    alert("SYSTEM SIGNAL: CSV export sequence completed. File saved successfully.");
  };

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 800);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-[#1E293B] pb-4">
        <div>
          <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 tracking-widest uppercase mb-1.5">
            Operational Telemetry // Grid Performance Intelligence
          </p>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-[#F8FAFC]">
            Telemetry Performance Analytics
          </h1>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <div className="flex bg-[#151A21] rounded-[3px] border border-[#2A313C]/40 p-0.5">
            <button
              onClick={() => setTimeframe("24h")}
              className={`px-3 py-1 rounded-[2px] text-xs font-semibold transition-all ${
                timeframe === "24h"
                  ? "bg-orange-500 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              24 Hours
            </button>
            <button
              onClick={() => setTimeframe("7d")}
              className={`px-3 py-1 rounded-[2px] text-xs font-semibold transition-all ${
                timeframe === "7d"
                  ? "bg-orange-500 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              7 Days
            </button>
          </div>
          <button
            onClick={handleRefresh}
            className="p-1.5 rounded-[3px] border border-slate-200 dark:border-[#2A313C] bg-white dark:bg-[#151A21] hover:bg-slate-50 dark:hover:bg-[#1E293B] text-slate-400 hover:text-slate-200 transition-all"
            title="Refresh Charts"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={triggerExport}
            className="flex items-center gap-2 px-3 py-1.5 rounded-[3px] border border-slate-200 dark:border-[#2A313C] bg-white dark:bg-[#151A21] hover:bg-slate-50 dark:hover:bg-[#1E293B] text-xs font-bold text-slate-700 dark:text-slate-300 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </section>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#07090C] p-4 rounded-[4px]">
          <span className="text-[10px] font-mono text-slate-500 uppercase flex items-center gap-1.5 mb-2">
            <Zap className="w-3.5 h-3.5 text-orange-500" /> Grid Frequency stability
          </span>
          <div className="text-xl font-bold font-mono">99.54%</div>
          <div className="text-[10px] text-emerald-500 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +0.12% vs last shift
          </div>
        </div>

        <div className="border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#07090C] p-4 rounded-[4px]">
          <span className="text-[10px] font-mono text-slate-500 uppercase flex items-center gap-1.5 mb-2">
            <Leaf className="w-3.5 h-3.5 text-emerald-500" /> Carbon target deviation
          </span>
          <div className="text-xl font-bold font-mono">-12.4%</div>
          <div className="text-[10px] text-emerald-500 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Compliant with NERC standard
          </div>
        </div>

        <div className="border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#07090C] p-4 rounded-[4px]">
          <span className="text-[10px] font-mono text-slate-500 uppercase flex items-center gap-1.5 mb-2">
            <BarChart3 className="w-3.5 h-3.5 text-purple-500" /> Renewable Penetration
          </span>
          <div className="text-xl font-bold font-mono">48.2% Avg</div>
          <div className="text-[10px] text-slate-500 mt-1">Peak: 64% at midday</div>
        </div>

        <div className="border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#07090C] p-4 rounded-[4px]">
          <span className="text-[10px] font-mono text-slate-500 uppercase flex items-center gap-1.5 mb-2">
            <ShieldAlert className="w-3.5 h-3.5 text-red-500" /> Load Shedding Events
          </span>
          <div className="text-xl font-bold font-mono">0 incidents</div>
          <div className="text-[10px] text-emerald-500 mt-1">100% Load balance reliability</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Load Profile and Renewable Share */}
        <div className="border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#07090C] p-5 rounded-[4px]">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-4">
            Grid Load & Renewables Generation
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="time" stroke="#475569" fontSize={11} />
                <YAxis stroke="#475569" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#11161D",
                    border: "1px solid #2A313C",
                    borderRadius: "4px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line
                  type="monotone"
                  dataKey="load"
                  stroke="#FF7A1A"
                  strokeWidth={2}
                  name="Load Demand (MW)"
                />
                <Line
                  type="monotone"
                  dataKey="renewable"
                  stroke="#10B981"
                  strokeWidth={2}
                  name="Renewable Capacity (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stability Profile */}
        <div className="border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#07090C] p-5 rounded-[4px]">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-4">
            Frequency Stability Factor (%)
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="time" stroke="#475569" fontSize={11} />
                <YAxis domain={[98, 100]} stroke="#475569" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#11161D",
                    border: "1px solid #2A313C",
                    borderRadius: "4px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="stability" fill="#6366F1" name="Stability Factor (%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
