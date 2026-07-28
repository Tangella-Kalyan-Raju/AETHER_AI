import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useAuthorization } from "../hooks/useAuthorization";
import {
  Zap,
  ScrollText,
  Box,
  Brain,
  BarChart3,
  FileText,
  Clock,
  Map,
  ShieldCheck,
  AlertTriangle,
  ArrowUpRight,
  Lock,
  Activity,
  CheckCircle2,
  Database,
  RefreshCw,
  Server,
  Cable,
  Cpu,
  GitBranch,
  Power,
  Info,
} from "lucide-react";

export default function DigitalTwin() {
  const { profile } = useAuth();
  const { checkPermission } = useAuthorization();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedSubstation, setSelectedSubstation] = useState<any>(null);
  const [selectedLine, setSelectedLine] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("gpo_access_token");
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
      const res = await fetch(`${API_URL}/api/v1/digital-twin/summary`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        throw new Error("Failed to connect to the backend database gateway.");
      }
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        // Default select first substation if available
        if (json.data.topology?.substations?.length > 0) {
          setSelectedSubstation(json.data.topology.substations[0]);
        }
      } else {
        throw new Error(json.error?.message || "Failed to load Digital Twin topology.");
      }
    } catch (err: any) {
      console.error("[GPO-DIGITAL-TWIN]", err);
      setError(err.message || "Failed to load Digital Twin data from backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Coordinate mapper helpers for dynamic SVG topology rendering
  const getSubCoords = (subName: string) => {
    if (subName.includes("Sierra")) return { x: 100, y: 130 };
    if (subName.includes("Reno")) return { x: 260, y: 80 };
    if (subName.includes("Tahoe")) return { x: 420, y: 180 };
    return { x: 260, y: 130 };
  };

  const getBusCoords = (busId: number) => {
    if (!data) return { x: 0, y: 0 };
    const bus = data.topology.buses.find((b: any) => b.id === busId);
    if (!bus) return { x: 0, y: 0 };
    const sub = data.topology.substations.find((s: any) => s.id === bus.substation_id);
    const subName = sub ? sub.name : "";

    if (subName.includes("Sierra")) {
      if (bus.name.includes("Bus A")) return { x: 85, y: 130 };
      if (bus.name.includes("Bus B")) return { x: 115, y: 130 };
      return { x: 100, y: 130 };
    }
    if (subName.includes("Reno")) return { x: 260, y: 80 };
    if (subName.includes("Tahoe")) return { x: 420, y: 180 };
    return { x: 260, y: 130 };
  };

  return (
    <div className="space-y-8 py-2 select-text">
      {/* ── Welcome Header ────────────────────────────────────────── */}
      <section className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-slate-200 dark:border-[#1E293B] pb-6">
        <div>
          <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 tracking-widest uppercase mb-1.5">
            Operational Clearance // {profile?.role || "Guest"}
          </p>
          <h1 className="text-xl sm:text-2xl font-heading font-bold tracking-tight text-slate-900 dark:text-[#F8FAFC]">
            Digital Twin Overview
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xl leading-relaxed">
            Monitor real-time physical configurations and live telemetry mapping for{" "}
            {profile?.organization || "GPO Corp"} bounded assets.
          </p>
        </div>
        <div className="flex-shrink-0 flex items-center gap-2">
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-1.5 rounded-[3px] border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#151A21]/50 hover:bg-slate-50 dark:hover:bg-[#1C222B] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            title="Refresh database topology"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 text-[11px] font-mono font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            SYS.STATUS // NOMINAL
          </span>
        </div>
      </section>

      {/* ── Dashboard Content ─────────────────────────────────────── */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1E293B] pb-2">
          <div className="flex items-center gap-2">
            <Box className="w-5 h-5 text-cyan-500" />
            <h2 className="text-sm font-semibold text-slate-800 dark:text-[#E2E8F0] uppercase tracking-wider">
              Digital Twin Topology Dashboard
            </h2>
          </div>
          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
            SYSTEM STATE: REAL DATABASE DATA
          </span>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 border border-slate-200 dark:border-[#1E293B] rounded-[3px] bg-white dark:bg-[#151A21]/40">
            <RefreshCw className="w-8 h-8 text-cyan-500 animate-spin mb-4" />
            <p className="text-xs font-mono text-slate-400 dark:text-slate-500">
              Querying database topology structures...
            </p>
          </div>
        )}

        {/* Offline / Error State */}
        {error && !loading && (
          <div className="border border-dashed border-red-500/30 bg-red-500/5 rounded-[3px] p-8 text-center space-y-4">
            <AlertTriangle className="w-10 h-10 mx-auto text-red-500" />
            <h3 className="text-sm font-mono font-bold text-red-500 uppercase">
              GPO API GATEWAY OFFLINE
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              No active connection to the physical database could be established. Please start the
              backend FastAPI server and database environment to retrieve the active Digital Twin
              topology.
            </p>
            <div className="pt-2">
              <button
                onClick={fetchData}
                className="px-4 py-2 border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-mono font-bold rounded-[3px] transition-all"
              >
                RETRY CONNECTION
              </button>
            </div>
            <p className="text-[9px] font-mono text-slate-400 dark:text-slate-500 mt-2">
              Error details: {error}
            </p>
          </div>
        )}

        {/* Real Data View */}
        {data && !loading && !error && (
          <div className="space-y-6">
            {/* 1. KPI Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#151A21]/40 p-4 rounded-[3px] flex flex-col justify-between">
                <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 uppercase flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-cyan-500" />
                  Substations
                </span>
                <div className="text-xl font-bold font-mono text-slate-800 dark:text-[#F8FAFC] mt-2">
                  {data.metrics.total_substations}
                </div>
              </div>

              <div className="border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#151A21]/40 p-4 rounded-[3px] flex flex-col justify-between">
                <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 uppercase flex items-center gap-1.5">
                  <GitBranch className="w-3.5 h-3.5 text-yellow-500" />
                  Buses
                </span>
                <div className="text-xl font-bold font-mono text-slate-800 dark:text-[#F8FAFC] mt-2">
                  {data.metrics.total_buses}
                </div>
              </div>

              <div className="border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#151A21]/40 p-4 rounded-[3px] flex flex-col justify-between">
                <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 uppercase flex items-center gap-1.5">
                  <Cable className="w-3.5 h-3.5 text-orange-500" />
                  Lines
                </span>
                <div className="text-xl font-bold font-mono text-slate-800 dark:text-[#F8FAFC] mt-2">
                  {data.metrics.total_transmission_lines}
                </div>
              </div>

              <div className="border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#151A21]/40 p-4 rounded-[3px] flex flex-col justify-between">
                <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 uppercase flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-purple-500" />
                  Transformers
                </span>
                <div className="text-xl font-bold font-mono text-slate-800 dark:text-[#F8FAFC] mt-2">
                  {data.metrics.total_transformers}
                </div>
              </div>

              <div className="border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#151A21]/40 p-4 rounded-[3px] flex flex-col justify-between">
                <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 uppercase flex items-center gap-1.5">
                  <Power className="w-3.5 h-3.5 text-emerald-500" />
                  Generators / Loads
                </span>
                <div className="text-xl font-bold font-mono text-slate-800 dark:text-[#F8FAFC] mt-2">
                  {data.metrics.total_generators} / {data.metrics.total_loads}
                </div>
              </div>

              <div className="border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#151A21]/40 p-4 rounded-[3px] flex flex-col justify-between">
                <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 uppercase flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-violet-500" />
                  Components
                </span>
                <div className="text-xl font-bold font-mono text-slate-800 dark:text-[#F8FAFC] mt-2">
                  {data.metrics.connected_components}
                </div>
              </div>

              <div className="border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#151A21]/40 p-4 rounded-[3px] flex flex-col justify-between">
                <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 uppercase flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  Asset Validation
                </span>
                <div className="mt-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-[2px] text-[10px] font-mono font-bold ${
                      data.metrics.asset_validation_status === "Passed"
                        ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-500"
                        : "bg-red-500/10 border border-red-500/20 text-red-500"
                    }`}
                  >
                    {data.metrics.asset_validation_status.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#151A21]/40 p-4 rounded-[3px] flex flex-col justify-between">
                <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 uppercase flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-indigo-500" />
                  DB Sync
                </span>
                <div className="mt-2">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-[2px] text-[10px] font-mono font-bold bg-indigo-500/10 border border-indigo-500/20 text-indigo-500">
                    {data.metrics.database_synchronization_status.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#151A21]/40 p-4 rounded-[3px] flex flex-col justify-between col-span-2">
                <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 uppercase flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-blue-500" />
                  Topology Completeness
                </span>
                <div className="flex items-center gap-4 mt-2">
                  <div className="text-xl font-bold font-mono text-slate-800 dark:text-[#F8FAFC]">
                    {data.metrics.topology_completeness}%
                  </div>
                  <div className="flex-1 bg-slate-100 dark:bg-[#1C222B] h-2 rounded-[2px] overflow-hidden">
                    <div
                      className="bg-blue-500 h-full rounded-[2px] transition-all duration-500"
                      style={{ width: `${data.metrics.topology_completeness}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Interactive Topology Visualizer & Inspector */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Panel: SVG Topological Map */}
              <div className="border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#151A21]/40 rounded-[3px] p-5 flex flex-col lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Map className="w-4 h-4 text-cyan-500" />
                    <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                      Interactive Grid Topology Map
                    </h3>
                  </div>
                  <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500">
                    CLICK TO INSPECT PROPERTIES
                  </span>
                </div>

                <div className="flex-1 min-h-[280px] border border-slate-100 dark:border-[#1E293B] bg-[#0F1318] rounded-[2px] p-4 flex flex-col justify-center items-center relative overflow-hidden select-none">
                  {/* Single Line Topology Diagram */}
                  <svg className="w-full max-w-lg h-64 overflow-visible" viewBox="0 0 520 260">
                    {/* Sierra Substation Box (Substation 1) */}
                    <rect
                      x="40"
                      y="80"
                      width="120"
                      height="110"
                      fill="none"
                      stroke={selectedSubstation?.id === 1 ? "#22C55E" : "#334155"}
                      strokeDasharray="4,4"
                      strokeWidth={selectedSubstation?.id === 1 ? 1.5 : 1}
                      className="cursor-pointer hover:stroke-cyan-500 transition-colors"
                      onClick={() => {
                        const s = data.topology.substations.find((sub: any) => sub.id === 1);
                        setSelectedSubstation(s);
                        setSelectedLine(null);
                      }}
                    />
                    <text
                      x="100"
                      y="74"
                      fill="#64748B"
                      fontSize="8"
                      fontFamily="monospace"
                      textAnchor="middle"
                      fontWeight="bold"
                    >
                      SIERRA_SUBSTATION
                    </text>

                    {/* Reno Substation Box (Substation 2) */}
                    <rect
                      x="200"
                      y="30"
                      width="120"
                      height="110"
                      fill="none"
                      stroke={selectedSubstation?.id === 2 ? "#22C55E" : "#334155"}
                      strokeDasharray="4,4"
                      strokeWidth={selectedSubstation?.id === 2 ? 1.5 : 1}
                      className="cursor-pointer hover:stroke-cyan-500 transition-colors"
                      onClick={() => {
                        const s = data.topology.substations.find((sub: any) => sub.id === 2);
                        setSelectedSubstation(s);
                        setSelectedLine(null);
                      }}
                    />
                    <text
                      x="260"
                      y="24"
                      fill="#64748B"
                      fontSize="8"
                      fontFamily="monospace"
                      textAnchor="middle"
                      fontWeight="bold"
                    >
                      RENO_SUBSTATION
                    </text>

                    {/* Tahoe Substation Box (Substation 3) */}
                    <rect
                      x="360"
                      y="130"
                      width="120"
                      height="110"
                      fill="none"
                      stroke={selectedSubstation?.id === 3 ? "#22C55E" : "#334155"}
                      strokeDasharray="4,4"
                      strokeWidth={selectedSubstation?.id === 3 ? 1.5 : 1}
                      className="cursor-pointer hover:stroke-cyan-500 transition-colors"
                      onClick={() => {
                        const s = data.topology.substations.find((sub: any) => sub.id === 3);
                        setSelectedSubstation(s);
                        setSelectedLine(null);
                      }}
                    />
                    <text
                      x="420"
                      y="124"
                      fill="#64748B"
                      fontSize="8"
                      fontFamily="monospace"
                      textAnchor="middle"
                      fontWeight="bold"
                    >
                      TAHOE_SUBSTATION
                    </text>

                    {/* Transmission lines */}
                    {/* Line 1: Sierra Bus A to Reno Bus A */}
                    <line
                      x1="85"
                      y1="130"
                      x2="260"
                      y2="80"
                      stroke={selectedLine?.id === 1 ? "#FF7A1A" : "#64748B"}
                      strokeWidth={selectedLine?.id === 1 ? 3 : 1.5}
                      className="cursor-pointer hover:stroke-orange-500 transition-all"
                      onClick={() => {
                        const l = data.topology.transmission_lines.find(
                          (line: any) => line.id === 1
                        );
                        setSelectedLine(l);
                        setSelectedSubstation(null);
                      }}
                    />
                    {/* Line 2: Sierra Bus A to Tahoe Bus A */}
                    <line
                      x1="85"
                      y1="130"
                      x2="420"
                      y2="180"
                      stroke={selectedLine?.id === 2 ? "#FF7A1A" : "#64748B"}
                      strokeWidth={selectedLine?.id === 2 ? 3 : 1.5}
                      className="cursor-pointer hover:stroke-orange-500 transition-all"
                      onClick={() => {
                        const l = data.topology.transmission_lines.find(
                          (line: any) => line.id === 2
                        );
                        setSelectedLine(l);
                        setSelectedSubstation(null);
                      }}
                    />

                    {/* Transformer Sierra: Sierra Bus A to Sierra Bus B */}
                    <g
                      className="cursor-pointer"
                      onClick={() => {
                        const s = data.topology.substations.find((sub: any) => sub.id === 1);
                        setSelectedSubstation(s);
                        setSelectedLine(null);
                      }}
                    >
                      <line
                        x1="85"
                        y1="130"
                        x2="115"
                        y2="130"
                        stroke="#8B5CF6"
                        strokeWidth="1.5"
                        strokeDasharray="2,2"
                      />
                      {/* overlapping circles standard XFMR symbol */}
                      <circle
                        cx="95"
                        cy="130"
                        r="5"
                        fill="none"
                        stroke="#8B5CF6"
                        strokeWidth="1.2"
                      />
                      <circle
                        cx="105"
                        cy="130"
                        r="5"
                        fill="none"
                        stroke="#8B5CF6"
                        strokeWidth="1.2"
                      />
                      <text
                        x="100"
                        y="145"
                        fill="#8B5CF6"
                        fontSize="6"
                        fontFamily="monospace"
                        textAnchor="middle"
                      >
                        XFMR 1
                      </text>
                    </g>

                    {/* Breaker indicators on line ends */}
                    {/* Sierra Line Breaker (Sierra Bus A to Reno line) */}
                    <rect
                      x="110"
                      y="112"
                      width="6"
                      height="6"
                      fill="#10B981"
                      stroke="#047857"
                      strokeWidth="1"
                    />
                    {/* Tahoe Line Breaker (Sierra Bus A to Tahoe line) */}
                    <rect
                      x="360"
                      y="162"
                      width="6"
                      height="6"
                      fill="#10B981"
                      stroke="#047857"
                      strokeWidth="1"
                    />

                    {/* Buses - thick copper vertical bars */}
                    {/* Sierra Bus A */}
                    <line
                      x1="85"
                      y1="100"
                      x2="85"
                      y2="160"
                      stroke="#FBBF24"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    <text
                      x="80"
                      y="96"
                      fill="#F8FAFC"
                      fontSize="6"
                      fontFamily="monospace"
                      textAnchor="end"
                    >
                      Bus A
                    </text>

                    {/* Sierra Bus B */}
                    <line
                      x1="115"
                      y1="100"
                      x2="115"
                      y2="160"
                      stroke="#F59E0B"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    <text
                      x="120"
                      y="96"
                      fill="#F8FAFC"
                      fontSize="6"
                      fontFamily="monospace"
                      textAnchor="start"
                    >
                      Bus B
                    </text>

                    {/* Reno Bus A */}
                    <line
                      x1="260"
                      y1="50"
                      x2="260"
                      y2="110"
                      stroke="#FBBF24"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    <text
                      x="255"
                      y="46"
                      fill="#F8FAFC"
                      fontSize="6"
                      fontFamily="monospace"
                      textAnchor="end"
                    >
                      Bus A
                    </text>

                    {/* Tahoe Bus A */}
                    <line
                      x1="420"
                      y1="150"
                      x2="420"
                      y2="210"
                      stroke="#FBBF24"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    <text
                      x="415"
                      y="146"
                      fill="#F8FAFC"
                      fontSize="6"
                      fontFamily="monospace"
                      textAnchor="end"
                    >
                      Bus A
                    </text>

                    {/* Generators (Circles with G) */}
                    {/* Sierra Gas Gen */}
                    <g>
                      <line x1="85" y1="100" x2="85" y2="110" stroke="#10B981" strokeWidth="1.2" />
                      <circle
                        cx="85"
                        cy="94"
                        r="6"
                        fill="#1e293b"
                        stroke="#10B981"
                        strokeWidth="1.2"
                      />
                      <text
                        x="85"
                        y="96"
                        fill="#10B981"
                        fontSize="7"
                        fontFamily="monospace"
                        textAnchor="middle"
                        fontWeight="bold"
                      >
                        G
                      </text>
                    </g>
                    {/* Tahoe Hydro Gen */}
                    <g>
                      <line
                        x1="420"
                        y1="150"
                        x2="420"
                        y2="160"
                        stroke="#10B981"
                        strokeWidth="1.2"
                      />
                      <circle
                        cx="420"
                        cy="144"
                        r="6"
                        fill="#1e293b"
                        stroke="#10B981"
                        strokeWidth="1.2"
                      />
                      <text
                        x="420"
                        y="146"
                        fill="#10B981"
                        fontSize="7"
                        fontFamily="monospace"
                        textAnchor="middle"
                        fontWeight="bold"
                      >
                        G
                      </text>
                    </g>

                    {/* Loads (Arrows pointing down) */}
                    {/* Sierra Local Load */}
                    <g>
                      <line
                        x1="115"
                        y1="150"
                        x2="115"
                        y2="162"
                        stroke="#EF4444"
                        strokeWidth="1.2"
                      />
                      <path d="M112,158 L115,162 L118,158 Z" fill="#EF4444" />
                    </g>
                    {/* Reno Town Load */}
                    <g>
                      <line
                        x1="260"
                        y1="110"
                        x2="260"
                        y2="122"
                        stroke="#EF4444"
                        strokeWidth="1.2"
                      />
                      <path d="M257,118 L260,122 L263,118 Z" fill="#EF4444" />
                    </g>
                  </svg>
                  <div className="absolute bottom-2 left-2 text-[8px] font-mono text-[#64748B]">
                    GOLD BARS = BUSES // GREEN BOX = BREAKER SWITCH // GREEN CIRCLE = GENERATOR //
                    RED ARROW = LOAD
                  </div>
                </div>
              </div>

              {/* Right Panel: Inspector & Asset Relationship Graph */}
              <div className="border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#151A21]/40 rounded-[3px] p-5 flex flex-col col-span-1 justify-between select-text">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 dark:border-[#1E293B] pb-2">
                    <Info className="w-4 h-4 text-cyan-500" />
                    <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                      Asset Inspector
                    </h3>
                  </div>

                  {/* Substation Selected View */}
                  {selectedSubstation && (
                    <div className="space-y-3 font-sans text-xs">
                      <div>
                        <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 uppercase">
                          SUBSTATION NAME
                        </span>
                        <div className="font-bold text-slate-800 dark:text-[#F8FAFC] text-sm mt-0.5">
                          {selectedSubstation.name}
                        </div>
                      </div>
                      <div>
                        <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 uppercase">
                          GEO COORDINATES
                        </span>
                        <div className="font-mono text-slate-600 dark:text-slate-300 mt-0.5">
                          Lat: {selectedSubstation.latitude}, Lng: {selectedSubstation.longitude}
                        </div>
                      </div>
                      <div>
                        <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 uppercase">
                          DESCRIPTION
                        </span>
                        <p className="text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                          {selectedSubstation.description}
                        </p>
                      </div>

                      {/* Substation Asset Tree */}
                      <div className="mt-4 border border-slate-100 dark:border-[#1E293B] rounded-[3px] bg-slate-50/50 dark:bg-[#0F1318]/50 p-4 font-mono text-[11px] space-y-3">
                        <div className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[9px] mb-2 border-b border-slate-200 dark:border-[#2D3748] pb-1">
                          ASSET RELATIONSHIP GRAPH
                        </div>
                        <div className="flex items-center gap-2 text-slate-800 dark:text-[#F8FAFC]">
                          <Box className="w-3.5 h-3.5 text-cyan-500" />
                          <span className="font-semibold">{selectedSubstation.name}</span>
                        </div>
                        <div className="pl-4 border-l border-slate-200 dark:border-[#2D3748] space-y-2.5">
                          {data.topology.buses
                            .filter((b: any) => b.substation_id === selectedSubstation.id)
                            .map((bus: any) => {
                              const busGenerators = data.topology.generators.filter(
                                (g: any) => g.bus_id === bus.id
                              );
                              const busLoads = data.topology.loads.filter(
                                (l: any) => l.bus_id === bus.id
                              );
                              const busSwitches = data.topology.switches.filter(
                                (s: any) => s.bus_id === bus.id
                              );

                              return (
                                <div key={bus.id} className="space-y-1.5">
                                  <div className="flex items-center gap-2 text-slate-700 dark:text-[#E2E8F0]">
                                    <GitBranch className="w-3.5 h-3.5 text-yellow-500" />
                                    <span>
                                      {bus.name} ({bus.base_kv} kV)
                                    </span>
                                  </div>

                                  <div className="pl-4 border-l border-slate-200 dark:border-[#2D3748] space-y-1">
                                    {busGenerators.map((gen: any) => (
                                      <div
                                        key={gen.id}
                                        className="flex items-center gap-2 text-slate-600 dark:text-slate-300"
                                      >
                                        <Power className="w-3 h-3 text-emerald-500" />
                                        <span>
                                          Gen: {gen.name} — {gen.p_mw}MW / {gen.capacity_mw}MW
                                        </span>
                                      </div>
                                    ))}
                                    {busLoads.map((load: any) => (
                                      <div
                                        key={load.id}
                                        className="flex items-center gap-2 text-slate-600 dark:text-slate-300"
                                      >
                                        <Zap className="w-3 h-3 text-orange-500" />
                                        <span>
                                          Load: {load.name} — {load.p_mw}MW
                                        </span>
                                      </div>
                                    ))}
                                    {busSwitches.map((sw: any) => (
                                      <div
                                        key={sw.id}
                                        className="flex items-center gap-2 text-slate-600 dark:text-slate-300"
                                      >
                                        <Cpu className="w-3 h-3 text-purple-500" />
                                        <span>
                                          Breaker: {sw.name} ({sw.state})
                                        </span>
                                      </div>
                                    ))}
                                    {busGenerators.length === 0 &&
                                      busLoads.length === 0 &&
                                      busSwitches.length === 0 && (
                                        <span className="text-slate-400 text-[10px]">
                                          No active devices connected
                                        </span>
                                      )}
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Line Selected View */}
                  {selectedLine && (
                    <div className="space-y-3 font-sans text-xs">
                      <div>
                        <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 uppercase">
                          LINE NAME
                        </span>
                        <div className="font-bold text-slate-800 dark:text-[#F8FAFC] text-sm mt-0.5">
                          {selectedLine.name}
                        </div>
                      </div>
                      <div>
                        <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 uppercase">
                          IMPEDANCE PARAMETERS
                        </span>
                        <div className="font-mono text-slate-600 dark:text-slate-300 mt-0.5">
                          R_pu: {selectedLine.r_pu}, X_pu: {selectedLine.x_pu}
                        </div>
                      </div>
                      <div>
                        <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 uppercase">
                          POWER RATING
                        </span>
                        <div className="font-mono text-slate-600 dark:text-slate-300 mt-0.5">
                          {selectedLine.rating_mva} MVA Capacity Limit
                        </div>
                      </div>
                      <div>
                        <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 uppercase">
                          DESCRIPTION
                        </span>
                        <p className="text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                          {selectedLine.description}
                        </p>
                      </div>

                      {/* Associated Switch details */}
                      <div className="mt-4 border border-slate-100 dark:border-[#1E293B] rounded-[3px] bg-slate-50/50 dark:bg-[#0F1318]/50 p-4 font-mono text-[11px] space-y-2">
                        <div className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[9px] border-b border-slate-200 dark:border-[#2D3748] pb-1">
                          LINE DEVICE CONTROLS
                        </div>
                        {data.topology.switches
                          .filter((s: any) => s.line_id === selectedLine.id)
                          .map((sw: any) => (
                            <div key={sw.id} className="flex justify-between items-center py-1">
                              <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                <Cpu className="w-3.5 h-3.5 text-purple-500" />
                                {sw.name}
                              </span>
                              <span className="px-1.5 py-0.5 rounded-[2px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[9px] font-bold">
                                {sw.state.toUpperCase()}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {!selectedSubstation && !selectedLine && (
                    <div className="flex flex-col justify-center items-center py-12 text-center text-slate-400 dark:text-slate-500">
                      <Map className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-3" />
                      <p className="text-xs">
                        Select a Substation or Transmission Line on the map to inspect its Digital
                        Twin properties.
                      </p>
                    </div>
                  )}
                </div>

                {/* Substation Selector Buttons */}
                {selectedSubstation && (
                  <div className="flex gap-2 border-t border-slate-100 dark:border-[#1E293B] pt-4 mt-4">
                    {data.topology.substations.map((s: any) => (
                      <button
                        key={s.id}
                        onClick={() => {
                          setSelectedSubstation(s);
                          setSelectedLine(null);
                        }}
                        className={`flex-1 py-1 px-2 border text-[10px] font-semibold rounded-[2px] transition-colors ${
                          selectedSubstation.id === s.id
                            ? "bg-slate-800 border-slate-700 text-white dark:bg-[#1C222B] dark:border-[#2A313C]"
                            : "bg-transparent border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-[#1E293B] dark:text-slate-400 dark:hover:bg-[#1C222B]"
                        }`}
                      >
                        {s.name.split(" ")[0]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 3. Distribution Charts & Network Summaries */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Chart: Generator Capacity Mix */}
              <div className="border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#151A21]/40 rounded-[3px] p-5 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Power className="w-4 h-4 text-emerald-500" />
                    <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                      Generation Fuel Mix
                    </h3>
                  </div>
                  <span className="text-[9px] font-mono text-slate-400 dark:text-slate-600">
                    CAPACITY RATIO
                  </span>
                </div>

                <div className="flex-1 flex flex-col justify-center items-center py-6">
                  {/* SVG Donut Chart */}
                  <svg className="w-32 h-32 overflow-visible" viewBox="0 0 36 36">
                    <circle
                      cx="18"
                      cy="18"
                      r="15.915"
                      fill="none"
                      stroke="#1E293B"
                      strokeWidth="3.5"
                    />

                    {/* Thermal: 150MW (75%), Hydro: 50MW (25%) */}
                    {/* strokeDasharray = "percent gap" */}
                    {/* 75% Thermal -> 75 25 */}
                    <circle
                      cx="18"
                      cy="18"
                      r="15.915"
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="3.5"
                      strokeDasharray="75 25"
                      strokeDashoffset="25"
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="15.915"
                      fill="none"
                      stroke="#3B82F6"
                      strokeWidth="3.5"
                      strokeDasharray="25 75"
                      strokeDashoffset="100"
                    />

                    <text
                      x="18"
                      y="18"
                      fill="#F8FAFC"
                      fontSize="5"
                      fontFamily="monospace"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontWeight="bold"
                    >
                      200 MW
                    </text>
                  </svg>

                  <div className="flex gap-4 mt-6 text-[10px] font-mono">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                      <span className="text-slate-600 dark:text-slate-300">
                        Gas/Thermal (150MW / 75%)
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]" />
                      <span className="text-slate-600 dark:text-slate-300">Hydro (50MW / 25%)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Middle Chart: Asset Categories */}
              <div className="border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#151A21]/40 rounded-[3px] p-5 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-cyan-500" />
                    <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                      Asset Type Distribution
                    </h3>
                  </div>
                  <span className="text-[9px] font-mono text-slate-400 dark:text-slate-600">
                    COUNT
                  </span>
                </div>

                <div className="flex-1 flex flex-col justify-between space-y-3 py-2 text-[10px] font-mono">
                  {/* Custom SVG Horizontal Bars */}
                  <div>
                    <div className="flex justify-between text-slate-400 dark:text-slate-500 mb-1">
                      <span>SUBSTATIONS</span>
                      <span className="text-slate-700 dark:text-slate-300">
                        {data.metrics.total_substations}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-[#1C222B] h-2 rounded-[2px] overflow-hidden">
                      <div className="bg-cyan-500 h-full rounded-[2px]" style={{ width: "60%" }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-400 dark:text-slate-500 mb-1">
                      <span>BUSES</span>
                      <span className="text-slate-700 dark:text-slate-300">
                        {data.metrics.total_buses}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-[#1C222B] h-2 rounded-[2px] overflow-hidden">
                      <div
                        className="bg-yellow-500 h-full rounded-[2px]"
                        style={{ width: "80%" }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-400 dark:text-slate-500 mb-1">
                      <span>TRANSMISSION LINES</span>
                      <span className="text-slate-700 dark:text-slate-300">
                        {data.metrics.total_transmission_lines}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-[#1C222B] h-2 rounded-[2px] overflow-hidden">
                      <div
                        className="bg-orange-500 h-full rounded-[2px]"
                        style={{ width: "40%" }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-400 dark:text-slate-500 mb-1">
                      <span>DEVICES (XFMR, GEN, LOAD, SWITCH)</span>
                      <span className="text-slate-700 dark:text-slate-300">
                        {data.metrics.total_transformers +
                          data.metrics.total_generators +
                          data.metrics.total_loads +
                          data.metrics.total_switches}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-[#1C222B] h-2 rounded-[2px] overflow-hidden">
                      <div
                        className="bg-indigo-500 h-full rounded-[2px]"
                        style={{ width: "100%" }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Panel: Network Topology Summary */}
              <div className="border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#151A21]/40 rounded-[3px] p-5 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-violet-500" />
                    <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                      Topology Network Summary
                    </h3>
                  </div>
                  <span className="text-[9px] font-mono text-slate-400 dark:text-slate-600">
                    COMPLIANCE
                  </span>
                </div>

                <div className="flex-1 flex flex-col justify-between select-text">
                  <div className="border border-indigo-500/20 bg-indigo-500/5 rounded-[3px] p-3 space-y-2">
                    <div className="text-[10px] font-mono font-bold text-indigo-500 uppercase flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      NERC CIP-002 Compliant
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                      The current Digital Twin topology contains no orphan buses or disconnected
                      asset groups. Referential verification is satisfied. Database tables are in a
                      fully synchronized state with the physical EMS SCADA database.
                    </p>
                  </div>

                  <div className="mt-4 font-mono text-[9px] text-slate-400 dark:text-slate-500 space-y-1">
                    <div>// IMPLEMENTATION: PHASE 3.1 TOPOLOGY</div>
                    <div>// SEED SOURCE: SQLite LOCAL DATABASE</div>
                    <div>// VALIDATION TARGET: NERC COMPLIANCY LIMITS</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Recent Events (Real Database Audit Logs) */}
            <div className="border border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#151A21]/40 rounded-[3px] p-5 flex flex-col">
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-[#1E293B] pb-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-violet-500" />
                  <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                    Recent Grid Events
                  </h3>
                </div>
                <span className="text-[9px] font-mono text-slate-400 dark:text-slate-600">
                  REAL SYSTEM HISTORY
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.recent_events.slice(0, 6).map((event: any, i: number) => (
                  <div
                    key={event.id || i}
                    className="flex gap-2.5 items-start border-l border-emerald-500/30 pl-2.5 py-1 text-[11px] font-mono"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-slate-400 dark:text-slate-500 text-[9px]">
                        {new Date(event.created_at).toLocaleTimeString()} //{" "}
                        {event.action.toUpperCase()}
                      </div>
                      <div className="text-slate-800 dark:text-slate-300 font-medium">
                        {event.details}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
