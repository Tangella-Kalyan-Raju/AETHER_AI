import { useState, useEffect, useMemo } from "react";
import { RefreshCw, SlidersHorizontal, Plus, Search, AlertTriangle } from "lucide-react";

import AssetTable from "@/assets/AssetTable";
import AssetForm from "@/assets/AssetForm";
import AssetDetailPanel from "@/assets/AssetDetailPanel";
import BulkOperationsToolbar from "@/assets/BulkOperationsToolbar";
import ToastContainer, { Toast } from "@/assets/ToastContainer";
import EmptyState from "@/topology/EmptyState";
import { useTelemetry } from "@/hooks/useTelemetry";

export function AssetWorkspace() {
  // Consume Live State Engine
  const {
    topology: data,
    liveMeasurements,
    loading,
    error,
    refreshInterval,
    setRefreshInterval,
    triggerManualRefresh: fetchData,
    addEvent,
  } = useTelemetry();

  // Search, sorting, and pagination state
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string | null>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 15;

  // Filters state
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [filterVoltage, setFilterVoltage] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSubstation, setFilterSubstation] = useState("all");

  // Selection states
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [activeAsset, setActiveAsset] = useState<any>(null);

  // Modals state
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit" | "duplicate">("create");
  const [assetToEdit, setAssetToEdit] = useState<any>(null);

  // Toasts state
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Bulk action indicators
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);

  const addToast = (type: Toast["type"], message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => removeToast(id), 5500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Flat mapping of all elements
  const flatAssets = useMemo(() => {
    if (!data) return [];
    const list: any[] = [];

    data.topology.substations.forEach((s: any) => list.push({ ...s, type: "substation" }));
    data.topology.buses.forEach((b: any) => list.push({ ...b, type: "bus" }));
    data.topology.transmission_lines.forEach((l: any) =>
      list.push({ ...l, type: "transmission_line" })
    );
    data.topology.transformers.forEach((x: any) => list.push({ ...x, type: "transformer" }));
    data.topology.generators.forEach((g: any) => list.push({ ...g, type: "generator" }));
    data.topology.loads.forEach((l: any) => list.push({ ...l, type: "load" }));
    data.topology.switches.forEach((s: any) => list.push({ ...s, type: "switch" }));

    return list;
  }, [data]);

  // Combine Text Search and Filters
  const filteredAssets = useMemo(() => {
    let result = [...flatAssets];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (asset) =>
          asset.name.toLowerCase().includes(q) ||
          asset.type.toLowerCase().includes(q) ||
          (asset.uuid && asset.uuid.toLowerCase().includes(q))
      );
    }

    if (filterType !== "all") {
      result = result.filter((a) => a.type === filterType);
    }

    if (filterVoltage !== "all") {
      const kv = parseFloat(filterVoltage);
      result = result.filter((a) => a.base_kv === kv);
    }

    if (filterStatus !== "all") {
      result = result.filter((a) => a.status === filterStatus);
    }

    if (filterSubstation !== "all") {
      const subId = parseInt(filterSubstation);
      result = result.filter(
        (a) => a.substation_id === subId || (a.id === subId && a.type === "substation")
      );
    }

    return result;
  }, [flatAssets, searchQuery, filterType, filterVoltage, filterStatus, filterSubstation]);

  // Sorting
  const sortedAssets = useMemo(() => {
    if (!sortBy) return filteredAssets;
    const sorted = [...filteredAssets];

    sorted.sort((a, b) => {
      let aVal: any = a[sortBy];
      let bVal: any = b[sortBy];

      if (sortBy === "type") {
        aVal = a.type;
        bVal = b.type;
      } else if (sortBy === "voltage") {
        aVal = a.base_kv ?? 0;
        bVal = b.base_kv ?? 0;
      } else if (sortBy === "capacity") {
        aVal = a.capacity_mw ?? a.rating_mva ?? 0;
        bVal = b.capacity_mw ?? b.rating_mva ?? 0;
      } else if (sortBy === "updated") {
        aVal = new Date(a.updated_at).getTime();
        bVal = new Date(b.updated_at).getTime();
      }

      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;

      if (typeof aVal === "string") {
        return sortOrder === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
    });

    return sorted;
  }, [filteredAssets, sortBy, sortOrder]);

  // Pagination
  const paginatedAssets = useMemo(() => {
    const start = (currentPage - 1) * recordsPerPage;
    return sortedAssets.slice(start, start + recordsPerPage);
  }, [sortedAssets, currentPage]);

  const totalPages = Math.ceil(sortedAssets.length / recordsPerPage) || 1;

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const handleToggleSelectRow = (id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === paginatedAssets.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedAssets.map((a) => a.id));
    }
  };

  const handleAddClick = () => {
    setFormMode("create");
    setAssetToEdit(null);
    setFormOpen(true);
  };

  const handleEditClick = (asset: any) => {
    setFormMode("edit");
    setAssetToEdit(asset);
    setFormOpen(true);
  };

  const handleDuplicateClick = (asset: any) => {
    setFormMode("duplicate");
    setAssetToEdit(asset);
    setFormOpen(true);
  };

  // Add / Save Asset logically
  const handleSaveAsset = async (type: string, payload: any) => {
    const token = localStorage.getItem("gpo_access_token");
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
    const endpointMap: Record<string, string> = {
      substation: "substations",
      bus: "buses",
      transmission_line: "transmission-lines",
      transformer: "transformers",
      generator: "generators",
      load: "loads",
      switch: "switches",
    };

    const endpoint = endpointMap[type];
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    let res;
    if (formMode === "edit") {
      res = await fetch(`${API_URL}/api/v1/${endpoint}/${payload.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(payload),
      });
    } else {
      res = await fetch(`${API_URL}/api/v1/${endpoint}`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
    }

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || "Failed to commit asset changes.");
    }

    addToast(
      "success",
      `${payload.name} successfully ${formMode === "edit" ? "updated" : "saved"} in the database.`
    );
    addEvent({
      assetName: payload.name,
      eventType: "state_change",
      message: `Asset successfully ${formMode === "edit" ? "modified" : "created"} inside workspace console.`,
    });
    fetchData();
  };

  // Live updates from Side panel
  const handleLiveUpdate = async (type: string, id: number, changes: any) => {
    const token = localStorage.getItem("gpo_access_token");
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
    const endpointMap: Record<string, string> = {
      substation: "substations",
      bus: "buses",
      transmission_line: "transmission-lines",
      transformer: "transformers",
      generator: "generators",
      load: "loads",
      switch: "switches",
    };

    const endpoint = endpointMap[type];
    const res = await fetch(`${API_URL}/api/v1/${endpoint}/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(changes),
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || "API update error.");
    }

    addToast("success", `Property modification committed successfully.`);
    addEvent({
      assetName: json.data.name || "Grid Asset",
      eventType: "state_change",
      message: `Live parameters updated in Property Editor.`,
    });
    setActiveAsset(json.data);
    fetchData();
  };

  const handleDeleteAsset = async (type: string, id: number) => {
    const name = flatAssets.find((a) => a.id === id && a.type === type)?.name || "Asset";
    if (
      !window.confirm(`CONFIRM SECURE DELETION?\nAre you sure you want to soft-delete '${name}'?`)
    ) {
      return;
    }

    const token = localStorage.getItem("gpo_access_token");
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
    const endpointMap: Record<string, string> = {
      substation: "substations",
      bus: "buses",
      transmission_line: "transmission-lines",
      transformer: "transformers",
      generator: "generators",
      load: "loads",
      switch: "switches",
    };

    try {
      const res = await fetch(`${API_URL}/api/v1/${endpointMap[type]}/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Delete execution failed.");
      }

      addToast("success", `Asset '${name}' successfully soft-deleted.`);
      addEvent({
        assetName: name,
        eventType: "state_change",
        message: `Asset de-energized and soft-deleted from live schema.`,
      });
      if (activeAsset && activeAsset.id === id && activeAsset.type === type) {
        setActiveAsset(null);
      }
      fetchData();
    } catch (e: any) {
      addToast("error", e.message || "Failed to delete grid asset.");
    }
  };

  // Bulk Operations Handlers
  const handleBulkDelete = async () => {
    setIsProcessingBulk(true);
    setBulkProgress(0);

    const token = localStorage.getItem("gpo_access_token");
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
    const endpointMap: Record<string, string> = {
      substation: "substations",
      bus: "buses",
      transmission_line: "transmission-lines",
      transformer: "transformers",
      generator: "generators",
      load: "loads",
      switch: "switches",
    };

    const targets = flatAssets.filter((a) => selectedIds.includes(a.id));
    const total = targets.length;
    let succeeded = 0;

    for (let index = 0; index < total; index++) {
      const item = targets[index];
      try {
        const res = await fetch(`${API_URL}/api/v1/${endpointMap[item.type]}/${item.id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) succeeded++;
      } catch (e) {
        console.error(e);
      }
      setBulkProgress(Math.round(((index + 1) / total) * 100));
    }

    addToast("success", `Bulk Delete completed. Succeeded: ${succeeded}/${total}.`);
    addEvent({
      assetName: `${succeeded} assets`,
      eventType: "state_change",
      message: `Bulk soft-delete completed successfully.`,
    });
    setSelectedIds([]);
    setIsProcessingBulk(false);
    fetchData();
  };

  const handleBulkStatusUpdate = async (status: string) => {
    setIsProcessingBulk(true);
    setBulkProgress(0);

    const token = localStorage.getItem("gpo_access_token");
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
    const endpointMap: Record<string, string> = {
      substation: "substations",
      bus: "buses",
      transmission_line: "transmission-lines",
      transformer: "transformers",
      generator: "generators",
      load: "loads",
      switch: "switches",
    };

    const targets = flatAssets.filter((a) => selectedIds.includes(a.id));
    const total = targets.length;
    let succeeded = 0;

    for (let index = 0; index < total; index++) {
      const item = targets[index];
      try {
        const res = await fetch(`${API_URL}/api/v1/${endpointMap[item.type]}/${item.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        });
        if (res.ok) succeeded++;
      } catch (e) {
        console.error(e);
      }
      setBulkProgress(Math.round(((index + 1) / total) * 100));
    }

    addToast("success", `Bulk Status Update completed. Succeeded: ${succeeded}/${total}.`);
    addEvent({
      assetName: `${succeeded} assets`,
      eventType: "state_change",
      message: `Bulk status update to [${status.toUpperCase()}] completed.`,
    });
    setSelectedIds([]);
    setIsProcessingBulk(false);
    fetchData();
  };

  const handleBulkExport = () => {
    const targets = flatAssets.filter((a) => selectedIds.includes(a.id));
    const blob = new Blob([JSON.stringify(targets, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `GPO-Asset-Export-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast("info", `${targets.length} assets successfully serialized and exported.`);
    setSelectedIds([]);
  };

  const activeRelations = useMemo(() => {
    if (!activeAsset || !data) return {};

    const { id, type } = activeAsset;
    let parentSubstation: string | undefined;
    let connectedBuses: string[] = [];
    let generators: string[] = [];
    let loads: string[] = [];
    let switches: string[] = [];
    let lines: string[] = [];

    if (type === "substation") {
      const subBuses = data.topology.buses.filter((b: any) => b.substation_id === id);
      connectedBuses = subBuses.map((b: any) => b.name);
    } else if (type === "bus") {
      const sub = data.topology.substations.find((s: any) => s.id === activeAsset.substation_id);
      parentSubstation = sub?.name;
      generators = data.topology.generators
        .filter((g: any) => g.bus_id === id)
        .map((g: any) => g.name);
      loads = data.topology.loads.filter((l: any) => l.bus_id === id).map((l: any) => l.name);
    } else if (type === "generator") {
      const bus = data.topology.buses.find((b: any) => b.id === activeAsset.bus_id);
      connectedBuses = bus ? [bus.name] : [];
    } else if (type === "load") {
      const bus = data.topology.buses.find((b: any) => b.id === activeAsset.bus_id);
      connectedBuses = bus ? [bus.name] : [];
    }

    return { parentSubstation, connectedBuses, generators, loads, switches, lines };
  }, [activeAsset, data]);

  const hasAssets = flatAssets.length > 0;

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] select-text">
      {/* Toast notifications container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Header Panel */}
      <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 dark:border-[#1E293B] pb-4 mb-4 gap-3 flex-shrink-0">
        <div>
          <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1.5">
            Operational Clearance
          </p>
          <h1 className="text-xl sm:text-2xl font-heading font-bold tracking-tight text-slate-900 dark:text-[#F8FAFC]">
            Asset Management Workspace
          </h1>
        </div>

        {/* Live Refresh Configuration Bar */}
        <div className="flex items-center gap-3 font-mono text-[10px] text-slate-500">
          <div className="flex items-center gap-1.5 border border-slate-200 dark:border-[#1E293B] rounded-[3px] p-1 bg-white dark:bg-[#151A21]/40">
            <span className="text-[9px] uppercase font-bold text-slate-400">Scan Interval:</span>
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
              className="bg-transparent text-slate-350 focus:outline-none cursor-pointer"
            >
              <option value={2000}>2s (LIVE)</option>
              <option value={5000}>5s (FAST)</option>
              <option value={15000}>15s (SLOW)</option>
              <option value={0}>PAUSED</option>
            </select>
          </div>

          <div className="w-px bg-slate-800 h-5 my-0.5" />

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-[3px] text-xs font-bold transition-all ${
              showFilters
                ? "border-orange-500 bg-orange-500/10 text-orange-500"
                : "border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#151A21]/50 text-slate-600 dark:text-slate-400"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            FILTERS
          </button>

          <button
            onClick={handleAddClick}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FF7A1A] hover:bg-[#E06510] text-white text-xs font-bold rounded-[3px] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            ADD ASSET
          </button>

          <button
            onClick={fetchData}
            disabled={loading}
            className="p-1.5 rounded-[3px] border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#151A21]/50 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </section>

      {/* Dynamic Filters Bar */}
      {showFilters && hasAssets && (
        <div className="bg-slate-50/50 dark:bg-[#151A21]/40 border border-slate-200 dark:border-[#1E293B] rounded-[3px] p-3 mb-4 flex flex-wrap gap-4 text-xs font-mono select-none">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-slate-400 uppercase font-semibold">Asset Type</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-white dark:bg-[#1C222B] border border-slate-200 dark:border-[#2A313C] rounded-[2px] px-2 py-1 text-slate-850 dark:text-slate-200 focus:outline-none"
            >
              <option value="all">All Types</option>
              <option value="substation">Substation</option>
              <option value="bus">Busbar Node</option>
              <option value="transmission_line">Transmission Line</option>
              <option value="transformer">Transformer</option>
              <option value="generator">Generator</option>
              <option value="load">Load Sink</option>
              <option value="switch">Switch / Breaker</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-slate-400 uppercase font-semibold">Voltage level</span>
            <select
              value={filterVoltage}
              onChange={(e) => setFilterVoltage(e.target.value)}
              className="bg-white dark:bg-[#1C222B] border border-slate-200 dark:border-[#2A313C] rounded-[2px] px-2 py-1 text-slate-850 dark:text-slate-200 focus:outline-none"
            >
              <option value="all">All Voltages</option>
              <option value="138">138 kV</option>
              <option value="69">69 kV</option>
              <option value="13.8">13.8 kV</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-slate-400 uppercase font-semibold">Substation</span>
            <select
              value={filterSubstation}
              onChange={(e) => setFilterSubstation(e.target.value)}
              className="bg-white dark:bg-[#1C222B] border border-slate-200 dark:border-[#2A313C] rounded-[2px] px-2 py-1 text-slate-850 dark:text-slate-200 focus:outline-none"
            >
              <option value="all">All Substations</option>
              {data?.topology?.substations?.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-slate-400 uppercase font-semibold">Status</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-white dark:bg-[#1C222B] border border-[#2A313C] rounded-[2px] px-2 py-1 text-slate-850 dark:text-slate-200 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="maintenance">Maintenance</option>
              <option value="tripped">Tripped</option>
            </select>
          </div>
        </div>
      )}

      {/* Main Table + Detail Panel Workspace */}
      <div className="flex-1 flex min-h-0 relative">
        {loading && !data && (
          <div className="flex-1 flex flex-col items-center justify-center border border-slate-200 dark:border-[#1E293B] rounded-[3px] bg-white dark:bg-[#151A21]/30">
            <RefreshCw className="w-8 h-8 text-orange-500 animate-spin mb-4" />
            <p className="text-xs font-mono text-slate-400 dark:text-slate-500">
              Loading Live Digital Twin database...
            </p>
          </div>
        )}

        {error && !loading && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 border border-dashed border-red-500/30 bg-red-500/5 rounded-[3px]">
            <AlertTriangle className="w-10 h-10 text-red-500 mb-3" />
            <h3 className="text-sm font-mono font-bold text-red-500 uppercase">
              WORKSPACE OFFLINE
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm text-center leading-relaxed mt-2">
              Failed to connect to grid telemetry. Check network status.
            </p>
          </div>
        )}

        {data && !loading && !error && (
          <>
            {!hasAssets ? (
              <div className="flex-1">
                <EmptyState
                  onImport={() => alert("Load config folder grid datasets.")}
                  onCreateSample={fetchData}
                  onAddFirstAsset={handleAddClick}
                  loading={loading}
                />
              </div>
            ) : !searchQuery && !activeAsset ? (
              <div className="flex-1 flex flex-col justify-center items-center p-8 bg-slate-50/10 dark:bg-[#07090C]/20 border border-dashed border-slate-200 dark:border-[#1E293B] rounded-[4px] min-h-[350px] space-y-6">
                <div className="text-center max-w-sm space-y-1.5">
                  <div className="w-10 h-10 mx-auto rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 mb-2">
                    <Search className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Search assets or inspect equipment
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Enter an equipment tag, substation name, asset class, or NERC group parameter to
                    audit operational telemetry.
                  </p>
                </div>

                <div className="w-full max-w-md flex gap-2">
                  <div className="flex-1 flex items-center bg-slate-100 dark:bg-[#1C222B] border border-slate-300 dark:border-[#2A313C] rounded-[2px] px-3 py-2">
                    <Search className="w-4 h-4 text-slate-500 mr-2" />
                    <input
                      type="text"
                      placeholder="Enter equipment tag (e.g. T-17, Feeder F-18, transformer)..."
                      className="bg-transparent border-none text-slate-200 placeholder-slate-650 text-xs focus:outline-none w-full"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          setSearchQuery((e.target as HTMLInputElement).value || " ");
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-1.5 text-center">
                  <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider block">
                    Quick Suggestions
                  </span>
                  <div className="flex flex-wrap justify-center gap-2 max-w-lg">
                    {[
                      { label: "Inspect Reno Feeder F-18 line status", q: "Feeder F-18" },
                      { label: "Inspect Tahoe Substation T1 winding status", q: "T1" },
                      { label: "Show all transformers", q: "transformer" },
                      { label: "Show all generators", q: "generator" },
                    ].map((sug, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSearchQuery(sug.q)}
                        className="text-[10px] bg-slate-100 dark:bg-[#151A21] hover:bg-slate-200 dark:hover:bg-[#1E293B] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-[#2A313C] px-2 py-0.5 rounded-[2px] transition-all"
                      >
                        {sug.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex min-h-0 relative">
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="flex items-center gap-3 bg-slate-950/30 border border-[#2A313C] p-2 rounded-t-[3px] border-b-0 flex-shrink-0">
                    <div className="flex items-center bg-[#1C222B] border border-[#2A313C] rounded-[2px] px-2.5 py-1 w-72 max-w-full">
                      <Search className="w-3.5 h-3.5 text-slate-500 mr-2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search workspace assets..."
                        className="bg-transparent border-none text-slate-200 placeholder-slate-600 text-xs focus:outline-none w-full"
                      />
                    </div>
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setActiveAsset(null);
                      }}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[9px] font-mono text-slate-300 rounded-[2px] transition-all"
                    >
                      RESET SEARCH
                    </button>
                    <span className="text-[10px] font-mono text-slate-550">
                      TOTAL SCADA CHANNELS: {sortedAssets.length}
                    </span>
                  </div>

                  {/* Main Grid Table */}
                  <AssetTable
                    assets={paginatedAssets}
                    selectedIds={selectedIds}
                    onToggleSelectAll={handleToggleSelectAll}
                    onToggleSelectRow={handleToggleSelectRow}
                    selectedAsset={activeAsset}
                    onSelectRow={setActiveAsset}
                    onEdit={handleEditClick}
                    onDuplicate={handleDuplicateClick}
                    onDelete={handleDeleteAsset}
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                    loading={loading}
                    substations={data.topology.substations}
                    liveMeasurements={liveMeasurements}
                  />

                  {/* Pagination control bar */}
                  <div className="flex items-center justify-between border border-[#2A313C] border-t-0 p-3 bg-slate-950/20 rounded-b-[3px] flex-shrink-0 font-mono text-[10.5px]">
                    <span className="text-slate-500">
                      Page {currentPage} of {totalPages} (Showing {paginatedAssets.length} of{" "}
                      {sortedAssets.length})
                    </span>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-2 py-1 border border-slate-700 hover:border-slate-500 disabled:opacity-40 rounded-[2px]"
                      >
                        PREV
                      </button>
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-2 py-1 border border-slate-700 hover:border-slate-500 disabled:opacity-40 rounded-[2px]"
                      >
                        NEXT
                      </button>
                    </div>
                  </div>
                </div>

                {/* Side Property Inspector Panel */}
                {activeAsset && (
                  <div className="h-full flex-shrink-0 animate-in slide-in-from-right duration-150">
                    <AssetDetailPanel
                      asset={activeAsset}
                      type={activeAsset.type}
                      onClose={() => setActiveAsset(null)}
                      relationships={activeRelations}
                      onUpdate={handleLiveUpdate}
                      substations={data.topology.substations}
                      buses={data.topology.buses}
                      lines={data.topology.transmission_lines}
                    />
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Add / Edit / Duplicate Asset Form Modal */}
      {formOpen && (
        <AssetForm
          mode={formMode}
          assetToEdit={assetToEdit}
          substations={data?.topology?.substations || []}
          buses={data?.topology?.buses || []}
          lines={data?.topology?.transmission_lines || []}
          onClose={() => setFormOpen(false)}
          onSave={handleSaveAsset}
        />
      )}

      {/* Bulk commands floating toolbar */}
      <BulkOperationsToolbar
        selectedCount={selectedIds.length}
        onBulkDelete={handleBulkDelete}
        onBulkStatusUpdate={handleBulkStatusUpdate}
        onBulkExport={handleBulkExport}
        isProcessing={isProcessingBulk}
        progress={bulkProgress}
      />
    </div>
  );
}
export default AssetWorkspace;
