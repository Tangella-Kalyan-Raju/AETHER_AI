import { Trash2, ShieldAlert, Download, Upload, Check } from "lucide-react";

interface BulkOperationsToolbarProps {
  selectedCount: number;
  onBulkDelete: () => void;
  onBulkStatusUpdate: (status: string) => void;
  onBulkExport: () => void;
  isProcessing: boolean;
  progress?: number; // 0 to 100
}

export function BulkOperationsToolbar({
  selectedCount,
  onBulkDelete,
  onBulkStatusUpdate,
  onBulkExport,
  isProcessing,
  progress,
}: BulkOperationsToolbarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-12 left-1/2 transform -translate-x-1/2 z-30 w-full max-w-2xl px-4 select-text">
      <div className="bg-slate-950/95 border border-[#2A313C] rounded-[3px] p-3 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-3 backdrop-blur-md font-mono text-xs text-[#94A3B8]">
        {/* Left indicators */}
        <div className="flex items-center gap-3">
          <span className="h-5 px-2 rounded-[2px] bg-[#FF7A1A]/10 border border-[#FF7A1A]/35 text-[#FF7A1A] text-[10px] font-bold flex items-center justify-center">
            {selectedCount} SELECTED
          </span>
          {isProcessing && progress !== undefined && (
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-slate-400">PROCESSING: {progress}%</span>
              <div className="w-24 bg-slate-800 h-1.5 rounded-[2px] overflow-hidden">
                <div
                  className="bg-[#FF7A1A] h-full rounded-[2px] transition-all duration-150"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onBulkStatusUpdate("active")}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-2.5 py-1.5 border border-slate-700 hover:border-emerald-500 hover:text-emerald-500 rounded-[2px] transition-colors disabled:opacity-40"
            title="Update all selected statuses to active"
          >
            <Check className="w-3.5 h-3.5" />
            ACTIVATE
          </button>

          <button
            onClick={() => onBulkStatusUpdate("maintenance")}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-2.5 py-1.5 border border-slate-700 hover:border-amber-500 hover:text-amber-500 rounded-[2px] transition-colors disabled:opacity-40"
            title="Transition selected assets to maintenance"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            MAINTENANCE
          </button>

          <button
            onClick={onBulkExport}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-2.5 py-1.5 border border-slate-700 hover:border-blue-500 hover:text-blue-500 rounded-[2px] transition-colors disabled:opacity-40"
            title="Download selected assets configuration as JSON"
          >
            <Download className="w-3.5 h-3.5" />
            EXPORT
          </button>

          <button
            className="flex items-center gap-1.5 px-2.5 py-1.5 border border-slate-800 text-slate-600 rounded-[2px] cursor-not-allowed opacity-50"
            disabled
            title="Import configuration JSON file (Standby)"
          >
            <Upload className="w-3.5 h-3.5" />
            IMPORT
          </button>

          <div className="w-px bg-slate-800 h-5 my-1" />

          <button
            onClick={() => {
              if (
                window.confirm(
                  `CONFIRM SECURE BULK DELETION?\nThis will soft-delete ${selectedCount} selected grid assets.`
                )
              ) {
                onBulkDelete();
              }
            }}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-2.5 py-1.5 border border-red-900/50 hover:bg-red-500/10 text-red-500 hover:border-red-500 rounded-[2px] transition-colors disabled:opacity-40"
          >
            <Trash2 className="w-3.5 h-3.5" />
            DELETE
          </button>
        </div>
      </div>
    </div>
  );
}
export default BulkOperationsToolbar;
