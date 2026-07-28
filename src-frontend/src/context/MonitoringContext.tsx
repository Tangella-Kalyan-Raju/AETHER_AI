import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useMonitoringStream, TelemetryRecord } from "../hooks/useMonitoringStream";

interface AssetCache {
  [assetId: string]: {
    [measurementType: string]: TelemetryRecord;
  };
}

interface MonitoringContextType {
  isConnected: boolean;
  assetCache: AssetCache;
  getLatest: (assetId: string, measurementType: string) => TelemetryRecord | undefined;
  getAllLatest: (measurementType?: string) => TelemetryRecord[];
}

const MonitoringContext = createContext<MonitoringContextType | undefined>(undefined);

export function MonitoringProvider({ children }: { children: React.ReactNode }) {
  const { latestData, isConnected } = useMonitoringStream(
    "ws://localhost:8000/api/v1/monitoring/stream"
  );
  const [assetCache, setAssetCache] = useState<AssetCache>({});

  // Initial fetch could go here (fetching `/api/v1/monitoring/measurements/latest` using react-query)
  // For now we will just populate via WS for simplicity, or we could fetch it via fetch/axios.

  useEffect(() => {
    if (latestData) {
      setAssetCache((prev) => {
        const assetId = latestData.asset_id;
        const type = latestData.measurement_type;
        return {
          ...prev,
          [assetId]: {
            ...(prev[assetId] || {}),
            [type]: latestData,
          },
        };
      });
    }
  }, [latestData]);

  const getLatest = useCallback(
    (assetId: string, measurementType: string) => {
      return assetCache[assetId]?.[measurementType];
    },
    [assetCache]
  );

  const getAllLatest = useCallback(
    (measurementType?: string) => {
      const results: TelemetryRecord[] = [];
      Object.values(assetCache).forEach((asset) => {
        if (measurementType) {
          if (asset[measurementType]) results.push(asset[measurementType]);
        } else {
          results.push(...Object.values(asset));
        }
      });
      return results;
    },
    [assetCache]
  );

  return (
    <MonitoringContext.Provider value={{ isConnected, assetCache, getLatest, getAllLatest }}>
      {children}
    </MonitoringContext.Provider>
  );
}

export function useMonitoring() {
  const context = useContext(MonitoringContext);
  if (!context) {
    throw new Error("useMonitoring must be used within a MonitoringProvider");
  }
  return context;
}
