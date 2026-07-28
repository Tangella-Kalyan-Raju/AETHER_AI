import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
import {
  ForecastSummaryCard,
  MetadataCard,
  ConfidenceCard,
} from "@/components/forecasting/ForecastComponents";
import { ForecastTimeline } from "@/components/forecasting/ForecastTimeline";
import { ForecastControls } from "@/components/forecasting/ForecastControls";
import {
  Activity,
  Zap,
  CloudLightning,
  Battery,
  BarChart3,
  TrendingUp,
  ShieldAlert,
  Cpu,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";

const mockForecasts = [
  {
    id: "1",
    name: "National Grid Demand - Day Ahead",
    type: "Demand",
    status: "Completed",
    version: "2.1",
    confidence_score: 94.2,
    timestamp: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Solar Generation - Western Region",
    type: "Generation",
    status: "Running",
    version: "1.4",
    confidence_score: null,
    timestamp: new Date().toISOString(),
  },
  {
    id: "3",
    name: "Storm Front Weather Impact",
    type: "Weather",
    status: "Failed",
    version: "1.0",
    confidence_score: null,
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "4",
    name: "Battery Storage Optimization",
    type: "Storage",
    status: "Scheduled",
    version: "3.0",
    confidence_score: 88.5,
    timestamp: new Date(Date.now() + 7200000).toISOString(),
  },
];

const mockHistory = [
  {
    status: "Completed",
    execution_timestamp: new Date().toISOString(),
    logs: { message: "Successfully generated 24h demand horizon." },
  },
  {
    status: "Running",
    execution_timestamp: new Date(Date.now() - 1800000).toISOString(),
    logs: { message: "Ingesting telemetry data from SCADA nodes..." },
  },
  {
    status: "Failed",
    execution_timestamp: new Date(Date.now() - 86400000).toISOString(),
    logs: { message: "Error: Could not connect to weather intelligence API." },
  },
];

export default function ForecastingWorkspace() {
  const [forecasts, setForecasts] = useState<any[]>(mockForecasts);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch from Phase 4.1 Enterprise API
    const loadForecasts = async () => {
      try {
        // If API is available, fetch real data
        // const res = await api.get("/forecasting");
        // if (res.data) setForecasts(res.data);
      } catch (err) {
        console.error("Using mock forecasts due to API error", err);
      }
    };
    loadForecasts();
  }, []);

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title="Enterprise Forecast Engine"
        description="Central hub for multi-domain predictive modeling, scheduling, and grid intelligence."
      />

      <ForecastControls />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ForecastSummaryCard
          title="Active Models"
          value="14"
          description="Currently running forecasting models"
          trend="up"
        />
        <ForecastSummaryCard
          title="Compute Utilization"
          value="82%"
          description="GPU cluster allocation"
          trend="up"
        />
        <ForecastSummaryCard
          title="Average Confidence"
          value="92.4%"
          description="System-wide prediction accuracy"
          trend="up"
        />
        <ForecastSummaryCard
          title="Daily Predictions"
          value="1.2M"
          description="Total data points generated today"
          trend="up"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-[#1E232B] border border-slate-200 dark:border-[#2A313C] rounded-lg shadow-sm">
            <div className="p-4 border-b border-slate-100 dark:border-[#2A313C]">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center">
                <Cpu className="w-5 h-5 mr-2 text-indigo-500" />
                Execution Engine Status
              </h3>
            </div>
            <div className="p-6">
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="mb-4 bg-slate-100 dark:bg-[#161B22]">
                  <TabsTrigger value="all">All Forecasts</TabsTrigger>
                  <TabsTrigger value="running">Running</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-4">
                  {forecasts.map((f) => (
                    <div
                      key={f.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-[#161B22] border border-slate-100 dark:border-[#2A313C]"
                    >
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded bg-indigo-500/10 flex items-center justify-center mr-4">
                          <TrendingUp className="w-5 h-5 text-indigo-500" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                            {f.name}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Type: {f.type} | Version: {f.version}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-6">
                        <div className="text-right hidden sm:block">
                          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase">
                            Confidence
                          </p>
                          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                            {f.confidence_score ? `${f.confidence_score}%` : "--"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase mb-1">
                            Status
                          </p>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${f.status === "Running" ? "bg-blue-500/10 text-blue-500" : f.status === "Completed" ? "bg-emerald-500/10 text-emerald-500" : f.status === "Failed" ? "bg-red-500/10 text-red-500" : "bg-slate-500/10 text-slate-500"}`}
                          >
                            {f.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </TabsContent>
                {/* Implement other tabs later */}
              </Tabs>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <ConfidenceCard score={92.4} level="High" />
          <MetadataCard
            dataSource="SCADA + OpenWeather"
            processingDuration={1250}
            confidenceScore={92.4}
          />

          <div className="bg-white dark:bg-[#1E232B] border border-slate-200 dark:border-[#2A313C] rounded-lg shadow-sm p-6">
            <ForecastTimeline history={mockHistory} />
          </div>
        </div>
      </div>
    </div>
  );
}
