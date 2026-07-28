import React, { useState, useEffect } from "react";
import { useMonitoring } from "../../context/MonitoringContext";
import { TelemetryRecord } from "../../hooks/useMonitoringStream";

export function LiveMeasurementStream() {
  const { getAllLatest } = useMonitoring();
  const [stream, setStream] = useState<TelemetryRecord[]>([]);

  // Simulate a rolling stream by pulling from latest every second, or we could have hooked directly into the WS.
  // For simplicity, we just display the top 20 latest updated items.
  useEffect(() => {
    const all = getAllLatest();
    // Sort by most recently updated
    all.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setStream(all.slice(0, 20));
  }, [getAllLatest]);

  return (
    <div className="h-full overflow-auto bg-slate-950 text-xs">
      <table className="w-full text-left border-collapse">
        <thead className="bg-slate-900 sticky top-0 z-10 shadow">
          <tr>
            <th className="p-2 font-medium text-slate-400 border-b border-slate-800">Time</th>
            <th className="p-2 font-medium text-slate-400 border-b border-slate-800">Asset ID</th>
            <th className="p-2 font-medium text-slate-400 border-b border-slate-800">Type</th>
            <th className="p-2 font-medium text-slate-400 border-b border-slate-800">Value</th>
            <th className="p-2 font-medium text-slate-400 border-b border-slate-800">Quality</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/50">
          {stream.map((s, idx) => (
            <tr
              key={`${s.asset_id}-${s.measurement_type}-${idx}`}
              className="hover:bg-slate-800/30 transition-colors"
            >
              <td className="p-2 text-slate-500">{new Date(s.timestamp).toLocaleTimeString()}</td>
              <td
                className="p-2 text-slate-300 font-mono truncate max-w-[100px]"
                title={s.asset_id}
              >
                {s.asset_id}
              </td>
              <td className="p-2 text-blue-400">{s.measurement_type}</td>
              <td className="p-2 text-slate-200 font-medium">
                {s.value.toFixed(2)} {s.unit}
              </td>
              <td className="p-2">
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider
                  ${
                    s.quality === "GOOD"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : s.quality === "BAD"
                        ? "bg-red-500/20 text-red-400"
                        : "bg-amber-500/20 text-amber-400"
                  }`}
                >
                  {s.quality}
                </span>
              </td>
            </tr>
          ))}
          {stream.length === 0 && (
            <tr>
              <td colSpan={5} className="p-4 text-center text-slate-500">
                Waiting for telemetry...
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
