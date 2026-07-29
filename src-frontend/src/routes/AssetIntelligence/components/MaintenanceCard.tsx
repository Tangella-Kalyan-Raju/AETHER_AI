import React from "react";
import { AlertOctagon, Calendar, CheckSquare, ShieldAlert } from "lucide-react";

interface MaintenanceCardProps {
  maintenance: {
    predicted_failure?: string;
    failure_probability: number;
    criticality_score: number;
    maintenance_priority: string;
    maintenance_schedule?: string;
  };
}

export function MaintenanceCard({ maintenance }: MaintenanceCardProps) {
  const getPriorityColor = (pri: string) => {
    switch (pri?.toLowerCase()) {
      case "critical":
        return "text-rose-500 bg-rose-500/10 border-rose-500/20";
      case "high":
        return "text-amber-500 bg-amber-500/10 border-amber-500/20";
      case "medium":
        return "text-blue-500 bg-blue-500/10 border-blue-500/20";
      default:
        return "text-slate-500 bg-slate-500/10 border-slate-500/20";
    }
  };

  return (
    <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#2A313C]">
        <div className="flex items-center gap-1.5">
          <ShieldAlert className="w-4 h-4 text-emerald-500" />
          <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-[#F8FAFC]">
            Predictive Maintenance
          </h3>
        </div>
        <span
          className={`px-2 py-0.5 border rounded-[4px] font-mono text-[9px] uppercase tracking-wider ${getPriorityColor(
            maintenance.maintenance_priority
          )}`}
        >
          {maintenance.maintenance_priority} Priority
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
        <div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
            <AlertOctagon className="w-3.5 h-3.5" />
            Failure Probability
          </p>
          <p className="text-slate-800 dark:text-slate-200">
            {maintenance.failure_probability
              ? `${(maintenance.failure_probability * 100).toFixed(1)}%`
              : "0.0%"}
          </p>
        </div>

        <div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
            <CheckSquare className="w-3.5 h-3.5" />
            Criticality Score
          </p>
          <p className="text-slate-800 dark:text-slate-200">
            {maintenance.criticality_score
              ? `${maintenance.criticality_score.toFixed(0)}/100`
              : "0"}
          </p>
        </div>

        <div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            Next Scheduled Date
          </p>
          <p className="text-slate-800 dark:text-slate-200">
            {maintenance.maintenance_schedule
              ? new Date(maintenance.maintenance_schedule).toLocaleDateString()
              : "None Scheduled"}
          </p>
        </div>

        <div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            Predicted Failure Date
          </p>
          <p className="text-rose-500 font-bold">
            {maintenance.predicted_failure
              ? new Date(maintenance.predicted_failure).toLocaleDateString()
              : "No Alarm"}
          </p>
        </div>
      </div>
    </div>
  );
}
