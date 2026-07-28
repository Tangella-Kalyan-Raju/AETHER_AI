import React from "react";
import { Activity, ShieldCheck, Zap, Power, Server, Clock } from "lucide-react";

export const AssetDetailPanel = ({ asset }: { asset: any }) => {
  if (!asset)
    return (
      <div className="h-full flex items-center justify-center text-slate-500 dark:text-slate-400">
        <p>Select an asset from the map to view details.</p>
      </div>
    );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">{asset.name}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {asset.type} • {asset.region}
          </p>
        </div>
        <div
          className={`px-2 py-1 rounded text-xs font-bold ${asset.state?.operational_state === "Online" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}`}
        >
          {asset.state?.operational_state || "Unknown"}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-50 dark:bg-[#161B22] border border-slate-100 dark:border-[#2A313C] p-3 rounded-lg">
          <p className="text-xs text-slate-500 mb-1 flex items-center">
            <Zap className="w-3 h-3 mr-1" /> Active Power
          </p>
          <p className="text-lg font-bold text-slate-900 dark:text-white">
            {asset.state?.active_power?.toFixed(1) || "0.0"} MW
          </p>
        </div>
        <div className="bg-slate-50 dark:bg-[#161B22] border border-slate-100 dark:border-[#2A313C] p-3 rounded-lg">
          <p className="text-xs text-slate-500 mb-1 flex items-center">
            <Power className="w-3 h-3 mr-1" /> Voltage Level
          </p>
          <p className="text-lg font-bold text-slate-900 dark:text-white">
            {asset.state?.voltage?.toFixed(1) || "0.0"} kV
          </p>
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Asset Health
        </h4>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-700 dark:text-slate-300">Health Score</span>
              <span className="font-bold text-emerald-500">
                {asset.health?.health_score?.toFixed(1)}%
              </span>
            </div>
            <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500"
                style={{ width: `${asset.health?.health_score}%` }}
              ></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-700 dark:text-slate-300">Utilization</span>
              <span className="font-bold text-blue-500">
                {asset.state?.utilization_pct?.toFixed(1)}%
              </span>
            </div>
            <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500"
                style={{ width: `${asset.state?.utilization_pct}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Metadata
        </h4>
        <div className="bg-slate-50 dark:bg-[#161B22] border border-slate-100 dark:border-[#2A313C] rounded-lg divide-y divide-slate-100 dark:divide-[#2A313C]">
          <div className="flex justify-between p-3 text-sm">
            <span className="text-slate-500 flex items-center">
              <Server className="w-4 h-4 mr-2" /> Asset ID
            </span>
            <span className="text-slate-900 dark:text-white font-mono">
              {asset.id.split("-")[0]}
            </span>
          </div>
          <div className="flex justify-between p-3 text-sm">
            <span className="text-slate-500 flex items-center">
              <Activity className="w-4 h-4 mr-2" /> Capacity
            </span>
            <span className="text-slate-900 dark:text-white">
              {asset.metadata?.capacity || "N/A"} MVA
            </span>
          </div>
          <div className="flex justify-between p-3 text-sm">
            <span className="text-slate-500 flex items-center">
              <Clock className="w-4 h-4 mr-2" /> Last Sync
            </span>
            <span className="text-slate-900 dark:text-white">Just now</span>
          </div>
        </div>
      </div>
    </div>
  );
};
