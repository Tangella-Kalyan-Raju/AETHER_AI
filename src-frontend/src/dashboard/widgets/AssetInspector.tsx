import React from "react";
import { useMonitoring } from "../../context/MonitoringContext";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AssetInspectorProps {
  assetId: string | null;
  onClose: () => void;
}

export function AssetInspector({ assetId, onClose }: AssetInspectorProps) {
  const { assetCache } = useMonitoring();

  if (!assetId) return null;
  const assetData = assetCache[assetId];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed right-0 top-0 bottom-0 w-96 bg-slate-900 border-l border-slate-800 shadow-2xl z-50 flex flex-col"
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white">Asset Inspector</h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Details
            </h3>
            <div className="bg-slate-950 p-3 rounded-md border border-slate-800 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">ID:</span>
                <span className="font-mono text-slate-200">{assetId}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Latest Telemetry
            </h3>
            <div className="space-y-2">
              {assetData ? (
                Object.values(assetData).map((m: any) => (
                  <div
                    key={m.measurement_type}
                    className="bg-slate-950 p-3 rounded-md border border-slate-800 flex justify-between items-center text-sm"
                  >
                    <span className="text-blue-400 capitalize">{m.measurement_type}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-slate-200">
                        {m.value.toFixed(2)} {m.unit}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${m.quality === "GOOD" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}
                      >
                        {m.quality}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-slate-500">No telemetry data available.</div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
