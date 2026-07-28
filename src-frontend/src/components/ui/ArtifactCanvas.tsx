import React, { useState } from "react";
import {
  Leaf,
  Zap,
  CloudSun,
  Activity,
  Play,
  CheckCircle,
  AlertTriangle,
  Sliders,
  Settings,
  Database,
  RefreshCw,
  Gauge,
  Thermometer,
  Wind,
  Sun,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

interface ArtifactCanvasProps {
  artifact: {
    id: string;
    type: string;
    data: any;
  } | null;
  onClose: () => void;
}

export default function ArtifactCanvas({ artifact, onClose }: ArtifactCanvasProps) {
  if (!artifact) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-slate-50/50 dark:bg-[#151A21]/10 text-slate-500">
        <Activity className="w-10 h-10 text-slate-400 dark:text-slate-600 mb-3 animate-pulse" />
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-400">
          No Active Artifact Session
        </h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs">
          Ask the AI Co-Pilot to analyze carbon emissions, run optimizations, or show the topology
          map to load an interactive session.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#11161D]/20 dark:bg-[#07090C]/20 rounded-[4px] border border-slate-200 dark:border-[#1E293B] overflow-hidden select-text font-sans">
      {/* Canvas Header */}
      <div className="h-10 px-4 border-b border-slate-200 dark:border-[#1E293B] bg-slate-50 dark:bg-[#0B0D11]/90 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
          <span className="text-[10px] font-mono font-bold tracking-wider text-slate-800 dark:text-[#F8FAFC] uppercase">
            AI-GENERATED ARTIFACT // {artifact.type.replace("WIDGET_", "")}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-[10px] font-mono bg-slate-200 dark:bg-[#1C222B] border border-slate-300 dark:border-[#2A313C] px-2 py-0.5 rounded-[2px] text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          CLEAR SESSION
        </button>
      </div>

      {/* Canvas Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-white dark:bg-[#0B0E13]/80">
        {artifact.type === "WIDGET_CARBON" && <CarbonArtifact data={artifact.data} />}
        {artifact.type === "WIDGET_OPTIMIZATION_BUILDER" && (
          <OptimizationBuilderArtifact data={artifact.data} />
        )}
        {artifact.type === "WIDGET_WEATHER" && <WeatherArtifact data={artifact.data} />}
        {artifact.type === "WIDGET_TOPOLOGY" && <TopologyArtifact data={artifact.data} />}
        {artifact.type === "WIDGET_POLICY" && <PolicyArtifact data={artifact.data} />}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* 1. CARBON ARTIFACT VIEW                                                    */
/* ────────────────────────────────────────────────────────────────────────── */
function CarbonArtifact({ data }: { data: any }) {
  const [offsetCredits, setOffsetCredits] = useState(1240);
  const [abatementSim, setAbatementSim] = useState(-12.4);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Leaf className="w-5 h-5 text-emerald-500" /> Network Carbon Footprint Diagnostic
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Detailed real-time assessment of renewable penetration and carbon intensities across
          bounded substations.
        </p>
      </div>

      {/* Mini KPI Deck */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-3 border border-slate-200 dark:border-[#1E293B] bg-slate-50/50 dark:bg-[#151A21]/30 rounded-[3px]">
          <span className="text-[9px] font-mono text-slate-500 uppercase block">
            Grid Intensity
          </span>
          <span className="text-xl font-mono font-bold text-[#F8FAFC] block mt-1">
            180 gCO2/kWh
          </span>
          <span className="text-[10px] font-mono text-emerald-500 mt-1 block">
            ✔ Within compliance target
          </span>
        </div>
        <div className="p-3 border border-slate-200 dark:border-[#1E293B] bg-slate-50/50 dark:bg-[#151A21]/30 rounded-[3px]">
          <span className="text-[9px] font-mono text-slate-500 uppercase block">
            Daily Abatement
          </span>
          <span className="text-xl font-mono font-bold text-emerald-500 block mt-1">
            {abatementSim.toFixed(1)}%
          </span>
          <span className="text-[9px] text-slate-400 block mt-1">YoY target offset</span>
        </div>
        <div className="p-3 border border-slate-200 dark:border-[#1E293B] bg-slate-50/50 dark:bg-[#151A21]/30 rounded-[3px]">
          <span className="text-[9px] font-mono text-slate-500 uppercase block">
            Offset Credit Reserve
          </span>
          <span className="text-xl font-mono font-bold text-[#F8FAFC] block mt-1">
            {offsetCredits} MT
          </span>
          <span className="text-[9px] text-slate-400 block mt-1">Standard NERC credit bounds</span>
        </div>
      </div>

      {/* Generation Fuel Mix Chart */}
      <div className="p-4 border border-slate-200 dark:border-[#1E293B] bg-slate-50/30 dark:bg-[#151A21]/10 rounded-[3px] space-y-3">
        <div className="text-xs font-semibold text-slate-800 dark:text-slate-300 uppercase font-mono tracking-wider">
          Current Generation Fuel Mix
        </div>
        <div className="space-y-2">
          {/* Progress Bars */}
          {[
            { name: "Solar Generation", value: 42, color: "bg-yellow-500", raw: "320 MW" },
            { name: "Wind Dispatch", value: 38, color: "bg-cyan-500", raw: "410 MW" },
            { name: "Hydro Power", value: 12, color: "bg-blue-500", raw: "120 MW" },
            { name: "Gas (Peaker Units)", value: 8, color: "bg-red-500", raw: "80 MW" },
          ].map((fuel) => (
            <div key={fuel.name} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">{fuel.name}</span>
                <span className="font-mono text-slate-300 font-semibold">
                  {fuel.raw} ({fuel.value}%)
                </span>
              </div>
              <div className="w-full h-2 bg-slate-200 dark:bg-[#1E293B] rounded-full overflow-hidden">
                <div
                  className={`h-full ${fuel.color} rounded-full`}
                  style={{ width: `${fuel.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Slider simulation tool */}
      <div className="p-4 border border-orange-500/20 bg-orange-500/5 rounded-[3px] space-y-3">
        <h4 className="text-xs font-bold text-orange-500 uppercase font-mono flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5" /> Simulate Battery Discharge Compliance Offset
        </h4>
        <p className="text-xs text-slate-400 leading-relaxed">
          Slide to configure active battery system discharging. Discharging offsets natural gas
          dependency during regional congestion peaks.
        </p>
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-mono">
            <span>Battery Output: {((offsetCredits - 1000) / 10).toFixed(0)} MW</span>
            <span>Offset Credits: {offsetCredits} MT</span>
          </div>
          <input
            type="range"
            min="1000"
            max="1800"
            value={offsetCredits}
            onChange={(e) => {
              const val = Number(e.target.value);
              setOffsetCredits(val);
              setAbatementSim(-12.4 - (val - 1240) / 45);
            }}
            className="w-full accent-orange-500"
          />
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* 2. OPTIMIZATION BUILDER ARTIFACT VIEW                                      */
/* ────────────────────────────────────────────────────────────────────────── */
function OptimizationBuilderArtifact({ data }: { data: any }) {
  const [strategy, setStrategy] = useState("cost_minimization");
  const [solver, setSolver] = useState("gurobi");
  const [targetSub, setTargetSub] = useState("all");
  const [renewableCap, setRenewableCap] = useState(60);

  const [solving, setSolving] = useState(false);
  const [progressMsg, setProgressMsg] = useState("");
  const [success, setSuccess] = useState(false);

  const handleTriggerSolve = () => {
    if (solving) return;
    setSolving(true);
    setSuccess(false);
    setProgressMsg("Compiling GPO node equations to LP matrix format...");

    setTimeout(() => {
      setProgressMsg("Sending LP matrix bounds to NERC-CIP Solver Gateway...");

      setTimeout(() => {
        setProgressMsg(`Initiating ${solver.toUpperCase()} Branch-and-Cut search loop...`);

        setTimeout(() => {
          setProgressMsg("Evaluating multi-objective optimality criteria...");

          setTimeout(() => {
            setSolving(false);
            setSuccess(true);
          }, 600);
        }, 800);
      }, 800);
    }, 800);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-purple-500" /> AI Optimization Dispatch Builder
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Configure solver coefficients to establish new generation dispatch policy mappings across
          network lines.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Col: Setup */}
        <div className="p-4 border border-slate-200 dark:border-[#1E293B] bg-slate-50/30 dark:bg-[#151A21]/30 rounded-[3px] space-y-4">
          <div className="text-xs font-semibold text-slate-800 dark:text-slate-300 uppercase font-mono tracking-wider">
            Solver Coefficients
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase text-slate-500 block">
              Target Strategy
            </label>
            <select
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              className="w-full bg-slate-100 dark:bg-[#151A21] border border-slate-300 dark:border-[#2A313C] rounded-[2px] p-1.5 text-xs text-slate-300 focus:outline-none"
            >
              <option value="cost_minimization">Economic Dispatch (Min Cost)</option>
              <option value="congestion_mitigation">Line Congestion Alleviation</option>
              <option value="carbon_reduction">Min Carbon Footprint</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase text-slate-500 block">
              Active Solver Engine
            </label>
            <select
              value={solver}
              onChange={(e) => setSolver(e.target.value)}
              className="w-full bg-slate-100 dark:bg-[#151A21] border border-slate-300 dark:border-[#2A313C] rounded-[2px] p-1.5 text-xs text-slate-300 focus:outline-none"
            >
              <option value="gurobi">MILP - Gurobi v12.0</option>
              <option value="ipopt">ACOPF - Ipopt v3.14</option>
              <option value="heuristic">Heuristic - Grid-Core v2</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase text-slate-500 block">
              Substation Bounding Box
            </label>
            <select
              value={targetSub}
              onChange={(e) => setTargetSub(e.target.value)}
              className="w-full bg-slate-100 dark:bg-[#151A21] border border-slate-300 dark:border-[#2A313C] rounded-[2px] p-1.5 text-xs text-slate-300 focus:outline-none"
            >
              <option value="all">All Substations (Sierra, Tahoe, Reno)</option>
              <option value="sierra">Sierra Substation Area only</option>
              <option value="tahoe">Tahoe Substation Area only</option>
            </select>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-mono uppercase text-slate-500">
              <span>Renewable Margin Goal</span>
              <span>{renewableCap}%</span>
            </div>
            <input
              type="range"
              min="20"
              max="90"
              value={renewableCap}
              onChange={(e) => setRenewableCap(Number(e.target.value))}
              className="w-full accent-purple-500"
            />
          </div>

          <button
            onClick={handleTriggerSolve}
            disabled={solving}
            className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-[3px] flex items-center justify-center gap-2 transition-colors"
          >
            {solving ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
            {solving ? "Solving LP Matrix..." : "Compile & Run Solver"}
          </button>
        </div>

        {/* Right Col: Console Status */}
        <div className="border border-slate-200 dark:border-[#1E293B] bg-slate-900 rounded-[3px] p-4 flex flex-col justify-between font-mono text-[11px] text-slate-300 min-h-[250px] shadow-inner select-text">
          <div className="space-y-2">
            <div className="text-slate-500 border-b border-slate-800 pb-1 flex justify-between items-center text-[9px]">
              <span>SOLVER SHELL LOGS</span>
              <span className="text-purple-400">ACTIVE: NERC-CIP</span>
            </div>

            <div className="space-y-1">
              <p className="text-slate-500">
                &gt; gpo_solver --engine={solver} --strategy={strategy}
              </p>
              <p className="text-slate-500">&gt; config.target_nodes = {targetSub}</p>
              <p className="text-slate-500">&gt; config.renewable_margin = {renewableCap}%</p>

              {solving && (
                <div className="space-y-1 mt-2">
                  <p className="text-yellow-500 animate-pulse">&gt;&gt;&gt; {progressMsg}</p>
                </div>
              )}

              {success && (
                <div className="space-y-1 mt-2 text-emerald-400">
                  <p className="flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" /> Optimal solution achieved in 24ms.
                  </p>
                  <p className="text-slate-400 mt-2">RESULTS OVERVIEW:</p>
                  <p className="pl-3">- Active losses reduced: -4.3% (Savings: $2,840/hr)</p>
                  <p className="pl-3">- Substation loading values nominal</p>
                  <p className="pl-3">- Frequency deviation: +0.002 Hz</p>
                  <p className="text-slate-500 mt-2">
                    &gt; policy compiler successfully committed new grid boundaries.
                  </p>
                </div>
              )}
            </div>
          </div>

          {!solving && !success && (
            <div className="text-center text-slate-600 py-10">
              [SOLVER IDLE: CLICK RUN TO COMPILE EQUATIONS]
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* 3. WEATHER ARTIFACT VIEW                                                   */
/* ────────────────────────────────────────────────────────────────────────── */
function WeatherArtifact({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <CloudSun className="w-5 h-5 text-yellow-500" /> Renewable Weather Forecast Intel
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Predictive yield telemetry for solar and wind arrays depending on atmospheric pressure
          front lines.
        </p>
      </div>

      {/* Local stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 border border-slate-200 dark:border-[#1E293B] bg-slate-50/50 dark:bg-[#151A21]/30 rounded-[3px] text-center">
          <Thermometer className="w-4 h-4 mx-auto text-orange-500 mb-1" />
          <span className="text-[9px] font-mono text-slate-500 uppercase block">Ambient Temp</span>
          <span className="text-sm font-semibold text-slate-200 block mt-0.5">74.2 °F</span>
        </div>
        <div className="p-3 border border-slate-200 dark:border-[#1E293B] bg-slate-50/50 dark:bg-[#151A21]/30 rounded-[3px] text-center">
          <Wind className="w-4 h-4 mx-auto text-cyan-400 mb-1" />
          <span className="text-[9px] font-mono text-slate-500 uppercase block">Wind Velocity</span>
          <span className="text-sm font-semibold text-slate-200 block mt-0.5">14.6 m/s</span>
        </div>
        <div className="p-3 border border-slate-200 dark:border-[#1E293B] bg-slate-50/50 dark:bg-[#151A21]/30 rounded-[3px] text-center">
          <Sun className="w-4 h-4 mx-auto text-yellow-500 mb-1" />
          <span className="text-[9px] font-mono text-slate-500 uppercase block">Irradiance</span>
          <span className="text-sm font-semibold text-slate-200 block mt-0.5">850 W/m²</span>
        </div>
        <div className="p-3 border border-slate-200 dark:border-[#1E293B] bg-slate-50/50 dark:bg-[#151A21]/30 rounded-[3px] text-center">
          <Gauge className="w-4 h-4 mx-auto text-purple-400 mb-1" />
          <span className="text-[9px] font-mono text-slate-500 uppercase block">Curtail Risk</span>
          <span className="text-sm font-semibold text-emerald-500 block mt-0.5">MINIMAL</span>
        </div>
      </div>

      {/* Yield forecast curves */}
      <div className="p-4 border border-slate-200 dark:border-[#1E293B] bg-slate-50/30 dark:bg-[#151A21]/10 rounded-[3px] space-y-4">
        <div className="text-xs font-semibold text-slate-800 dark:text-slate-300 uppercase font-mono tracking-wider">
          24h Renewable Yield Output Curve
        </div>
        {/* Simple Simulated Chart */}
        <div className="h-32 flex items-end justify-between gap-1 border-b border-l border-slate-700 pb-1.5 pl-2 pt-2 select-none">
          {[45, 52, 60, 78, 92, 85, 70, 48, 30, 22, 18, 35].map((val, idx) => (
            <div key={idx} className="flex-1 flex flex-col justify-end h-full group relative">
              <div
                className="w-full bg-cyan-500/80 group-hover:bg-cyan-500 rounded-t-[1px] transition-all"
                style={{ height: `${val}%` }}
              />
              <div
                className="w-full bg-yellow-500/80 group-hover:bg-yellow-500 rounded-t-[1px] transition-all mt-[1px]"
                style={{ height: `${val * 0.4}%` }}
              />
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 bg-[#1C222B] border border-[#2A313C] text-[8px] text-slate-300 p-1 rounded hidden group-hover:block whitespace-nowrap z-10 pointer-events-none">
                Hour {idx * 2}: {val * 6} MW
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between text-[9px] font-mono text-slate-500">
          <span>00:00 UTC</span>
          <span>08:00 UTC</span>
          <span>16:00 UTC</span>
          <span>24:00 UTC</span>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* 4. TOPOLOGY ARTIFACT VIEW                                                  */
/* ────────────────────────────────────────────────────────────────────────── */
function TopologyArtifact({ data }: { data: any }) {
  const [activeBus, setActiveBus] = useState<string>("Sierra A");
  const [contingencyActive, setContingencyActive] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-cyan-500" /> Dynamic Transmission Line Diagnoses
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Interactive schematic mapping line flow loadings and active contingencies. Click nodes to
          inspect.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SVG Grid Map */}
        <div className="lg:col-span-2 p-4 border border-slate-200 dark:border-[#1E293B] bg-slate-950 rounded-[3px] flex items-center justify-center min-h-[250px] relative select-none">
          <svg className="w-full h-full max-w-[450px]" viewBox="0 0 450 250">
            {/* Bus Grid lines */}
            {/* Line 1 Sierra to Tahoe */}
            <line
              x1="120"
              y1="120"
              x2="330"
              y2="170"
              stroke={contingencyActive ? "#ef4444" : "#ff7a1a"}
              strokeWidth={contingencyActive ? "4" : "2"}
              strokeDasharray={contingencyActive ? "4" : "0"}
              className={contingencyActive ? "animate-pulse" : ""}
            />
            {/* Line 2 Sierra to Reno */}
            <line x1="120" y1="120" x2="220" y2="70" stroke="#22c55e" strokeWidth="2" />
            {/* Line 3 Reno to Tahoe */}
            <line x1="220" y1="70" x2="330" y2="170" stroke="#22c55e" strokeWidth="2" />

            {/* Substation Nodes */}
            {/* Sierra Substation */}
            <g className="cursor-pointer" onClick={() => setActiveBus("Sierra A")}>
              <rect
                x="90"
                y="100"
                width="60"
                height="40"
                rx="3"
                fill="#151A21"
                stroke="#ff7a1a"
                strokeWidth="2"
              />
              <text
                x="120"
                y="125"
                fill="#f8fafc"
                fontSize="9"
                textAnchor="middle"
                fontWeight="bold"
              >
                SIERRA
              </text>
            </g>
            {/* Reno Substation */}
            <g className="cursor-pointer" onClick={() => setActiveBus("Reno Sub B")}>
              <rect
                x="190"
                y="50"
                width="60"
                height="40"
                rx="3"
                fill="#151A21"
                stroke="#22c55e"
                strokeWidth="2"
              />
              <text
                x="220"
                y="75"
                fill="#f8fafc"
                fontSize="9"
                textAnchor="middle"
                fontWeight="bold"
              >
                RENO
              </text>
            </g>
            {/* Tahoe Substation */}
            <g className="cursor-pointer" onClick={() => setActiveBus("Tahoe Sub A")}>
              <rect
                x="300"
                y="150"
                width="60"
                height="40"
                rx="3"
                fill="#151A21"
                stroke="#22c55e"
                strokeWidth="2"
              />
              <text
                x="330"
                y="175"
                fill="#f8fafc"
                fontSize="9"
                textAnchor="middle"
                fontWeight="bold"
              >
                TAHOE
              </text>
            </g>

            {/* Outage indicator if contingency is active */}
            {contingencyActive && (
              <g transform="translate(225, 145)">
                <circle r="12" fill="#ef4444" opacity="0.3" className="animate-ping" />
                <circle r="8" fill="#ef4444" />
                <text x="0" y="3" fill="#fff" fontSize="8" textAnchor="middle" fontWeight="bold">
                  !
                </text>
              </g>
            )}
          </svg>

          <span className="absolute bottom-2 left-2 text-[9px] font-mono text-slate-500">
            [CLICK NODES TO AUDIT LIVE VOLTAGE]
          </span>
        </div>

        {/* Node Telemetry Inspector */}
        <div className="p-4 border border-slate-200 dark:border-[#1E293B] bg-slate-50/30 dark:bg-[#151A21]/30 rounded-[3px] flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase font-mono tracking-wider border-b border-slate-200 dark:border-slate-800 pb-1">
              Substation Telemetry
            </h4>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Selected Node</span>
                <span className="text-slate-300 font-bold">{activeBus}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Bus Voltage</span>
                <span className="text-slate-300">0.998 p.u.</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Active Load</span>
                <span className="text-slate-300">
                  {activeBus.includes("Sierra")
                    ? "420 MW"
                    : activeBus.includes("Reno")
                      ? "280 MW"
                      : "340 MW"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Substation Status</span>
                <span className="text-emerald-500 font-bold">NOMINAL</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => setContingencyActive(!contingencyActive)}
              className={`w-full py-1.5 rounded-[3px] font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 ${
                contingencyActive
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-slate-200 dark:bg-[#1C222B] hover:bg-slate-300 dark:hover:bg-[#1E293B] text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-[#2A313C]"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              {contingencyActive ? "Reset Contingency Outage" : "Simulate Tahoe Outage"}
            </button>
            <p className="text-[10px] text-slate-500 font-mono text-center">
              {contingencyActive
                ? "⚠️ LINE SIERRA-TAHOE OVERLOAD WARNING"
                : "Line load levels fully nominal."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* 5. POLICY ARTIFACT VIEW                                                    */
/* ────────────────────────────────────────────────────────────────────────── */
function PolicyArtifact({ data }: { data: any }) {
  const policyName = data?.name || "Active Operating Policy";
  const desc = data?.description || "Currently enforcing grid coefficients.";
  const weights = data?.weights || { cost: 0.25, carbon: 0.25, stability: 0.25, reliability: 0.25 };
  const constraints = data?.constraints || {
    voltage_deviation_pct: 5.0,
    thermal_limit_pct: 90.0,
    min_soc_pct: 20.0,
  };
  const expectedOutcome = data?.expected_outcome || "Stable balanced operations.";

  return (
    <div className="space-y-6 text-[#94A3B8]">
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-500" /> {policyName} Configurator
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{desc}</p>
      </div>

      {/* Weights */}
      <div className="space-y-3">
        <span className="text-[10px] font-mono text-slate-400 block uppercase tracking-wider">
          Objective Weighting Vectors
        </span>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(weights).map(([key, val]: [string, any]) => (
            <div
              key={key}
              className="p-3 border border-slate-200 dark:border-[#1E293B] bg-slate-50/30 dark:bg-[#151A21]/30 rounded font-mono text-xs"
            >
              <div className="flex justify-between text-slate-400 mb-1 capitalize">
                <span>{key} Optimization</span>
                <span className="text-orange-500 font-bold">{Math.round(val * 100)}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-[#1C222B] rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 rounded-full"
                  style={{ width: `${val * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Constraints list */}
      <div className="space-y-3">
        <span className="text-[10px] font-mono text-slate-400 block uppercase tracking-wider">
          Operational Constraints Limits
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
          {Object.entries(constraints).map(([key, val]: [string, any]) => (
            <div
              key={key}
              className="p-2 border border-slate-200 dark:border-[#2A313C]/40 bg-[#151A21]/20 rounded"
            >
              <span className="text-[9px] text-slate-500 uppercase block">
                {key.replace("_pct", "")} Limit
              </span>
              <span className="text-sm text-slate-200 mt-1 block font-bold">{val}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Expected outcome */}
      <div className="p-4 bg-slate-50 dark:bg-[#151A21]/30 border border-slate-200 dark:border-[#2A313C]/50 rounded text-xs space-y-1.5">
        <span className="font-mono text-[9px] font-bold text-slate-400 uppercase block">
          Expected Grid Outcomes
        </span>
        <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
          {expectedOutcome}
        </p>
      </div>
    </div>
  );
}
