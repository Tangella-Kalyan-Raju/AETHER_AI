import React from "react";
import { useTelemetry } from "@/hooks/useTelemetry";
import { Battery, BatteryCharging, Zap, ShieldCheck } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function EnergyStorageDashboard() {
  const { topology, liveMeasurements, loading } = useTelemetry();

  if (loading) {
    return <div className="p-6">Loading Storage Analytics...</div>;
  }

  // Calculate Storage KPIs
  let totalStorageMWh = 0;
  let currentChargeMWh = 0;
  let activeBatteries = 0;

  if (topology) {
    // We assume some generators are type 'battery' or we map storage specifically
    topology.topology?.generators?.forEach((g: any) => {
      if (g.type === "battery") {
        activeBatteries++;
        totalStorageMWh += g.capacity_mw * 4; // Mock 4-hour duration
        const m = liveMeasurements[`generator-${g.id}`];
        if (m) {
          // mock SoC
          const soc = m.utilization / 100;
          currentChargeMWh += g.capacity_mw * 4 * soc;
        }
      }
    });
  }

  // Fallbacks if no batteries in digital twin yet
  if (activeBatteries === 0) {
    activeBatteries = 3;
    totalStorageMWh = 400;
    currentChargeMWh = 275;
  }

  const overallSoC = (currentChargeMWh / totalStorageMWh) * 100;

  const storageSitesData = [
    { name: "BESS Alpha", soc: 85, capacity: 100 },
    { name: "BESS Beta", soc: 62, capacity: 150 },
    { name: "BESS Gamma", soc: 40, capacity: 150 },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-[#F8FAFC]">Energy Storage</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Battery Energy Storage Systems (BESS) Overview
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-[#151A21] border border-slate-200 dark:border-[#2A313C] shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <Battery className="w-4 h-4 text-emerald-500" />
            <span className="text-xs uppercase font-bold tracking-wider">Total Capacity</span>
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white">
            {totalStorageMWh.toFixed(1)}{" "}
            <span className="text-lg text-slate-500 font-normal">MWh</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#151A21] border border-slate-200 dark:border-[#2A313C] shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <BatteryCharging className="w-4 h-4 text-emerald-500" />
            <span className="text-xs uppercase font-bold tracking-wider">Current Charge</span>
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white">
            {currentChargeMWh.toFixed(1)}{" "}
            <span className="text-lg text-slate-500 font-normal">MWh</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-500/30 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-500 mb-2">
            <Zap className="w-4 h-4" />
            <span className="text-xs uppercase font-bold tracking-wider">Overall SoC</span>
          </div>
          <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-500">
            {overallSoC.toFixed(1)} <span className="text-lg opacity-70 font-normal">%</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#151A21] border border-slate-200 dark:border-[#2A313C] shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <ShieldCheck className="w-4 h-4 text-blue-500" />
            <span className="text-xs uppercase font-bold tracking-wider">Active Sites</span>
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white">{activeBatteries}</div>
        </div>
      </div>

      <div className="p-5 rounded-xl bg-white dark:bg-[#151A21] border border-slate-200 dark:border-[#2A313C]">
        <h3 className="text-sm font-semibold mb-4 text-slate-800 dark:text-white">
          State of Charge by Site (%)
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={storageSitesData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
              <XAxis
                type="number"
                domain={[0, 100]}
                stroke="#475569"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                dataKey="name"
                type="category"
                stroke="#475569"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                cursor={{ fill: "transparent" }}
                contentStyle={{ backgroundColor: "#1E293B", borderColor: "#334155" }}
              />
              <Bar
                dataKey="soc"
                fill="#10B981"
                radius={[0, 4, 4, 0]}
                name="State of Charge (%)"
                barSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
