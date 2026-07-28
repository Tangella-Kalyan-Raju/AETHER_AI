import React from "react";
import { format } from "date-fns";
import { Clock, PlayCircle, CheckCircle2, AlertCircle } from "lucide-react";

export const ForecastTimeline = ({ history }: { history: any[] }) => {
  return (
    <div className="space-y-6">
      <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-4 uppercase tracking-widest">
        Execution Timeline
      </h3>
      <div className="relative border-l border-slate-200 dark:border-[#2A313C] ml-3 space-y-6">
        {history.length === 0 ? (
          <p className="text-sm text-slate-500 pl-6">No execution history found.</p>
        ) : (
          history.map((entry, index) => (
            <div key={index} className="relative pl-6">
              <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-[#2A313C] ring-4 ring-white dark:ring-[#161B22]" />
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-slate-900 dark:text-white flex items-center">
                  {entry.status === "Completed" && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mr-2" />
                  )}
                  {entry.status === "Running" && (
                    <PlayCircle className="w-4 h-4 text-blue-500 mr-2" />
                  )}
                  {entry.status === "Failed" && (
                    <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
                  )}
                  {entry.status} Execution
                </span>
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400 flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {format(new Date(entry.execution_timestamp), "MMM dd, HH:mm:ss")}
                </span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {entry.logs?.message || "Execution completed."}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
