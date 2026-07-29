import React from "react";
import { Link } from "react-router-dom";

interface HeatmapAsset {
  id: number;
  asset_id: string;
  name: string;
  type: string;
  health_score: number;
  condition: string;
  failure_probability: number;
}

interface FailureHeatmapProps {
  assets: HeatmapAsset[];
}

export function FailureHeatmap({ assets }: FailureHeatmapProps) {
  const getHeatColor = (score: number) => {
    if (score >= 90) return "bg-emerald-500 hover:bg-emerald-600";
    if (score >= 80) return "bg-teal-500 hover:bg-teal-600";
    if (score >= 70) return "bg-amber-500 hover:bg-amber-600";
    return "bg-rose-500 hover:bg-rose-600";
  };

  return (
    <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#2A313C]">
        <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-[#F8FAFC]">
          Grid Failure Risk Heatmap
        </h3>
        <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">
          Hover to inspect health score
        </span>
      </div>

      <div className="flex flex-wrap gap-2.5">
        {assets.map((asset) => (
          <Link
            key={asset.id}
            to={`/asset-intelligence/assets/${asset.id}`}
            title={`${asset.name}: Health ${asset.health_score}% | Fail Prob ${(
              asset.failure_probability * 100
            ).toFixed(0)}%`}
            className={`w-10 h-10 rounded-[4px] flex items-center justify-center text-[10px] font-mono font-bold text-white transition ${getHeatColor(
              asset.health_score
            )}`}
          >
            {asset.health_score.toFixed(0)}
          </Link>
        ))}
      </div>

      {/* Legend */}
      <div className="pt-2 flex items-center justify-between text-[10px] font-mono text-slate-400 dark:text-slate-500">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-[2px] bg-rose-500" />
          <span>Critical (&lt; 70%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-[2px] bg-amber-500" />
          <span>Warning (70-79%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-[2px] bg-teal-500" />
          <span>Nominal (80-89%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-[2px] bg-emerald-500" />
          <span>Optimal (&gt; 90%)</span>
        </div>
      </div>
    </div>
  );
}
