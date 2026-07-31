import React, { createContext, useState, useEffect, useCallback, ReactNode } from "react";

export interface EventTimelineItem {
  id: string;
  timestamp: string;
  assetName: string;
  eventType: "state_change" | "overload" | "info" | "error";
  message: string;
}

interface TelemetryContextType {
  topology: any;
  liveMeasurements: Record<string, any>;
  eventTimeline: EventTimelineItem[];
  loading: boolean;
  error: string | null;
  refreshInterval: number; // in ms
  setRefreshInterval: (ms: number) => void;
  triggerManualRefresh: () => Promise<void>;
  addEvent: (item: Omit<EventTimelineItem, "id" | "timestamp">) => void;
  clearTimeline: () => void;
  integrationData: {
    weather: any[];
    demand: any[];
    solar: any[];
  };
  activePolicy: any;
  recommendations: any;
  simulationResults: any;
  deploymentStatus: string | null;
  governanceLoading: boolean;
  governanceError: string | null;
  triggerGovernanceRefresh: () => Promise<void>;
  updateSimulationResults: (results: any) => void;
}

export const TelemetryContext = createContext<TelemetryContextType | undefined>(undefined);

interface TelemetryProviderProps {
  children: ReactNode;
}

export function TelemetryProvider({ children }: TelemetryProviderProps) {
  const [topology, setTopology] = useState<any>(null);
  const [liveMeasurements, setLiveMeasurements] = useState<Record<string, any>>({});
  const [eventTimeline, setEventTimeline] = useState<EventTimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshInterval, setRefreshInterval] = useState(4000); // 4 seconds default

  const [integrationData, setIntegrationData] = useState({
    weather: [],
    demand: [],
    solar: [],
  });

  const [activePolicy, setActivePolicy] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [simulationResults, setSimulationResults] = useState<any>(null);
  const [deploymentStatus, setDeploymentStatus] = useState<string | null>(null);
  const [governanceLoading, setGovernanceLoading] = useState(false);
  const [governanceError, setGovernanceError] = useState<string | null>(null);

  const fetchGovernanceData = useCallback(async () => {
    setGovernanceLoading(true);
    setGovernanceError(null);
    try {
      const token = localStorage.getItem("gpo_access_token");
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
      const headers = { Authorization: `Bearer ${token}` };

      // 1. Fetch policies to identify active policy & status
      const pRes = await fetch(`${API_URL}/api/v1/policies`, { headers });
      if (pRes.ok) {
        const pJson = await pRes.json();
        const payload = pJson.success !== undefined ? pJson.data : pJson;
        const items = payload.items || payload || [];
        const active = items.find((p: any) => p.is_active);
        if (active) {
          setActivePolicy((prev: any) => {
            // Only update state if something actually changed to minimize re-renders
            if (!prev || prev.id !== active.id || prev.status !== active.status) {
              return active;
            }
            return prev;
          });
          setDeploymentStatus(active.status);
        }
      }

      // 2. Fetch AI Recommendations
      const rRes = await fetch(`${API_URL}/api/v1/policies/recommendations/explain`, { headers });
      if (rRes.ok) {
        const rJson = await rRes.json();
        setRecommendations((prev: any) => {
          // Compare strings or nested properties to avoid needless updates
          if (JSON.stringify(prev) !== JSON.stringify(rJson.data || rJson)) {
            return rJson.data || rJson;
          }
          return prev;
        });
      }
    } catch (err: any) {
      console.error("[GPO-GOVERNANCE] Failed to fetch governance updates:", err);
      setGovernanceError(err.message || "Failed to update governance state.");
    } finally {
      setGovernanceLoading(false);
    }
  }, []);

  const updateSimulationResults = useCallback((results: any) => {
    setSimulationResults(results);
  }, []);

  const addEvent = useCallback((item: Omit<EventTimelineItem, "id" | "timestamp">) => {
    const newItem: EventTimelineItem = {
      ...item,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
    };
    setEventTimeline((prev) => [newItem, ...prev].slice(0, 100)); // cap at 100 items
  }, []);

  const clearTimeline = useCallback(() => {
    setEventTimeline([]);
  }, []);

  // Compute live measurements based on grid physics
  const computeGridMeasurements = useCallback((data: any) => {
    if (!data) return {};
    const measures: Record<string, any> = {};
    const time = Date.now();

    // 1. Compute fluctuating Generator values (turbine governor loop simulation)
    const genOffset = 3.5 * Math.sin(time / 7000); // 7s cycle
    data.topology.generators.forEach((gen: any) => {
      const liveP = Math.max(0, Math.min(gen.capacity_mw, gen.p_mw + genOffset));
      const utilization = (liveP / gen.capacity_mw) * 100;
      let health = "Excellent";
      let healthScore = 98;

      if (utilization > 95) {
        health = "Critical";
        healthScore = 38;
      } else if (utilization > 85) {
        health = "Fair";
        healthScore = 72;
      } else if (utilization > 50) {
        health = "Good";
        healthScore = 88;
      }

      measures[`generator-${gen.id}`] = {
        p_mw: parseFloat(liveP.toFixed(2)),
        q_mvar: parseFloat((gen.q_mvar + genOffset * 0.25).toFixed(2)),
        utilization: parseFloat(utilization.toFixed(1)),
        health,
        healthScore,
        status: gen.status || "active",
      };
    });

    // 2. Compute fluctuating Load values
    const loadOffset = 2.0 * Math.cos(time / 10000); // 10s cycle
    data.topology.loads.forEach((load: any) => {
      const liveP = Math.max(0, load.p_mw + loadOffset);
      measures[`load-${load.id}`] = {
        p_mw: parseFloat(liveP.toFixed(2)),
        q_mvar: parseFloat((load.q_mvar + loadOffset * 0.2).toFixed(2)),
        status: load.status || "active",
      };
    });

    // 3. Switch status mapping
    const activeSwitches: Record<number, string> = {};
    data.topology.switches.forEach((sw: any) => {
      activeSwitches[sw.id] = sw.state;
      measures[`switch-${sw.id}`] = {
        state: sw.state,
        status: sw.status || "active",
      };
    });

    // 4. Calculate grid flow paths and Line/Transformer currents (simplified DC power flow solver)
    // Find if line switches are open (de-energizing lines)
    const isLineEnergized = (lineId: number) => {
      const lineSwitches = data.topology.switches.filter((s: any) => s.line_id === lineId);
      // If any associated switch/breaker is open, the line trips
      return !lineSwitches.some((s: any) => s.state === "open");
    };

    // Net generation minus load at each busbar node
    const busNetPower: Record<number, number> = {};
    data.topology.buses.forEach((bus: any) => {
      let net = 0;
      // Add gen
      data.topology.generators
        .filter((g: any) => g.bus_id === bus.id)
        .forEach((g: any) => {
          const m = measures[`generator-${g.id}`];
          if (m && m.status === "active") net += m.p_mw;
        });
      // Sub load
      data.topology.loads
        .filter((l: any) => l.bus_id === bus.id)
        .forEach((l: any) => {
          const m = measures[`load-${l.id}`];
          if (m && m.status === "active") net -= m.p_mw;
        });
      busNetPower[bus.id] = net;
    });

    // Calculate line flow (simplified proportional distribution)
    data.topology.transmission_lines.forEach((line: any) => {
      let flow = 0;
      const energized = isLineEnergized(line.id);

      if (energized) {
        // Line flow approximation based on net power difference between ends
        const fromNet = busNetPower[line.from_bus_id] || 0;
        const toNet = busNetPower[line.to_bus_id] || 0;
        flow = (fromNet - toNet) * 0.45; // split coefficient
        // Cap to rating limits
        flow = Math.max(-line.rating_mva, Math.min(line.rating_mva, flow));
      }

      const absFlow = Math.abs(flow);
      const utilization = (absFlow / line.rating_mva) * 100;
      // I = S / (sqrt(3) * V_kv)
      const bus = data.topology.buses.find((b: any) => b.id === line.from_bus_id);
      const kv = bus ? bus.base_kv : 138.0;
      const currentAmps = (absFlow * 1000) / (Math.sqrt(3) * kv);

      let health = "Excellent";
      let healthScore = 99;
      if (utilization > 95) {
        health = "Critical";
        healthScore = 32;
      } else if (utilization > 80) {
        health = "Fair";
        healthScore = 75;
      }

      measures[`transmission_line-${line.id}`] = {
        flow_mw: parseFloat(flow.toFixed(2)),
        current_a: parseFloat(currentAmps.toFixed(1)),
        utilization: parseFloat(utilization.toFixed(1)),
        health,
        healthScore,
        status: energized ? "active" : "tripped",
      };
    });

    // Transformers
    data.topology.transformers.forEach((xfmr: any) => {
      let flow = 0;
      const fromNet = busNetPower[xfmr.from_bus_id] || 0;
      const toNet = busNetPower[xfmr.to_bus_id] || 0;
      flow = Math.abs(fromNet - toNet) * 0.35;
      flow = Math.min(xfmr.rating_mva, flow);

      const utilization = (flow / xfmr.rating_mva) * 100;

      measures[`transformer-${xfmr.id}`] = {
        flow_mw: parseFloat(flow.toFixed(2)),
        utilization: parseFloat(utilization.toFixed(1)),
        health: utilization > 90 ? "Fair" : "Excellent",
        healthScore: utilization > 90 ? 78 : 98,
        status: "active",
      };
    });

    // 5. Buses base metadata
    data.topology.buses.forEach((bus: any) => {
      const net = busNetPower[bus.id] || 0;
      measures[`bus-${bus.id}`] = {
        net_power_mw: parseFloat(net.toFixed(2)),
        status: bus.status || "active",
      };
    });

    // 6. Substations aggregation
    data.topology.substations.forEach((sub: any) => {
      measures[`substation-${sub.id}`] = {
        status: sub.status || "active",
      };
    });

    return measures;
  }, []);

  const fetchData = useCallback(
    async (isSilent = false) => {
      if (!isSilent) setLoading(true);
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
          throw new Error("Telemetry database link offline.");
        }

        const json = await res.json();
        if (json.success) {
          // Detect state transitions to trigger chronological events
          if (topology && json.data) {
            // Check switch changes
            json.data.topology.switches.forEach((sw: any) => {
              const oldSw = topology.topology.switches.find((s: any) => s.id === sw.id);
              if (oldSw && oldSw.state !== sw.state) {
                addEvent({
                  assetName: sw.name,
                  eventType: "state_change",
                  message: `Breaker state transitioned from [${oldSw.state.toUpperCase()}] to [${sw.state.toUpperCase()}].`,
                });
              }
            });

            // Check status changes
            json.data.topology.generators.forEach((gen: any) => {
              const oldGen = topology.topology.generators.find((g: any) => g.id === gen.id);
              if (oldGen && oldGen.status !== gen.status) {
                addEvent({
                  assetName: gen.name,
                  eventType: "state_change",
                  message: `Generator status updated to [${gen.status || "active"}].`,
                });
              }
            });
          } else {
            // Initial load logs
            addEvent({
              assetName: "Digital Twin Engine",
              eventType: "info",
              message: "Real-time operating telemetry synchronizing nominal state parameters.",
            });
          }

          setTopology(json.data);
          const measures = computeGridMeasurements(json.data);
          setLiveMeasurements(measures);

          // Check for overload warnings in computed measures
          Object.keys(measures).forEach((key) => {
            const item = measures[key];
            if (item.utilization > 95) {
              const name = key.split("-");
              addEvent({
                assetName: `Overload Warning: ${name[0].toUpperCase()} #${name[1]}`,
                eventType: "overload",
                message: `Asset reached critical stress: ${item.utilization}% capacity utilization.`,
              });
            }
          });

          // Fetch Phase 5.1 Integrations
          try {
            const headers = { Authorization: `Bearer ${token}` };
            const [weatherRes, demandRes, solarRes] = await Promise.all([
              fetch(`${API_URL}/api/v1/integrations/telemetry/temperature?limit=50`, { headers }),
              fetch(`${API_URL}/api/v1/integrations/telemetry/demand_mw?limit=50`, { headers }),
              fetch(`${API_URL}/api/v1/integrations/telemetry/ghi?limit=50`, { headers }),
            ]);

            if (weatherRes.ok && demandRes.ok && solarRes.ok) {
              const weatherData = await weatherRes.json();
              const demandData = await demandRes.json();
              const solarData = await solarRes.json();

              const wData = weatherData.success !== undefined ? weatherData.data : weatherData;
              const dData = demandData.success !== undefined ? demandData.data : demandData;
              const sData = solarData.success !== undefined ? solarData.data : solarData;

              setIntegrationData({
                weather: Array.isArray(wData) ? wData : [],
                demand: Array.isArray(dData) ? dData : [],
                solar: Array.isArray(sData) ? sData : [],
              });
            }
          } catch (intErr) {
            console.warn("[GPO-INTEGRATION] Failed to fetch integration telemetry", intErr);
          }
        } else {
          throw new Error(json.error?.message || "Failed to load Digital Twin summary.");
        }
      } catch (err: any) {
        console.error("[GPO-TELEMETRY]", err);
        setError(err.message || "Failed to connect to gateway.");
      } finally {
        if (!isSilent) setLoading(false);
      }
    },
    [topology, computeGridMeasurements, addEvent]
  );

  // Periodic Telemetry Fluctuation Engine
  useEffect(() => {
    fetchData(); // first fetch
    fetchGovernanceData();
  }, [fetchGovernanceData]);

  useEffect(() => {
    if (!refreshInterval || !topology) return;

    const timer = setInterval(() => {
      // Fluctuate measurements locally between API polls to keep interface feeling alive and fluid
      setLiveMeasurements((prev) => {
        const updated = { ...prev };
        const time = Date.now();
        const genOffset = 2.0 * Math.sin(time / 6000);
        const loadOffset = 1.5 * Math.cos(time / 9000);

        // Update generators in measures
        topology.topology.generators.forEach((gen: any) => {
          const key = `generator-${gen.id}`;
          if (updated[key]) {
            const liveP = Math.max(0, Math.min(gen.capacity_mw, gen.p_mw + genOffset));
            updated[key].p_mw = parseFloat(liveP.toFixed(2));
            updated[key].utilization = parseFloat(((liveP / gen.capacity_mw) * 100).toFixed(1));
          }
        });

        // Update loads in measures
        topology.topology.loads.forEach((load: any) => {
          const key = `load-${load.id}`;
          if (updated[key]) {
            const liveP = Math.max(0, load.p_mw + loadOffset);
            updated[key].p_mw = parseFloat(liveP.toFixed(2));
          }
        });

        return updated;
      });

      // Poll API to check actual database changes
      fetchData(true);
      fetchGovernanceData();
    }, refreshInterval);

    return () => clearInterval(timer);
  }, [refreshInterval, topology, fetchData, fetchGovernanceData]);

  return (
    <TelemetryContext.Provider
      value={{
        topology,
        liveMeasurements,
        eventTimeline,
        loading,
        error,
        refreshInterval,
        setRefreshInterval,
        triggerManualRefresh: () => fetchData(false),
        addEvent,
        clearTimeline,
        integrationData,
        activePolicy,
        recommendations,
        simulationResults,
        deploymentStatus,
        governanceLoading,
        governanceError,
        triggerGovernanceRefresh: fetchGovernanceData,
        updateSimulationResults,
      }}
    >
      {children}
    </TelemetryContext.Provider>
  );
}
export default TelemetryProvider;
