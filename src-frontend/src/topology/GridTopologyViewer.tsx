import React, { useState, useRef, useEffect } from "react";
import {
  Server,
  GitBranch,
  Power,
  Zap,
  Cpu,
  Cable,
  Activity,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { useTelemetry } from "@/hooks/useTelemetry";

const formatDisplayName = (name: string) => {
  if (!name) return "";
  // Shorten UUID/Hex suffix (e.g. -C42F54E2) to just the first 4 characters (-C42F) to save layout space
  return name.replace(/-([A-Fa-f0-9]{4})[A-Fa-f0-9]{4}$/, "-$1");
};

interface GridTopologyViewerProps {
  topology: {
    substations: any[];
    buses: any[];
    transmission_lines: any[];
    transformers: any[];
    generators: any[];
    loads: any[];
    switches: any[];
  };
  layoutMode: "geo" | "schematic";
  snapToGrid: boolean;
  selectedAsset: { id: number; type: string } | null;
  onSelectAsset: (asset: { id: number; type: string } | null) => void;
  panX: number;
  panY: number;
  scale: number;
  onViewportChange: (panX: number, panY: number, scale: number) => void;
  highlightCategory: string | null;
  highlightVoltage: number | null;
}

export function GridTopologyViewer({
  topology,
  layoutMode,
  snapToGrid,
  selectedAsset,
  onSelectAsset,
  panX,
  panY,
  scale,
  onViewportChange,
  highlightCategory,
  highlightVoltage,
}: GridTopologyViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { liveMeasurements } = useTelemetry();
  const [hoveredAsset, setHoveredAsset] = useState<any>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [draggedNode, setDraggedNode] = useState<{ id: number; type: string } | null>(null);
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>({});
  const isPanning = useRef(false);
  const startPanOffset = useRef({ x: 0, y: 0 });

  const canvasWidth = 2000;
  const canvasHeight = 1500;

  // Initialize node positions dynamically
  useEffect(() => {
    const newPositions: Record<string, { x: number; y: number }> = {};

    if (layoutMode === "geo") {
      const lats = topology.substations.map((s) => s.latitude || 37.77);
      const lons = topology.substations.map((s) => s.longitude || -122.42);

      const minLat = Math.min(...lats, 37.0);
      const maxLat = Math.max(...lats, 38.0);
      const minLon = Math.min(...lons, -123.0);
      const maxLon = Math.max(...lons, -121.0);

      const latRange = maxLat - minLat || 1;
      const lonRange = maxLon - minLon || 1;

      topology.substations.forEach((sub) => {
        const x = 200 + ((sub.longitude - minLon) / lonRange) * 800;
        const y = 800 - ((sub.latitude - minLat) / latRange) * 600;
        newPositions[`substation-${sub.id}`] = { x, y };

        const subBuses = topology.buses.filter((b) => b.substation_id === sub.id);
        subBuses.forEach((bus, index) => {
          newPositions[`bus-${bus.id}`] = { x, y: y - 40 + index * 40 };
        });
      });
    } else {
      const centerX = 1000;
      const centerY = 750;
      const radius = 650;
      const N = topology.substations.length || 1;

      topology.substations.forEach((sub, i) => {
        const angle = (i / N) * 2 * Math.PI;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        newPositions[`substation-${sub.id}`] = { x, y };

        const subBuses = topology.buses.filter((b) => b.substation_id === sub.id);
        const M = subBuses.length || 1;
        subBuses.forEach((bus, j) => {
          newPositions[`bus-${bus.id}`] = { x, y: y - ((M - 1) * 65) / 2 + j * 65 };
        });
      });
    }

    setNodePositions(newPositions);
  }, [topology, layoutMode]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (
      (e.target instanceof SVGElement && e.target.tagName === "svg") ||
      e.target instanceof SVGGElement
    ) {
      isPanning.current = true;
      startPanOffset.current = { x: e.clientX - panX, y: e.clientY - panY };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;
      setHoverPosition({ x: clientX + 15, y: clientY + 15 });
    }

    if (isPanning.current) {
      const newPanX = e.clientX - startPanOffset.current.x;
      const newPanY = e.clientY - startPanOffset.current.y;
      onViewportChange(newPanX, newPanY, scale);
    } else if (draggedNode) {
      const currentPos = nodePositions[`${draggedNode.type}-${draggedNode.id}`];
      if (!currentPos || !rect) return;

      const dx = e.movementX / scale;
      const dy = e.movementY / scale;

      let newX = currentPos.x + dx;
      let newY = currentPos.y + dy;

      if (snapToGrid) {
        newX = Math.round(newX / 20) * 20;
        newY = Math.round(newY / 20) * 20;
      }

      setNodePositions((prev) => ({
        ...prev,
        [`${draggedNode.type}-${draggedNode.id}`]: { x: newX, y: newY },
      }));

      if (draggedNode.type === "substation") {
        const subBuses = topology.buses.filter((b) => b.substation_id === draggedNode.id);
        setNodePositions((prev) => {
          const updated = { ...prev };
          subBuses.forEach((b) => {
            const bPos = prev[`bus-${b.id}`];
            if (bPos) {
              updated[`bus-${b.id}`] = { x: bPos.x + dx, y: bPos.y + dy };
            }
          });
          return updated;
        });
      }
    }
  };

  const handleMouseUp = () => {
    isPanning.current = false;
    setDraggedNode(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = 1.15;
    const newScale = e.deltaY < 0 ? scale * zoomFactor : scale / zoomFactor;
    const clampedScale = Math.max(0.15, Math.min(4.0, newScale));

    const canvasMouseX = (mouseX - panX) / scale;
    const canvasMouseY = (mouseY - panY) / scale;
    const newPanX = mouseX - canvasMouseX * clampedScale;
    const newPanY = mouseY - canvasMouseY * clampedScale;

    onViewportChange(newPanX, newPanY, clampedScale);
  };

  const isRelated = (assetId: number, assetType: string): boolean => {
    if (!selectedAsset) return false;
    const selId = selectedAsset.id;
    const selType = selectedAsset.type;

    if (selType === assetType && selId === assetId) return true;

    if (selType === "substation") {
      if (assetType === "bus") {
        const bus = topology.buses.find((b) => b.id === assetId);
        return bus?.substation_id === selId;
      }
      if (assetType === "generator") {
        const gen = topology.generators.find((g) => g.id === assetId);
        const bus = topology.buses.find((b) => b.id === gen?.bus_id);
        return bus?.substation_id === selId;
      }
      if (assetType === "load") {
        const load = topology.loads.find((l) => l.id === assetId);
        const bus = topology.buses.find((b) => b.id === load?.bus_id);
        return bus?.substation_id === selId;
      }
    }

    if (selType === "bus") {
      if (assetType === "substation") {
        const bus = topology.buses.find((b) => b.id === selId);
        return bus?.substation_id === assetId;
      }
      if (assetType === "generator") {
        const gen = topology.generators.find((g) => g.id === assetId);
        return gen?.bus_id === selId;
      }
      if (assetType === "load") {
        const load = topology.loads.find((l) => l.id === assetId);
        return load?.bus_id === selId;
      }
      if (assetType === "transmission_line") {
        const line = topology.transmission_lines.find((l) => l.id === assetId);
        return line?.from_bus_id === selId || line?.to_bus_id === selId;
      }
      if (assetType === "transformer") {
        const xfmr = topology.transformers.find((x) => x.id === assetId);
        return xfmr?.from_bus_id === selId || xfmr?.to_bus_id === selId;
      }
    }

    if (selType === "transmission_line") {
      const line = topology.transmission_lines.find((l) => l.id === selId);
      if (assetType === "bus") {
        return assetId === line?.from_bus_id || assetId === line?.to_bus_id;
      }
    }

    return false;
  };

  const getOpacity = (assetId: number, assetType: string): string => {
    if (highlightCategory && highlightCategory !== assetType) {
      return "opacity-20";
    }

    if (highlightVoltage) {
      if (assetType === "bus") {
        const bus = topology.buses.find((b) => b.id === assetId);
        if (bus?.base_kv !== highlightVoltage) return "opacity-20";
      } else {
        return "opacity-20";
      }
    }

    if (!selectedAsset) return "opacity-100";
    return isRelated(assetId, assetType) ? "opacity-100" : "opacity-30";
  };

  // Helper to color lines based on live telemetry utilization
  const getLineColor = (lineId: number, isSelected: boolean) => {
    if (isSelected) return "#FF7A1A";
    const live = liveMeasurements[`transmission_line-${lineId}`];
    if (!live || live.status === "tripped") return "#3A4556"; // Gray for de-energized/tripped

    const u = live.utilization;
    if (u > 95) return "#EF4444"; // Red for overloaded lines
    if (u > 75) return "#F59E0B"; // Yellow/Orange for heavily loaded lines
    return "#22C55E"; // Green for normal operating conditions
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      className="w-full h-full relative overflow-hidden select-none bg-[#0B0E13] border border-[#2A313C] rounded-[3px]"
    >
      <svg
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseLeave={handleMouseUp}
      >
        <defs>
          <pattern
            id="grid-pattern"
            width={40 * scale}
            height={40 * scale}
            patternUnits="userSpaceOnUse"
          >
            <circle cx={1 * scale} cy={1 * scale} r={1 * scale} fill="#2A313C" opacity="0.6" />
          </pattern>
        </defs>

        <rect
          width="100%"
          height="100%"
          fill="url(#grid-pattern)"
          x={panX % (40 * scale)}
          y={panY % (40 * scale)}
        />

        {/* Panning Container */}
        <g transform={`translate(${panX}, ${panY}) scale(${scale})`}>
          {/* 1. Substations */}
          {topology.substations.map((sub) => {
            const pos = nodePositions[`substation-${sub.id}`];
            if (!pos) return null;

            const isSelected = selectedAsset?.type === "substation" && selectedAsset.id === sub.id;
            const opacity = getOpacity(sub.id, "substation");

            return (
              <g key={`sub-${sub.id}`} className={`transition-all ${opacity}`}>
                <rect
                  x={pos.x - 95}
                  y={pos.y - 90}
                  width={190}
                  height={180}
                  fill="none"
                  stroke={isSelected ? "#FF7A1A" : "#334155"}
                  strokeDasharray="4,4"
                  strokeWidth={isSelected ? 2 : 1}
                  className="cursor-move hover:stroke-cyan-500 transition-colors"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setDraggedNode({ id: sub.id, type: "substation" });
                    onSelectAsset({ id: sub.id, type: "substation" });
                  }}
                  onMouseEnter={() =>
                    setHoveredAsset({ name: sub.name, type: "substation", data: sub })
                  }
                  onMouseLeave={() => setHoveredAsset(null)}
                />
                <text
                  x={pos.x}
                  y={pos.y - 96}
                  fill="#64748B"
                  fontSize="9.5"
                  fontFamily="monospace"
                  textAnchor="middle"
                  fontWeight="bold"
                >
                  {formatDisplayName(sub.name).toUpperCase()}
                </text>
              </g>
            );
          })}

          {/* 2. Transmission Lines */}
          {topology.transmission_lines.map((line) => {
            const fromPos = nodePositions[`bus-${line.from_bus_id}`];
            const toPos = nodePositions[`bus-${line.to_bus_id}`];
            if (!fromPos || !toPos) return null;

            const isSelected =
              selectedAsset?.type === "transmission_line" && selectedAsset.id === line.id;
            const opacity = getOpacity(line.id, "transmission_line");
            const color = getLineColor(line.id, isSelected);
            const live = liveMeasurements[`transmission_line-${line.id}`] || {};
            const isTripped = live.status === "tripped";

            return (
              <g key={`line-${line.id}`} className={`transition-all ${opacity}`}>
                <line
                  x1={fromPos.x}
                  y1={fromPos.y}
                  x2={toPos.x}
                  y2={toPos.y}
                  stroke={color}
                  strokeWidth={isSelected ? 4 : 2}
                  className="cursor-pointer hover:stroke-orange-500 transition-all"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectAsset({ id: line.id, type: "transmission_line" });
                  }}
                  onMouseEnter={() =>
                    setHoveredAsset({
                      name: line.name,
                      type: "transmission_line",
                      data: { ...line, ...live },
                    })
                  }
                  onMouseLeave={() => setHoveredAsset(null)}
                />

                {/* Blinking overload alarm indicator */}
                {!isTripped && live.utilization > 95 && (
                  <circle
                    cx={(fromPos.x + toPos.x) / 2}
                    cy={(fromPos.y + toPos.y) / 2}
                    r="6"
                    fill="red"
                    className="animate-ping pointer-events-none"
                  />
                )}

                {/* Flow direction indicator dot */}
                {!isTripped && (
                  <circle
                    cx={(fromPos.x + toPos.x) / 2}
                    cy={(fromPos.y + toPos.y) / 2}
                    r="3.5"
                    fill={color}
                    className="pointer-events-none"
                  />
                )}
              </g>
            );
          })}

          {/* 3. Transformers */}
          {topology.transformers.map((xfmr) => {
            const fromPos = nodePositions[`bus-${xfmr.from_bus_id}`];
            const toPos = nodePositions[`bus-${xfmr.to_bus_id}`];
            if (!fromPos || !toPos) return null;

            const isSelected =
              selectedAsset?.type === "transformer" && selectedAsset.id === xfmr.id;
            const opacity = getOpacity(xfmr.id, "transformer");
            const midX = (fromPos.x + toPos.x) / 2;
            const midY = (fromPos.y + toPos.y) / 2;
            const live = liveMeasurements[`transformer-${xfmr.id}`] || {};

            return (
              <g
                key={`xfmr-${xfmr.id}`}
                className={`cursor-pointer transition-all ${opacity}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectAsset({ id: xfmr.id, type: "transformer" });
                }}
                onMouseEnter={() =>
                  setHoveredAsset({
                    name: xfmr.name,
                    type: "transformer",
                    data: { ...xfmr, ...live },
                  })
                }
                onMouseLeave={() => setHoveredAsset(null)}
              >
                <line
                  x1={fromPos.x}
                  y1={fromPos.y}
                  x2={toPos.x}
                  y2={toPos.y}
                  stroke="#8B5CF6"
                  strokeWidth="1.2"
                  strokeDasharray="2,2"
                />
                <circle
                  cx={midX - 5}
                  cy={midY}
                  r="7"
                  fill="#0b0e13"
                  stroke="#8B5CF6"
                  strokeWidth="1.5"
                />
                <circle
                  cx={midX + 5}
                  cy={midY}
                  r="7"
                  fill="none"
                  stroke="#8B5CF6"
                  strokeWidth="1.5"
                />
              </g>
            );
          })}

          {/* 4. Buses */}
          {topology.buses.map((bus) => {
            const pos = nodePositions[`bus-${bus.id}`];
            if (!pos) return null;

            const isSelected = selectedAsset?.type === "bus" && selectedAsset.id === bus.id;
            const opacity = getOpacity(bus.id, "bus");
            const live = liveMeasurements[`bus-${bus.id}`] || {};

            return (
              <g key={`bus-${bus.id}`} className={`transition-all ${opacity}`}>
                <line
                  x1={pos.x - 45}
                  y1={pos.y}
                  x2={pos.x + 45}
                  y2={pos.y}
                  stroke={isSelected ? "#FF7A1A" : bus.base_kv >= 138 ? "#FBBF24" : "#F59E0B"}
                  strokeWidth="4"
                  strokeLinecap="round"
                  className="cursor-move hover:stroke-cyan-500 transition-colors"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setDraggedNode({ id: bus.id, type: "bus" });
                    onSelectAsset({ id: bus.id, type: "bus" });
                  }}
                  onMouseEnter={() =>
                    setHoveredAsset({
                      name: bus.name,
                      type: "bus",
                      data: { ...bus, ...live },
                    })
                  }
                  onMouseLeave={() => setHoveredAsset(null)}
                />
                <text
                  x={pos.x - 50}
                  y={pos.y + 3.5}
                  fill="#F8FAFC"
                  fontSize="8"
                  fontFamily="monospace"
                  textAnchor="end"
                  className="pointer-events-none select-none font-bold"
                >
                  {formatDisplayName(bus.name)}
                </text>
                <text
                  x={pos.x + 50}
                  y={pos.y + 3}
                  fill="#64748B"
                  fontSize="7"
                  fontFamily="monospace"
                  textAnchor="start"
                  className="pointer-events-none select-none"
                >
                  {bus.base_kv}kV
                </text>

                {/* Attached Generators */}
                {topology.generators
                  .filter((g) => g.bus_id === bus.id)
                  .map((gen, gIdx) => {
                    const genX = pos.x - 30 + gIdx * 30;
                    const genY = pos.y - 25;
                    const genOpacity = getOpacity(gen.id, "generator");
                    const genLive = liveMeasurements[`generator-${gen.id}`] || {};
                    const isOverloaded = genLive.utilization > 90;

                    return (
                      <g
                        key={`gen-${gen.id}`}
                        className={`cursor-pointer transition-all ${genOpacity}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectAsset({ id: gen.id, type: "generator" });
                        }}
                        onMouseEnter={() =>
                          setHoveredAsset({
                            name: gen.name,
                            type: "generator",
                            data: { ...gen, ...genLive },
                          })
                        }
                        onMouseLeave={() => setHoveredAsset(null)}
                      >
                        <line
                          x1={genX}
                          y1={pos.y}
                          x2={genX}
                          y2={genY}
                          stroke={isOverloaded ? "#EF4444" : "#10B981"}
                          strokeWidth="1.2"
                        />
                        <circle
                          cx={genX}
                          cy={genY}
                          r="7"
                          fill="#151A21"
                          stroke={isOverloaded ? "#EF4444" : "#10B981"}
                          strokeWidth="1.3"
                        />
                        <text
                          x={genX}
                          y={genY + 2.5}
                          fill={isOverloaded ? "#EF4444" : "#10B981"}
                          fontSize="8"
                          fontFamily="monospace"
                          textAnchor="middle"
                          fontWeight="bold"
                        >
                          G
                        </text>
                        {/* Blinking overload alarm indicator */}
                        {isOverloaded && (
                          <circle
                            cx={genX}
                            cy={genY}
                            r="11"
                            fill="none"
                            stroke="red"
                            strokeWidth="1"
                            className="animate-ping"
                          />
                        )}
                      </g>
                    );
                  })}

                {/* Attached Loads */}
                {topology.loads
                  .filter((l) => l.bus_id === bus.id)
                  .map((load, lIdx) => {
                    const loadX = pos.x - 20 + lIdx * 40;
                    const loadY = pos.y + 20;
                    const loadOpacity = getOpacity(load.id, "load");
                    const loadLive = liveMeasurements[`load-${load.id}`] || {};

                    return (
                      <g
                        key={`load-${load.id}`}
                        className={`cursor-pointer transition-all ${loadOpacity}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectAsset({ id: load.id, type: "load" });
                        }}
                        onMouseEnter={() =>
                          setHoveredAsset({
                            name: load.name,
                            type: "load",
                            data: { ...load, ...loadLive },
                          })
                        }
                        onMouseLeave={() => setHoveredAsset(null)}
                      >
                        <line
                          x1={loadX}
                          y1={pos.y}
                          x2={loadX}
                          y2={loadY}
                          stroke="#EF4444"
                          strokeWidth="1.2"
                        />
                        <path
                          d={`M${loadX - 3.5},${loadY - 1} L${loadX},${loadY + 4} L${loadX + 3.5},${loadY - 1} Z`}
                          fill="#EF4444"
                        />
                      </g>
                    );
                  })}

                {/* Attached Switches */}
                {topology.switches
                  .filter((sw) => sw.bus_id === bus.id)
                  .map((breaker, bIdx) => {
                    const swX = pos.x + 20 + bIdx * 20;
                    const swY = pos.y - 12;
                    const swLive = liveMeasurements[`switch-${breaker.id}`] || {};
                    const isClosed = swLive.state === "closed";
                    const swOpacity = getOpacity(breaker.id, "switch");

                    return (
                      <g
                        key={`sw-${breaker.id}`}
                        className={`cursor-pointer transition-all ${swOpacity}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectAsset({ id: breaker.id, type: "switch" });
                        }}
                        onMouseEnter={() =>
                          setHoveredAsset({
                            name: breaker.name,
                            type: "switch",
                            data: { ...breaker, ...swLive },
                          })
                        }
                        onMouseLeave={() => setHoveredAsset(null)}
                      >
                        <line
                          x1={swX}
                          y1={pos.y}
                          x2={swX}
                          y2={swY}
                          stroke="#94A3B8"
                          strokeWidth="1"
                        />
                        <rect
                          x={swX - 3.5}
                          y={swY - 3.5}
                          width="7"
                          height="7"
                          fill={isClosed ? "#10B981" : "#EF4444"}
                          stroke={isClosed ? "#047857" : "#B91C1C"}
                          strokeWidth="0.8"
                        />
                      </g>
                    );
                  })}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Hover Tooltip overlay */}
      {hoveredAsset && (
        <div
          className="absolute bg-slate-950/95 border border-[#2A313C] rounded-[3px] p-3 shadow-2xl text-[10.5px] font-mono text-[#94A3B8] w-64 pointer-events-none z-30 backdrop-blur-md"
          style={{ left: `${hoverPosition.x}px`, top: `${hoverPosition.y}px` }}
        >
          <div className="border-b border-[#2A313C] pb-1.5 mb-1.5 flex items-center justify-between">
            <span className="font-bold text-slate-100 truncate pr-2">{hoveredAsset.name}</span>
            <span className="px-1.5 py-0.5 rounded-[2px] bg-slate-800 text-[#FF7A1A] text-[8.5px] uppercase font-bold">
              {hoveredAsset.type.replace("_", " ")}
            </span>
          </div>

          <div className="space-y-1">
            {hoveredAsset.data.base_kv !== undefined && (
              <div>
                Voltage Level:{" "}
                <span className="text-slate-300 font-semibold">{hoveredAsset.data.base_kv} kV</span>
              </div>
            )}
            {hoveredAsset.data.capacity_mw !== undefined && (
              <div>
                Capacity:{" "}
                <span className="text-slate-300 font-semibold">
                  {hoveredAsset.data.capacity_mw} MW
                </span>
              </div>
            )}
            {hoveredAsset.data.p_mw !== undefined && (
              <div>
                Power (Active):{" "}
                <span className="text-slate-300 font-semibold">{hoveredAsset.data.p_mw} MW</span>
              </div>
            )}
            {hoveredAsset.data.flow_mw !== undefined && (
              <div>
                Power Flow:{" "}
                <span className="text-slate-300 font-semibold">{hoveredAsset.data.flow_mw} MW</span>
              </div>
            )}
            {hoveredAsset.data.current_a !== undefined && (
              <div>
                Current Flow:{" "}
                <span className="text-slate-300 font-semibold">
                  {hoveredAsset.data.current_a} A
                </span>
              </div>
            )}
            {hoveredAsset.data.utilization !== undefined && (
              <div>
                Utilization:{" "}
                <span
                  className={`font-semibold ${hoveredAsset.data.utilization > 90 ? "text-red-500" : "text-slate-300"}`}
                >
                  {hoveredAsset.data.utilization}%
                </span>
              </div>
            )}
            {hoveredAsset.data.state !== undefined && (
              <div>
                State:{" "}
                <span
                  className={`font-semibold ${hoveredAsset.data.state === "closed" ? "text-emerald-500" : "text-red-500"}`}
                >
                  {hoveredAsset.data.state.toUpperCase()}
                </span>
              </div>
            )}
            <div>
              Status:{" "}
              <span
                className={`font-bold ${hoveredAsset.data.status === "active" ? "text-emerald-500" : "text-red-500 animate-pulse"}`}
              >
                {(hoveredAsset.data.status || "active").toUpperCase()}
              </span>
            </div>
            <div className="border-t border-[#2A313C]/60 pt-1 mt-1 text-[8.5px] text-slate-500">
              Last Scanned: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default GridTopologyViewer;
