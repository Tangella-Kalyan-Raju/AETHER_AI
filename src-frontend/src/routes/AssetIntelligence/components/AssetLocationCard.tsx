import React from "react";
import { Globe, MapPin } from "lucide-react";
import { AssetLocation } from "../../../api/assets";

interface AssetLocationCardProps {
  location: AssetLocation;
}

export function AssetLocationCard({ location }: AssetLocationCardProps) {
  return (
    <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5 shadow-sm space-y-4">
      <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-[#2A313C]">
        <MapPin className="w-4 h-4 text-emerald-500" />
        <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-[#F8FAFC]">
          Geographic Location
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
        <div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
            Region
          </p>
          <p className="text-slate-800 dark:text-slate-200">{location.region || "N/A"}</p>
        </div>

        <div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
            Zone
          </p>
          <p className="text-slate-800 dark:text-slate-200">{location.zone || "N/A"}</p>
        </div>

        <div className="sm:col-span-2">
          <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
            Physical Address / Placement
          </p>
          <p className="text-slate-800 dark:text-slate-200">{location.address || "N/A"}</p>
        </div>

        <div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
            Substation
          </p>
          <p className="text-slate-800 dark:text-slate-200">{location.substation || "N/A"}</p>
        </div>

        <div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
            Geographic Coordinates
          </p>
          <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
            <Globe className="w-3.5 h-3.5 text-slate-450" />
            <span>
              {location.latitude !== undefined && location.longitude !== undefined
                ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
                : "N/A"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
