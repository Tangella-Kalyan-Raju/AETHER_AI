import React from "react";
import { useMonitoring } from "../../context/MonitoringContext";
import { motion } from "framer-motion";

export function LiveDigitalTwin() {
  const { assetCache } = useMonitoring();

  // Determine color based on status
  const getColor = (assetId: string) => {
    let worstStatus = "Healthy";
    const measurements = assetCache[assetId];
    if (measurements) {
      for (const key in measurements) {
        const s = measurements[key].status;
        if (s === "Critical") worstStatus = "Critical";
        else if (s === "Warning" && worstStatus !== "Critical") worstStatus = "Warning";
      }
    }

    switch (worstStatus) {
      case "Critical":
        return "#ef4444"; // red-500
      case "Warning":
        return "#f59e0b"; // amber-500
      case "Healthy":
        return "#10b981"; // emerald-500
      default:
        return "#64748b"; // slate-500
    }
  };

  // Mock topology coordinates for visual display
  const nodes = [
    { id: "sub-1", label: "Main Substation", x: 200, y: 100 },
    { id: "gen-101", label: "Hydro Gen A", x: 50, y: 50 },
    { id: "load-200", label: "Industrial Zone", x: 350, y: 200 },
    { id: "bat-1", label: "Storage Unit", x: 100, y: 200 },
  ];

  const edges = [
    { source: "gen-101", target: "sub-1" },
    { source: "bat-1", target: "sub-1" },
    { source: "sub-1", target: "load-200" },
  ];

  return (
    <div className="relative w-full h-full bg-slate-950 flex items-center justify-center overflow-hidden">
      <svg width="100%" height="100%" viewBox="0 0 400 300" className="max-w-full max-h-full">
        {/* Draw Edges */}
        {edges.map((edge, idx) => {
          const sourceNode = nodes.find((n) => n.id === edge.source);
          const targetNode = nodes.find((n) => n.id === edge.target);
          if (!sourceNode || !targetNode) return null;
          return (
            <motion.line
              key={`edge-${idx}`}
              x1={sourceNode.x}
              y1={sourceNode.y}
              x2={targetNode.x}
              y2={targetNode.y}
              stroke="#334155"
              strokeWidth={3}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1 }}
            />
          );
        })}

        {/* Draw Nodes */}
        {nodes.map((node) => {
          const color = getColor(node.id);
          return (
            <g
              key={node.id}
              transform={`translate(${node.x}, ${node.y})`}
              className="cursor-pointer"
            >
              <circle
                r={20}
                fill="#1e293b"
                stroke={color}
                strokeWidth={4}
                className="hover:opacity-80 transition-opacity"
              />
              {/* Optional inner pulse for critical nodes */}
              {color === "#ef4444" && (
                <circle r={20} fill="none" stroke={color} strokeWidth={2}>
                  <animate
                    attributeName="r"
                    values="20; 35; 20"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="1; 0; 1"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}
              <text
                y={35}
                textAnchor="middle"
                fill="#cbd5e1"
                fontSize={10}
                className="font-semibold pointer-events-none"
              >
                {node.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
