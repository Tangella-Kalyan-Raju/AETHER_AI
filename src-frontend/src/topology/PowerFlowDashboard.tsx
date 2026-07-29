import React, { useState } from "react";
import { useTelemetry } from "@/hooks/useTelemetry";
import { Zap, AlertTriangle, ArrowRight, ActivitySquare } from "lucide-react";

export default function PowerFlowDashboard() {
  const { topology, liveMeasurements, loading } = useTelemetry();
  const [selectedLine, setSelectedLine] = useState<any>(null);

  if (loading) {
    return <div className="p-6">Loading Power Flow Analytics...</div>;
  }

  const lines = topology?.topology?.transmission_lines || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-[#F8FAFC]">
            Power Flow Analytics
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Real-time Transmission Line Load & Dynamics
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-[#151A21] border border-slate-200 dark:border-[#2A313C] rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 dark:border-[#2A313C] bg-slate-50 dark:bg-[#0B0E13]/50 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-orange-500" />
              Active Transmission Lines
            </h3>
            <div className="text-xs font-mono text-slate-500">{lines.length} Lines Monitored</div>
          </div>

          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#0B0E13]/30 border-b border-slate-200 dark:border-[#2A313C] text-xs uppercase tracking-wider text-slate-500 font-semibold">
                  <th className="p-3">Line ID</th>
                  <th className="p-3">From Bus</th>
                  <th className="p-3 text-center">Direction</th>
                  <th className="p-3">To Bus</th>
                  <th className="p-3">Current Flow</th>
                  <th className="p-3">Rating Limit</th>
                  <th className="p-3">Utilization</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#2A313C]">
                {lines.map((line: any) => {
                  const m = liveMeasurements[`transmission_line-${line.id}`];
                  const flow = m ? m.flow_mw : 0;
                  const utilization = m ? m.utilization : 0;

                  let utilColor = "bg-emerald-500";
                  if (utilization > 80) utilColor = "bg-amber-500";
                  if (utilization > 95) utilColor = "bg-red-500";

                  return (
                    <tr
                      key={line.id}
                      onClick={() => setSelectedLine(line)}
                      className={`cursor-pointer transition-colors ${selectedLine?.id === line.id ? "bg-indigo-50/50 dark:bg-indigo-900/20" : "hover:bg-slate-50 dark:hover:bg-[#1C222B]"}`}
                    >
                      <td className="p-3 font-mono text-sm text-slate-700 dark:text-slate-300">
                        LN-{line.id.toString().padStart(4, "0")}
                      </td>
                      <td className="p-3 text-sm text-slate-600 dark:text-slate-400">
                        Bus {line.from_bus_id}
                      </td>
                      <td className="p-3 text-center">
                        <ArrowRight className="w-4 h-4 text-slate-400 mx-auto" />
                      </td>
                      <td className="p-3 text-sm text-slate-600 dark:text-slate-400">
                        Bus {line.to_bus_id}
                      </td>
                      <td className="p-3 font-mono text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {Math.abs(flow).toFixed(2)} MW
                      </td>
                      <td className="p-3 font-mono text-sm text-slate-500">
                        {line.rating_mva} MVA
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-slate-200 dark:bg-[#2A313C] rounded-full overflow-hidden">
                            <div
                              className={`h-full ${utilColor}`}
                              style={{ width: `${Math.min(100, utilization)}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono w-10 text-right">
                            {utilization.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        {utilization > 95 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-500/10 text-red-500 border border-red-500/20">
                            <AlertTriangle className="w-3 h-3" />
                            Overload
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                            Nominal
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Details View */}
        <div className="lg:col-span-1 bg-white dark:bg-[#151A21] border border-slate-200 dark:border-[#2A313C] rounded-xl p-6 flex flex-col h-[600px] overflow-y-auto">
          {!selectedLine ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-[#1C222B] border border-slate-200 dark:border-[#334155] flex items-center justify-center mb-4">
                <ActivitySquare className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
                Select a Transmission Line
              </h3>
              <p className="text-slate-500 text-sm max-w-sm">
                Click on any line in the table to view its real-time telemetry, thermal ratings, and
                impedance metrics.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-200 dark:border-[#2A313C] pb-4">
                <div className="p-3 rounded-lg bg-orange-500/10 text-orange-500">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    Line LN-{selectedLine.id.toString().padStart(4, "0")}
                  </h2>
                  <p className="text-sm text-slate-500">
                    Bus {selectedLine.from_bus_id} ➔ Bus {selectedLine.to_bus_id}
                  </p>
                </div>
              </div>

              {/* Telemetry section */}
              {(() => {
                const m = liveMeasurements[`transmission_line-${selectedLine.id}`];
                return (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                      Live Telemetry
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 dark:bg-[#1C222B] p-4 rounded-lg border border-slate-200 dark:border-[#2A313C]">
                        <p className="text-xs text-slate-500 mb-1 uppercase">Active Flow</p>
                        <p className="text-lg font-mono font-bold text-slate-900 dark:text-white">
                          {Math.abs(m?.flow_mw || 0).toFixed(2)} MW
                        </p>
                      </div>
                      <div className="bg-slate-50 dark:bg-[#1C222B] p-4 rounded-lg border border-slate-200 dark:border-[#2A313C]">
                        <p className="text-xs text-slate-500 mb-1 uppercase">Current</p>
                        <p className="text-lg font-mono font-bold text-slate-900 dark:text-white">
                          {m?.current_a?.toFixed(1) || "0.0"} A
                        </p>
                      </div>
                      <div className="bg-slate-50 dark:bg-[#1C222B] p-4 rounded-lg border border-slate-200 dark:border-[#2A313C] col-span-2 flex items-center justify-between">
                        <div>
                          <p className="text-xs text-slate-500 mb-1 uppercase">Utilization</p>
                          <p className="text-lg font-mono font-bold text-slate-900 dark:text-white">
                            {m?.utilization?.toFixed(1) || "0.0"}%
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-500 mb-1 uppercase">Status</p>
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase ${m?.utilization > 95 ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-500"}`}
                          >
                            {m?.utilization > 95 ? "Overload" : "Nominal"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                  Line Metadata
                </h3>
                <div className="bg-slate-50 dark:bg-[#1C222B] border border-slate-200 dark:border-[#2A313C] rounded-lg overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <tbody className="divide-y divide-slate-200 dark:divide-[#2A313C]">
                      <tr>
                        <td className="px-4 py-2 font-medium text-slate-500">Thermal Rating</td>
                        <td className="px-4 py-2 text-slate-900 dark:text-slate-300">
                          {selectedLine.rating_mva} MVA
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 font-medium text-slate-500">Resistance (R)</td>
                        <td className="px-4 py-2 text-slate-900 dark:text-slate-300">
                          {selectedLine.r_pu} p.u.
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 font-medium text-slate-500">Reactance (X)</td>
                        <td className="px-4 py-2 text-slate-900 dark:text-slate-300">
                          {selectedLine.x_pu} p.u.
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 font-medium text-slate-500">Susceptance (B)</td>
                        <td className="px-4 py-2 text-slate-900 dark:text-slate-300">
                          {selectedLine.b_pu || "0.00"} p.u.
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 font-medium text-slate-500">Length</td>
                        <td className="px-4 py-2 text-slate-900 dark:text-slate-300">
                          {selectedLine.length_km || "10"} km
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
