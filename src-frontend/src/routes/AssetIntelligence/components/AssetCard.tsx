import React from "react";
import { Link } from "react-router-dom";
import { Database, MapPin, Zap } from "lucide-react";
import { AssetBadge } from "./AssetBadge";

interface AssetCardProps {
  asset: {
    id: number;
    asset_id: string;
    name: string;
    type: string;
    status: string;
    region: string;
    capacity?: number;
    voltage_level?: number;
  };
}

export function AssetCard({ asset }: AssetCardProps) {
  return (
    <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-4 flex flex-col justify-between hover:border-slate-300 dark:hover:border-[#3A4352] transition shadow-sm">
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            {asset.asset_id}
          </p>
          <AssetBadge status={asset.status} />
        </div>

        <Link
          to={`/asset-intelligence/assets/${asset.id}`}
          className="font-heading font-bold text-slate-900 dark:text-[#F8FAFC] hover:text-emerald-500 dark:hover:text-emerald-400 transition"
        >
          {asset.name}
        </Link>

        <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-1 mb-3">
          {asset.type}
        </p>

        <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>{asset.region}</span>
          </div>
          {asset.capacity !== undefined && asset.capacity !== null && (
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-slate-400" />
              <span>Capacity: {asset.capacity} MW</span>
            </div>
          )}
          {asset.voltage_level !== undefined && asset.voltage_level !== null && (
            <div className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-slate-400" />
              <span>Voltage: {asset.voltage_level} kV</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#2A313C] flex justify-end">
        <Link
          to={`/asset-intelligence/assets/${asset.id}`}
          className="text-xs text-emerald-500 dark:text-emerald-400 hover:underline font-mono"
        >
          View Specifications ➔
        </Link>
      </div>
    </div>
  );
}
