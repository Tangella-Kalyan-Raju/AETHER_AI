import React, { useRef, useEffect } from "react";

interface MinimapProps {
  nodes: Array<{ id: number; x: number; y: number; type: string }>;
  edges: Array<{
    id: number;
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
    type: string;
  }>;
  panX: number;
  panY: number;
  scale: number;
  canvasWidth: number;
  canvasHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  onPanTo: (x: number, y: number) => void;
}

export function Minimap({
  nodes,
  edges,
  panX,
  panY,
  scale,
  canvasWidth,
  canvasHeight,
  viewportWidth,
  viewportHeight,
  onPanTo,
}: MinimapProps) {
  const miniWidth = 180;
  const miniHeight = 120;
  const containerRef = useRef<HTMLDivElement>(null);

  // Bounds of all nodes to fit within the minimap
  let minX = 0,
    maxX = canvasWidth;
  let minY = 0,
    maxY = canvasHeight;

  if (nodes.length > 0) {
    const xs = nodes.map((n) => n.x);
    const ys = nodes.map((n) => n.y);
    minX = Math.min(...xs) - 100;
    maxX = Math.max(...xs) + 100;
    minY = Math.min(...ys) - 100;
    maxY = Math.max(...ys) + 100;
  }

  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;

  // Map coordinates to minimap coordinates
  const mapX = (x: number) => ((x - minX) / rangeX) * miniWidth;
  const mapY = (y: number) => ((y - minY) / rangeY) * miniHeight;

  // Viewport mapping
  // Left visible border on main canvas: -panX / scale
  // Width visible: viewportWidth / scale
  const viewX1 = mapX(-panX / scale);
  const viewY1 = mapY(-panY / scale);
  const viewW = (viewportWidth / scale / rangeX) * miniWidth;
  const viewH = (viewportHeight / scale / rangeY) * miniHeight;

  // Constrain viewport box within minimap borders
  const boxLeft = Math.max(0, Math.min(miniWidth, viewX1));
  const boxTop = Math.max(0, Math.min(miniHeight, viewY1));
  const boxWidth = Math.min(miniWidth - boxLeft, Math.max(8, viewW));
  const boxHeight = Math.min(miniHeight - boxTop, Math.max(8, viewH));

  const handleMiniClickOrDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Convert minimap coordinate to main canvas coordinate
    const targetCanvasX = (clickX / miniWidth) * rangeX + minX;
    const targetCanvasY = (clickY / miniHeight) * rangeY + minY;

    // We want the clicked point to be centered in the viewport
    // panX = (viewportWidth / 2) - targetCanvasX * scale
    const targetPanX = viewportWidth / 2 - targetCanvasX * scale;
    const targetPanY = viewportHeight / 2 - targetCanvasY * scale;

    onPanTo(targetPanX, targetPanY);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    handleMiniClickOrDrag(e);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const clickX = moveEvent.clientX - rect.left;
      const clickY = moveEvent.clientY - rect.top;

      const targetCanvasX = (clickX / miniWidth) * rangeX + minX;
      const targetCanvasY = (clickY / miniHeight) * rangeY + minY;

      const targetPanX = viewportWidth / 2 - targetCanvasX * scale;
      const targetPanY = viewportHeight / 2 - targetCanvasY * scale;
      onPanTo(targetPanX, targetPanY);
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      className="absolute bottom-4 left-4 z-20 bg-slate-950/90 border border-[#2A313C] rounded-[3px] shadow-2xl overflow-hidden cursor-crosshair backdrop-blur-sm select-none"
      style={{ width: `${miniWidth}px`, height: `${miniHeight}px` }}
      title="Minimap - Click or drag to pan grid"
    >
      <svg className="w-full h-full opacity-65" viewBox={`0 0 ${miniWidth} ${miniHeight}`}>
        {/* Draw edges (Transmission lines / Transformers) */}
        {edges.map((e) => (
          <line
            key={`mini-edge-${e.id}`}
            x1={mapX(e.fromX)}
            y1={mapY(e.fromY)}
            x2={mapX(e.toX)}
            y2={mapY(e.toY)}
            stroke={e.type === "transformer" ? "#8B5CF6" : "#475569"}
            strokeWidth="0.8"
            strokeDasharray={e.type === "transformer" ? "1,1" : undefined}
          />
        ))}

        {/* Draw nodes (Buses, Substations, Generators, Loads) */}
        {nodes.map((n) => {
          let color = "#94A3B8"; // default
          if (n.type === "bus") color = "#FBBF24";
          if (n.type === "generator") color = "#10B981";
          if (n.type === "load") color = "#EF4444";
          if (n.type === "substation") color = "#22D3EE";

          return (
            <circle
              key={`mini-node-${n.type}-${n.id}`}
              cx={mapX(n.x)}
              cy={mapY(n.y)}
              r={n.type === "substation" ? 2.5 : 1.5}
              fill={n.type === "substation" ? "none" : color}
              stroke={n.type === "substation" ? "#22D3EE" : undefined}
              strokeWidth={n.type === "substation" ? 0.5 : undefined}
              strokeDasharray={n.type === "substation" ? "1,1" : undefined}
            />
          );
        })}

        {/* Viewport Bounds Bounding Box */}
        <rect
          x={boxLeft}
          y={boxTop}
          width={boxWidth}
          height={boxHeight}
          fill="rgba(255, 122, 26, 0.08)"
          stroke="#FF7A1A"
          strokeWidth="1.2"
        />
      </svg>
      <div className="absolute bottom-1 right-1.5 text-[7.5px] font-mono text-slate-500 uppercase tracking-widest leading-none pointer-events-none">
        Minimap
      </div>
    </div>
  );
}
export default Minimap;
