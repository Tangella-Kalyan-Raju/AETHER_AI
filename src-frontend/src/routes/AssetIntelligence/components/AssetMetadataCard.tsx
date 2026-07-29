import React from "react";
import { Cpu, Tag } from "lucide-react";
import { AssetMetadata } from "../../../api/assets";

interface AssetMetadataCardProps {
  metadata: AssetMetadata;
}

export function AssetMetadataCard({ metadata }: AssetMetadataCardProps) {
  return (
    <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5 shadow-sm space-y-4">
      <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-[#2A313C]">
        <Cpu className="w-4 h-4 text-emerald-500" />
        <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-[#F8FAFC]">
          Technical Specifications
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
        <div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
            Voltage Rating
          </p>
          <p className="text-slate-800 dark:text-slate-200">
            {metadata.voltage_level ? `${metadata.voltage_level} kV` : "N/A"}
          </p>
        </div>

        <div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
            Rated Capacity
          </p>
          <p className="text-slate-800 dark:text-slate-200">
            {metadata.capacity ? `${metadata.capacity} MW` : "N/A"}
          </p>
        </div>

        <div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
            Manufacturer
          </p>
          <p className="text-slate-800 dark:text-slate-200">{metadata.manufacturer || "N/A"}</p>
        </div>

        <div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
            Model Number
          </p>
          <p className="text-slate-800 dark:text-slate-200">{metadata.model || "N/A"}</p>
        </div>

        <div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
            Serial Number
          </p>
          <p className="text-slate-800 dark:text-slate-200">{metadata.serial_number || "N/A"}</p>
        </div>

        <div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
            Ownership
          </p>
          <p className="text-slate-800 dark:text-slate-200">{metadata.owner || "N/A"}</p>
        </div>
      </div>

      {/* Asset-specific attributes */}
      {metadata.extra_attributes && Object.keys(metadata.extra_attributes).length > 0 && (
        <div className="pt-4 border-t border-slate-100 dark:border-[#2A313C] space-y-2">
          <h4 className="font-heading font-bold text-xs text-slate-800 dark:text-slate-200">
            Asset-Specific Details
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            {Object.entries(metadata.extra_attributes).map(([key, val]) => (
              <div key={key}>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">
                  {key.replace(/_/g, " ")}
                </p>
                <p className="text-slate-800 dark:text-slate-200">{String(val)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      {metadata.tags && metadata.tags.length > 0 && (
        <div className="pt-4 border-t border-slate-100 dark:border-[#2A313C]">
          <div className="flex flex-wrap gap-1">
            {metadata.tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 px-2 py-0.5 bg-slate-50 dark:bg-[#11161D] border border-slate-200 dark:border-[#2A313C] rounded-[4px] font-mono text-[10px] text-slate-500 dark:text-slate-400"
              >
                <Tag className="w-2.5 h-2.5 text-slate-400" />
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
