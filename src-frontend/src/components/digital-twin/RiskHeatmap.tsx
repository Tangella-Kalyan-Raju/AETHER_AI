import React from "react";
import { AlertTriangle } from "lucide-react";

export const RiskHeatmap = ({ predictions, onAssetSelect, selectedAssetId }: any) => {
  // Sort by risk (Critical first)
  const sorted = [...predictions].sort((a, b) => {
    const riskScore = (r: string) =>
      r === "Critical" ? 3 : r === "High" ? 2 : r === "Medium" ? 1 : 0;
    return riskScore(b.risk_level) - riskScore(a.risk_level);
  });

  const getRiskColor = (level: string) => {
    if (level === "Critical") return "bg-red-500 text-white";
    if (level === "High") return "bg-orange-500 text-white";
    if (level === "Medium") return "bg-amber-400 text-slate-900";
    return "bg-emerald-500 text-white";
  };

  return (
    <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
      {sorted.length === 0 && (
        <p className="text-slate-500 text-sm">No risks detected for this horizon.</p>
      )}

      {sorted.map((p: any) => {
        const isSelected = selectedAssetId === p.asset_id;
        return (
          <div
            key={p.asset_id}
            onClick={() =>
              onAssetSelect &&
              onAssetSelect({ id: p.asset_id, name: p.asset_name, type: p.asset_type })
            }
            className={`p-3 cursor-pointer rounded-lg flex items-center justify-between transition-colors
              ${
                isSelected
                  ? "bg-indigo-500/10 border-2 border-indigo-500/60 shadow-[0_0_15px_rgba(99,102,241,0.25)]"
                  : "bg-slate-50 dark:bg-[#161B22] border border-slate-100 dark:border-[#2A313C] hover:bg-slate-100 dark:hover:bg-[#1c222b]"
              }
            `}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-full ${p.risk_level === "Critical" || p.risk_level === "High" ? "bg-red-500/10 text-red-500" : "bg-slate-200 dark:bg-slate-800 text-slate-400"}`}
              >
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">{p.asset_name}</h4>
                <p className="text-xs text-slate-500">{p.asset_type}</p>
              </div>
            </div>

            <div className="text-right">
              <div
                className={`text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider inline-block mb-1 ${getRiskColor(p.risk_level)}`}
              >
                {p.risk_level}
              </div>
              <p className="text-[10px] text-slate-400">Conf: {p.confidence.toFixed(1)}%</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
