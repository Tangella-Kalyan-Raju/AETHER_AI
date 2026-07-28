import { useState, useEffect, useMemo } from "react";
import { useTelemetry } from "@/hooks/useTelemetry";
import { useTheme } from "@/context/ThemeContext";
import GridTopologyViewer from "@/topology/GridTopologyViewer";
import TopologyToolbar from "@/topology/TopologyToolbar";
import Minimap from "@/topology/Minimap";
import api from "@/api/axios";
import { Sparkles, RefreshCw, AlertTriangle, Info } from "lucide-react";

export default function InteractiveMap() {
  const { theme } = useTheme();

  // Consume live state from TelemetryContext
  const { topology: data, liveMeasurements, loading, error } = useTelemetry();

  // Map settings and state
  const [layoutMode, setLayoutMode] = useState<"geo" | "schematic">("schematic");
  const [snapToGrid, setSnapToGrid] = useState<boolean>(false);
  const [selectedAsset, setSelectedAsset] = useState<{ id: number; type: string } | null>(null);
  const [panX, setPanX] = useState(35);
  const [panY, setPanY] = useState(20);
  const [scale, setScale] = useState(0.65);

  // Zoom / Viewport controls
  const handleZoomIn = () => setScale((s) => Math.min(s + 0.1, 2.0));
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.1, 0.3));
  const handleFitToScreen = () => {
    setPanX(50);
    setPanY(50);
    setScale(0.7);
  };
  const handleReset = () => {
    setPanX(35);
    setPanY(20);
    setScale(0.65);
  };

  // AI Summary state
  const [aiSummary, setAiSummary] = useState<string>("");
  const [loadingSummary, setLoadingSummary] = useState<boolean>(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const fetchSummary = async () => {
    setLoadingSummary(true);
    setSummaryError(null);
    try {
      const response = await api.get("/api/v1/ai/summarize-grid");
      setAiSummary(response.data.summary);
    } catch (err: any) {
      console.error("Error fetching grid summary:", err);
      setSummaryError("Failed to fetch topology summary from Groq AI.");
    } finally {
      setLoadingSummary(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  // Compute assets list for the toolbar search dropdown
  const allAssetsList = useMemo(() => {
    if (!data?.topology) return [];
    const list: any[] = [];
    data.topology.substations?.forEach((s: any) =>
      list.push({ ...s, type: "substation", label: `Substation: ${s.name}`, name: s.name })
    );
    data.topology.buses?.forEach((b: any) =>
      list.push({ ...b, type: "bus", label: `Bus: ${b.name}`, name: b.name })
    );
    data.topology.generators?.forEach((g: any) =>
      list.push({ ...g, type: "generator", label: `Gen: ${g.name}`, name: g.name })
    );
    return list;
  }, [data]);

  const handleSelectAsset = (asset: any) => {
    if (asset) {
      setSelectedAsset({ id: asset.id, type: asset.type });
    } else {
      setSelectedAsset(null);
    }
  };

  // Compute elements for minimap
  const minimapNodes = useMemo(() => {
    if (!data?.topology?.substations) return [];
    return data.topology.substations.map((s: any, idx: number) => ({
      id: s.id,
      x: 100 + (idx % 3) * 80,
      y: 100 + Math.floor(idx / 3) * 80,
      label: s.name,
    }));
  }, [data]);

  const minimapEdges = useMemo(() => {
    if (!data?.topology?.transmission_lines) return [];
    return data.topology.transmission_lines.map((l: any) => ({
      from: l.from_bus_id,
      to: l.to_bus_id,
    }));
  }, [data]);

  return (
    <div className="flex-1 flex flex-col xl:flex-row h-full min-h-0 overflow-hidden bg-[#07090C] text-[#F8FAFC]">
      {/* Map Canvas Side */}
      <div className="flex-1 flex flex-col min-h-0 relative border-r border-slate-800">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-[#0B0E14] flex items-center justify-between">
          <div>
            <h1 className="text-xl font-heading font-bold uppercase tracking-wider text-slate-200">
              Interactive Grid Topology Map
            </h1>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Live Schematic and Geographic Dispatch Controls
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono flex items-center gap-1.5 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-505" />
              LIVE TELEMETRY STREAM
            </span>
          </div>
        </div>

        {/* Canvas area */}
        <div className="flex-1 relative min-h-0 bg-[#07090C] overflow-hidden">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40">
              <div className="flex flex-col items-center gap-3">
                <RefreshCw className="w-8 h-8 text-orange-500 animate-spin" />
                <span className="text-xs font-mono text-slate-400">Syncing Grid Nodes...</span>
              </div>
            </div>
          ) : error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-red-950/10 border border-red-500/20 text-center">
              <AlertTriangle className="w-10 h-10 text-red-500 mb-3" />
              <h3 className="text-sm font-bold text-red-500 uppercase">GRID VISUALIZER OFFLINE</h3>
              <p className="text-xs text-slate-400 mt-1">
                Failed to sync live operational telemetry bounds.
              </p>
            </div>
          ) : data ? (
            <>
              {/* Toolbar */}
              <div className="absolute top-4 left-4 z-10">
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
              </div>

              {/* SVG Topology Canvas */}
              <div className="w-full h-full">
                <GridTopologyViewer
                  topology={data.topology}
                  layoutMode={layoutMode}
                  snapToGrid={snapToGrid}
                  selectedAsset={selectedAsset}
                  onSelectAsset={setSelectedAsset}
                  panX={panX}
                  panY={panY}
                  scale={scale}
                  onViewportChange={(x, y, s) => {
                    setPanX(x);
                    setPanY(y);
                    setScale(s);
                  }}
                  highlightCategory={null}
                  highlightVoltage={null}
                />
              </div>

              {/* Minimap Widget */}
              <div className="absolute bottom-4 right-4 z-10 bg-[#0B0E14]/90 border border-slate-800 rounded-lg p-2 shadow-lg hidden md:block">
                <Minimap
                  nodes={minimapNodes}
                  edges={minimapEdges}
                  panX={panX}
                  panY={panY}
                  scale={scale}
                />
              </div>
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs text-slate-500 font-mono">No topology loaded.</span>
            </div>
          )}
        </div>
      </div>

      {/* Groq AI Summary Sidebar Panel */}
      <div className="w-full xl:w-96 bg-[#0B0E14] flex flex-col h-1/3 xl:h-full min-h-0 border-l border-slate-800">
        <div className="p-4 border-b border-slate-800 bg-[#0F131A] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <h3 className="font-heading font-bold text-xs uppercase tracking-wider text-purple-300">
              Groq AI Grid Summary
            </h3>
          </div>
          <button
            onClick={fetchSummary}
            disabled={loadingSummary}
            className="p-1.5 rounded border border-slate-800 hover:border-slate-700 bg-[#161C24]/50 hover:bg-[#1E2530] text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-50"
            title="Refresh AI Analysis"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingSummary ? "animate-spin" : ""}`} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loadingSummary ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <RefreshCw className="w-6 h-6 text-purple-500 animate-spin" />
              <span className="text-xs font-mono text-slate-400">
                Synthesizing network topology...
              </span>
            </div>
          ) : summaryError ? (
            <div className="p-3.5 bg-red-950/20 border border-red-900/30 rounded text-red-400 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Summary Analysis Failed</p>
                <p className="text-slate-400 mt-1">{summaryError}</p>
              </div>
            </div>
          ) : aiSummary ? (
            <div className="prose prose-invert prose-xs max-w-none text-slate-350 text-xs font-mono leading-relaxed space-y-4 select-text">
              {aiSummary.split("\n").map((line, idx) => {
                if (line.startsWith("#")) {
                  const level = line.match(/^#+/)?.[0].length || 1;
                  const text = line.replace(/^#+\s*/, "");
                  const classes =
                    level === 1
                      ? "text-xs font-bold text-slate-100 uppercase border-b border-slate-800 pb-1 mt-4"
                      : "text-[11px] font-bold text-slate-200 mt-3";
                  return (
                    <div key={idx} className={classes}>
                      {text}
                    </div>
                  );
                }
                if (line.trim().startsWith("-") || line.trim().startsWith("*")) {
                  return (
                    <div key={idx} className="flex items-start gap-2 pl-2">
                      <span className="text-purple-400 mt-1">•</span>
                      <span>{line.replace(/^[-*]\s*/, "")}</span>
                    </div>
                  );
                }
                return (
                  <p key={idx} className="my-1.5">
                    {line}
                  </p>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Info className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <span className="text-xs text-slate-500 font-mono">No summary generated.</span>
            </div>
          )}
        </div>

        {/* Bottom Metadata Block */}
        <div className="p-3 border-t border-slate-800/80 bg-[#07090C] text-[10px] font-mono text-slate-500 space-y-1">
          <div>
            Provider: <span className="text-slate-400">Groq Cloud</span>
          </div>
          <div>
            Model: <span className="text-slate-400">llama3-8b-8192</span>
          </div>
          <div>
            Engine Context: <span className="text-emerald-500">Substations & Telemetry</span>
          </div>
        </div>
      </div>
    </div>
  );
}
