import React, { useState, useEffect } from "react";
import { useMonitoring } from "../../context/MonitoringContext";
import { Info, AlertTriangle, XCircle } from "lucide-react";

export function LiveEventTimeline() {
  const { getAllLatest } = useMonitoring();
  const [events, setEvents] = useState<any[]>([]);

  // Synthesize events from poor quality measurements for the demo
  useEffect(() => {
    const all = getAllLatest();
    const newEvents = all
      .filter((m) => m.quality === "BAD" || m.quality === "UNCERTAIN" || m.status === "Critical")
      .map((m) => ({
        id: `${m.asset_id}-${m.measurement_type}-${m.timestamp}`,
        time: new Date(m.timestamp),
        message: `Asset ${m.asset_id} reported ${m.status} status for ${m.measurement_type} (${m.value.toFixed(1)} ${m.unit})`,
        severity: m.status === "Critical" ? "error" : "warning",
      }));

    // Merge and sort
    setEvents((prev) => {
      const merged = [...prev, ...newEvents];
      // Deduplicate by id
      const unique = Array.from(new Map(merged.map((item) => [item.id, item])).values());
      unique.sort((a, b) => b.time.getTime() - a.time.getTime());
      return unique.slice(0, 50); // Keep last 50
    });
  }, [getAllLatest]);

  return (
    <div className="h-full overflow-auto bg-slate-950 p-2 space-y-2">
      {events.map((event) => (
        <div
          key={event.id}
          className="flex gap-3 p-3 rounded-md bg-slate-900 border border-slate-800 shadow-sm text-sm"
        >
          <div className="flex-shrink-0 mt-0.5">
            {event.severity === "error" ? (
              <XCircle className="w-4 h-4 text-red-500" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-slate-200">{event.message}</p>
            <p className="text-xs text-slate-500 mt-1">{event.time.toLocaleTimeString()}</p>
          </div>
        </div>
      ))}
      {events.length === 0 && (
        <div className="text-center p-4 text-slate-500 text-sm">No critical events detected.</div>
      )}
    </div>
  );
}
