import React, { useState } from "react";
import { Zap, Activity, Battery, Triangle, Circle, Square } from "lucide-react";

export const InteractiveGridMap = ({ assets, topology, onAssetSelect, selectedAssetId }: any) => {
  // Generate a static network graph layout based on assets.
  // In a production app, we would use d3 or react-flow.
  // Here we'll build a highly stylized SVG-based schematic layout.

  // Group assets
  const substations = assets.filter((a: any) => a.type === "Substation");
  const generators = assets.filter((a: any) => a.type.includes("Plant"));
  const lines = assets.filter((a: any) => a.type === "Transmission Line");
  const loads = assets.filter((a: any) => a.type === "Load Center");

  // Distribute nodes randomly for a visual effect (or grid-based)
  // We'll just assign fixed coordinates for a cool look based on index
  const getNodePos = (idx: number, total: number, radius: number, cx: number, cy: number) => {
    const angle = (idx / total) * 2 * Math.PI;
    return {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    };
  };

  const getIcon = (type: string) => {
    if (type === "Substation")
      return <Square className="w-6 h-6 text-indigo-400" fill="currentColor" />;
    if (type.includes("Plant"))
      return <Triangle className="w-6 h-6 text-emerald-400" fill="currentColor" />;
    if (type === "Load Center")
      return <Circle className="w-6 h-6 text-amber-400" fill="currentColor" />;
    return <Activity className="w-6 h-6 text-slate-400" />;
  };

  return (
    <div className="relative w-full h-[600px] bg-slate-900 rounded-xl overflow-hidden border border-slate-700 shadow-inner">
      {/* Background Grid Pattern */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: "radial-gradient(#4f46e5 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      ></div>

      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {/* Draw topology lines */}
        {topology.map((t: any, i: number) => {
          // For demo, we just draw random lines or connect everything to center
          // To keep it simple, we will just use absolute divs for nodes and no SVG lines to avoid complex coordinate mapping
          // or we can draw some generic lines
          return null;
        })}
      </svg>

      {/* Nodes */}
      <div className="absolute inset-0 p-8 flex flex-wrap gap-6 justify-center items-center content-center overflow-auto custom-scrollbar">
        {assets.map((asset: any) => {
          if (asset.type === "Transmission Line") return null; // Hide lines as nodes
          const isSelected = selectedAssetId === asset.id;
          const isOffline = asset.state?.operational_state !== "Online";

          return (
            <div
              key={asset.id}
              onClick={() => onAssetSelect(asset)}
              className={`flex flex-col items-center justify-center cursor-pointer transition-all duration-300 transform hover:scale-110 z-10 p-4 rounded-xl backdrop-blur-sm
                                ${isSelected ? "bg-indigo-500/20 ring-2 ring-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.5)]" : "bg-slate-800/80 ring-1 ring-slate-700 hover:ring-indigo-500/50 hover:bg-slate-800"}
                            `}
            >
              <div className={`mb-2 ${isOffline ? "opacity-50 grayscale" : ""}`}>
                {getIcon(asset.type)}
              </div>
              <span className="text-xs font-semibold text-slate-200 text-center max-w-[100px] truncate">
                {asset.name}
              </span>
              <span className="text-[10px] text-slate-400">{asset.type}</span>
              {asset.state?.active_power > 0 && (
                <span className="text-[10px] font-bold text-emerald-400 mt-1">
                  {asset.state.active_power.toFixed(1)} MW
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="absolute bottom-4 left-4 bg-slate-800/90 backdrop-blur border border-slate-700 p-3 rounded-lg text-xs space-y-2">
        <div className="flex items-center">
          <Square className="w-4 h-4 text-indigo-400 mr-2" fill="currentColor" /> Substations
        </div>
        <div className="flex items-center">
          <Triangle className="w-4 h-4 text-emerald-400 mr-2" fill="currentColor" /> Generation
        </div>
        <div className="flex items-center">
          <Circle className="w-4 h-4 text-amber-400 mr-2" fill="currentColor" /> Load Centers
        </div>
      </div>
    </div>
  );
};
