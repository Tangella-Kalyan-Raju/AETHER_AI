import { useState, useEffect, useRef } from "react";

export interface TelemetryRecord {
  asset_id: string;
  asset_type: string;
  measurement_type: string;
  value: number;
  unit: string;
  timestamp: string;
  quality: string;
  source: string;
  confidence: number;
  status: string;
}

export function useMonitoringStream(wsUrl: string) {
  const [data, setData] = useState<TelemetryRecord | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let reconnectTimer: NodeJS.Timeout;

    const connect = () => {
      const token = localStorage.getItem("gpo_token"); // Might need this if we secure WS later
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          setData(parsed);
        } catch (err) {
          console.error("Failed to parse telemetry:", err);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        // Auto-reconnect
        reconnectTimer = setTimeout(connect, 3000);
      };

      ws.onerror = (err) => {
        console.error("WebSocket error:", err);
        ws.close();
      };
    };

    connect();

    return () => {
      clearTimeout(reconnectTimer);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [wsUrl]);

  return { latestData: data, isConnected };
}
