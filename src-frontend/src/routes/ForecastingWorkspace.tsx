import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
import {
  ForecastSummaryCard,
  MetadataCard,
  ConfidenceCard,
} from "@/components/forecasting/ForecastComponents";
import { ForecastTimeline } from "@/components/forecasting/ForecastTimeline";
import { ForecastControls } from "@/components/forecasting/ForecastControls";
import { GenericForecastPage } from "@/pages/forecasting/GenericForecastPage";

const getForecastConfig = (type: string) => {
  switch (type) {
    case "Demand":
      return {
        domain: "demand",
        title: "Demand Forecast",
        description: "Short, medium, and long-term base load and peak demand predictions.",
        color: "#8b5cf6",
        unit: "MW",
        kpiTitle: "Peak Demand",
        dataKey: "predicted_value",
      };
    case "Generation":
      return {
        domain: "generation",
        title: "Generation Forecast",
        description: "Aggregate generation predictions across thermal, hydro, and nuclear assets.",
        color: "#3b82f6",
        unit: "MW",
        kpiTitle: "Expected Generation",
        dataKey: "predicted_value",
      };
    case "Weather":
      return {
        domain: "weather",
        title: "Weather Intelligence",
        description: "Hyper-local weather forecasting for grid impact analysis.",
        color: "#06b6d4",
        unit: "°C",
        kpiTitle: "Avg Temp",
        dataKey: "predicted_value",
      };
    case "Price":
      return {
        domain: "price",
        title: "Price Forecast",
        description: "Day-ahead and real-time market price predictions.",
        color: "#10b981",
        unit: "$/MWh",
        kpiTitle: "Avg Price",
        dataKey: "predicted_value",
      };
    case "Frequency":
      return {
        domain: "frequency",
        title: "Frequency Forecast",
        description: "Grid frequency stability and deviation predictions.",
        color: "#f59e0b",
        unit: "Hz",
        kpiTitle: "Avg Frequency",
        dataKey: "predicted_value",
      };
    case "Voltage":
      return {
        domain: "voltage",
        title: "Voltage Forecast",
        description: "Bus voltage stability and limit violations.",
        color: "#ef4444",
        unit: "kV",
        kpiTitle: "Avg Voltage",
        dataKey: "predicted_value",
      };
    case "Reserve":
      return {
        domain: "reserve",
        title: "Reserve Forecast",
        description: "Operating reserve margin and capacity predictions.",
        color: "#6366f1",
        unit: "MW",
        kpiTitle: "Available Reserve",
        dataKey: "predicted_value",
      };
    case "Renewable":
      return {
        domain: "renewable",
        title: "Renewable Forecast",
        description: "Solar and wind generation yield predictions.",
        color: "#84cc16",
        unit: "MW",
        kpiTitle: "Renewable Yield",
        dataKey: "predicted_value",
      };
    case "Battery":
      return {
        domain: "battery",
        title: "Battery Forecast",
        description: "BESS state of charge and dispatch optimization.",
        color: "#14b8a6",
        unit: "MWh",
        kpiTitle: "Available Energy",
        dataKey: "predicted_value",
      };
    default:
      return null;
  }
};

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
import api from "@/api/axios";

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
  {
    id: "5",
    name: "Day-Ahead Wholesale Price",
    type: "Price",
    status: "Completed",
    version: "1.2",
    confidence_score: 91.0,
    timestamp: new Date().toISOString(),
  },
  {
    id: "6",
    name: "Grid Frequency Stability",
    type: "Frequency",
    status: "Running",
    version: "2.0",
    confidence_score: null,
    timestamp: new Date().toISOString(),
  },
  {
    id: "7",
    name: "Voltage Regulation Constraints",
    type: "Voltage",
    status: "Completed",
    version: "1.5",
    confidence_score: 95.1,
    timestamp: new Date().toISOString(),
  },
  {
    id: "8",
    name: "Operating Reserve Margin",
    type: "Reserve",
    status: "Running",
    version: "2.2",
    confidence_score: null,
    timestamp: new Date().toISOString(),
  },
  {
    id: "9",
    name: "Renewable Generation Yield",
    type: "Renewable",
    status: "Completed",
    version: "3.1",
    confidence_score: 89.7,
    timestamp: new Date().toISOString(),
  },
  {
    id: "10",
    name: "Battery State of Charge",
    type: "Battery",
    status: "Completed",
    version: "1.1",
    confidence_score: 93.4,
    timestamp: new Date().toISOString(),
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
  const [selectedType, setSelectedType] = useState("All Forecasts");

  useEffect(() => {
    // Fetch from Phase 4.1 Enterprise API
    const loadForecasts = async () => {
      setLoading(true);
      try {
        const res = await api.get("/api/v1/forecasting");
        if (res.data && res.data.length > 0) {
          setForecasts(res.data);
        } else {
          setForecasts(mockForecasts);
        }
      } catch (err) {
        console.error("Using mock forecasts due to API error", err);
        setForecasts(mockForecasts);
      } finally {
        setLoading(false);
      }
    };
    loadForecasts();
  }, []);

  // Filter forecasts by selected type dropdown option
  const filteredForecasts = forecasts.filter((f) => {
    if (selectedType === "All Forecasts") return true;
    return f.type.toLowerCase() === selectedType.toLowerCase();
  });

  // Filter by tab status
  const runningForecasts = filteredForecasts.filter((f) => f.status === "Running");
  const completedForecasts = filteredForecasts.filter((f) => f.status === "Completed");

  const renderForecastList = (items: any[]) => {
    if (items.length === 0) {
      return (
        <div className="py-8 text-center text-sm text-slate-500 font-mono">
          No forecasts matching this criteria.
        </div>
      );
    }
    return items.map((f) => (
      <div
        key={f.id}
        className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-[#161B22] border border-slate-100 dark:border-[#2A313C]"
      >
        <div className="flex items-center">
          <div className="w-10 h-10 rounded bg-indigo-500/10 flex items-center justify-center mr-4">
            <TrendingUp className="w-5 h-5 text-indigo-500" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{f.name}</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Type: {f.type} | Version: {f.version}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-6">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase">Confidence</p>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {f.confidence_score ? `${f.confidence_score}%` : "--"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase mb-1">Status</p>
            <span
              className={`px-2 py-1 rounded text-xs font-medium ${f.status === "Running" ? "bg-blue-500/10 text-blue-500" : f.status === "Completed" ? "bg-emerald-500/10 text-emerald-500" : f.status === "Failed" ? "bg-red-500/10 text-red-500" : "bg-slate-500/10 text-slate-500"}`}
            >
              {f.status}
            </span>
          </div>
        </div>
      </div>
    ));
  };

  const config = selectedType !== "All Forecasts" ? getForecastConfig(selectedType) : null;

  if (config) {
    return (
      <GenericForecastPage
        {...config}
        hideControls={true}
        selectedType={selectedType}
        onTypeChange={setSelectedType}
      />
    );
  }

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-8 select-text animate-in fade-in duration-500">
      <PageHeader
        title="Enterprise Forecast Engine"
        description="Central hub for multi-domain predictive modeling, scheduling, and grid intelligence."
      />

      <ForecastControls selectedType={selectedType} onTypeChange={setSelectedType} />

      <div className="grid grid-cols-1 tablet:grid-cols-2 laptop:grid-cols-4 gap-6">
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

      <div className="grid grid-cols-1 laptop:grid-cols-3 gap-6 mt-8">
        <div className="laptop:col-span-2 space-y-6">
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
                  {renderForecastList(filteredForecasts)}
                </TabsContent>

                <TabsContent value="running" className="space-y-4">
                  {renderForecastList(runningForecasts)}
                </TabsContent>

                <TabsContent value="completed" className="space-y-4">
                  {renderForecastList(completedForecasts)}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <ConfidenceCard score={92.4} level="High" />

          <div className="bg-white dark:bg-[#1E232B] border border-slate-200 dark:border-[#2A313C] rounded-lg shadow-sm p-6">
            <ForecastTimeline history={mockHistory} />
          </div>
        </div>
      </div>
    </div>
  );
}
