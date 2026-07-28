import React from "react";
import {
  Server,
  GitBranch,
  Power,
  Zap,
  Cpu,
  Cable,
  Activity,
  Edit2,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
} from "lucide-react";

interface AssetTableProps {
  assets: any[];
  selectedIds: number[];
  onToggleSelectAll: () => void;
  onToggleSelectRow: (id: number) => void;
  selectedAsset: any;
  onSelectRow: (asset: any) => void;
  onEdit: (asset: any) => void;
  onDuplicate: (asset: any) => void;
  onDelete: (type: string, id: number) => void;
  sortBy: string | null;
  sortOrder: "asc" | "desc";
  onSort: (field: string) => void;
  loading: boolean;
  substations: any[];
  liveMeasurements: Record<string, any>;
}

export function AssetTable({
  assets,
  selectedIds,
  onToggleSelectAll,
  onToggleSelectRow,
  selectedAsset,
  onSelectRow,
  onEdit,
  onDuplicate,
  onDelete,
  sortBy,
  sortOrder,
  onSort,
  loading,
  substations,
  liveMeasurements,
}: AssetTableProps) {
  const getAssetIcon = (type: string) => {
    switch (type) {
      case "substation":
        return <Server className="w-3.5 h-3.5 text-cyan-500" />;
      case "bus":
        return <GitBranch className="w-3.5 h-3.5 text-yellow-500" />;
      case "generator":
        return <Power className="w-3.5 h-3.5 text-emerald-500" />;
      case "load":
        return <Zap className="w-3.5 h-3.5 text-red-500" />;
      case "switch":
        return <Cpu className="w-3.5 h-3.5 text-purple-500" />;
      case "transmission_line":
        return <Cable className="w-3.5 h-3.5 text-orange-500" />;
      case "transformer":
        return <Activity className="w-3.5 h-3.5 text-violet-500" />;
      default:
        return <Activity className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  const getSubstationName = (item: any) => {
    if (item.type === "substation") return "-";
    if (item.substation_id) {
      const sub = substations.find((s) => s.id === item.substation_id);
      return sub ? sub.name : "-";
    }
    return "-";
  };

  const getLiveTelemetryLabel = (item: any) => {
    const live = liveMeasurements[`${item.type}-${item.id}`];
    if (!live) return "-";

    if (item.type === "generator" && live.p_mw !== undefined) {
      return `${live.p_mw} MW / ${item.capacity_mw} MW (${live.utilization}%)`;
    }
    if (item.type === "load" && live.p_mw !== undefined) {
      return `${live.p_mw} MW`;
    }
    if (item.type === "transmission_line" && live.flow_mw !== undefined) {
      return `${Math.abs(live.flow_mw)} MW / ${item.rating_mva} MVA`;
    }
    if (item.type === "transformer" && live.flow_mw !== undefined) {
      return `${live.flow_mw} MW`;
    }
    if (item.type === "switch" && live.state !== undefined) {
      return `Breaker: ${live.state.toUpperCase()}`;
    }
    return "-";
  };

  const getLiveStatusBadge = (item: any) => {
    const live = liveMeasurements[`${item.type}-${item.id}`] || {};
    const status = live.status || item.status || "active";
    const utilization = live.utilization || 0;

    let color = "bg-emerald-500/10 border-emerald-500/20 text-emerald-500";
    let label = status.toUpperCase();

    if (status === "tripped") {
      color = "bg-red-500/10 border-red-500/20 text-red-500 animate-pulse";
      label = "TRIPPED";
    } else if (utilization > 95) {
      color = "bg-red-500/10 border-red-500/20 text-red-500 animate-bounce";
      label = "OVERLOAD";
    } else if (utilization > 85) {
      color = "bg-amber-500/10 border-amber-500/20 text-amber-550";
      label = "WARNING";
    } else if (status === "maintenance") {
      color = "bg-blue-500/10 border-blue-500/20 text-blue-500";
      label = "TEST_MODE";
    }

    return (
      <span
        className={`inline-flex items-center px-1.5 py-0.5 rounded-[2px] text-[9px] font-bold ${color}`}
      >
        {label}
      </span>
    );
  };

  const renderSortArrow = (field: string) => {
    if (sortBy !== field) {
      return <ArrowUpDown className="w-3 h-3 text-slate-650 group-hover:text-slate-400" />;
    }
    return sortOrder === "asc" ? (
      <ChevronUp className="w-3 h-3 text-[#FF7A1A]" />
    ) : (
      <ChevronDown className="w-3 h-3 text-[#FF7A1A]" />
    );
  };

  const allSelected = assets.length > 0 && selectedIds.length === assets.length;

  return (
    <div className="flex-1 overflow-x-auto select-text font-mono text-xs text-[#94A3B8] border border-[#2A313C] rounded-[3px] bg-[#151A21]/30">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-[#2A313C] bg-slate-950/40 text-[9px] uppercase tracking-wider text-[#64748B] select-none h-9">
            <th className="px-4 py-2 w-10 text-center">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={onToggleSelectAll}
                className="accent-[#FF7A1A] cursor-pointer"
              />
            </th>
            <th className="px-4 py-2 cursor-pointer group" onClick={() => onSort("name")}>
              <div className="flex items-center gap-1.5">Asset Name {renderSortArrow("name")}</div>
            </th>
            <th className="px-4 py-2 cursor-pointer group" onClick={() => onSort("type")}>
              <div className="flex items-center gap-1.5">Type {renderSortArrow("type")}</div>
            </th>
            <th className="px-4 py-2 cursor-pointer group" onClick={() => onSort("status")}>
              <div className="flex items-center gap-1.5">
                Live Status {renderSortArrow("status")}
              </div>
            </th>
            <th className="px-4 py-2 cursor-pointer group" onClick={() => onSort("voltage")}>
              <div className="flex items-center gap-1.5">Voltage {renderSortArrow("voltage")}</div>
            </th>
            <th className="px-4 py-2 cursor-pointer group" onClick={() => onSort("capacity")}>
              <div className="flex items-center gap-1.5">
                Live Telemetry {renderSortArrow("capacity")}
              </div>
            </th>
            <th className="px-4 py-2">Substation</th>
            <th className="px-4 py-2 cursor-pointer group" onClick={() => onSort("updated")}>
              <div className="flex items-center gap-1.5">
                Last Updated {renderSortArrow("updated")}
              </div>
            </th>
            <th className="px-4 py-2 text-right w-28 select-none">Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={`shimmer-${i}`} className="border-b border-[#2A313C]/40 animate-pulse h-12">
                <td className="px-4 py-2">
                  <div className="bg-slate-800 h-3.5 w-3.5 mx-auto rounded-[2px]" />
                </td>
                <td className="px-4 py-2">
                  <div className="bg-slate-800 h-3.5 w-36 rounded-[2px]" />
                </td>
                <td className="px-4 py-2">
                  <div className="bg-slate-800 h-3.5 w-20 rounded-[2px]" />
                </td>
                <td className="px-4 py-2">
                  <div className="bg-slate-800 h-3.5 w-16 rounded-[2px]" />
                </td>
                <td className="px-4 py-2">
                  <div className="bg-slate-800 h-3.5 w-12 rounded-[2px]" />
                </td>
                <td className="px-4 py-2">
                  <div className="bg-slate-800 h-3.5 w-16 rounded-[2px]" />
                </td>
                <td className="px-4 py-2">
                  <div className="bg-slate-800 h-3.5 w-24 rounded-[2px]" />
                </td>
                <td className="px-4 py-2">
                  <div className="bg-slate-800 h-3.5 w-28 rounded-[2px]" />
                </td>
                <td className="px-4 py-2">
                  <div className="bg-slate-800 h-5 w-20 ml-auto rounded-[2px]" />
                </td>
              </tr>
            ))
          ) : assets.length === 0 ? (
            <tr>
              <td
                colSpan={9}
                className="px-4 py-12 text-center text-slate-500 font-sans select-none"
              >
                No matching grid assets found. Refine your filters or search query.
              </td>
            </tr>
          ) : (
            assets.map((item) => {
              const isSelected =
                selectedAsset && selectedAsset.id === item.id && selectedAsset.type === item.type;
              const isChecked = selectedIds.includes(item.id);

              return (
                <tr
                  key={`${item.type}-${item.id}`}
                  onClick={() => onSelectRow(item)}
                  className={`border-b border-[#2A313C]/40 hover:bg-[#1C222B]/40 cursor-pointer transition-colors h-12 group ${
                    isSelected ? "bg-[#FF7A1A]/10 text-slate-200 border-l-2 border-l-[#FF7A1A]" : ""
                  }`}
                >
                  <td className="px-4 py-2 w-10 text-center" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => onToggleSelectRow(item.id)}
                      className="accent-[#FF7A1A] cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-2 font-semibold text-slate-200 truncate max-w-[200px]">
                    {item.name}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      {getAssetIcon(item.type)}
                      <span className="uppercase text-[10px] tracking-wide">
                        {item.type.replace("_", " ")}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2">{getLiveStatusBadge(item)}</td>
                  <td className="px-4 py-2">
                    {item.base_kv !== undefined ? `${item.base_kv} kV` : "-"}
                  </td>
                  <td className="px-4 py-2 font-mono text-slate-350">
                    {getLiveTelemetryLabel(item)}
                  </td>
                  <td className="px-4 py-2 truncate max-w-[150px]">{getSubstationName(item)}</td>
                  <td className="px-4 py-2 text-[10px] text-slate-500">
                    {new Date(item.updated_at).toLocaleString()}
                  </td>
                  <td
                    className="px-4 py-2 text-right select-none"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onEdit(item)}
                        className="p-1 hover:bg-[#1C222B] hover:text-white rounded-[2px] transition-colors"
                        title="Edit parameters"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDuplicate(item)}
                        className="p-1 hover:bg-[#1C222B] hover:text-white rounded-[2px] transition-colors"
                        title="Duplicate asset"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete(item.type, item.id)}
                        className="p-1 hover:bg-red-950/40 hover:text-red-500 rounded-[2px] transition-colors"
                        title="Delete asset"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
export default AssetTable;
