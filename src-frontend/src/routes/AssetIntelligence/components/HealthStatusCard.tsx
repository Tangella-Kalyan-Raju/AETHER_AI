import React from "react";
import { Activity, Clock, Cpu, Heart, Shield, Thermometer } from "lucide-react";

interface HealthStatusCardProps {
  health: {
    health_score: number;
    condition: string;
    remaining_useful_life: number;
    efficiency: number;
    temperature: number;
    performance_index: number;
    utilization: number;
    availability: number;
  };
}

export function HealthStatusCard({ health }: HealthStatusCardProps) {
  const getConditionColor = (cond: string) => {
    switch (cond?.toLowerCase()) {
      case "nominal":
        return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
      case "warning":
        return "text-amber-500 bg-amber-500/10 border-amber-500/20";
      case "critical":
        return "text-rose-500 bg-rose-500/10 border-rose-500/20";
      default:
        return "text-slate-500 bg-slate-500/10 border-slate-500/20";
    }
  };

  return (
    <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#2A313C]">
        <div className="flex items-center gap-1.5">
          <Heart className="w-4 h-4 text-rose-500 animate-pulse" />
          <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-[#F8FAFC]">
            Asset Health & Diagnostics
          </h3>
        </div>
        <span
          className={`px-2 py-0.5 border rounded-[4px] font-mono text-[9px] uppercase tracking-wider ${getConditionColor(
            health.condition
          )}`}
        >
          {health.condition}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs font-mono">
        <div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Remaining Useful Life
          </p>
          <p className="text-slate-800 dark:text-slate-200">
            {health.remaining_useful_life
              ? `${health.remaining_useful_life.toFixed(1)} years`
              : "N/A"}
          </p>
        </div>

        <div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Shield className="w-3.5 h-3.5" />
            Availability
          </p>
          <p className="text-slate-800 dark:text-slate-200">
            {health.availability ? `${health.availability.toFixed(1)}%` : "N/A"}
          </p>
        </div>

        <div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5" />
            Efficiency Rating
          </p>
          <p className="text-slate-800 dark:text-slate-200">
            {health.efficiency ? `${health.efficiency.toFixed(1)}%` : "N/A"}
          </p>
        </div>

        <div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Thermometer className="w-3.5 h-3.5" />
            Operating Temp
          </p>
          <p className="text-slate-800 dark:text-slate-200">
            {health.temperature ? `${health.temperature.toFixed(1)} °C` : "N/A"}
          </p>
        </div>

        <div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Activity className="w-3.5 h-3.5" />
            Utilization Index
          </p>
          <p className="text-slate-800 dark:text-slate-200">
            {health.utilization ? `${health.utilization.toFixed(1)}%` : "N/A"}
          </p>
        </div>

        <div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Heart className="w-3.5 h-3.5" />
            Performance Index
          </p>
          <p className="text-slate-800 dark:text-slate-200">
            {health.performance_index ? `${health.performance_index.toFixed(1)}/100` : "N/A"}
          </p>
        </div>
      </div>
    </div>
  );
}
