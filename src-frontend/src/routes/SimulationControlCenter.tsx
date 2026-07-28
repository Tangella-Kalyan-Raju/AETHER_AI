import React, { useState, useEffect } from "react";
import api from "../api/axios";
import {
  Play, Pause, Square, FastForward, ShieldAlert, Activity,
  Loader2, Maximize2, SkipBack, SkipForward, BarChart2, GitBranch, Map
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";

export default function SimulationControlCenter() {
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [activeSimulationId, setActiveSimulationId] = useState<string | null>(null);
  const [simState, setSimState] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    fetchScenarios();
    fetchHistory();
  }, []);

  useEffect(() => {
    let interval: any;
    if (activeSimulationId) {
      interval = setInterval(fetchSimulationState, 1000);
    }
    return () => clearInterval(interval);
  }, [activeSimulationId]);

  const fetchScenarios = async () => {
    try {
      const res = await api.get("/api/v1/scenarios/");
      setScenarios(res.data);
    } catch (e) { console.warn("API Scenarios issue"); }
  };

  const fetchHistory = async () => {
    try {
      const res = await api.get("/api/v1/simulation/history");
      setHistory(res.data);
    } catch (e) { console.warn("API History issue"); }
  };

  const startSimulation = async (scenarioId: string, speed: number = 1.0) => {
    try {
      const res = await api.post("/api/v1/simulation/start", { scenario_id: scenarioId, speed_multiplier: speed });
      setActiveSimulationId(res.data.id);
    } catch (e) { alert("Failed to start simulation"); }
  };

  const stopSimulation = async () => {
    if (!activeSimulationId) return;
    await api.post(`/api/v1/simulation/${activeSimulationId}/stop`);
    setActiveSimulationId(null);
    fetchHistory();
  };

  const fetchSimulationState = async () => {
    if (!activeSimulationId) return;
    try {
      const res = await api.get(`/api/v1/simulation/${activeSimulationId}/state`);
      setSimState(res.data);
      if (res.data.status === "COMPLETED" || res.data.status === "FAILED") {
        setActiveSimulationId(null);
        fetchHistory();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 p-6 pb-32">
      <PageHeader 
        title="Simulation Control Center" 
        subtitle="Execute, monitor, and compare enterprise grid scenarios in a safe digital twin environment." 
      />

      {!activeSimulationId ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-xl bg-white dark:bg-[#0B0E13] border border-slate-200 dark:border-[#1E293B] shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <GitBranch className="w-5 h-5 text-orange-500" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Available Scenarios</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {scenarios.map((s) => (
                  <div key={s.id} className="p-4 rounded-lg bg-slate-50 dark:bg-[#151A21] border border-slate-200 dark:border-[#2A313C] hover:border-orange-500/50 transition-colors flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-slate-900 dark:text-white">{s.name}</h3>
                        <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-200 dark:bg-[#1E293B] px-1.5 py-0.5 rounded">{s.scenario_type}</span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">{s.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => startSimulation(s.id, 1.0)} className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded flex items-center justify-center gap-1"><Play className="w-3 h-3"/> Run</button>
                      <button onClick={() => startSimulation(s.id, 10.0)} className="flex-1 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded flex items-center justify-center gap-1"><FastForward className="w-3 h-3"/> Fast</button>
                    </div>
                  </div>
                ))}
                {scenarios.length === 0 && (
                  <div className="col-span-full py-12 text-center border border-dashed border-slate-200 dark:border-[#2A313C] rounded-lg">
                    <p className="text-sm text-slate-500">No scenarios available.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="p-6 rounded-xl bg-white dark:bg-[#0B0E13] border border-slate-200 dark:border-[#1E293B] shadow-sm min-h-[300px]">
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 className="w-5 h-5 text-blue-500" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Recent Simulations</h2>
              </div>
              <div className="space-y-3">
                {history.map(h => (
                  <div key={h.id} className="p-3 rounded bg-slate-50 dark:bg-[#151A21] border border-slate-200 dark:border-[#2A313C] flex justify-between items-center cursor-pointer hover:border-blue-500/50">
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">Sim {h.id.substring(0,6)}</p>
                      <p className="text-xs text-slate-500">{new Date(h.completed_at).toLocaleTimeString()}</p>
                    </div>
                    <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${h.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>{h.status}</span>
                  </div>
                ))}
                {history.length === 0 && (
                  <div className="py-12 text-center border border-dashed border-slate-200 dark:border-[#2A313C] rounded-lg">
                    <p className="text-sm text-slate-500">No recent simulations.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Playback & Status Header */}
          <div className="p-4 rounded-xl bg-white dark:bg-[#0B0E13] border border-orange-500/30 shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0">
                <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">SIMULATION RUNNING</h2>
                <div className="flex gap-4 mt-1">
                  <span className="text-xs font-mono text-slate-500">T+{simState?.current_time || 0} mins</span>
                  <span className="text-xs font-mono text-orange-500 font-bold">{simState?.status}</span>
                </div>
              </div>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-[#151A21] p-1.5 rounded-lg border border-slate-200 dark:border-[#2A313C]">
              <button className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"><SkipBack className="w-4 h-4" /></button>
              <button className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"><Pause className="w-4 h-4" /></button>
              <button className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"><Play className="w-4 h-4" /></button>
              <button className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"><FastForward className="w-4 h-4" /></button>
              <button className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"><SkipForward className="w-4 h-4" /></button>
              <div className="w-px h-6 bg-slate-300 dark:bg-[#2A313C] mx-1" />
              <button onClick={stopSimulation} className="p-2 text-red-500 hover:bg-red-500/10 rounded"><Square className="w-4 h-4 fill-current" /></button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 flex flex-col gap-6">
              {/* Interactive Timeline */}
              <div className="p-5 rounded-xl bg-white dark:bg-[#0B0E13] border border-slate-200 dark:border-[#1E293B]">
                 <div className="flex justify-between items-center mb-4">
                   <h3 className="font-bold flex items-center gap-2"><Activity className="w-4 h-4 text-emerald-500"/> Execution Timeline</h3>
                 </div>
                 <div className="relative h-2 bg-slate-200 dark:bg-[#1E293B] rounded-full overflow-hidden">
                   <div className="absolute top-0 left-0 h-full bg-emerald-500 transition-all duration-1000" style={{width: `${Math.min(100, ((simState?.current_time || 0) / 1440) * 100)}%`}}></div>
                 </div>
                 <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-2">
                   <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>24:00</span>
                 </div>
              </div>

              {/* Digital Twin Overlay Placeholder */}
              <div className="p-5 rounded-xl bg-white dark:bg-[#0B0E13] border border-slate-200 dark:border-[#1E293B] flex-1 min-h-[400px] flex flex-col items-center justify-center relative overflow-hidden">
                <Maximize2 className="absolute top-4 right-4 w-5 h-5 text-slate-400 cursor-pointer hover:text-white" />
                <Map className="w-16 h-16 text-slate-200 dark:text-[#1E293B] mb-4" />
                <p className="text-slate-500 font-bold">Interactive Grid Map Overlay</p>
                <p className="text-xs text-slate-400 max-w-sm text-center mt-2">The digital twin will render geospatial impact markers here in real-time as the simulation timeline progresses.</p>
              </div>
            </div>

            {/* Audit & Metrics */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              <div className="p-5 rounded-xl bg-white dark:bg-[#0B0E13] border border-slate-200 dark:border-[#1E293B] flex-1">
                <h3 className="font-bold flex items-center gap-2 mb-4 text-sm"><ShieldAlert className="w-4 h-4 text-amber-500"/> Live Event Log</h3>
                <div className="space-y-3 h-[500px] overflow-auto pr-2">
                  {(simState?.recent_events || []).map((evt: any, i: number) => (
                    <div key={i} className="p-3 bg-slate-50 dark:bg-[#151A21] border border-slate-200 dark:border-[#2A313C] rounded-lg">
                      <div className="flex justify-between text-[10px] font-mono text-emerald-500 mb-1">
                        <span>T+{evt.time}m</span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300">{evt.msg}</p>
                    </div>
                  ))}
                  {(!simState?.recent_events?.length) && <p className="text-xs text-slate-500 text-center py-12">Waiting for events...</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
