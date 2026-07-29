import React from "react";
import { Loader2, AlertCircle, Database } from "lucide-react";

export function LoadingState({ message = "Loading asset telemetry..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-slate-500 dark:text-slate-400">
      <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-3" />
      <span className="text-sm font-mono tracking-wider">{message}</span>
    </div>
  );
}

export function ErrorState({
  message = "Failed to synchronize operational assets.",
  retry,
}: {
  message?: string;
  retry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center text-slate-500 dark:text-slate-400">
      <AlertCircle className="w-10 h-10 text-rose-500 mb-3" />
      <h3 className="font-heading text-base font-bold text-slate-900 dark:text-[#F8FAFC] mb-1">
        Telemetry Synchronization Failure
      </h3>
      <p className="text-sm max-w-md mb-4">{message}</p>
      {retry && (
        <button
          onClick={retry}
          className="px-4 py-2 bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500/20 rounded-[4px] font-mono text-xs transition"
        >
          Retry Connection
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  title = "No Grid Assets Registered",
  message = "No physical assets match the selected criteria.",
}: {
  title?: string;
  message?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center text-slate-500 dark:text-slate-400 border border-dashed border-slate-200 dark:border-[#2A313C] rounded-[4px]">
      <Database className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-3" />
      <h3 className="font-heading text-base font-bold text-slate-900 dark:text-[#F8FAFC] mb-1">
        {title}
      </h3>
      <p className="text-sm max-w-md">{message}</p>
    </div>
  );
}
