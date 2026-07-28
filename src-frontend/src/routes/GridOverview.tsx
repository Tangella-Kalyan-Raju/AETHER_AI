import { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/context/ThemeContext";
import {
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  AlertTriangle,
  Server,
  Zap,
  Terminal,
  Activity,
  Shield,
  Play,
  Pause,
} from "lucide-react";

import EmptyState from "@/topology/EmptyState";
import InteractiveLegend from "@/topology/InteractiveLegend";
import TopologyToolbar from "@/topology/TopologyToolbar";
import AssetDetailPanel from "@/assets/AssetDetailPanel";
import Minimap from "@/topology/Minimap";
import GridTopologyViewer from "@/topology/GridTopologyViewer";
import { useTelemetry } from "@/hooks/useTelemetry";

export function GridOverview() {
  const { theme } = useTheme();

  // Consume live state from TelemetryContext
  const {
    topology: data,
    liveMeasurements,
    eventTimeline,
    loading,
    error,
    refreshInterval,
    setRefreshInterval,
    triggerManualRefresh,
  } = useTelemetry();

  // Layout and interaction states
  const [layoutMode, setLayoutMode] = useState<"geo" | "schematic">("schematic");
  const [snapToGrid, setSnapToGrid] = useState<boolean>(false);
  const [selectedAsset, setSelectedAsset] = useState<{ id: number; type: string } | null>(null);

  // Highlight legend states
  const [highlightCategory, setHighlightCategory] = useState<string | null>(null);
  const [highlightVoltage, setHighlightVoltage] = useState<number | null>(null);

  // Filters state
  const [showFilters, setShowFilters] = useState(false);
  const [filterSubstation, setFilterSubstation] = useState<string>("all");
  const [filterVoltage, setFilterVoltage] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Viewport transformation states
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [scale, setScale] = useState(0.85);

  const viewerContainerRef = useRef<HTMLDivElement>(null);
  const [viewportSize, setViewportSize] = useState({ width: 800, height: 600 });

  // Update viewport width/height on resize
  useEffect(() => {
    if (viewerContainerRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (let entry of entries) {
          setViewportSize({
            width: entry.contentRect.width || 800,
            height: entry.contentRect.height || 600,
          });
        }
      });
      resizeObserver.observe(viewerContainerRef.current);
      return () => resizeObserver.disconnect();
    }
  }, []);

  // Filtered topology calculations
  const filteredTopology = useMemo(() => {
    if (!data) return null;

    let substations = [...data.topology.substations];
    let buses = [...data.topology.buses];
    let lines = [...data.topology.transmission_lines];
    let transformers = [...data.topology.transformers];
    let generators = [...data.topology.generators];
    let loads = [...data.topology.loads];
    let switches = [...data.topology.switches];

    // 1. Substation Filter
    if (filterSubstation !== "all") {
      const subId = parseInt(filterSubstation);
      substations = substations.filter((s) => s.id === subId);
      buses = buses.filter((b) => b.substation_id === subId);
      const busIds = buses.map((b) => b.id);
      lines = lines.filter((l) => busIds.includes(l.from_bus_id) || busIds.includes(l.to_bus_id));
      transformers = transformers.filter(
        (x) => busIds.includes(x.from_bus_id) || busIds.includes(x.to_bus_id)
      );
      generators = generators.filter((g) => busIds.includes(g.bus_id));
      loads = loads.filter((l) => busIds.includes(l.bus_id));
      switches = switches.filter((sw) => busIds.includes(sw.bus_id));
    }

    // 2. Voltage Filter
    if (filterVoltage !== "all") {
      const kv = parseFloat(filterVoltage);
      buses = buses.filter((b) => b.base_kv === kv);
      const busIds = buses.map((b) => b.id);
      lines = lines.filter((l) => busIds.includes(l.from_bus_id) || busIds.includes(l.to_bus_id));
      transformers = transformers.filter(
        (x) => busIds.includes(x.from_bus_id) || busIds.includes(x.to_bus_id)
      );
      generators = generators.filter((g) => busIds.includes(g.bus_id));
      loads = loads.filter((l) => busIds.includes(l.bus_id));
      switches = switches.filter((sw) => busIds.includes(sw.bus_id));
    }

    // 3. Status Filter
    if (filterStatus !== "all") {
      substations = substations.filter((s) => s.status === filterStatus);
      buses = buses.filter((b) => b.status === filterStatus);
      lines = lines.filter((l) => l.status === filterStatus);
      transformers = transformers.filter((x) => x.status === filterStatus);
      generators = generators.filter((g) => g.status === filterStatus);
      loads = loads.filter((l) => l.status === filterStatus);
      switches = switches.filter((sw) => sw.status === filterStatus);
    }

    return {
      substations,
      buses,
      transmission_lines: lines,
      transformers,
      generators,
      loads,
      switches,
    };
  }, [data, filterSubstation, filterVoltage, filterStatus]);

  // Build list of all assets for autocomplete search
  const allAssetsList = useMemo(() => {
    if (!data) return [];
    const list: Array<{ id: number; name: string; type: string; uuid: string }> = [];

    data.topology.substations.forEach((s: any) =>
      list.push({ id: s.id, name: s.name, type: "substation", uuid: s.uuid })
    );
    data.topology.buses.forEach((b: any) =>
      list.push({ id: b.id, name: b.name, type: "bus", uuid: b.uuid })
    );
    data.topology.transmission_lines.forEach((l: any) =>
      list.push({ id: l.id, name: l.name, type: "transmission_line", uuid: l.uuid })
    );
    data.topology.transformers.forEach((x: any) =>
      list.push({ id: x.id, name: x.name, type: "transformer", uuid: x.uuid })
    );
    data.topology.generators.forEach((g: any) =>
      list.push({ id: g.id, name: g.name, type: "generator", uuid: g.uuid })
    );
    data.topology.loads.forEach((l: any) =>
      list.push({ id: l.id, name: l.name, type: "load", uuid: l.uuid })
    );
    data.topology.switches.forEach((s: any) =>
      list.push({ id: s.id, name: s.name, type: "switch", uuid: s.uuid })
    );

    return list;
  }, [data]);

  // Get active selected asset object combined with live measurements
  const activeAssetDetails = useMemo(() => {
    if (!selectedAsset || !data) return null;
    const { id, type } = selectedAsset;

    let baseDetails: any;
    switch (type) {
      case "substation":
        baseDetails = data.topology.substations.find((s: any) => s.id === id);
        break;
      case "bus":
        baseDetails = data.topology.buses.find((b: any) => b.id === id);
        break;
      case "generator":
        baseDetails = data.topology.generators.find((g: any) => g.id === id);
        break;
      case "load":
        baseDetails = data.topology.loads.find((l: any) => l.id === id);
        break;
      case "switch":
        baseDetails = data.topology.switches.find((s: any) => s.id === id);
        break;
      case "transmission_line":
        baseDetails = data.topology.transmission_lines.find((l: any) => l.id === id);
        break;
      case "transformer":
        baseDetails = data.topology.transformers.find((x: any) => x.id === id);
        break;
      default:
        return null;
    }

    if (!baseDetails) return null;

    // Merge live telemetry values
    const live = liveMeasurements[`${type}-${id}`] || {};
    return {
      ...baseDetails,
      ...live,
    };
  }, [selectedAsset, data, liveMeasurements]);

  // Compute relationship mappings for side panel display
  const activeRelations = useMemo(() => {
    if (!selectedAsset || !data || !activeAssetDetails) {
      return {};
    }

    const { id, type } = selectedAsset;
    let parentSubstation: string | undefined;
    let connectedBuses: string[] = [];
    let generators: string[] = [];
    let loads: string[] = [];
    let switches: string[] = [];
    let lines: string[] = [];

    if (type === "substation") {
      const subBuses = data.topology.buses.filter((b: any) => b.substation_id === id);
      connectedBuses = subBuses.map((b: any) => b.name);

      const busIds = subBuses.map((b: any) => b.id);
      generators = data.topology.generators
        .filter((g: any) => busIds.includes(g.bus_id))
        .map((g: any) => g.name);
      loads = data.topology.loads
        .filter((l: any) => busIds.includes(l.bus_id))
        .map((l: any) => l.name);
    } else if (type === "bus") {
      const sub = data.topology.substations.find(
        (s: any) => s.id === activeAssetDetails.substation_id
      );
      parentSubstation = sub?.name;

      generators = data.topology.generators
        .filter((g: any) => g.bus_id === id)
        .map((g: any) => g.name);
      loads = data.topology.loads.filter((l: any) => l.bus_id === id).map((l: any) => l.name);
      switches = data.topology.switches.filter((s: any) => s.bus_id === id).map((s: any) => s.name);
      lines = data.topology.transmission_lines
        .filter((l: any) => l.from_bus_id === id || l.to_bus_id === id)
        .map((l: any) => l.name);
    } else if (type === "generator") {
      const bus = data.topology.buses.find((b: any) => b.id === activeAssetDetails.bus_id);
      connectedBuses = bus ? [bus.name] : [];
      const sub = data.topology.substations.find((s: any) => s.id === bus?.substation_id);
      parentSubstation = sub?.name;
    } else if (type === "load") {
      const bus = data.topology.buses.find((b: any) => b.id === activeAssetDetails.bus_id);
      connectedBuses = bus ? [bus.name] : [];
      const sub = data.topology.substations.find((s: any) => s.id === bus?.substation_id);
      parentSubstation = sub?.name;
    } else if (type === "switch") {
      const bus = data.topology.buses.find((b: any) => b.id === activeAssetDetails.bus_id);
      connectedBuses = bus ? [bus.name] : [];
      const line = data.topology.transmission_lines.find(
        (l: any) => l.id === activeAssetDetails.line_id
      );
      lines = line ? [line.name] : [];
    } else if (type === "transmission_line") {
      const fromBus = data.topology.buses.find((b: any) => b.id === activeAssetDetails.from_bus_id);
      const toBus = data.topology.buses.find((b: any) => b.id === activeAssetDetails.to_bus_id);
      connectedBuses = [fromBus?.name, toBus?.name].filter(Boolean) as string[];
    } else if (type === "transformer") {
      const fromBus = data.topology.buses.find((b: any) => b.id === activeAssetDetails.from_bus_id);
      const toBus = data.topology.buses.find((b: any) => b.id === activeAssetDetails.to_bus_id);
      connectedBuses = [fromBus?.name, toBus?.name].filter(Boolean) as string[];
    }

    return {
      parentSubstation,
      connectedBuses,
      generators,
      loads,
      switches,
      lines,
    };
  }, [selectedAsset, data, activeAssetDetails]);

  // Center on selected asset searched via Autocomplete
  const handleSelectAsset = (asset: { id: number; type: string } | null) => {
    setSelectedAsset(asset);
    if (!asset || !data) return;

    // Determine target coordinate mapping to pan
    let targetX = 600;
    let targetY = 450;

    if (layoutMode === "geo") {
      if (asset.type === "substation") {
        const sub = data.topology.substations.find((s: any) => s.id === asset.id);
        if (sub) {
          targetX = 400;
          targetY = 300;
        }
      }
    } else {
      if (asset.type === "substation") {
        const index = data.topology.substations.findIndex((s: any) => s.id === asset.id);
        const angle = (index / data.topology.substations.length) * 2 * Math.PI;
        targetX = 600 + 300 * Math.cos(angle);
        targetY = 450 + 300 * Math.sin(angle);
      } else if (asset.type === "bus") {
        const bus = data.topology.buses.find((b: any) => b.id === asset.id);
        const index = data.topology.substations.findIndex((s: any) => s.id === bus?.substation_id);
        const angle = (index / data.topology.substations.length) * 2 * Math.PI;
        targetX = 600 + 300 * Math.cos(angle);
        targetY = 450 + 300 * Math.sin(angle);
      }
    }

    const newPanX = viewportSize.width / 2 - targetX * scale;
    const newPanY = viewportSize.height / 2 - targetY * scale;

    setPanX(newPanX);
    setPanY(newPanY);
  };

  // Zoom handlers
  const handleZoomIn = () => setScale((s) => Math.min(4.0, s * 1.2));
  const handleZoomOut = () => setScale((s) => Math.max(0.15, s / 1.2));
  const handleFitToScreen = () => {
    setPanX(viewportSize.width / 2 - 600 * 0.75);
    setPanY(viewportSize.height / 2 - 400 * 0.75);
    setScale(0.75);
  };
  const handleReset = () => {
    setPanX(0);
    setPanY(0);
    setScale(0.85);
    setSelectedAsset(null);
  };

  // Minimap flat edge builder
  const minimapEdges = useMemo(() => {
    if (!data) return [];
    const edges: any[] = [];

    const getCoords = (busId: number) => {
      const centerX = 600;
      const centerY = 450;
      const radius = 300;
      const bus = data.topology.buses.find((b: any) => b.id === busId);
      if (!bus) return { x: 0, y: 0 };
      const subIdx = data.topology.substations.findIndex((s: any) => s.id === bus.substation_id);
      const angle = (subIdx / data.topology.substations.length) * 2 * Math.PI;
      return {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle) + (busId % 2 === 0 ? 30 : -30),
      };
    };

    data.topology.transmission_lines.forEach((l: any) => {
      const from = getCoords(l.from_bus_id);
      const to = getCoords(l.to_bus_id);
      edges.push({ id: l.id, fromX: from.x, fromY: from.y, toX: to.x, toY: to.y, type: "line" });
    });

    data.topology.transformers.forEach((x: any) => {
      const from = getCoords(x.from_bus_id);
      const to = getCoords(x.to_bus_id);
      edges.push({
        id: x.id,
        fromX: from.x,
        fromY: from.y,
        toX: to.x,
        toY: to.y,
        type: "transformer",
      });
    });

    return edges;
  }, [data]);

  // Minimap flat node builder
  const minimapNodes = useMemo(() => {
    if (!data) return [];
    const nodes: any[] = [];

    data.topology.substations.forEach((s: any, idx: number) => {
      const angle = (idx / data.topology.substations.length) * 2 * Math.PI;
      nodes.push({
        id: s.id,
        x: 600 + 300 * Math.cos(angle),
        y: 450 + 300 * Math.sin(angle),
        type: "substation",
      });
    });

    data.topology.buses.forEach((b: any) => {
      const subIdx = data.topology.substations.findIndex((s: any) => s.id === b.substation_id);
      const angle = (subIdx / data.topology.substations.length) * 2 * Math.PI;
      nodes.push({
        id: b.id,
        x: 600 + 300 * Math.cos(angle),
        y: 450 + 300 * Math.sin(angle) + (b.id % 2 === 0 ? 30 : -30),
        type: "bus",
      });
    });

    return nodes;
  }, [data]);

  const hasGridData = data?.topology?.substations?.length > 0;

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] select-text">
      {/* Welcome Header */}
      <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 dark:border-[#1E293B] pb-4 mb-4 gap-3 flex-shrink-0">
        <div>
          <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1.5">
            Operational Telemetry
          </p>
          <h1 className="text-xl sm:text-2xl font-heading font-bold tracking-tight text-slate-900 dark:text-[#F8FAFC]">
            Interactive Grid Visualization
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

          {/* Filters Toggle Button */}
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
            onClick={triggerManualRefresh}
            disabled={loading}
            className="p-1.5 rounded-[3px] border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#151A21]/50 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </section>

      {/* Dynamic Filters Bar */}
      {showFilters && hasGridData && (
        <div className="bg-slate-50/50 dark:bg-[#151A21]/40 border border-slate-200 dark:border-[#1E293B] rounded-[3px] p-3 mb-4 flex flex-wrap gap-4 text-xs font-mono">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-slate-400 uppercase font-semibold">Substation</span>
            <select
              value={filterSubstation}
              onChange={(e) => setFilterSubstation(e.target.value)}
              className="bg-white dark:bg-[#1C222B] border border-slate-200 dark:border-[#2A313C] rounded-[2px] px-2 py-1 text-slate-800 dark:text-[#F8FAFC] focus:outline-none"
            >
              <option value="all">All Substations</option>
              {data.topology.substations.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-slate-400 uppercase font-semibold">Voltage Level</span>
            <select
              value={filterVoltage}
              onChange={(e) => setFilterVoltage(e.target.value)}
              className="bg-white dark:bg-[#1C222B] border border-slate-200 dark:border-[#2A313C] rounded-[2px] px-2 py-1 text-slate-800 dark:text-[#F8FAFC] focus:outline-none"
            >
              <option value="all">All Voltages</option>
              <option value="138">138 kV</option>
              <option value="69">69 kV</option>
              <option value="13.8">13.8 kV</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-slate-400 uppercase font-semibold">Status</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-white dark:bg-[#1C222B] border border-slate-200 dark:border-[#2A313C] rounded-[2px] px-2 py-1 text-slate-800 dark:text-[#F8FAFC] focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="maintenance">Maintenance</option>
              <option value="tripped">Tripped</option>
            </select>
          </div>
        </div>
      )}

      {/* Main Canvas + Timeline Workspace */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 gap-4">
        {/* Left column: Canvas Visualizer + Event Timeline below */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 min-h-0 relative">
            {loading && !data && (
              <div className="flex-1 h-full flex flex-col items-center justify-center border border-slate-200 dark:border-[#1E293B] rounded-[3px] bg-white dark:bg-[#151A21]/30">
                <RefreshCw className="w-8 h-8 text-orange-500 animate-spin mb-4" />
                <p className="text-xs font-mono text-slate-400 dark:text-slate-500">
                  Initializing live topology streams...
                </p>
              </div>
            )}

            {error && !loading && (
              <div className="flex-1 h-full flex flex-col items-center justify-center p-8 border border-dashed border-red-500/30 bg-red-500/5 rounded-[3px]">
                <AlertTriangle className="w-10 h-10 text-red-500 mb-3" />
                <h3 className="text-sm font-mono font-bold text-red-500 uppercase">
                  GRID VISUALIZER OFFLINE
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm text-center leading-relaxed mt-2">
                  Failed to sync live operational telemetry bounds.
                </p>
              </div>
            )}

            {data && !loading && !error && (
              <>
                {!hasGridData ? (
                  <div className="h-full flex">
                    <EmptyState
                      onImport={() => alert("Ready to load configuration XML/JSON grid files.")}
                      onCreateSample={() => alert("Initialize sample from Assets Console")}
                      onAddFirstAsset={() => alert("Create substation inside Assets panel.")}
                      loading={loading}
                    />
                  </div>
                ) : (
                  <div className="w-full h-full relative">
                    {/* Floating Toolbar Controls */}
                    <TopologyToolbar
                      onZoomIn={handleZoomIn}
                      onZoomOut={handleZoomOut}
                      onFitToScreen={handleFitToScreen}
                      onReset={handleReset}
                      layoutMode={layoutMode}
                      onChangeLayoutMode={setLayoutMode}
                      snapToGrid={snapToGrid}
                      onToggleSnapToGrid={() => setSnapToGrid(!snapToGrid)}
                      allAssets={allAssetsList}
                      onSelectAsset={handleSelectAsset}
                    />

                    {/* Rendering SVG Graph Canvas */}
                    <GridTopologyViewer
                      topology={filteredTopology || data.topology}
                      layoutMode={layoutMode}
                      snapToGrid={snapToGrid}
                      selectedAsset={selectedAsset}
                      onSelectAsset={setSelectedAsset}
                      panX={panX}
                      y={panY}
                      panY={panY}
                      scale={scale}
                      onViewportChange={(x, y, s) => {
                        setPanX(x);
                        setPanY(y);
                        setScale(s);
                      }}
                      highlightCategory={highlightCategory}
                      highlightVoltage={highlightVoltage}
                    />

                    {/* Minimap Widget */}
                    <Minimap
                      nodes={minimapNodes}
                      edges={minimapEdges}
                      panX={panX}
                      panY={panY}
                      scale={scale}
                      canvasWidth={2000}
                      canvasHeight={1500}
                      viewportWidth={viewportSize.width}
                      viewportHeight={viewportSize.height}
                      onPanTo={(x, y) => {
                        setPanX(x);
                        setPanY(y);
                      }}
                    />

                    {/* Interactive Legend Box */}
                    <InteractiveLegend
                      onHighlightCategory={setHighlightCategory}
                      onHighlightVoltage={setHighlightVoltage}
                      activeCategory={highlightCategory}
                      activeVoltage={highlightVoltage}
                    />
                  </div>
                )}
              </>
            )}
          </div>

          {/* Chronological Event Timeline widget (rendered below visualizer) */}
          {hasGridData && (
            <div className="h-44 border border-slate-200 dark:border-[#2A313C] rounded-[3px] bg-slate-950/40 p-3 mt-4 flex flex-col min-h-[120px] select-text">
              <div className="flex items-center justify-between border-b border-[#2A313C] pb-1.5 mb-2 font-mono text-[9.5px]">
                <span className="font-bold text-[#F8FAFC] tracking-wider uppercase flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-[#FF7A1A]" />
                  CHRONOLOGICAL OPERATION EVENT TIMELINE
                </span>
                <span className="text-slate-500">LIVE ANOMALY SCANS</span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-1.5 font-mono text-[10px] text-[#94A3B8]">
                {eventTimeline.length === 0 ? (
                  <div className="text-slate-600 text-center py-6">
                    Waiting for grid operational telemetry events...
                  </div>
                ) : (
                  eventTimeline.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-4 hover:bg-slate-900/50 p-0.5 rounded-[2px] transition-colors leading-normal"
                    >
                      <span className="text-slate-650 flex-shrink-0">
                        [{new Date(item.timestamp).toLocaleTimeString()}]
                      </span>
                      <span
                        className={`font-semibold flex-shrink-0 uppercase w-24 truncate ${
                          item.eventType === "overload"
                            ? "text-red-500"
                            : item.eventType === "state_change"
                              ? "text-amber-500"
                              : "text-blue-500"
                        }`}
                      >
                        {item.eventType}
                      </span>
                      <span className="font-bold text-slate-300 w-36 truncate">
                        {item.assetName}
                      </span>
                      <span className="text-slate-400 flex-1">{item.message}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right column: Side inspector panel */}
        {selectedAsset && activeAssetDetails && (
          <div className="h-full flex-shrink-0 animate-in slide-in-from-right duration-150">
            <AssetDetailPanel
              asset={activeAssetDetails}
              type={selectedAsset.type}
              onClose={() => setSelectedAsset(null)}
              relationships={activeRelations}
              onUpdate={async () => {}}
              substations={data?.topology?.substations || []}
              buses={data?.topology?.buses || []}
              lines={data?.topology?.transmission_lines || []}
            />
          </div>
        )}
      </div>
    </div>
  );
}
export default GridOverview;
