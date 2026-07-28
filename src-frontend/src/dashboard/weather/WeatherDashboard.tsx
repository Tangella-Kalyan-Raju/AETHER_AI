import React, { useState, useEffect } from "react";
import {
  CloudLightning,
  Droplets,
  Wind,
  Thermometer,
  MapPin,
  Clock,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Play,
  Pause,
  Layers,
  Map,
  Eye,
  Compass,
  Zap,
  Info,
  ChevronRight,
  Compass as WindDirIcon,
  RefreshCw,
  Bell,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
} from "recharts";

export default function WeatherDashboard() {
  const [loading, setLoading] = useState(true);
  const [currentWeather, setCurrentWeather] = useState<any>(null);
  const [forecasts, setForecasts] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [mapData, setMapData] = useState<any>(null);
  const [impacts, setImpacts] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [renewableForecast, setRenewableForecast] = useState<any>(null);
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);

  // Interactive controls
  const [timelineIndex, setTimelineIndex] = useState(2); // Start at index 2 (current)
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeMapLayer, setActiveMapLayer] = useState<"radar" | "wind" | "satellite">("radar");
  const [forecastRange, setForecastRange] = useState<"24h" | "48h" | "7d">("24h");

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("gpo_access_token");
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
      const headers = { Authorization: `Bearer ${token}` };

      const [curRes, foreRes, lineRes, mapRes, impRes, recRes, aiRes, renRes, alertRes] =
        await Promise.all([
          fetch(`${API_URL}/api/v1/weather/current`, { headers }),
          fetch(`${API_URL}/api/v1/weather/forecast`, { headers }),
          fetch(`${API_URL}/api/v1/weather/timeline`, { headers }),
          fetch(`${API_URL}/api/v1/weather/map`, { headers }),
          fetch(`${API_URL}/api/v1/weather/impact`, { headers }),
          fetch(`${API_URL}/api/v1/weather/recommendations`, { headers }),
          fetch(`${API_URL}/api/v1/weather/ai-insights`, { headers }),
          fetch(`${API_URL}/api/v1/weather/renewable-forecast`, { headers }),
          fetch(`${API_URL}/api/v1/weather/alerts`, { headers }),
        ]);

      if (curRes.ok) setCurrentWeather((await curRes.json()).data);
      if (foreRes.ok) setForecasts((await foreRes.json()).data);
      if (lineRes.ok) setTimeline((await lineRes.json()).data);
      if (mapRes.ok) setMapData((await mapRes.json()).data);
      if (impRes.ok) setImpacts((await impRes.json()).data);
      if (recRes.ok) setRecommendations((await recRes.json()).data);
      if (aiRes.ok) setAiInsights((await aiRes.json()).data);
      if (renRes.ok) setRenewableForecast((await renRes.json()).data);
      if (alertRes.ok) setActiveAlerts((await alertRes.json()).data);
    } catch (err) {
      console.error("Failed to load operational weather telemetry", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Timeline Auto-play simulation loop
  useEffect(() => {
    let timer: any;
    if (isPlaying) {
      timer = setInterval(() => {
        setTimelineIndex((prev) => (prev + 1) % timeline.length);
      }, 3000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, timeline.length]);

  if (loading || !currentWeather) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <RefreshCw className="h-10 w-10 animate-spin text-emerald-500" />
          <span className="text-sm font-medium text-slate-400">
            Loading Grid Weather Station metrics...
          </span>
        </div>
      </div>
    );
  }

  // Selected timeline event
  const selectedEvent = timeline[timelineIndex] || {
    event_type: "Nominal",
    description: "All variables normal.",
  };

  // Current forecast array based on toggle range
  const forecastData = forecasts
    ? forecastRange === "24h"
      ? forecasts.forecast_24h
      : forecastRange === "48h"
        ? forecasts.forecast_48h
        : forecasts.forecast_7d
    : [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 select-text">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
            GPO CLIMATE INTELLIGENCE // METEOROLOGICAL NETWORK
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Weather Intelligence Platform
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-[#161C24] px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Sync Weather
          </button>
        </div>
      </div>

      {/* Grid of Weather Telemetry (High Density Metrics) */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl bg-white dark:bg-[#11161D] border border-slate-200 dark:border-[#2A313C]">
          <span className="text-[10px] text-slate-500 uppercase font-mono block">Temperature</span>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {currentWeather.temperature.toFixed(1)}{" "}
            <span className="text-xs text-slate-500">°C</span>
          </div>
          <span className="text-[9px] text-slate-400 block mt-1">
            Feels like: {currentWeather.feels_like.toFixed(1)}°C
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-[#11161D] border border-slate-200 dark:border-[#2A313C]">
          <span className="text-[10px] text-slate-500 uppercase font-mono block">
            Wind Telemetry
          </span>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {currentWeather.wind_speed.toFixed(1)}{" "}
            <span className="text-xs text-slate-500">m/s</span>
          </div>
          <span className="text-[9px] text-slate-400 block mt-1">
            Dir: {currentWeather.wind_direction} // Gusts: {currentWeather.wind_gust.toFixed(1)}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-[#11161D] border border-slate-200 dark:border-[#2A313C]">
          <span className="text-[10px] text-slate-500 uppercase font-mono block">Cloud Cover</span>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {currentWeather.cloud_cover}%
          </div>
          <span className="text-[9px] text-slate-400 block mt-1">
            Density: {currentWeather.cloud_density}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-[#11161D] border border-slate-200 dark:border-[#2A313C]">
          <span className="text-[10px] text-slate-500 uppercase font-mono block">
            Humidity & Dew
          </span>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {currentWeather.humidity}%
          </div>
          <span className="text-[9px] text-slate-400 block mt-1">
            Dew Point: {currentWeather.dew_point}°C
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-[#11161D] border border-slate-200 dark:border-[#2A313C]">
          <span className="text-[10px] text-slate-500 uppercase font-mono block">
            Sun / Solar Index
          </span>
          <div className="text-xl font-bold text-amber-500 mt-1">{currentWeather.uv_index} UV</div>
          <span className="text-[9px] text-slate-400 block mt-1">Set: {currentWeather.sunset}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-[#11161D] border border-slate-200 dark:border-[#2A313C]">
          <span className="text-[10px] text-slate-500 uppercase font-mono block">Air Quality</span>
          <div className="text-xl font-bold text-emerald-400 mt-1">42 AQI</div>
          <span className="text-[9px] text-slate-400 block mt-1">
            Visibility: {currentWeather.visibility} km
          </span>
        </div>
      </div>

      {/* Main Grid: Map & Weather Timeline */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left/Middle Columns: Interactive map and timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Simulated Meteorological GIS Map */}
          <div className="rounded-xl border border-slate-200 dark:border-[#2A313C] bg-[#11161D] p-5">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-200 font-mono uppercase tracking-wider">
                  Meteorological GIS Overlay
                </h3>
                <p className="text-[11px] text-slate-500">
                  Live grid substation SCADA telemetry alignment
                </p>
              </div>
              <div className="flex gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-lg">
                {(["radar", "wind", "satellite"] as const).map((layer) => (
                  <button
                    key={layer}
                    onClick={() => setActiveMapLayer(layer)}
                    className={`px-2.5 py-1 text-[10px] font-bold font-mono uppercase rounded transition-colors ${
                      activeMapLayer === layer
                        ? "bg-emerald-500 text-white"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {layer}
                  </button>
                ))}
              </div>
            </div>

            {/* Premium Simulated Map Layer Box */}
            <div className="relative h-[320px] bg-[#0c1015] border border-slate-850 rounded-xl overflow-hidden flex items-center justify-center">
              {/* GIS Map Grid layout SVG */}
              <svg
                className="absolute inset-0 w-full h-full opacity-20 pointer-events-none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                    <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#2a3749" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>

              {/* Simulated overlays depending on activeLayer */}
              {activeMapLayer === "radar" && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    className="absolute w-44 h-44 rounded-full bg-emerald-500/10 border border-emerald-500/25 animate-ping"
                    style={{ animationDuration: "6s" }}
                  />
                  <div
                    className="absolute w-72 h-72 rounded-full bg-emerald-500/5 border border-emerald-500/10 animate-ping"
                    style={{ animationDuration: "9s" }}
                  />
                  {/* Weather fronts representation */}
                  <path
                    d="M 50 100 Q 200 150 350 100 T 600 200"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="4"
                    strokeDasharray="5,5"
                    className="absolute"
                  />
                  <span className="absolute top-12 left-24 text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded font-mono">
                    CLOUD BOUNDARY INCOMING
                  </span>
                </div>
              )}

              {activeMapLayer === "wind" && (
                <div className="absolute inset-0 flex items-center justify-center">
                  {/* Wind streamline animations */}
                  <svg
                    className="absolute inset-0 w-full h-full opacity-60"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M 50,150 Q 150,180 250,120 T 450,160"
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth="2.5"
                      strokeDasharray="10, 5"
                      className="animate-[dash_10s_linear_infinite]"
                    />
                    <path
                      d="M 100,200 Q 200,220 300,180 T 500,210"
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth="1.5"
                      strokeDasharray="8, 4"
                      className="animate-[dash_8s_linear_infinite]"
                    />
                    <path
                      d="M 10,80 Q 120,60 220,100 T 410,70"
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth="2"
                      strokeDasharray="12, 6"
                      className="animate-[dash_12s_linear_infinite]"
                    />
                  </svg>
                  <span className="absolute bottom-6 left-6 text-[10px] bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded font-mono">
                    STREAMING GUSTS: 18.2 m/s
                  </span>
                </div>
              )}

              {activeMapLayer === "satellite" && (
                <div className="absolute inset-0 bg-[#06080b] flex items-center justify-center">
                  <div className="w-56 h-56 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden">
                    <div
                      className="w-48 h-48 rounded-full border border-slate-800/40 border-dashed animate-spin"
                      style={{ animationDuration: "60s" }}
                    />
                  </div>
                  <span className="absolute top-6 right-6 text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-mono">
                    SATELLITE SECTOR ACTIVE
                  </span>
                </div>
              )}

              {/* Plant coordinate nodes overlay */}
              {mapData?.plant_locations?.map((node: any) => (
                <div
                  key={node.id}
                  className="absolute"
                  style={{
                    left: `${(node.coords[1] - 70) * 15 + 50}%`,
                    top: `${(32 - node.coords[0]) * 15 + 50}%`,
                  }}
                >
                  <div className="w-3.5 h-3.5 rounded-full bg-[#11161D] border-2 border-emerald-400 flex items-center justify-center hover:scale-125 transition-transform cursor-pointer relative group">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    {/* Plant label tooltip */}
                    <div className="hidden group-hover:block absolute bottom-5 left-1/2 transform -translate-x-1/2 z-10 bg-slate-900 text-white font-mono text-[9px] px-2 py-1 rounded border border-slate-800 whitespace-nowrap">
                      {node.name} ({node.output_mw} MW)
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Animated Weather Timeline Selector */}
          <div className="rounded-xl border border-slate-200 dark:border-[#2A313C] bg-[#11161D] p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-200 font-mono uppercase tracking-wider">
                  Meteorological Event Timeline
                </h3>
                <p className="text-[11px] text-slate-500">
                  Track current cloud density, wind speeds, and incoming fronts
                </p>
              </div>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="flex items-center gap-1 bg-slate-900 border border-slate-800 hover:bg-slate-855 px-3 py-1.5 rounded text-xs text-slate-400 hover:text-white"
              >
                {isPlaying ? (
                  <Pause className="h-3.5 w-3.5 text-rose-400" />
                ) : (
                  <Play className="h-3.5 w-3.5 text-emerald-400" />
                )}
                {isPlaying ? "Pause Simulation" : "Play Timeline"}
              </button>
            </div>

            {/* Slider Timeline Selector */}
            <div className="space-y-4">
              <div className="flex justify-between items-center gap-3">
                {timeline.map((event, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setTimelineIndex(idx);
                      setIsPlaying(false);
                    }}
                    className={`flex-1 p-3 rounded-lg border text-center transition-all duration-200 ${
                      timelineIndex === idx
                        ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                        : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <p className="text-[9px] font-mono font-bold uppercase tracking-wider mb-1">
                      {event.phase}
                    </p>
                    <p className="text-xs font-bold font-mono truncate">{event.event_type}</p>
                  </button>
                ))}
              </div>

              {/* Timeline Detail View card */}
              <div className="bg-slate-900/40 border border-slate-850 rounded-xl p-4.5 flex gap-3.5 items-start">
                <Clock className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-mono uppercase tracking-wider font-bold">
                      EVENT ACTIVE
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      Timestamp: {new Date(selectedEvent.time).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-slate-200">{selectedEvent.event_type}</p>
                  <p className="text-xs text-slate-400 leading-relaxed font-mono">
                    {selectedEvent.description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: AI Dispatch recommendations & forecast confidence */}
        <div className="space-y-6">
          {/* Weather Impact Engine & Reasoning Tree */}
          <div className="rounded-xl border border-slate-200 dark:border-[#2A313C] bg-[#11161D] p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <ShieldAlert className="h-5 w-5 text-emerald-400 animate-pulse" />
              <div>
                <h3 className="text-sm font-bold text-slate-200 font-mono uppercase tracking-wider">
                  Weather Impact Engine
                </h3>
                <p className="text-[11px] text-slate-500">
                  Automated grid stability policy recommendations
                </p>
              </div>
            </div>

            {/* Simulated interactive decision tree */}
            <div className="space-y-3 font-mono text-[11px]">
              <div className="bg-slate-900 border border-slate-800 p-3 rounded flex justify-between items-center">
                <span className="text-slate-500">Detected Trigger:</span>
                <span className="text-amber-400 font-bold">Cloud Cover Density Build-up</span>
              </div>
              <div className="flex justify-center text-slate-600">
                <ChevronRight className="rotate-90 h-4 w-4" />
              </div>

              <div className="bg-slate-900 border border-slate-800 p-3 rounded flex justify-between items-center">
                <span className="text-slate-500">Solar Irradiance Drop:</span>
                <span className="text-rose-400 font-bold">-320 W/m²</span>
              </div>
              <div className="flex justify-center text-slate-600">
                <ChevronRight className="rotate-90 h-4 w-4" />
              </div>

              <div className="bg-slate-900 border border-slate-800 p-3 rounded flex justify-between items-center">
                <span className="text-slate-500">Renewable reduction:</span>
                <span className="text-rose-400 font-bold">-620 MW</span>
              </div>
              <div className="flex justify-center text-slate-600">
                <ChevronRight className="rotate-90 h-4 w-4" />
              </div>

              <div className="bg-emerald-950/20 border border-emerald-900/30 p-4 rounded-xl space-y-2">
                <p className="text-[10px] text-emerald-500 uppercase font-bold tracking-wider">
                  OPERATIONAL DISPATCH DECISION
                </p>
                <p className="text-xs text-emerald-300 font-bold">
                  Recommendation: Battery Preservation Mode
                </p>
                <p className="text-slate-400 leading-relaxed">
                  Increase Hydro dam output to cushion solar decline. Lock battery state of charge
                  (SoC) parameters to backup standby.
                </p>
              </div>
            </div>
          </div>

          {/* Renewable Efficiency & forecast confidence */}
          <div className="rounded-xl border border-slate-200 dark:border-[#2A313C] bg-[#11161D] p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 font-mono uppercase tracking-wider border-b border-slate-800 pb-3">
              Forecast Confidence metrics
            </h3>

            <div className="space-y-3 font-mono text-[11px]">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Wind Forecast confidence:</span>
                <span className="text-emerald-400 font-bold font-mono">96%</span>
              </div>
              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-400 h-full rounded-full" style={{ width: "96%" }} />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400">Solar Forecast confidence:</span>
                <span className="text-emerald-400 font-bold font-mono">91%</span>
              </div>
              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-400 h-full rounded-full" style={{ width: "91%" }} />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400">Rain Forecast accuracy:</span>
                <span className="text-emerald-400 font-bold font-mono">88%</span>
              </div>
              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-400 h-full rounded-full" style={{ width: "88%" }} />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400">Demand correlation score:</span>
                <span className="text-emerald-400 font-bold font-mono">94%</span>
              </div>
              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-400 h-full rounded-full" style={{ width: "94%" }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Forecast Line Chart View */}
      <div className="rounded-xl border border-slate-200 dark:border-[#2A313C] bg-[#11161D] p-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-4 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-200 font-mono uppercase tracking-wider">
              Met Forecast Timeline Curves
            </h3>
            <p className="text-[11px] text-slate-500">24h, 48h and 7d trend metrics</p>
          </div>
          <div className="flex gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-lg">
            {(["24h", "48h", "7d"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setForecastRange(range)}
                className={`px-3 py-1.5 text-[10px] font-bold font-mono uppercase rounded transition-colors ${
                  forecastRange === range
                    ? "bg-emerald-500 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={forecastData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222f3e" vertical={false} />
              <XAxis
                dataKey="timestamp"
                stroke="#64748b"
                fontSize={10}
                tickFormatter={(t) =>
                  new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                }
              />
              <YAxis stroke="#64748b" fontSize={10} />
              <Tooltip
                contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#fff" }}
              />
              <Area
                type="monotone"
                dataKey="temperature"
                name="Temp (°C)"
                stroke="#f59e0b"
                fill="#f59e0b"
                fillOpacity={0.03}
              />
              <Area
                type="monotone"
                dataKey="wind_speed"
                name="Wind (m/s)"
                stroke="#06b6d4"
                fill="#06b6d4"
                fillOpacity={0.03}
              />
              <Area
                type="monotone"
                dataKey="cloud_cover"
                name="Clouds (%)"
                stroke="#8b5cf6"
                fill="#8b5cf6"
                fillOpacity={0.03}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
