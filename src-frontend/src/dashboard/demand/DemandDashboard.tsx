import React from "react";
import { useTelemetry } from "@/hooks/useTelemetry";
import { Activity, Users, Building, Factory } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function DemandDashboard() {
  const { topology, liveMeasurements, integrationData, loading } = useTelemetry();

  if (loading) {
    return <div className="p-6">Loading Demand Analytics...</div>;
  }

  // Calculate Demand KPIs
  let totalDemand = 0;
  if (topology) {
    topology.topology?.loads?.forEach((l: any) => {
      const m = liveMeasurements[`load-${l.id}`];
      if (m) totalDemand += m.p_mw;
    });
  }

  const latestDemand = integrationData?.demand?.[0]?.value
    ? parseFloat(integrationData.demand[0].value)
    : 1520.4;

  // Use Digital Twin total if available, else API data
  const displayDemand = totalDemand > 0 ? totalDemand : latestDemand;

  const historyData = [
    { time: "00:00", demand: displayDemand * 0.6 },
    { time: "04:00", demand: displayDemand * 0.5 },
    { time: "08:00", demand: displayDemand * 0.8 },
    { time: "12:00", demand: displayDemand * 1.0 },
    { time: "16:00", demand: displayDemand * 1.2 },
    { time: "20:00", demand: displayDemand * 1.1 },
    { time: "24:00", demand: displayDemand },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-[#F8FAFC]">
            Electricity Demand
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            National and Regional Load Tracking
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-[#151A21] border border-orange-500/30 shadow-sm">
          <div className="flex items-center gap-2 text-orange-500 mb-2">
            <Activity className="w-4 h-4" />
            <span className="text-xs uppercase font-bold tracking-wider">Total System Load</span>
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white">
            {displayDemand.toFixed(1)}{" "}
            <span className="text-lg text-slate-500 font-normal">MW</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#151A21] border border-slate-200 dark:border-[#2A313C] shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <Factory className="w-4 h-4 text-purple-500" />
            <span className="text-xs uppercase font-bold tracking-wider">Industrial</span>
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white">
            {(displayDemand * 0.45).toFixed(1)}{" "}
            <span className="text-lg text-slate-500 font-normal">MW</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#151A21] border border-slate-200 dark:border-[#2A313C] shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <Building className="w-4 h-4 text-blue-500" />
            <span className="text-xs uppercase font-bold tracking-wider">Commercial</span>
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white">
            {(displayDemand * 0.35).toFixed(1)}{" "}
            <span className="text-lg text-slate-500 font-normal">MW</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#151A21] border border-slate-200 dark:border-[#2A313C] shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <Users className="w-4 h-4 text-emerald-500" />
            <span className="text-xs uppercase font-bold tracking-wider">Residential</span>
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white">
            {(displayDemand * 0.2).toFixed(1)}{" "}
            <span className="text-lg text-slate-500 font-normal">MW</span>
          </div>
        </div>
      </div>

      <div className="p-5 rounded-xl bg-white dark:bg-[#151A21] border border-slate-200 dark:border-[#2A313C]">
        <h3 className="text-sm font-semibold mb-4 text-slate-800 dark:text-white">
          National Demand Trend (24h)
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis
                dataKey="time"
                stroke="#475569"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ backgroundColor: "#1E293B", borderColor: "#334155" }} />
              <Line
                type="monotone"
                dataKey="demand"
                stroke="#8B5CF6"
                strokeWidth={3}
                dot={{ fill: "#8B5CF6", r: 4 }}
                name="Total Demand (MW)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
