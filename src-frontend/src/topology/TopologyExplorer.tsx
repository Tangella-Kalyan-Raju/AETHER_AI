import React, { useState } from "react";
import { useTelemetry } from "@/hooks/useTelemetry";
import { Network, Server, Zap, ChevronRight, ChevronDown, Activity, Settings2 } from "lucide-react";

export default function TopologyExplorer() {
  const { topology, liveMeasurements, loading } = useTelemetry();
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    root: true,
  });

  if (loading) {
    return <div className="p-6">Loading Topology Explorer...</div>;
  }

  const toggleNode = (id: string) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Build a tree from the flattened topology
  const buses = topology?.topology?.buses || [];
  const generators = topology?.topology?.generators || [];
  const loads = topology?.topology?.loads || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-[#F8FAFC]">
            Topology Explorer
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Hierarchical Digital Twin Navigator
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-[#151A21] border border-slate-200 dark:border-[#2A313C] rounded-md text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1E252F] transition-colors">
            <Settings2 className="w-4 h-4" />
            Display Options
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Navigation Tree */}
        <div className="lg:col-span-1 bg-white dark:bg-[#151A21] border border-slate-200 dark:border-[#2A313C] rounded-xl overflow-hidden flex flex-col h-[600px]">
          <div className="p-3 border-b border-slate-200 dark:border-[#2A313C] bg-slate-50 dark:bg-[#0B0E13]/50">
            <input
              type="text"
              placeholder="Search assets..."
              className="w-full bg-white dark:bg-[#1C222B] border border-slate-300 dark:border-[#334155] rounded-md px-3 py-1.5 text-sm outline-none focus:border-orange-500 dark:focus:border-orange-500 transition-colors"
            />
          </div>
          <div className="flex-1 overflow-y-auto p-2 font-mono text-sm">
            {/* Root */}
            <div className="select-none">
              <div
                className="flex items-center gap-2 p-1.5 hover:bg-slate-100 dark:hover:bg-[#1C222B] rounded cursor-pointer transition-colors"
                onClick={() => toggleNode("root")}
              >
                {expandedNodes["root"] ? (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                )}
                <Network className="w-4 h-4 text-blue-500" />
                <span className="text-slate-800 dark:text-slate-200 font-semibold">
                  National Grid (Root)
                </span>
              </div>

              {expandedNodes["root"] && (
                <div className="pl-6 border-l border-slate-200 dark:border-[#2A313C] ml-3 mt-1 space-y-1">
                  {buses.map((bus: any) => (
                    <div key={bus.id}>
                      <div
                        className="flex items-center gap-2 p-1.5 hover:bg-slate-100 dark:hover:bg-[#1C222B] rounded cursor-pointer transition-colors"
                        onClick={() => toggleNode(`bus-${bus.id}`)}
                      >
                        {expandedNodes[`bus-${bus.id}`] ? (
                          <ChevronDown className="w-3 h-3 text-slate-400" />
                        ) : (
                          <ChevronRight className="w-3 h-3 text-slate-400" />
                        )}
                        <Server className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-slate-700 dark:text-slate-300">
                          {bus.name} ({bus.base_kv}kV)
                        </span>
                        {bus.status === "active" && (
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-auto mr-2" />
                        )}
                      </div>

                      {expandedNodes[`bus-${bus.id}`] && (
                        <div className="pl-6 border-l border-slate-200 dark:border-[#2A313C] ml-2 mt-1 space-y-1">
                          {generators
                            .filter((g: any) => g.bus_id === bus.id)
                            .map((gen: any) => (
                              <div
                                key={gen.id}
                                className="flex items-center gap-2 p-1 hover:bg-slate-100 dark:hover:bg-[#1C222B] rounded cursor-pointer group"
                              >
                                <Zap className="w-3 h-3 text-orange-500" />
                                <span className="text-slate-600 dark:text-slate-400 text-xs">
                                  {gen.name} [{gen.type}]
                                </span>
                                <span className="text-[10px] text-orange-500/70 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                  {liveMeasurements[`generator-${gen.id}`]?.p_mw?.toFixed(1) || 0}{" "}
                                  MW
                                </span>
                              </div>
                            ))}
                          {loads
                            .filter((l: any) => l.bus_id === bus.id)
                            .map((load: any) => (
                              <div
                                key={load.id}
                                className="flex items-center gap-2 p-1 hover:bg-slate-100 dark:hover:bg-[#1C222B] rounded cursor-pointer group"
                              >
                                <Activity className="w-3 h-3 text-purple-500" />
                                <span className="text-slate-600 dark:text-slate-400 text-xs">
                                  {load.name}
                                </span>
                                <span className="text-[10px] text-purple-500/70 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                  {liveMeasurements[`load-${load.id}`]?.p_mw?.toFixed(1) || 0} MW
                                </span>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Details View */}
        <div className="lg:col-span-2 bg-white dark:bg-[#151A21] border border-slate-200 dark:border-[#2A313C] rounded-xl flex flex-col items-center justify-center p-6 text-center h-[600px]">
          <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-[#1C222B] border border-slate-200 dark:border-[#334155] flex items-center justify-center mb-4">
            <Network className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
            Select an Asset
          </h3>
          <p className="text-slate-500 text-sm max-w-sm">
            Navigate the digital twin topology tree on the left to inspect detailed operational
            metadata and live measurements for specific assets.
          </p>
        </div>
      </div>
    </div>
  );
}
