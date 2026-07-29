import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Network, RefreshCw } from "lucide-react";
import { assetApi, AssetHierarchyNode } from "../../api/assets";
import { AssetHierarchyTree } from "./components/AssetHierarchyTree";
import { LoadingState, ErrorState } from "./components/StateStates";

export default function AssetExplorer() {
  const [nodes, setNodes] = useState<AssetHierarchyNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHierarchy = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await assetApi.getHierarchy();
      setNodes(res);
    } catch (err: any) {
      console.error(err);
      setError("Failed to synchronize with grid topological layout model.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHierarchy();
  }, []);

  return (
    <div className="space-y-6 py-2 select-text">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
            GRID TOPOLOGY BROWSER
          </p>
          <h1 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-[#F8FAFC]">
            Asset Explorer
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Navigate through parent-child relationships and spatial groupings of physical
            components.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchHierarchy}
            className="flex items-center justify-center p-2 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-[#2A313C] rounded-[4px] hover:bg-slate-50 dark:hover:bg-[#11161D] transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <Link
            to="/asset-intelligence"
            className="px-3 py-2 bg-slate-100 dark:bg-[#1C222B] text-slate-700 dark:text-slate-350 border border-slate-250 dark:border-[#2A313C] hover:bg-slate-200 dark:hover:bg-[#252D37] rounded-[4px] font-mono text-xs transition"
          >
            Dashboard
          </Link>
        </div>
      </div>

      {loading ? (
        <LoadingState message="Rebuilding grid parent-child topology..." />
      ) : error ? (
        <ErrorState message={error} retry={fetchHierarchy} />
      ) : nodes.length === 0 ? (
        <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-8 text-center text-slate-500">
          <Network className="w-8 h-8 mx-auto text-slate-300 mb-3" />
          <p className="font-mono text-xs mb-1">[SYS.TOPOLOGY-EMPTY]</p>
          <p className="text-sm">No hierarchical links mapped in the database yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          <div>
            <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-[#F8FAFC] mb-3">
              Operational Hierarchy Layout
            </h3>
            <AssetHierarchyTree nodes={nodes} />
          </div>
        </div>
      )}
    </div>
  );
}
