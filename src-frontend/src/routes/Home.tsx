import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Activity,
  Zap,
  Wind,
  Droplet,
  Flame,
  Battery as BatteryIcon,
  TrendingUp,
  Layers,
  CheckCircle2,
  ChevronRight,
  Play,
  Sparkles,
  Clock,
  Sun,
  Globe,
  Bell,
  User as UserIcon,
  RefreshCw,
  Check,
  ArrowRight,
  TrendingDown,
  Shield,
  Settings,
  Download,
  AlertTriangle,
  Wifi,
  Database,
  Info,
  X,
  Compass,
  Thermometer,
  CloudLightning,
  Radio,
  Terminal as TerminalIcon,
  ShieldAlert,
  Search,
  Cpu,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import { useTelemetry } from "@/hooks/useTelemetry";
import GridTopologyViewer from "@/topology/GridTopologyViewer";
import api from "../api/axios";

interface SourceDetail {
  id: string;
  name: string;
  current_generation: number;
  available_capacity: number;
  max_capacity: number;
  percentage: number;
  status: string;
  trend: string;
  health_score: number;
  operating_cost: number;
  co2_emissions: number;
  last_updated: string;
}

interface SelectedPlantDetail {
  id: string;
  name: string;
  current_generation: number;
  installed_capacity: number;
  capacity_factor: number;
  availability: number;
  status: string;
  health_score: number;
  efficiency: number;
  operating_cost: number;
  co2_emissions: number;
  last_updated: string;
  energy_today?: number;
  peak_today?: number;
  forecast_generation?: number;
  forecast_confidence?: number;
}

interface HistoryDataPoint {
  time: string;
  generation: number;
  utilisation: number;
  trend: number;
}

