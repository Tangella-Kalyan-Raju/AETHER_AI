import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { InteractiveGridMap } from "@/components/digital-twin/InteractiveGridMap";
import { PredictionTimeline } from "@/components/digital-twin/PredictionTimeline";
import { RiskHeatmap } from "@/components/digital-twin/RiskHeatmap";
import { api } from "@/lib/api";
import { Loader2, Zap, AlertTriangle, ShieldCheck, Activity } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AssetSummaryCard } from "@/components/digital-twin/AssetCards";

export default function PredictiveDigitalTwinDashboard() {
  const [horizon, setHorizon] = useState(15);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [stability, setStability] = useState<any>(null);
  const [topology, setTopology] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  const fetchPredictions = async (h: number) => {
    try {
      const [predRes, stabRes, topoRes] = await Promise.all([
        api.get(`/prediction?horizon_minutes=${h}`),
        api.get(`/prediction/stability?horizon_minutes=${h}`),
        api.get("/dt/grid/topology"),
      ]);
      setPredictions(predRes.data);
      setStability(stabRes.data);
      setTopology(topoRes.data);
    } catch (err) {
      console.error("Failed to load predictions", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchPredictions(horizon);
  }, [horizon]);

  // Playback effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setHorizon((prev) => {
          const horizons = [15, 30, 60, 360, 720, 1440];
          const idx = horizons.indexOf(prev);
          if (idx < horizons.length - 1) return horizons[idx + 1];
          setIsPlaying(false);
          return prev;
        });
      }, 3000); // Wait 3s before advancing horizon
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Adapt predictions to the InteractiveMap format
  const mappedAssets = predictions.map((p) => ({
    id: p.asset_id,
    name: p.asset_name,
    type: p.asset_type,
    state: {
      operational_state: p.risk_level === "Critical" ? "Offline" : "Online",
      active_power: p.predictions.active_power,
      utilization_pct: p.predictions.utilization_pct,
    },
  }));

  const criticalCount = predictions.filter((p) => p.risk_level === "Critical").length;
  const avgConfidence =
    predictions.length > 0
      ? predictions.reduce((acc, p) => acc + p.confidence, 0) / predictions.length
      : 0;

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Predictive Digital Twin Intelligence"
        description="Simulate and visualize future grid states using forecast intelligence."
      />

      {loading && predictions.length === 0 ? (
        <div className="h-[400px] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <AssetSummaryCard
              title="Predicted Stability"
              value={stability?.stability_score?.toFixed(1) || "0"}
              icon={ShieldCheck}
              trend={stability?.risk_status}
            />
            <AssetSummaryCard title="Critical Risks" value={criticalCount} icon={AlertTriangle} />
            <AssetSummaryCard title="Prediction Horizon" value={`+${horizon}m`} icon={Activity} />
            <AssetSummaryCard
              title="Avg. Confidence"
              value={`${avgConfidence.toFixed(1)}%`}
              icon={Zap}
            />
          </div>

          <PredictionTimeline
            currentHorizon={horizon}
            onHorizonChange={setHorizon}
            isPlaying={isPlaying}
            onPlayToggle={() => setIsPlaying(!isPlaying)}
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8">
              <Card className="h-full border border-slate-200 dark:border-[#2A313C] bg-white dark:bg-[#1E232B] shadow-sm relative">
                {loading && (
                  <div className="absolute inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center rounded-xl">
                    <Loader2 className="w-8 h-8 animate-spin text-white" />
                  </div>
                )}
                <div className="p-4 border-b border-slate-100 dark:border-[#2A313C] bg-slate-50 dark:bg-[#161B22]">
                  <h3 className="font-semibold text-slate-900 dark:text-white flex items-center">
                    <Zap className="w-4 h-4 mr-2 text-indigo-500" /> Future Grid Overlay (+{horizon}
                    m)
                  </h3>
                </div>
                <InteractiveGridMap
                  assets={mappedAssets}
                  topology={topology}
                  onAssetSelect={() => {}}
                />
              </Card>
            </div>
            <div className="lg:col-span-4">
              <Card className="h-full border border-slate-200 dark:border-[#2A313C] bg-white dark:bg-[#1E232B] shadow-sm">
                <div className="p-4 border-b border-slate-100 dark:border-[#2A313C] bg-slate-50 dark:bg-[#161B22]">
                  <h3 className="font-semibold text-slate-900 dark:text-white flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-2 text-orange-500" /> Risk Heatmap
                  </h3>
                </div>
                <div className="p-4">
                  <RiskHeatmap predictions={predictions} />
                </div>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
