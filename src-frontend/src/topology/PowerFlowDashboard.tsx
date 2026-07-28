import React from "react";
import { useTelemetry } from "@/hooks/useTelemetry";
import { Zap, AlertTriangle, ArrowRight } from "lucide-react";

export default function PowerFlowDashboard() {
  const { topology, liveMeasurements, loading } = useTelemetry();

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

      <div className="bg-white dark:bg-[#151A21] border border-slate-200 dark:border-[#2A313C] rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-[#2A313C] bg-slate-50 dark:bg-[#0B0E13]/50 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-orange-500" />
            Active Transmission Lines
          </h3>
          <div className="text-xs font-mono text-slate-500">{lines.length} Lines Monitored</div>
        </div>

        <div className="overflow-x-auto">
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
                    className="hover:bg-slate-50 dark:hover:bg-[#1C222B] transition-colors"
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
                    <td className="p-3 font-mono text-sm text-slate-500">{line.rating_mva} MVA</td>
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
    </div>
  );
}
