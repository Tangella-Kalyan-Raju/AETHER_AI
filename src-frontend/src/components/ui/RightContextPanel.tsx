import React, { useState, useEffect, useRef } from "react";
import {
  Bell,
  CloudLightning,
  Activity,
  ShieldCheck,
  Cpu,
  Thermometer,
  Wind,
  Sun,
  AlertTriangle,
  RefreshCw,
  X,
  Radio,
  Terminal as TerminalIcon,
} from "lucide-react";

interface OperationalEvent {
  id: string;
  severity: string;
  event_type: string;
  description: string;
  timestamp: string;
}

export default function RightContextPanel() {
  const [events, setEvents] = useState<OperationalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [freq, setFreq] = useState(59.982);
  const [volt, setVolt] = useState(0.994);

  // Connection and Refresh States
  const [connected, setConnected] = useState<boolean>(true);
  const [lastRefreshed, setLastRefreshed] = useState<string>("Initializing...");

  // Notification system
  const [notification, setNotification] = useState<string | null>(null);
  const knownEventIdsRef = useRef<Set<string>>(new Set());

  // Real-time scrolling SCADA logs
  const [scadaLogs, setScadaLogs] = useState<string[]>([]);
  const terminalEndRef = useRef<HTMLDivElement | null>(null);

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem("gpo_access_token");
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await fetch(`${API_URL}/api/v1/events`, { headers }).catch(() => null);
      if (res && res.ok) {
        const data = await res.json();
        const latestEvents = data.slice(0, 4) as OperationalEvent[];

        // Check for new incoming high-priority events to trigger notification banner
        let newCriticalDetected = false;
        let newCritMessage = "";

        latestEvents.forEach((evt) => {
          if (!knownEventIdsRef.current.has(evt.id)) {
            knownEventIdsRef.current.add(evt.id);
            if (evt.severity === "CRITICAL" || evt.severity === "WARNING") {
              newCriticalDetected = true;
              newCritMessage = `${evt.severity}: ${evt.event_type} - ${evt.description}`;
            }
          }
        });

        if (newCriticalDetected && knownEventIdsRef.current.size > latestEvents.length) {
          setNotification(newCritMessage);
        }

        setEvents(latestEvents);
        setConnected(true);
      } else {
        throw new Error("Offline mode");
      }
    } catch {
      setConnected(false);
      // Fallback fallback simulated events
      const mockEvents = [
        {
          id: "evt-1",
          severity: "CRITICAL",
          event_type: "Bus Voltage Drop",
          description: "Sierra Bus-A voltage dip detected at 0.942 p.u.",
          timestamp: new Date().toISOString(),
        },
        {
          id: "evt-2",
          severity: "WARNING",
          event_type: "High Load Congestion",
          description: "Tahoe branch line active load at 94% capacity",
          timestamp: new Date().toISOString(),
        },
        {
          id: "evt-3",
          severity: "INFO",
          event_type: "Dispatch Updated",
          description: "Battery Storage set to charge cycles nominal",
          timestamp: new Date().toISOString(),
        },
      ];
      setEvents(mockEvents);
    } finally {
      setLoading(false);
      setLastRefreshed(new Date().toLocaleTimeString("en-US", { hour12: false }));
    }
  };

  // Poll events and parameters
  useEffect(() => {
    fetchEvents();

    // Background polling every 5 seconds
    const intervalEvents = setInterval(() => {
      fetchEvents();
    }, 5000);

    const intervalStats = setInterval(() => {
      setFreq((prev) => {
        const delta = (Math.random() - 0.5) * 0.01;
        return Math.max(59.9, Math.min(60.1, prev + delta));
      });
      setVolt((prev) => {
        const delta = (Math.random() - 0.5) * 0.001;
        return Math.max(0.98, Math.min(1.02, prev + delta));
      });
    }, 5000);

    return () => {
      clearInterval(intervalEvents);
      clearInterval(intervalStats);
    };
  }, []);

  // Simulate scrolling SCADA logs
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
      setScadaLogs((prev) => [...prev.slice(-30), `[${timestamp}] ${randomMsg}`]);
    }, 3000);

    return () => clearInterval(scadaInterval);
  }, []);

  // Auto-scroll terminal log
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [scadaLogs]);

  const getSeverityBadge = (severity: string) => {
    const norm = severity?.toUpperCase();
    if (norm === "CRITICAL") {
      return (
        <span className="px-1 text-[7px] font-bold rounded-[1px] bg-red-500/20 text-red-400 border border-red-500/20 uppercase">
          Critical
        </span>
      );
    }
    if (norm === "WARNING") {
      return (
        <span className="px-1 text-[7px] font-bold rounded-[1px] bg-amber-500/20 text-amber-400 border border-amber-500/20 uppercase">
          Warning
        </span>
      );
    }
    return (
      <span className="px-1 text-[7px] font-bold rounded-[1px] bg-sky-500/20 text-sky-400 border border-sky-500/20 uppercase">
        Info
      </span>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#07090C] border-l border-[#1E293B] select-none text-slate-300 font-sans">
      {/* Panel Header */}
      <div className="h-14 px-4 border-b border-[#1E293B] flex items-center justify-between bg-[#0B0E13]">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-orange-500 animate-pulse" />
          <span className="text-[10px] font-mono font-bold tracking-widest text-[#F8FAFC]">
            CONTEXT OBSERVATIONS
          </span>
        </div>

        {/* Connection status */}
        <div className="flex items-center gap-1.5">
          <span
            className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`}
          />
          <span
            className={`text-[8px] font-mono font-bold uppercase ${connected ? "text-emerald-400" : "text-red-400"}`}
          >
            {connected ? "Synced" : "Offline"}
          </span>
        </div>
      </div>

      {/* Slide-down alert notification banner */}
      {notification && (
        <div className="p-2.5 bg-red-950/90 border-b border-red-800 text-red-300 text-[10px] flex items-start justify-between gap-2 animate-bounce">
          <div className="flex gap-2 items-start">
            <Bell className="w-4 h-4 shrink-0 text-red-400 animate-pulse" />
            <div>
              <span className="font-bold block uppercase text-[8px] tracking-wider text-red-200">
                New Operational Threat
              </span>
              <p className="mt-0.5 leading-relaxed text-slate-200">{notification}</p>
            </div>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="p-0.5 rounded hover:bg-red-900/50 text-red-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Panel Sections */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Section 1: Weather Intelligence */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold tracking-wider text-slate-500 uppercase">
            <CloudLightning className="w-3.5 h-3.5 text-yellow-500" />
            <span>Weather Intelligence</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 bg-[#151A21]/40 border border-[#2A313C]/40 rounded-[2px]">
              <div className="flex items-center gap-1 text-slate-500 text-[10px] uppercase font-mono">
                <Thermometer className="w-3 h-3" /> Temp
              </div>
              <div className="text-sm font-bold text-slate-200 mt-1 font-mono">74.2 °F</div>
            </div>
            <div className="p-2 bg-[#151A21]/40 border border-[#2A313C]/40 rounded-[2px]">
              <div className="flex items-center gap-1 text-slate-500 text-[10px] uppercase font-mono">
                <Wind className="w-3 h-3" /> Wind
              </div>
              <div className="text-sm font-bold text-slate-200 mt-1 font-mono">14.6 m/s</div>
            </div>
            <div className="p-2 bg-[#151A21]/40 border border-[#2A313C]/40 rounded-[2px]">
              <div className="flex items-center gap-1 text-slate-500 text-[10px] uppercase font-mono">
                <Sun className="w-3 h-3" /> Solar Index
              </div>
              <div className="text-sm font-bold text-slate-200 mt-1 font-mono">850 W/m²</div>
            </div>
            <div className="p-2 bg-[#151A21]/40 border border-[#2A313C]/40 rounded-[2px]">
              <div className="flex items-center gap-1 text-slate-500 text-[10px] uppercase font-mono">
                Cloud Cover
              </div>
              <div className="text-sm font-bold text-slate-200 mt-1 font-mono">15.4%</div>
            </div>
          </div>
        </div>

        {/* Section 2: Active Grid Alerts (Live Event Feed) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-[10px] font-mono font-bold tracking-wider text-slate-500 uppercase">
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />
              <span>Grid Anomaly Log</span>
            </span>
            <button
              onClick={() => {
                setLoading(true);
                fetchEvents();
              }}
              className="hover:text-[#FF7A1A]"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2 max-h-[170px] overflow-y-auto pr-1">
            {loading ? (
              <div className="text-[10px] font-mono text-slate-500 italic">
                Syncing event logs...
              </div>
            ) : events.length > 0 ? (
              events.map((evt) => (
                <div
                  key={evt.id}
                  className="p-2.5 border border-[#2A313C]/40 bg-[#151A21]/20 rounded-[2px] space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-slate-300 font-sans">
                      {evt.event_type}
                    </span>
                    {getSeverityBadge(evt.severity)}
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
                    {evt.description}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-[10px] font-mono text-slate-500 italic">
                No anomalies logged.
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Live SCADA Operational Logs Terminal */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold tracking-wider text-slate-500 uppercase">
            <TerminalIcon className="w-3.5 h-3.5 text-emerald-400" />
            <span>SCADA System Console</span>
          </div>
          <div className="bg-[#05070A] border border-slate-850 p-2 rounded text-[9px] font-mono text-emerald-400 h-28 overflow-y-auto flex flex-col space-y-1 select-text">
            {scadaLogs.map((log, index) => (
              <div key={index} className="leading-normal whitespace-pre-wrap">
                {log}
              </div>
            ))}
            <div ref={terminalEndRef} />
          </div>
        </div>

        {/* Section 4: Solver & Optimization Status */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold tracking-wider text-slate-500 uppercase">
            <Cpu className="w-3.5 h-3.5 text-purple-500" />
            <span>Active Optimization System</span>
          </div>
          <div className="p-3 bg-[#151A21]/40 border border-[#2A313C]/40 rounded-[2px] space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Solver Engine</span>
              <span className="font-mono text-slate-300 font-semibold">MILP Gurobi v12.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Telemetry Status</span>
              <span className="text-emerald-500 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>{" "}
                NOMINAL
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Frequency Stream</span>
              <span className="font-mono text-slate-300">{freq.toFixed(3)} Hz</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Voltage Stream</span>
              <span className="font-mono text-slate-300">{volt.toFixed(4)} p.u.</span>
            </div>
          </div>
        </div>

        {/* Section 5: AI Agent Telemetry */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold tracking-wider text-slate-500 uppercase">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>AI Confidence & Logs</span>
          </div>
          <div className="p-3 bg-[#151A21]/40 border border-[#2A313C]/40 rounded-[2px] space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Co-Pilot Model</span>
              <span className="text-slate-300 font-semibold">GPO-Agent-v3.5</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Avg LLM Latency</span>
              <span className="font-mono text-slate-300">12ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">LLM Confidence</span>
              <span className="font-mono text-emerald-500 font-semibold">98.4%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Active Token Load</span>
              <span className="font-mono text-slate-400">1,240 t/s</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer System Status */}
      <div className="h-10 border-t border-[#1E293B] px-4 flex items-center justify-between text-[9px] font-mono text-slate-500 bg-[#0B0E13]">
        <div className="flex items-center gap-1.5">
          <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
          <span>Sync: {lastRefreshed}</span>
        </div>
        <span>UTC +00:00</span>
      </div>
    </div>
  );
}
