import React from "react";
import { Search } from "lucide-react";

interface AssetSearchBarProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

export function AssetSearchBar({
  value,
  onChange,
  placeholder = "Search by Asset ID, Name, Manufacturer, Region...",
}: AssetSearchBarProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-[#F8FAFC] placeholder-slate-400 focus:border-emerald-500 focus:outline-none transition font-mono shadow-sm"
      />
    </div>
  );
}
