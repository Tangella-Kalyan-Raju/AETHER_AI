import React, { useState } from "react";
import GridLayout, { Layout } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { useMonitoring, MonitoringProvider } from "../context/MonitoringContext";
import { LiveKPICards } from "./widgets/LiveKPICards";
import { LiveDigitalTwin } from "./widgets/LiveDigitalTwin";
import { AssetStatusBoard } from "./widgets/AssetStatusBoard";
import { LiveEventTimeline } from "./widgets/LiveEventTimeline";
import { RealTimeCharts } from "./widgets/RealTimeCharts";
import { LiveMeasurementStream } from "./widgets/LiveMeasurementStream";
import { Activity, Radio, AlertTriangle } from "lucide-react";

const DashboardContent = () => {
  const { isConnected } = useMonitoring();
  const [layout, setLayout] = useState<Layout[]>([
    { i: "kpi", x: 0, y: 0, w: 12, h: 2, static: true },
    { i: "digital_twin", x: 0, y: 2, w: 8, h: 8 },
    { i: "events", x: 8, y: 2, w: 4, h: 8 },
    { i: "charts", x: 0, y: 10, w: 6, h: 6 },
    { i: "stream", x: 6, y: 10, w: 6, h: 6 },
    { i: "status_board", x: 0, y: 16, w: 12, h: 6 },
  ]);

  const onLayoutChange = (newLayout: Layout[]) => {
    setLayout(newLayout);
    // Could save to local storage or backend here
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <header className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Activity className="text-blue-500 w-6 h-6" />
          <h1 className="text-xl font-bold tracking-tight text-white">
            Global Operations Dashboard
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span
              className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500 animate-pulse"}`}
            ></span>
            <span className="text-sm font-medium text-slate-400">
              {isConnected ? "Telemetry Active" : "Connecting..."}
            </span>
          </div>
        </div>
      </header>

      <main className="p-4">
        <GridLayout
          className="layout"
          layout={layout}
          cols={12}
          rowHeight={50}
          width={1600}
          onLayoutChange={onLayoutChange}
          isDraggable={true}
          isResizable={true}
          margin={[16, 16]}
        >
          <div key="kpi" className="overflow-hidden">
            <LiveKPICards />
          </div>
          <div
            key="digital_twin"
            className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden shadow-sm flex flex-col"
          >
            <div className="px-4 py-2 bg-slate-800/50 border-b border-slate-800 font-semibold text-sm flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400" /> Live Grid Topology
            </div>
            <div className="flex-1 overflow-auto p-2">
              <LiveDigitalTwin />
            </div>
          </div>
          <div
            key="events"
            className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden shadow-sm flex flex-col"
          >
            <div className="px-4 py-2 bg-slate-800/50 border-b border-slate-800 font-semibold text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" /> Live Event Timeline
            </div>
            <div className="flex-1 overflow-hidden p-2">
              <LiveEventTimeline />
            </div>
          </div>
          <div
            key="charts"
            className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden shadow-sm flex flex-col"
          >
            <div className="px-4 py-2 bg-slate-800/50 border-b border-slate-800 font-semibold text-sm">
              Real-Time Analytics
            </div>
            <div className="flex-1 p-2">
              <RealTimeCharts />
            </div>
          </div>
          <div
            key="stream"
            className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden shadow-sm flex flex-col"
          >
            <div className="px-4 py-2 bg-slate-800/50 border-b border-slate-800 font-semibold text-sm">
              Telemetry Stream
            </div>
            <div className="flex-1 overflow-hidden p-2">
              <LiveMeasurementStream />
            </div>
          </div>
          <div
            key="status_board"
            className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden shadow-sm flex flex-col"
          >
            <div className="px-4 py-2 bg-slate-800/50 border-b border-slate-800 font-semibold text-sm">
              Asset Status Board
            </div>
            <div className="flex-1 overflow-auto p-2">
              <AssetStatusBoard />
            </div>
          </div>
        </GridLayout>
      </main>
    </div>
  );
};

export default function GlobalOperationsDashboard() {
  return (
    <MonitoringProvider>
      <DashboardContent />
    </MonitoringProvider>
  );
}
