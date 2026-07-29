import React from "react";

export function AssetBadge({ status }: { status: string }) {
  const getColors = (s: string) => {
    switch (s?.toLowerCase()) {
      case "active":
      case "online":
      case "completed":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "maintenance":
      case "offline":
      case "standby":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "inactive":
      case "deleted":
        return "bg-rose-500/10 text-rose-500 border-rose-500/20";
      default:
        return "bg-slate-500/10 text-slate-500 border-slate-500/20";
    }
  };

  return (
    <span
      className={`px-2 py-0.5 rounded-[4px] border font-mono text-[10px] uppercase tracking-wider ${getColors(
        status
      )}`}
    >
      {status || "Unknown"}
    </span>
  );
}
