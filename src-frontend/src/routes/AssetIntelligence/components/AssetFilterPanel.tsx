import React from "react";
import { SlidersHorizontal } from "lucide-react";

interface AssetFilterPanelProps {
  region: string;
  type: string;
  status: string;
  voltage: string;
  setRegion: (r: string) => void;
  setType: (t: string) => void;
  setStatus: (s: string) => void;
  setVoltage: (v: string) => void;
}

export function AssetFilterPanel({
  region,
  type,
  status,
  voltage,
  setRegion,
  setType,
  setStatus,
  setVoltage,
}: AssetFilterPanelProps) {
  const regions = ["West Region", "East Region", "North Region", "South Region"];
  const assetTypes = [
    "Solar Farm",
    "Wind Farm",
    "Battery Energy Storage System",
    "Transformer",
    "Transmission Line",
    "Substation",
    "Breaker",
    "Relay",
    "Generator",
  ];
  const statuses = ["active", "maintenance", "inactive"];
  const voltages = ["13.8", "34.5", "138.0"];

  return (
    <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-4 space-y-4 shadow-sm">
      <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-[#2A313C]">
        <SlidersHorizontal className="w-4 h-4 text-emerald-500" />
        <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-[#F8FAFC]">
          Filter Telemetry
        </h3>
      </div>

      {/* Region */}
      <div>
        <label className="block text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
          Operating Region
        </label>
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="w-full bg-slate-50 dark:bg-[#11161D] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-2 text-xs text-slate-700 dark:text-slate-300 font-mono focus:border-emerald-500 focus:outline-none"
        >
          <option value="all">All Regions</option>
          {regions.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      {/* Asset Type */}
      <div>
        <label className="block text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
          Asset Category
        </label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full bg-slate-50 dark:bg-[#11161D] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-2 text-xs text-slate-700 dark:text-slate-300 font-mono focus:border-emerald-500 focus:outline-none"
        >
          <option value="all">All Categories</option>
          {assetTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {/* Voltage Level */}
      <div>
        <label className="block text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
          Voltage Rating (kV)
        </label>
        <select
          value={voltage}
          onChange={(e) => setVoltage(e.target.value)}
          className="w-full bg-slate-50 dark:bg-[#11161D] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-2 text-xs text-slate-700 dark:text-slate-300 font-mono focus:border-emerald-500 focus:outline-none"
        >
          <option value="all">All Voltages</option>
          {voltages.map((v) => (
            <option key={v} value={v}>
              {v} kV
            </option>
          ))}
        </select>
      </div>

      {/* Status */}
      <div>
        <label className="block text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
          Operational Status
        </label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full bg-slate-50 dark:bg-[#11161D] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-2 text-xs text-slate-700 dark:text-slate-300 font-mono focus:border-emerald-500 focus:outline-none"
        >
          <option value="all">All Statuses</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s.toUpperCase()}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
