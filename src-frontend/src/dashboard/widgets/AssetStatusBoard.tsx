import React, { useMemo } from "react";
import { useMonitoring } from "../../context/MonitoringContext";
import { CheckCircle, AlertTriangle, XCircle, Wrench, HelpCircle } from "lucide-react";

export function AssetStatusBoard() {
  const { getAllLatest } = useMonitoring();

  const assets = useMemo(() => {
    // Group by asset_id
    const grouped: Record<string, any> = {};
    const all = getAllLatest();
    all.forEach((record) => {
      if (!grouped[record.asset_id]) {
        grouped[record.asset_id] = {
          id: record.asset_id,
          type: record.asset_type,
          status: record.status,
          measurements: 0,
          lastUpdated: record.timestamp,
        };
      }
      grouped[record.asset_id].measurements += 1;
      // Use the worst status or most recent timestamp
      if (new Date(record.timestamp) > new Date(grouped[record.asset_id].lastUpdated)) {
        grouped[record.asset_id].lastUpdated = record.timestamp;
      }
      if (record.status === "Critical") grouped[record.asset_id].status = "Critical";
      else if (record.status === "Warning" && grouped[record.asset_id].status !== "Critical") {
        grouped[record.asset_id].status = "Warning";
      }
    });
    return Object.values(grouped);
  }, [getAllLatest]);

  const StatusIcon = ({ status }: { status: string }) => {
    switch (status?.toLowerCase()) {
      case "healthy":
        return <CheckCircle className="text-emerald-500 w-4 h-4" />;
      case "warning":
        return <AlertTriangle className="text-amber-500 w-4 h-4" />;
      case "critical":
        return <XCircle className="text-red-500 w-4 h-4" />;
      case "maintenance":
        return <Wrench className="text-blue-500 w-4 h-4" />;
      default:
        return <HelpCircle className="text-slate-500 w-4 h-4" />;
    }
  };

  return (
    <div className="h-full overflow-auto text-sm">
      <table className="w-full text-left border-collapse">
        <thead className="bg-slate-900 sticky top-0 z-10 shadow">
          <tr>
            <th className="p-2 font-medium text-slate-400 border-b border-slate-800">Status</th>
            <th className="p-2 font-medium text-slate-400 border-b border-slate-800">Asset ID</th>
            <th className="p-2 font-medium text-slate-400 border-b border-slate-800">Type</th>
            <th className="p-2 font-medium text-slate-400 border-b border-slate-800">Points</th>
            <th className="p-2 font-medium text-slate-400 border-b border-slate-800">
              Last Update
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/50">
          {assets.map((asset) => (
            <tr key={asset.id} className="hover:bg-slate-800/30 transition-colors">
              <td className="p-2 flex items-center gap-2">
                <StatusIcon status={asset.status} />
                <span className="font-medium text-slate-200">{asset.status}</span>
              </td>
              <td className="p-2 text-slate-300 font-mono">{asset.id}</td>
              <td className="p-2 text-slate-400 capitalize">{asset.type}</td>
              <td className="p-2 text-slate-400">{asset.measurements}</td>
              <td className="p-2 text-slate-500">
                {new Date(asset.lastUpdated).toLocaleTimeString()}
              </td>
            </tr>
          ))}
          {assets.length === 0 && (
            <tr>
              <td colSpan={5} className="p-4 text-center text-slate-500">
                No assets actively monitored.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
