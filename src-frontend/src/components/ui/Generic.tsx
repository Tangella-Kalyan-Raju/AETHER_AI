import { AlertTriangle, Clock, Activity, LucideIcon } from "lucide-react";

interface StatusBadgeProps {
  status: "ONLINE" | "OFFLINE" | "STANDBY" | "ERROR" | "WARNING" | "ACTIVE";
  className?: string;
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const getStyles = () => {
    switch (status) {
      case "ONLINE":
      case "ACTIVE":
        return "bg-emerald-500/10 border-emerald-500/20 text-emerald-500";
      case "OFFLINE":
      case "ERROR":
        return "bg-red-500/10 border-red-500/20 text-red-500";
      case "WARNING":
        return "bg-orange-500/10 border-orange-500/20 text-orange-500";
      case "STANDBY":
      default:
        return "bg-slate-500/10 border-slate-500/20 text-slate-500";
    }
  };

  return (
    <span
      className={`px-2 py-0.5 rounded-[2px] border text-[10px] font-bold tracking-wider ${getStyles()} ${className}`}
    >
      {status}
    </span>
  );
}

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
}

export function EmptyState({ title, description, icon: Icon = Activity }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-slate-200 dark:border-[#2A313C] rounded-[3px] bg-slate-50/50 dark:bg-[#151A21]/30">
      <div className="w-10 h-10 mb-3 rounded-full bg-slate-100 dark:bg-[#1C222B] flex items-center justify-center">
        <Icon className="w-5 h-5 text-slate-400" />
      </div>
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{title}</h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">{description}</p>
    </div>
  );
}