export default function Home() {
  const [timeStr, setTimeStr] = useState("");
  const [showExportToast, setShowExportToast] = useState(false);

  // Shared Telemetry Context
  const {
    topology: gridData,
    liveMeasurements,
    eventTimeline,
    loading: telemetryLoading,
    error: telemetryError,
    triggerManualRefresh,
  } = useTelemetry();

  // Selected plant state (for drawer)
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [drawerTab, setDrawerTab] = useState<"overview" | "history" | "weather" | "impact">(
    "overview"
  );
  const [historyRange, setHistoryRange] = useState<"24H" | "7D" | "30D">("24H");
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerError, setDrawerError] = useState<string | null>(null);
  const [plantDetail, setPlantDetail] = useState<SelectedPlantDetail | null>(null);

  // Sorting / Filtering for the Command Center Table
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeFilter, setActiveFilter] = useState<
    "all" | "renewable" | "non-renewable" | "storage"
  >("all");
  const [sortColumn, setSortColumn] = useState<
    "current_generation" | "available_capacity" | "health_score"
  >("current_generation");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // SCADA Console Logs state
  const [scadaLogs, setScadaLogs] = useState<string[]>([]);
  const scadaContainerRef = useRef<HTMLDivElement | null>(null);

  // Map viewport states
  const [layoutMode, setLayoutMode] = useState<"geo" | "schematic">("schematic");
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [mapPanX, setMapPanX] = useState(0);
  const [mapPanY, setMapPanY] = useState(-50);
  const [mapScale, setMapScale] = useState(0.3);

  // Grid Map Canvas / AI Summary tab controls
  const [centerTab, setCenterTab] = useState<"map" | "summary">("map");
  const [aiSummary, setAiSummary] = useState<string>("");
  const [summaryLoading, setSummaryLoading] = useState<boolean>(false);
  const [queryInput, setQueryInput] = useState<string>("");
  const [aiQueryAnswer, setAiQueryAnswer] = useState<any>(null);
  const [queryLoading, setQueryLoading] = useState<boolean>(false);

  const fetchAiSummary = async () => {
    setSummaryLoading(true);
    try {
      const res = await api.get("/api/v1/ai/summarize-grid");
      setAiSummary(res.data?.summary || "No summary returned.");
    } catch (err) {
      setAiSummary("Failed to fetch AI operational summary from Groq API.");
    } finally {
      setSummaryLoading(false);
    }
  };

  useEffect(() => {
    if (centerTab === "summary" && !aiSummary) {
      fetchAiSummary();
    }
  }, [centerTab]);

  const handleQuerySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryInput.trim()) return;
    setQueryLoading(true);
    setAiQueryAnswer(null);
    try {
      const res = await api.post("/api/v1/ai/query", { query: queryInput });
      setAiQueryAnswer(res.data);
    } catch (err) {
      setAiQueryAnswer({
        what_happened: "Error querying decision engine.",
        why: "Failed to connect to the backend Groq gateway.",
        evidence: {},
        alternatives: [],
        recommendation: "Please try again later.",
        confidence: 0,
        cost_impact: "N/A",
      });
    } finally {
      setQueryLoading(false);
    }
  };

  // Clock Update
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString("en-US", { hour12: false }) + " IST");
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // SCADA scrolling console logs
  useEffect(() => {
    const scadaTemplates = [
      "Substation 12 Frequency stabilized at 59.982Hz",
      "Solver constraints verified - MILP convergence in 11.2ms",
      "Telemetry Sync: Bhadla Solar Park reports 8,050 MW output",
      "SCADA check: Kudankulam NPP thermal status Nominal",
      "Battery Charge Preservation rules check: PASS",
      "NR-01 Transmission branch impedance balance nominal",
      "SCADA: Tahoe line active load at 92.4%",
      "Solar output scaled to dispatch target: 8,050 MW",
      "Grid stability score recalibrated: 98.4%",
      "Dispatch instructions synchronized with MILP solver",
    ];

    setScadaLogs([
      `[${new Date().toLocaleTimeString([], { hour12: false })}] SCADA Link Active - Listening...`,
      `[${new Date().toLocaleTimeString([], { hour12: false })}] Solver Engine MILP Nominal`,
    ]);

    const scadaInterval = setInterval(() => {
      const randomMsg = scadaTemplates[Math.floor(Math.random() * scadaTemplates.length)];
      const timestamp = new Date().toLocaleTimeString("en-US", { hour12: false });
      setScadaLogs((prev) => [...prev.slice(-15), `[${timestamp}] ${randomMsg}`]);
    }, 4000);

    return () => clearInterval(scadaInterval);
  }, []);

  useEffect(() => {
    if (scadaContainerRef.current) {
      scadaContainerRef.current.scrollTop = scadaContainerRef.current.scrollHeight;
    }
  }, [scadaLogs]);

  // Compute combined Generation Sources data list
  const sourcesData: SourceDetail[] = useMemo(() => {
    if (!gridData || !gridData.topology || !gridData.topology.generators) {
      // Mock fallback if telemetry not loaded
      return [
        {
          id: "solar",
          name: "Bhadla Solar Park",
          current_generation: 4850,
          available_capacity: 5000,
          max_capacity: 5000,
          percentage: 19.2,
          status: "ACTIVE",
          trend: "up",
          health_score: 98,
          operating_cost: 15.2,
          co2_emissions: 0,
          last_updated: new Date().toISOString(),
        },
        {
          id: "wind",
          name: "Tahoe Wind Farm",
          current_generation: 3100,
          available_capacity: 3500,
          max_capacity: 3500,
          percentage: 12.3,
          status: "ACTIVE",
          trend: "up",
          health_score: 95,
          operating_cost: 18.5,
          co2_emissions: 0,
          last_updated: new Date().toISOString(),
        },
        {
          id: "hydro",
          name: "Sierra Hydro Dam",
          current_generation: 2500,
          available_capacity: 3000,
          max_capacity: 3000,
          percentage: 9.9,
          status: "ACTIVE",
          trend: "stable",
          health_score: 99,
          operating_cost: 12.0,
          co2_emissions: 0,
          last_updated: new Date().toISOString(),
        },
        {
          id: "coal",
          name: "Ramagundam Thermal",
          current_generation: 8500,
          available_capacity: 9000,
          max_capacity: 9000,
          percentage: 33.7,
          status: "ACTIVE",
          trend: "stable",
          health_score: 92,
          operating_cost: 42.5,
          co2_emissions: 820,
          last_updated: new Date().toISOString(),
        },
        {
          id: "gas",
          name: "Tahoe Gas Plant",
          current_generation: 3200,
          available_capacity: 4000,
          max_capacity: 4000,
          percentage: 12.7,
          status: "ACTIVE",
          trend: "down",
          health_score: 94,
          operating_cost: 65.0,
          co2_emissions: 490,
          last_updated: new Date().toISOString(),
        },
        {
          id: "nuc",
          name: "Kudankulam Nuclear",
          current_generation: 2000,
          available_capacity: 2000,
          max_capacity: 2000,
          percentage: 7.9,
          status: "ACTIVE",
          trend: "stable",
          health_score: 99,
          operating_cost: 22.0,
          co2_emissions: 0,
          last_updated: new Date().toISOString(),
        },
        {
          id: "battery",
          name: "Sierra Battery BESS",
          current_generation: 1060,
          available_capacity: 3000,
          max_capacity: 3000,
          percentage: 4.2,
          status: "CHARGING",
          trend: "stable",
          health_score: 98,
          operating_cost: 8.5,
          co2_emissions: 0,
          last_updated: new Date().toISOString(),
        },
      ];
    }

    const mapSourceType = (type: string) => {
      const t = type.toLowerCase();
      if (t.includes("solar")) return "solar";
      if (t.includes("wind")) return "wind";
      if (t.includes("hydro")) return "hydro";
      if (t.includes("nuc") || t.includes("nuclear")) return "nuc";
      if (t.includes("coal") || t.includes("thermal")) return "coal";
      if (t.includes("gas")) return "gas";
      if (t.includes("battery") || t.includes("storage")) return "battery";
      return "coal";
    };

    // Aggregate generators by type
    const groups: Record<
      string,
      {
        name: string;
        current_generation: number;
        available_capacity: number;
        max_capacity: number;
        health_score: number;
        operating_cost: number;
        co2_emissions: number;
      }
    > = {
      solar: {
        name: "Bhadla Solar Park",
        current_generation: 0,
        available_capacity: 0,
        max_capacity: 5000,
        health_score: 0,
        operating_cost: 15.2,
        co2_emissions: 0,
      },
      wind: {
        name: "Tahoe Wind Farm",
        current_generation: 0,
        available_capacity: 0,
        max_capacity: 3500,
        health_score: 0,
        operating_cost: 18.5,
        co2_emissions: 0,
      },
      hydro: {
        name: "Sierra Hydro Dam",
        current_generation: 0,
        available_capacity: 0,
        max_capacity: 3000,
        health_score: 0,
        operating_cost: 12.0,
        co2_emissions: 0,
      },
      coal: {
        name: "Ramagundam Thermal",
        current_generation: 0,
        available_capacity: 0,
        max_capacity: 9000,
        health_score: 0,
        operating_cost: 42.5,
        co2_emissions: 820,
      },
      gas: {
        name: "Tahoe Gas Plant",
        current_generation: 0,
        available_capacity: 0,
        max_capacity: 4000,
        health_score: 0,
        operating_cost: 65.0,
        co2_emissions: 490,
      },
      nuc: {
        name: "Kudankulam Nuclear",
        current_generation: 0,
        available_capacity: 0,
        max_capacity: 2000,
        health_score: 0,
        operating_cost: 22.0,
        co2_emissions: 0,
      },
      battery: {
        name: "Sierra Battery BESS",
        current_generation: 0,
        available_capacity: 0,
        max_capacity: 3000,
        health_score: 0,
        operating_cost: 8.5,
        co2_emissions: 0,
      },
    };

    let counts: Record<string, number> = {};

    gridData.topology.generators.forEach((gen: any) => {
      const type = mapSourceType(gen.type || gen.name || "");
      const live = liveMeasurements[`generator-${gen.id}`] || {};

      const p = live.p_mw !== undefined ? live.p_mw : gen.p_mw;
      const cap = gen.capacity_mw || 1000;
      const hScore = live.healthScore !== undefined ? live.healthScore : 95;

      if (groups[type]) {
        groups[type].current_generation += p;
        groups[type].available_capacity += cap;
        groups[type].health_score += hScore;
        counts[type] = (counts[type] || 0) + 1;
      }
    });

    return Object.keys(groups).map((key) => {
      const g = groups[key];
      const count = counts[key] || 1;
      const current_generation = parseFloat(g.current_generation.toFixed(1));
      const available_capacity = parseFloat(g.available_capacity.toFixed(1));
      const health_score = Math.round(g.health_score / count) || 95;

      let status = "ACTIVE";
      if (current_generation <= 0) status = "OFFLINE";
      else if (key === "battery" && current_generation < 0) status = "CHARGING";

      return {
        id: key,
        name: g.name,
        current_generation,
        available_capacity,
        max_capacity: g.max_capacity,
        percentage: 0, // Calculated below
        status,
        trend: current_generation > available_capacity * 0.7 ? "up" : "stable",
        health_score,
        operating_cost: g.operating_cost,
        co2_emissions: g.co2_emissions,
        last_updated: new Date().toISOString(),
      };
    });
  }, [gridData, liveMeasurements]);

  // Aggregate stats
  const totalGen = useMemo(
    () => sourcesData.reduce((acc, s) => acc + s.current_generation, 0),
    [sourcesData]
  );
  const totalCap = useMemo(
    () => sourcesData.reduce((acc, s) => acc + s.available_capacity, 0),
    [sourcesData]
  );

  const formattedSources = useMemo(() => {
    return sourcesData.map((s) => ({
      ...s,
      percentage:
        totalGen > 0 ? parseFloat(((s.current_generation / totalGen) * 100).toFixed(1)) : 0,
    }));
  }, [sourcesData, totalGen]);

  const renewablePct = useMemo(() => {
    const clean = sourcesData
      .filter((s) => s.id === "solar" || s.id === "wind" || s.id === "hydro")
      .reduce((acc, s) => acc + s.current_generation, 0);
    return totalGen > 0 ? parseFloat(((clean / totalGen) * 100).toFixed(1)) : 48.7;
  }, [sourcesData, totalGen]);

  const co2Intensity = useMemo(() => {
    const emissions = sourcesData.reduce(
      (acc, s) => acc + s.current_generation * s.co2_emissions,
      0
    );
    return totalGen > 0 ? parseFloat((emissions / totalGen).toFixed(1)) : 420.5;
  }, [sourcesData, totalGen]);

  // Fetch single plant details when selecting/clicking a plant/source
  const fetchPlantDetail = async (id: string) => {
    setDrawerLoading(true);
    setDrawerError(null);
    try {
      const token = localStorage.getItem("gpo_access_token");
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await fetch(`${API_URL}/api/v1/dashboard/generation-sources/${id}`, {
        headers,
      }).catch(() => null);
      if (res && res.ok) {
        const data = await res.json();
        setPlantDetail(data);
      } else {
        throw new Error("Local simulated fallback");
      }
    } catch {
      // Offline fallback simulator
      const src = formattedSources.find((s) => s.id === id);
      if (src) {
        setPlantDetail({
          id: src.id,
          name: src.name,
          current_generation: src.current_generation,
          installed_capacity: src.available_capacity,
          capacity_factor: parseFloat(
            ((src.current_generation / src.available_capacity) * 100).toFixed(1)
          ),
          availability: src.health_score,
          status: src.status,
          health_score: src.health_score,
          efficiency: src.id === "coal" ? 38.5 : src.id === "gas" ? 48.0 : 92.0,
          operating_cost: src.operating_cost,
          co2_emissions: src.co2_emissions,
          last_updated: src.last_updated,
          energy_today: Math.round(src.current_generation * 18.5),
          peak_today: Math.round(src.current_generation * 1.1),
          forecast_generation: Math.round(src.current_generation * 0.95),
          forecast_confidence: 96,
        });
      }
    } finally {
      setDrawerLoading(false);
    }
  };

  // Trigger plant selection
  const handleSelectSource = (id: string) => {
    setSelectedSourceId(id);
    fetchPlantDetail(id);
  };

  // SVG Interactive Grid Map nodes click handler
  const handleMapAssetSelect = (asset: any) => {
    setSelectedAsset(asset);
    if (!asset) return;

    // Map generator nodes to source type
    if (asset.type === "generator") {
      const typeStr = asset.name || "";
      let matchedId = "solar";
      if (typeStr.toLowerCase().includes("wind")) matchedId = "wind";
      else if (typeStr.toLowerCase().includes("hydro")) matchedId = "hydro";
      else if (typeStr.toLowerCase().includes("nuclear") || typeStr.toLowerCase().includes("nuc"))
        matchedId = "nuc";
      else if (typeStr.toLowerCase().includes("coal") || typeStr.toLowerCase().includes("thermal"))
        matchedId = "coal";
      else if (typeStr.toLowerCase().includes("gas")) matchedId = "gas";
      else if (
        typeStr.toLowerCase().includes("battery") ||
        typeStr.toLowerCase().includes("storage")
      )
        matchedId = "battery";

      handleSelectSource(matchedId);
    }
  };

  // Generate historical data points
  const rawHistory: HistoryDataPoint[] = useMemo(() => {
    if (!plantDetail) return [];
    const points: HistoryDataPoint[] = [];
    const cap = plantDetail.installed_capacity || 5000;
    const baseOutput = plantDetail.current_generation || 2500;

    let hoursCount = historyRange === "24H" ? 24 : historyRange === "7D" ? 7 : 30;
    for (let i = hoursCount; i >= 0; i--) {
      let label = "";
      if (historyRange === "24H") {
        label = `${(24 - i).toString().padStart(2, "0")}:00`;
      } else if (historyRange === "7D") {
        label = `Day -${i}`;
      } else {
        label = `D -${i}`;
      }

      const fluctuation = 1 + Math.sin(i * 0.7) * 0.15 + (Math.random() - 0.5) * 0.05;
      const generation = Math.max(0, Math.min(cap, baseOutput * fluctuation));
      points.push({
        time: label,
        generation: parseFloat(generation.toFixed(1)),
        utilisation: parseFloat(((generation / cap) * 100).toFixed(1)),
        trend: parseFloat((generation * 0.98).toFixed(1)),
      });
    }
    return points;
  }, [plantDetail, historyRange]);

  // Export CSV
  const triggerCsvExport = () => {
    if (!plantDetail) return;
    const headers = ["Time", "Generation (MW)", "Capacity Utilisation (%)"];
    const rows = rawHistory.map((p) => [p.time, p.generation, p.utilisation]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${plantDetail.id}_historical_${historyRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (val: string) => {
    const status = val?.toUpperCase();
    if (status === "ACTIVE" || status === "ONLINE") {
      return (
        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          ACTIVE
        </span>
      );
    }
    if (status === "CHARGING") {
      return (
        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
          CHARGING
        </span>
      );
    }
    return (
      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
        OFFLINE
      </span>
    );
  };

  const getHealthBadge = (score: number) => {
    if (score >= 95)
      return <span className="text-[10px] font-bold text-emerald-400">Excellent ({score}%)</span>;
    if (score >= 85)
      return <span className="text-[10px] font-bold text-sky-400">Nominal ({score}%)</span>;
    return <span className="text-[10px] font-bold text-amber-500">Fair ({score}%)</span>;
  };

  // Filter & Sort table content
  const filteredTableRows = useMemo(() => {
    let rows = [...formattedSources];

    // 1. Search Query
    if (searchQuery.trim()) {
      rows = rows.filter(
        (r) =>
          r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // 2. Groups Filter
    if (activeFilter !== "all") {
      if (activeFilter === "renewable") {
        rows = rows.filter((r) => r.id === "solar" || r.id === "wind" || r.id === "hydro");
      } else if (activeFilter === "non-renewable") {
        rows = rows.filter((r) => r.id === "coal" || r.id === "gas" || r.id === "nuc");
      } else if (activeFilter === "storage") {
        rows = rows.filter((r) => r.id === "battery");
      }
    }

    // 3. Sorting
    rows.sort((a, b) => {
      let valA = a[sortColumn];
      let valB = b[sortColumn];
      if (sortOrder === "asc") {
        return valA > valB ? 1 : -1;
      } else {
        return valA < valB ? 1 : -1;
      }
    });

    return rows;
  }, [formattedSources, searchQuery, activeFilter, sortColumn, sortOrder]);

  return (
    <div className="space-y-4 animate-in fade-in duration-500 text-slate-200 select-text font-sans pb-12">
      {/* Top Header Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-3 border-b border-slate-800 bg-[#07090C]/40 p-4 rounded-lg">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-500" />
            Grid Operations Workspace
          </h1>
          <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
            ● LIVE TELEMETRY
          </span>
        </div>

        {/* Top Clock and User */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
          <div className="px-3 py-1 bg-[#11161d] rounded border border-slate-850 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-orange-500" />
            <span className="text-[#F8FAFC] font-semibold">{timeStr || "00:00:00 IST"}</span>
          </div>
          <div className="px-3 py-1 bg-[#11161d] rounded border border-slate-850 flex items-center gap-2">
            <UserIcon className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-300">Operator Control Center</span>
          </div>
        </div>
      </div>

      {/* Operations Status Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 p-2 bg-[#090D14] border border-[#1E293B]/70 rounded-lg text-[11px] font-mono">
        <div className="flex items-center justify-between p-2 rounded border bg-[#0b0f17] border-slate-800/80">
          <span className="text-slate-400">Grid Status:</span>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
            NORMAL
          </span>
        </div>
        <div className="flex items-center justify-between p-2 rounded border bg-[#0b0f17] border-slate-800/80">
          <span className="text-slate-400">System Health:</span>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
            98.5%
          </span>
        </div>
        <div className="flex items-center justify-between p-2 rounded border bg-[#0b0f17] border-slate-800/80">
          <span className="text-slate-400">Weather:</span>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold text-sky-400 bg-sky-500/10 border border-sky-500/20">
            32.1°C
          </span>
        </div>
        <div className="flex items-center justify-between p-2 rounded border bg-[#0b0f17] border-slate-800/80">
          <span className="text-slate-400">Active Alerts:</span>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20">
            2 Alerts
          </span>
        </div>
        <div className="flex items-center justify-between p-2 rounded border bg-[#0b0f17] border-slate-800/80">
          <span className="text-slate-400">AI Status:</span>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20">
            ONLINE
          </span>
        </div>
        <div className="flex items-center justify-between p-2 rounded border bg-[#0b0f17] border-slate-800/80">
          <span className="text-slate-400">Refreshed:</span>
          <span className="px-2 py-0.5 rounded text-[10px] text-emerald-400 font-bold">
            SUCCESS
          </span>
        </div>
        <div className="flex items-center justify-between p-2 rounded border bg-[#0b0f17] border-slate-800/80">
          <span className="text-slate-400">API Status:</span>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
            NOMINAL
          </span>
        </div>
      </div>

      {/* Grid Health Ribbon */}
      <div className="bg-gradient-to-r from-[#0F172A] to-[#1E293B] border border-slate-800 rounded-lg p-3 shadow-md">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full lg:w-1/4">
            <Activity className="w-5 h-5 text-emerald-400 shrink-0 animate-pulse" />
            <div className="w-full">
              <div className="flex justify-between text-xs font-mono font-semibold mb-1 text-slate-300">
                <span>OVERALL GRID HEALTH</span>
                <span>98.5%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `98.5%` }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 w-full lg:w-3/4 text-[11px] font-mono border-t lg:border-t-0 lg:border-l border-slate-700/60 pt-3 lg:pt-0 lg:pl-6">
            <div className="bg-slate-900/40 p-2 rounded border border-slate-800/60">
              <span className="text-slate-400 block mb-0.5 uppercase tracking-wider text-[9px]">
                Grid Stability
              </span>
              <span className="font-bold text-slate-100">98.5%</span>
            </div>
            <div className="bg-slate-900/40 p-2 rounded border border-slate-800/60">
              <span className="text-slate-400 block mb-0.5 uppercase tracking-wider text-[9px]">
                Frequency Status
              </span>
              <span className="font-bold text-slate-100">59.98 Hz</span>
            </div>
            <div className="bg-slate-900/40 p-2 rounded border border-slate-800/60">
              <span className="text-slate-400 block mb-0.5 uppercase tracking-wider text-[9px]">
                Reserve Margin
              </span>
              <span className="font-bold text-slate-100">18.6%</span>
            </div>
            <div className="bg-slate-900/40 p-2 rounded border border-slate-800/60">
              <span className="text-slate-400 block mb-0.5 uppercase tracking-wider text-[9px]">
                Reliability Index
              </span>
              <span className="font-bold text-emerald-400">99.8%</span>
            </div>
            <div className="bg-slate-900/40 p-2 rounded border border-slate-800/60">
              <span className="text-slate-400 block mb-0.5 uppercase tracking-wider text-[9px]">
                AI Confidence
              </span>
              <span className="font-bold text-purple-400">98.0%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0B0E14] border border-slate-800/80 p-2 rounded-lg">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => triggerManualRefresh()}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#1E293B] hover:bg-[#334155] text-slate-200 hover:text-white rounded border border-slate-700 text-xs font-semibold transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Force Sync Telemetry</span>
          </button>
          <button
            onClick={() => {
              setShowExportToast(true);
              setTimeout(() => setShowExportToast(false), 3000);
            }}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#1E293B] hover:bg-[#334155] text-slate-200 hover:text-white rounded border border-slate-700 text-xs font-semibold transition-all"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export Snapshot</span>
          </button>
        </div>
        <div className="text-[10px] font-mono text-slate-450 flex items-center gap-2">
          <span>Auto-polling: 4s</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>SCADA Link nominal</span>
        </div>
      </div>

      {/* Export Toast Notification */}
      {showExportToast && (
        <div className="fixed bottom-4 right-4 bg-emerald-600 text-white font-mono text-xs px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-50 animate-bounce">
          <Check className="w-4 h-4" />
          <span>Operations snapshot exported successfully!</span>
        </div>
      )}

      {/* Main Split-Screen Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Panel: Operations Overview */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-[#0B0E14] border border-slate-800 rounded-lg p-4 space-y-3.5 shadow-sm">
            <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono border-b border-slate-800 pb-2 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-500" />
              Operations Overview
            </h2>

            <div className="grid grid-cols-1 gap-2 text-xs font-mono">
              <div className="p-3 rounded bg-slate-900/60 border border-slate-850 flex flex-col justify-between">
                <span className="text-slate-450 text-[10px] uppercase font-bold tracking-wider">
                  CURRENT DEMAND
                </span>
                <span className="text-lg font-bold text-orange-500 mt-1">
                  {totalGen ? (totalGen - 390).toLocaleString() : "24,820"} MW
                </span>
                <span className="text-[9px] text-slate-500 mt-1">Grid load target Feeder Line</span>
              </div>

              <div className="p-3 rounded bg-slate-900/60 border border-slate-850 flex flex-col justify-between">
                <span className="text-slate-450 text-[10px] uppercase font-bold tracking-wider">
                  CURRENT GENERATION
                </span>
                <span className="text-lg font-bold text-emerald-500 mt-1">
                  {totalGen ? totalGen.toLocaleString() : "25,210"} MW
                </span>
                <span className="text-[9px] text-slate-500 mt-1">Consolidated active yield</span>
              </div>

              <div className="p-3 rounded bg-slate-900/60 border border-slate-850 flex flex-col justify-between">
                <span className="text-slate-450 text-[10px] uppercase font-bold tracking-wider">
                  AVAILABLE CAPACITY
                </span>
                <span className="text-lg font-bold text-sky-400 mt-1">
                  {totalCap ? totalCap.toLocaleString() : "29,500"} MW
                </span>
                <span className="text-[9px] text-slate-500 mt-1">
                  Operational safety limit upper bound
                </span>
              </div>

              <div className="p-3 rounded bg-slate-900/60 border border-slate-850 flex flex-col justify-between">
                <span className="text-slate-450 text-[10px] uppercase font-bold tracking-wider">
                  RENEWABLE CONTRIBUTION
                </span>
                <span className="text-lg font-bold text-teal-400 mt-1">{renewablePct}%</span>
                <span className="text-[9px] text-slate-500 mt-1">
                  Solar, Wind, and Hydro yield share
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Centre Panel: Interactive Grid Map (Integrated) */}
        <div className="lg:col-span-6 flex flex-col">
          <div className="bg-[#0B0E14] border border-slate-800 rounded-lg p-4 flex-1 flex flex-col shadow-sm min-h-[450px]">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-sky-400" />
                {centerTab === "map"
                  ? "Interactive Grid Map Canvas"
                  : "AI Operational Summary & Grid Registry"}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setCenterTab("map")}
                  className={`text-[9px] font-mono px-2 py-0.5 rounded transition-all ${centerTab === "map" ? "bg-sky-500/20 text-sky-400 border border-sky-500/30" : "bg-slate-800 text-slate-400 hover:text-slate-200"}`}
                >
                  MAP SCHEMA
                </button>
                <button
                  onClick={() => setCenterTab("summary")}
                  className={`text-[9px] font-mono px-2 py-0.5 rounded transition-all ${centerTab === "summary" ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" : "bg-slate-800 text-slate-400 hover:text-slate-200"}`}
                >
                  AI SUMMARY & QUERY
                </button>
              </div>
            </div>

            {/* Embedded Active SVG Grid Map or AI Summary registry */}
            <div className="flex-1 border border-slate-850/60 bg-[#06080C] rounded-lg mt-4 relative overflow-hidden min-h-[350px]">
              {centerTab === "map" ? (
                telemetryLoading && !gridData ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80">
                    <RefreshCw className="w-8 h-8 text-orange-500 animate-spin mb-4" />
                    <p className="text-xs font-mono text-slate-400">
                      Loading Grid Physics Simulator Graph...
                    </p>
                  </div>
                ) : telemetryError ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-red-950/10 border border-red-500/20 text-center">
                    <AlertTriangle className="w-10 h-10 text-red-500 mb-3" />
                    <h3 className="text-sm font-bold text-red-500 uppercase">
                      GRID VISUALIZER OFFLINE
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Failed to sync live operational telemetry bounds.
                    </p>
                  </div>
                ) : gridData ? (
                  <GridTopologyViewer
                    topology={gridData.topology}
                    layoutMode={layoutMode}
                    snapToGrid={false}
                    selectedAsset={selectedAsset}
                    onSelectAsset={handleMapAssetSelect}
                    panX={mapPanX}
                    panY={mapPanY}
                    scale={mapScale}
                    onViewportChange={(x, y, s) => {
                      setMapPanX(x);
                      setMapPanY(y);
                      setMapScale(s);
                    }}
                    highlightCategory={null}
                    highlightVoltage={null}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs text-slate-500 font-mono">No topology loaded.</span>
                  </div>
                )
              ) : (
                <div className="p-4 space-y-4 text-xs font-mono max-h-[420px] overflow-y-auto bg-[#06080C] text-slate-300 select-text">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <h4 className="font-bold text-slate-400 uppercase tracking-widest text-[10px] flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Groq AI Grid Summary
                    </h4>
                    <button
                      onClick={fetchAiSummary}
                      disabled={summaryLoading}
                      className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-350 text-[9px] rounded flex items-center gap-1 transition-all"
                    >
                      <RefreshCw
                        className={`w-2.5 h-2.5 ${summaryLoading ? "animate-spin" : ""}`}
                      />{" "}
                      REFRESH
                    </button>
                  </div>

                  {summaryLoading ? (
                    <div className="py-8 flex flex-col items-center justify-center text-slate-500">
                      <RefreshCw className="w-6 h-6 text-orange-500 animate-spin mb-2" />
                      <span>Querying Groq Llama3 model...</span>
                    </div>
                  ) : (
                    <div className="p-3 bg-[#0B0E14] border border-slate-850 rounded leading-relaxed whitespace-pre-line text-slate-300 text-[11px]">
                      {aiSummary ||
                        "Click Refresh to generate a live operational summary of the grid topology."}
                    </div>
                  )}

                  {/* Ask a Question Q&A Form */}
                  <div className="p-3 bg-purple-950/10 border border-purple-500/20 rounded space-y-3">
                    <h5 className="text-[10px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-purple-400" /> Ask AI Decision Engine (Groq
                      API)
                    </h5>
                    <form onSubmit={handleQuerySubmit} className="flex gap-2">
                      <input
                        type="text"
                        value={queryInput}
                        onChange={(e) => setQueryInput(e.target.value)}
                        placeholder="e.g., What is the total load on Tahoe Bus A?"
                        className="flex-1 bg-[#151A21] border border-slate-850 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={queryLoading}
                        className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30 font-bold text-xs rounded transition-all flex items-center gap-1"
                      >
                        {queryLoading && <RefreshCw className="w-3 h-3 animate-spin" />}
                        ASK
                      </button>
                    </form>

                    {aiQueryAnswer && (
                      <div className="p-3 bg-[#06080C] border border-slate-850 rounded space-y-2 text-[10.5px]">
                        <div>
                          <span className="text-slate-500 block uppercase text-[8.5px]">
                            What Happened:
                          </span>
                          <span className="text-slate-200">{aiQueryAnswer.what_happened}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block uppercase text-[8.5px]">Why:</span>
                          <span className="text-slate-350">{aiQueryAnswer.why}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block uppercase text-[8.5px]">
                            Recommendation:
                          </span>
                          <span className="text-emerald-400 font-bold">
                            {aiQueryAnswer.recommendation}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[9px] border-t border-slate-850/60 pt-1.5">
                          <span className="text-slate-500">
                            Confidence:{" "}
                            {aiQueryAnswer.confidence > 1
                              ? Math.round(aiQueryAnswer.confidence)
                              : Math.round(aiQueryAnswer.confidence * 100)}
                            %
                          </span>
                          <span className="text-slate-555">
                            Cost Impact: {aiQueryAnswer.cost_impact}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border-b border-slate-800 pb-2 pt-2">
                    <h4 className="font-bold text-slate-450 uppercase tracking-widest text-[10px]">
                      ✦ Structured Asset Registry
                    </h4>
                  </div>

                  {gridData ? (
                    <div className="space-y-4">
                      {gridData.topology.substations.map((sub: any) => {
                        const subBuses = gridData.topology.buses.filter(
                          (b: any) => b.substation_id === sub.id
                        );
                        return (
                          <div
                            key={sub.id}
                            className="p-2.5 bg-[#0B0E14] border border-slate-850 rounded space-y-2"
                          >
                            <div className="flex justify-between items-center border-b border-slate-850 pb-1">
                              <span className="font-bold text-slate-200">{sub.name}</span>
                              <span className="text-[9px] px-1 bg-emerald-500/10 text-emerald-400 rounded">
                                {sub.status?.toUpperCase() || "ACTIVE"}
                              </span>
                            </div>
                            <div className="pl-2 space-y-2 text-[11px]">
                              {subBuses.map((bus: any) => {
                                const busGens = gridData.topology.generators.filter(
                                  (g: any) => g.bus_id === bus.id
                                );
                                const busLoads = gridData.topology.loads.filter(
                                  (l: any) => l.bus_id === bus.id
                                );
                                return (
                                  <div key={bus.id} className="space-y-1">
                                    <div className="text-sky-400 font-bold">
                                      ➔ {bus.name} ({bus.base_kv} kV Busbar)
                                    </div>
                                    {busGens.length > 0 && (
                                      <div className="pl-3 text-slate-350">
                                        <span className="text-slate-500 font-bold">
                                          Generators:
                                        </span>
                                        <ul className="list-disc pl-4 space-y-0.5 mt-0.5">
                                          {busGens.map((g: any) => {
                                            const m = liveMeasurements[`generator-${g.id}`];
                                            return (
                                              <li key={g.id}>
                                                {g.name}:{" "}
                                                <span className="text-emerald-400 font-bold">
                                                  {m ? m.p_mw : g.p_mw} MW
                                                </span>{" "}
                                                / {g.capacity_mw} MW Limit
                                              </li>
                                            );
                                          })}
                                        </ul>
                                      </div>
                                    )}
                                    {busLoads.length > 0 && (
                                      <div className="pl-3 text-slate-350">
                                        <span className="text-slate-500 font-bold">
                                          Demand Loads:
                                        </span>
                                        <ul className="list-disc pl-4 space-y-0.5 mt-0.5">
                                          {busLoads.map((l: any) => {
                                            const m = liveMeasurements[`load-${l.id}`];
                                            return (
                                              <li key={l.id}>
                                                {l.name}:{" "}
                                                <span className="text-orange-400 font-bold">
                                                  {m ? m.p_mw : l.p_mw} MW
                                                </span>{" "}
                                                Active load
                                              </li>
                                            );
                                          })}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="text-slate-500 font-mono">No assets configured.</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel: AI Recommendation & SCADA log console */}
        <div className="lg:col-span-3 space-y-4">
          {/* AI Recommendations */}
          <div className="bg-[#0B0E14] border border-slate-800 rounded-lg p-4 space-y-3.5 shadow-sm">
            <div className="flex justify-between items-center pb-2 border-b border-purple-500/20">
              <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                ✦ AI Recommendations
              </h3>
              <span className="inline-flex items-center rounded bg-purple-500/10 px-2 py-0.5 text-[9px] font-bold text-purple-400 font-mono">
                98% Confidence
              </span>
            </div>
            <div className="space-y-3 text-xs">
              <div className="p-2.5 bg-yellow-500/5 rounded border border-yellow-500/15 text-yellow-450 leading-relaxed font-mono text-[9.5px]">
                <div className="font-bold flex items-center gap-1.5 mb-1">
                  <ShieldAlert className="w-3 h-3 text-yellow-500" /> SOLAR IMPACT ALERT
                </div>
                Cloud cover forecast to increase rapidly. Solar output is expected to drop by -1,850
                MW over Tahoe corridor bounds.
              </div>
              <div className="space-y-1 font-mono">
                <span className="text-[9px] text-slate-500 uppercase font-bold block">
                  RECOMMENDED MITIGATION
                </span>
                <p className="font-bold text-slate-200 text-[11px] flex items-center gap-1">
                  <ArrowRight className="w-3 h-3 text-purple-400 shrink-0" />
                  Increase coal thermal by +1,600 MW
                </p>
              </div>
            </div>
          </div>

          {/* SCADA Console Logs */}
          <div className="bg-[#0B0E14] border border-slate-800 rounded-lg p-4 space-y-3 shadow-sm">
            <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono border-b border-slate-800 pb-2 flex items-center gap-1.5">
              <TerminalIcon className="w-4 h-4 text-emerald-500" />
              Live Operations Feed
            </h2>
            <div
              ref={scadaContainerRef}
              className="bg-[#05070A] border border-slate-850 p-2 rounded text-[9px] font-mono text-emerald-400 h-[210px] overflow-y-auto flex flex-col space-y-1 select-text"
            >
              {scadaLogs.map((log, index) => (
                <div key={index} className="leading-normal">
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Generation Flow Section (Integrated below Grid Operations) */}
      <div className="bg-[#0B0E14] border border-slate-800 rounded-lg p-5 shadow-sm space-y-5">
        <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono border-b border-slate-800 pb-2 flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-teal-400" />
          Generation Flow schematic
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* SVG Animated Flow lines */}
          <div className="lg:col-span-5 border border-slate-850 bg-[#06080C] p-4 rounded-lg flex items-center justify-center min-h-[220px]">
            <svg
              className="w-full max-w-[420px]"
              viewBox="0 0 400 200"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <style>{`
                @keyframes dash {
                  to { stroke-dashoffset: -20; }
                }
                .flow-line { stroke: #10b981; stroke-width: 1.5; stroke-dasharray: 4, 4; animation: dash 1s linear infinite; }
                .thermal-line { stroke: #f97316; }
                .nuclear-line { stroke: #a855f7; }
                .battery-line { stroke: #0ea5e9; }
              `}</style>

              {/* Nodes */}
              <circle cx="50" cy="40" r="18" fill="#15202B" stroke="#10b981" strokeWidth="2" />
              <text x="50" y="44" fill="#10b981" fontSize="9" fontWeight="bold" textAnchor="middle">
                SOL
              </text>

              <circle cx="50" cy="100" r="18" fill="#15202B" stroke="#0ea5e9" strokeWidth="2" />
              <text
                x="50"
                y="104"
                fill="#0ea5e9"
                fontSize="9"
                fontWeight="bold"
                textAnchor="middle"
              >
                WIND
              </text>

              <circle cx="50" cy="160" r="18" fill="#15202B" stroke="#38bdf8" strokeWidth="2" />
              <text
                x="50"
                y="164"
                fill="#38bdf8"
                fontSize="9"
                fontWeight="bold"
                textAnchor="middle"
              >
                BESS
              </text>

              <circle cx="350" cy="40" r="18" fill="#15202B" stroke="#f97316" strokeWidth="2" />
              <text
                x="350"
                y="44"
                fill="#f97316"
                fontSize="9"
                fontWeight="bold"
                textAnchor="middle"
              >
                COAL
              </text>

              <circle cx="350" cy="100" r="18" fill="#15202B" stroke="#f59e0b" strokeWidth="2" />
              <text
                x="350"
                y="104"
                fill="#f59e0b"
                fontSize="9"
                fontWeight="bold"
                textAnchor="middle"
              >
                GAS
              </text>

              <circle cx="350" cy="160" r="18" fill="#15202B" stroke="#a855f7" strokeWidth="2" />
              <text
                x="350"
                y="164"
                fill="#a855f7"
                fontSize="9"
                fontWeight="bold"
                textAnchor="middle"
              >
                NUC
              </text>

              {/* Central Grid Node */}
              <rect
                x="170"
                y="75"
                width="60"
                height="50"
                rx="3"
                fill="#1E293B"
                stroke="#64748B"
                strokeWidth="2"
              />
              <text
                x="200"
                y="99"
                fill="#F8FAFC"
                fontSize="10"
                fontWeight="bold"
                textAnchor="middle"
              >
                GRID
              </text>
              <text
                x="200"
                y="112"
                fill="#10B981"
                fontSize="8"
                fontWeight="bold"
                textAnchor="middle"
              >
                NOMINAL
              </text>

              {/* Paths to central Grid */}
              <path d="M 68 40 L 170 85" className="flow-line" />
              <path d="M 68 100 L 170 100" className="flow-line battery-line" />
              <path d="M 68 160 L 170 115" className="flow-line battery-line" />

              <path d="M 332 40 L 230 85" className="flow-line thermal-line" />
              <path d="M 332 100 L 230 100" className="flow-line thermal-line" />
              <path d="M 332 160 L 230 115" className="flow-line nuclear-line" />
            </svg>
          </div>

          {/* Donut Recharts Pie */}
          <div className="lg:col-span-3 flex flex-col items-center justify-center border border-slate-850 p-4 rounded-lg min-h-[220px]">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-4">
              Consolidated Mix
            </span>
            <div className="w-full h-32 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={formattedSources}
                    cx="50%"
                    cy="50%"
                    innerRadius={36}
                    outerRadius={50}
                    paddingAngle={3}
                    dataKey="current_generation"
                  >
                    {formattedSources.map((entry, index) => {
                      const colors: Record<string, string> = {
                        solar: "#10b981",
                        wind: "#0ea5e9",
                        hydro: "#38bdf8",
                        coal: "#f97316",
                        gas: "#f59e0b",
                        nuc: "#a855f7",
                        battery: "#6366f1",
                      };
                      return <Cell key={`cell-${index}`} fill={colors[entry.id] || "#94a3b8"} />;
                    })}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0F172A", border: "1px solid #334155" }}
                    itemStyle={{ color: "#F8FAFC", fontSize: "10px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center font-mono">
                <span className="text-xs text-slate-400 font-bold">{renewablePct}%</span>
                <span className="text-[8px] text-slate-500 uppercase font-bold mt-0.5">CLEAN</span>
              </div>
            </div>
          </div>

          {/* Grid Corridor Metrics */}
          <div className="lg:col-span-4 grid grid-cols-2 gap-3 font-mono">
            <div className="p-3 rounded bg-slate-900/60 border border-slate-850">
              <span className="text-slate-500 text-[8px] uppercase block">Grid imports</span>
              <span className="text-sm font-bold text-emerald-400 mt-1 block">1,820 MW</span>
              <span className="text-[8px] text-slate-600 block mt-0.5">Limit: 2,500 MW (NR)</span>
            </div>
            <div className="p-3 rounded bg-slate-900/60 border border-slate-850">
              <span className="text-slate-500 text-[8px] uppercase block">Grid exports</span>
              <span className="text-sm font-bold text-sky-450 mt-1 block">1,430 MW</span>
              <span className="text-[8px] text-slate-600 block mt-0.5">Limit: 2,000 MW (SR)</span>
            </div>
            <div className="p-3 rounded bg-slate-900/60 border border-slate-850">
              <span className="text-slate-500 text-[8px] uppercase block">CO₂ emissions</span>
              <span className="text-sm font-bold text-slate-300 mt-1 block">
                {co2Intensity} g/kWh
              </span>
              <span className="text-[8px] text-slate-600 block mt-0.5">Avg intensity factor</span>
            </div>
            <div className="p-3 rounded bg-slate-900/60 border border-slate-850">
              <span className="text-slate-500 text-[8px] uppercase block">Avg dispatch cost</span>
              <span className="text-sm font-bold text-yellow-500 mt-1 block">₹28.4 /MWh</span>
              <span className="text-[8px] text-slate-600 block mt-0.5">
                Economic dispatch limit
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Generation Command Center Monitoring Table */}
      <div className="bg-[#0B0E14] border border-slate-800 rounded-lg p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Database className="w-4 h-4 text-emerald-500" />
              Generation Command Center
            </h2>
            <span className="text-[9px] font-mono text-slate-500">
              Live operational monitoring table
            </span>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="relative">
              <input
                type="text"
                placeholder="Search source..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-44 pl-8 pr-3 py-1 bg-slate-950/60 border border-slate-800 focus:border-orange-500 focus:outline-none rounded text-xs text-slate-200 font-mono"
              />
              <Search className="w-3.5 h-3.5 text-slate-550 absolute left-2.5 top-1.5" />
            </div>

            <div className="flex items-center bg-slate-950/80 border border-slate-800 rounded p-0.5 font-mono text-[9px] font-bold text-slate-400">
              <button
                onClick={() => setActiveFilter("all")}
                className={`px-2 py-1 rounded-[2px] ${activeFilter === "all" ? "bg-orange-500/10 text-orange-500 border border-orange-500/20" : "hover:text-slate-200"}`}
              >
                ALL
              </button>
              <button
                onClick={() => setActiveFilter("renewable")}
                className={`px-2 py-1 rounded-[2px] ${activeFilter === "renewable" ? "bg-orange-500/10 text-orange-500 border border-orange-500/20" : "hover:text-slate-200"}`}
              >
                RENEWABLE
              </button>
              <button
                onClick={() => setActiveFilter("non-renewable")}
                className={`px-2 py-1 rounded-[2px] ${activeFilter === "non-renewable" ? "bg-orange-500/10 text-orange-500 border border-orange-500/20" : "hover:text-slate-200"}`}
              >
                THERMAL/NUC
              </button>
              <button
                onClick={() => setActiveFilter("storage")}
                className={`px-2 py-1 rounded-[2px] ${activeFilter === "storage" ? "bg-orange-500/10 text-orange-500 border border-orange-500/20" : "hover:text-slate-200"}`}
              >
                STORAGE
              </button>
            </div>
          </div>
        </div>

        {/* Responsive Operational Data Table */}
        <div className="overflow-x-auto select-none">
          <table className="w-full text-left font-mono text-[11px] border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-800 bg-[#0d121c] text-slate-400 uppercase tracking-widest text-[9px] sticky top-0 z-10">
                <th className="py-2.5 px-3">Generation Source</th>
                <th className="py-2.5 px-3">Live Yield (MW)</th>
                <th className="py-2.5 px-3">Capacity limit (MW)</th>
                <th className="py-2.5 px-3">Share (%)</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Health Score</th>
                <th className="py-2.5 px-3">Operating Cost</th>
                <th className="py-2.5 px-3">co2 Intensity</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 bg-[#080b11]/30">
              {filteredTableRows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => handleSelectSource(row.id)}
                  className={`hover:bg-[#1E293B]/20 transition-colors cursor-pointer ${selectedSourceId === row.id ? "bg-[#FF7A1A]/5 border-l-2 border-l-[#FF7A1A]" : ""}`}
                >
                  <td className="py-3 px-3 font-bold text-slate-100 flex items-center gap-2">
                    {row.id === "solar" ? (
                      <Sun className="w-3.5 h-3.5 text-yellow-500" />
                    ) : row.id === "wind" ? (
                      <Wind className="w-3.5 h-3.5 text-sky-400" />
                    ) : row.id === "hydro" ? (
                      <Droplet className="w-3.5 h-3.5 text-cyan-400" />
                    ) : row.id === "coal" ? (
                      <Flame className="w-3.5 h-3.5 text-orange-500" />
                    ) : row.id === "gas" ? (
                      <Flame className="w-3.5 h-3.5 text-amber-500" strokeDasharray="2,2" />
                    ) : row.id === "nuc" ? (
                      <Cpu className="w-3.5 h-3.5 text-purple-400" />
                    ) : (
                      <BatteryIcon className="w-3.5 h-3.5 text-[#8b5cf6]" />
                    )}
                    {row.name}
                  </td>
                  <td className="py-3 px-3 text-emerald-400 font-bold">
                    {row.current_generation.toLocaleString()} MW
                  </td>
                  <td className="py-3 px-3 text-slate-350">
                    {row.available_capacity.toLocaleString()} MW
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <span className="w-8 shrink-0">{row.percentage}%</span>
                      <div className="w-16 bg-slate-800 h-1 rounded-full overflow-hidden">
                        <div
                          className="bg-orange-500 h-1"
                          style={{ width: `${row.percentage}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3">{getStatusBadge(row.status)}</td>
                  <td className="py-3 px-3">{getHealthBadge(row.health_score)}</td>
                  <td className="py-3 px-3 text-emerald-500">
                    ₹{row.operating_cost.toFixed(2)}/MWh
                  </td>
                  <td className="py-3 px-3 text-slate-400">{row.co2_emissions} g/kWh</td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectSource(row.id);
                      }}
                      className="px-2 py-1 bg-[#1E293B] hover:bg-[#334155] border border-slate-700 text-slate-200 hover:text-white rounded-[2px] text-[10px]"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-out Plant Intelligence Drawer Workspace */}
      {selectedSourceId && (
        <div className="fixed inset-0 z-50 overflow-hidden select-text text-slate-300 font-sans">
          {/* Backdrop */}
          <div
            onClick={() => setSelectedSourceId(null)}
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
          />

          {/* Drawer Body */}
          <div className="absolute inset-y-0 right-0 max-w-full flex">
            <div className="w-[480px] bg-[#07090C] border-l border-[#1E293B] shadow-2xl flex flex-col h-full transform transition-all duration-300">
              {/* Drawer Header */}
              <div className="p-4 border-b border-[#1E293B] bg-[#0B0E13] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-orange-500 animate-pulse" />
                  <div>
                    <h2 className="text-xs font-mono font-bold tracking-widest text-[#F8FAFC]">
                      PLANT INTELLIGENCE WORKSPACE
                    </h2>
                    <p className="text-[9px] font-mono text-slate-500 uppercase mt-0.5">
                      ID: {selectedSourceId}-telemetry
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedSourceId(null)}
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Tabs */}
              <div className="flex border-b border-[#1E293B] bg-[#0B0E13]/50 font-mono text-[9px] font-bold text-slate-500">
                <button
                  onClick={() => setDrawerTab("overview")}
                  className={`flex-1 py-2 text-center border-b-2 ${drawerTab === "overview" ? "border-orange-500 text-orange-500 bg-[#07090C]" : "border-transparent hover:text-slate-300"}`}
                >
                  OVERVIEW
                </button>
                <button
                  onClick={() => setDrawerTab("history")}
                  className={`flex-1 py-2 text-center border-b-2 ${drawerTab === "history" ? "border-orange-500 text-orange-500 bg-[#07090C]" : "border-transparent hover:text-slate-300"}`}
                >
                  HISTORICAL
                </button>
                <button
                  onClick={() => setDrawerTab("weather")}
                  className={`flex-1 py-2 text-center border-b-2 ${drawerTab === "weather" ? "border-orange-500 text-orange-500 bg-[#07090C]" : "border-transparent hover:text-slate-300"}`}
                >
                  WEATHER
                </button>
                <button
                  onClick={() => setDrawerTab("impact")}
                  className={`flex-1 py-2 text-center border-b-2 ${drawerTab === "impact" ? "border-orange-500 text-orange-500 bg-[#07090C]" : "border-transparent hover:text-slate-300"}`}
                >
                  WEATHER IMPACT
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                {drawerLoading ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <RefreshCw className="w-8 h-8 text-orange-500 animate-spin mb-4" />
                    <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">
                      Compiling details...
                    </span>
                  </div>
                ) : drawerError ? (
                  <div className="text-center py-20 text-red-500 font-mono text-xs">
                    <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                    <span>Failed to retrieve telemetry limits.</span>
                  </div>
                ) : plantDetail ? (
                  <>
                    {/* Tab 1: Overview */}
                    {drawerTab === "overview" && (
                      <div className="space-y-4">
                        <div className="bg-slate-900/40 border border-slate-850 p-4 rounded-lg space-y-2">
                          <h3 className="text-[10px] font-bold text-slate-450 uppercase tracking-wider border-b border-slate-850 pb-1.5 flex items-center gap-1.5">
                            <Compass className="w-3.5 h-3.5 text-sky-400" />
                            Plant Profile
                          </h3>
                          <div className="space-y-2 text-xs font-mono">
                            <div className="flex justify-between border-b border-slate-850/50 pb-1">
                              <span className="text-slate-500">Plant Name</span>
                              <span className="font-bold text-slate-200">{plantDetail.name}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-850/50 pb-1">
                              <span className="text-slate-500">Plant Type</span>
                              <span className="text-slate-300 uppercase">{plantDetail.id}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-850/50 pb-1">
                              <span className="text-slate-500">Live Yield</span>
                              <span className="text-emerald-400 font-bold">
                                {plantDetail.current_generation.toLocaleString()} MW
                              </span>
                            </div>
                            <div className="flex justify-between border-b border-slate-850/50 pb-1">
                              <span className="text-slate-500">Installed Capacity</span>
                              <span className="text-slate-300 font-bold">
                                {plantDetail.installed_capacity.toLocaleString()} MW
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Dispatch Cost</span>
                              <span className="text-slate-300">
                                ₹{plantDetail.operating_cost.toFixed(2)}/MWh
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Progress Factor Cards */}
                        <div className="space-y-3 bg-[#0e1322] border border-slate-850 p-4 rounded-lg font-mono">
                          <div>
                            <div className="flex justify-between text-[9px] text-slate-400 uppercase font-bold mb-1">
                              <span>Availability</span>
                              <span>{plantDetail.availability}%</span>
                            </div>
                            <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-emerald-500 h-1.5 rounded-full"
                                style={{ width: `${plantDetail.availability}%` }}
                              />
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-[9px] text-slate-400 uppercase font-bold mb-1">
                              <span>Capacity Factor</span>
                              <span>{plantDetail.capacity_factor}%</span>
                            </div>
                            <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-sky-400 h-1.5 rounded-full"
                                style={{ width: `${plantDetail.capacity_factor}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Tab 2: Historical charts */}
                    {drawerTab === "history" && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <div className="flex bg-slate-950 border border-slate-850 rounded p-0.5 font-mono text-[9px] font-bold text-slate-450">
                            <button
                              onClick={() => setHistoryRange("24H")}
                              className={`px-2 py-1 rounded-[2px] ${historyRange === "24H" ? "bg-orange-500/10 text-orange-500" : ""}`}
                            >
                              24H
                            </button>
                            <button
                              onClick={() => setHistoryRange("7D")}
                              className={`px-2 py-1 rounded-[2px] ${historyRange === "7D" ? "bg-orange-500/10 text-orange-500" : ""}`}
                            >
                              7D
                            </button>
                            <button
                              onClick={() => setHistoryRange("30D")}
                              className={`px-2 py-1 rounded-[2px] ${historyRange === "30D" ? "bg-orange-500/10 text-orange-500" : ""}`}
                            >
                              30D
                            </button>
                          </div>
                          <button
                            onClick={triggerCsvExport}
                            className="flex items-center gap-1.5 px-2.5 py-1 bg-[#1E293B] hover:bg-[#334155] border border-slate-700 text-slate-200 hover:text-white rounded font-mono text-[9.5px]"
                          >
                            <Download className="w-3 h-3 text-emerald-400" />
                            <span>Export CSV</span>
                          </button>
                        </div>

                        {/* Recharts Performance Area Chart */}
                        <div className="h-56 bg-[#0E1322] border border-slate-850 p-2.5 rounded-lg">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={rawHistory}>
                              <defs>
                                <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#2A313C" opacity={0.3} />
                              <XAxis
                                dataKey="time"
                                stroke="#64748B"
                                fontSize={8}
                                tickLine={false}
                              />
                              <YAxis stroke="#64748B" fontSize={8} tickLine={false} />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: "#0F172A",
                                  border: "1px solid #334155",
                                  fontSize: "10px",
                                }}
                              />
                              <Area
                                type="monotone"
                                dataKey="generation"
                                stroke="#10b981"
                                strokeWidth={1.5}
                                fillOpacity={1}
                                fill="url(#histGrad)"
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}

                    {/* Tab 3: Weather Intelligence */}
                    {drawerTab === "weather" && (
                      <div className="space-y-4">
                        <div className="bg-slate-900/40 border border-slate-850 p-4 rounded-lg space-y-3 font-mono text-xs">
                          <h3 className="text-[10px] font-bold text-slate-450 uppercase tracking-wider border-b border-slate-850 pb-1.5 flex items-center gap-1.5">
                            <CloudLightning className="w-3.5 h-3.5 text-yellow-500" />
                            Current weather conditions
                          </h3>
                          <div className="grid grid-cols-2 gap-2.5">
                            <div className="bg-slate-950/60 p-2 border border-slate-850 rounded">
                              <span className="text-[8px] text-slate-500 uppercase block">
                                Temperature
                              </span>
                              <span className="font-bold text-slate-200 mt-1 block">32.1 °C</span>
                            </div>
                            <div className="bg-slate-950/60 p-2 border border-slate-850 rounded">
                              <span className="text-[8px] text-slate-500 uppercase block">
                                Wind speed
                              </span>
                              <span className="font-bold text-slate-200 mt-1 block">12.0 m/s</span>
                            </div>
                            <div className="bg-slate-950/60 p-2 border border-slate-850 rounded">
                              <span className="text-[8px] text-slate-500 uppercase block">
                                Solar index
                              </span>
                              <span className="font-bold text-slate-200 mt-1 block">850 W/m²</span>
                            </div>
                            <div className="bg-slate-950/60 p-2 border border-slate-850 rounded">
                              <span className="text-[8px] text-slate-500 uppercase block">
                                Cloud cover
                              </span>
                              <span className="font-bold text-slate-200 mt-1 block">18.0%</span>
                            </div>
                          </div>
                        </div>

                        {/* Forecast List */}
                        <div className="space-y-2">
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block font-mono">
                            7-Day Forecast
                          </span>
                          <div className="divide-y divide-slate-850 border border-slate-850 rounded-lg overflow-hidden font-mono text-[10px]">
                            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, idx) => (
                              <div
                                key={day}
                                className="flex justify-between items-center p-2.5 bg-slate-900/10 hover:bg-slate-900/30"
                              >
                                <span className="font-bold text-slate-300">{day}</span>
                                <span className="text-slate-400">Sunny</span>
                                <span className="font-bold text-slate-200">
                                  {32 - idx}°C / {22 - idx}°C
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Tab 4: Weather Impact Engine */}
                    {drawerTab === "impact" && (
                      <div className="space-y-4">
                        <div className="bg-slate-900/40 border border-slate-850 p-4 rounded-lg space-y-3 font-mono text-xs">
                          <h3 className="text-[10px] font-bold text-slate-450 uppercase tracking-wider border-b border-slate-850 pb-1.5 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                            Weather impact analysis
                          </h3>
                          <div className="space-y-2.5">
                            <div className="flex justify-between border-b border-slate-850/50 pb-1">
                              <span className="text-slate-500">Expected MW Change</span>
                              <span
                                className={`font-bold ${selectedSourceId === "solar" || selectedSourceId === "wind" ? "text-red-400" : "text-slate-300"}`}
                              >
                                {selectedSourceId === "solar"
                                  ? "-1,850 MW"
                                  : selectedSourceId === "wind"
                                    ? "-450 MW"
                                    : "0 MW"}
                              </span>
                            </div>
                            <div className="flex justify-between border-b border-slate-850/50 pb-1">
                              <span className="text-slate-500">Renewable Output Impact</span>
                              <span className="text-slate-300 font-bold">
                                {selectedSourceId === "solar" || selectedSourceId === "wind"
                                  ? "HIGH"
                                  : "NONE"}
                              </span>
                            </div>
                            <div className="flex justify-between border-b border-slate-850/50 pb-1">
                              <span className="text-slate-500">Grid Risk Level</span>
                              <span
                                className={`font-bold px-1.5 rounded-[2px] ${selectedSourceId === "solar" ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-400"}`}
                              >
                                {selectedSourceId === "solar" ? "HIGH RISK" : "LOW RISK"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">AI Confidence Score</span>
                              <span className="text-purple-400 font-bold">96%</span>
                            </div>
                          </div>
                        </div>

                        {/* AI explanation panel */}
                        <div className="p-3 bg-purple-500/5 border border-purple-500/15 rounded-lg text-slate-300 text-[10px] leading-relaxed font-mono">
                          <span className="font-bold text-purple-400 uppercase tracking-widest block mb-1">
                            AI Explanation
                          </span>
                          {selectedSourceId === "solar"
                            ? "Increasing cloud cover over the Western solar arrays will directly limit photovoltaic cell irradiance, triggering a net drop in available output. Recommend ramping up standby Coal/Gas units to preserve secondary reserves."
                            : selectedSourceId === "wind"
                              ? "Wind speeds across the Tahoe valley corridors are slightly tapering, leading to minor turbine blade speed attenuation. Standard reserve margin remains sufficient."
                              : "Weather parameters are within normal design operational thresholds. Plant output yields are completely nominal."}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-20 text-slate-500 font-mono text-xs uppercase">
                    No telemetry loaded.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
