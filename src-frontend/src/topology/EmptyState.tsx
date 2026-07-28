import { Box, Import, Plus, Database } from "lucide-react";

interface EmptyStateProps {
  onImport: () => void;
  onCreateSample: () => void;
  onAddFirstAsset: () => void;
  loading?: boolean;
}

export function EmptyState({
  onImport,
  onCreateSample,
  onAddFirstAsset,
  loading,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 border border-dashed border-slate-200 dark:border-[#2A313C] rounded-[3px] bg-white dark:bg-[#151A21]/30 text-center select-text">
      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-[#1C222B] border border-slate-200 dark:border-[#2A313C] flex items-center justify-center mb-4">
        <Box className="w-6 h-6 text-slate-400 dark:text-slate-500 animate-pulse" />
      </div>

      <h3 className="font-heading text-lg font-bold tracking-tight text-slate-900 dark:text-[#F8FAFC]">
        No grid assets available
      </h3>

      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mt-2 leading-relaxed">
        The Digital Twin model is currently empty. Initialize the grid topology by creating sample
        assets, importing a configuration, or adding a new substation manually.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 mt-8">
        <button
          onClick={onCreateSample}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-[#FF7A1A]/30 bg-[#FF7A1A]/10 hover:bg-[#FF7A1A]/20 text-[#FF7A1A] text-xs font-mono font-bold rounded-[3px] transition-all disabled:opacity-50"
        >
          <Database className="w-3.5 h-3.5" />
          {loading ? "CREATING..." : "CREATE SAMPLE GRID"}
        </button>

        <button
          onClick={onImport}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 dark:border-[#2A313C] bg-white dark:bg-[#1C222B] hover:bg-slate-50 dark:hover:bg-[#2A313C] text-slate-700 dark:text-slate-300 text-xs font-mono font-bold rounded-[3px] transition-all disabled:opacity-50"
        >
          <Import className="w-3.5 h-3.5" />
          IMPORT GRID
        </button>

        <button
          onClick={onAddFirstAsset}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#FF7A1A] hover:bg-[#E06510] text-white text-xs font-mono font-bold rounded-[3px] transition-all disabled:opacity-50"
        >
          <Plus className="w-3.5 h-3.5" />
          ADD FIRST ASSET
        </button>
      </div>
    </div>
  );
}
export default EmptyState;
