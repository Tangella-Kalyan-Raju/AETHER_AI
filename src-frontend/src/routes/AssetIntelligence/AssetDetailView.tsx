import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, RefreshCw, Calendar, History } from "lucide-react";
import { assetApi } from "../../api/assets";
import { AssetBadge } from "./components/AssetBadge";
import { AssetMetadataCard } from "./components/AssetMetadataCard";
import { AssetLocationCard } from "./components/AssetLocationCard";
import { HealthGauge } from "./components/HealthGauge";
import { HealthStatusCard } from "./components/HealthStatusCard";
import { MaintenanceCard } from "./components/MaintenanceCard";
import { AssetTimeline } from "./components/AssetTimeline";
import { LoadingState, ErrorState } from "./components/StateStates";
import { AssetAIRecommendationPanel } from "./components/AssetAIRecommendationPanel";

export default function AssetDetailView() {
  const { id } = useParams<{ id: string }>();
  const [asset, setAsset] = useState<any | null>(null);
  const [health, setHealth] = useState<any | null>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetails = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const assetIdNum = parseInt(id);

      const res = await assetApi.getAsset(assetIdNum);
      const healthData = await assetApi.getAssetHealth(assetIdNum);
      const timelineData = await assetApi.getAssetTimeline(assetIdNum);
      const hist = await assetApi.getHistory(assetIdNum);

      setAsset(res);
      setHealth(healthData);
      setTimeline(timelineData);
      setHistory(hist);
    } catch (err: any) {
      console.error(err);
      setError("Failed to fetch detailed specifications and health diagnostics for asset ID.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  if (loading) return <LoadingState message="Loading asset specifications and health indices..." />;
  if (error || !asset) return <ErrorState message={error || ""} retry={fetchDetails} />;

  return (
    <div className="space-y-6 py-2 select-text">
      {/* Header breadcrumb link */}
      <div>
        <Link
          to="/asset-intelligence/registry"
          className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-emerald-500 font-mono transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Registry</span>
        </Link>
      </div>

      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono text-slate-450 dark:text-slate-500 uppercase tracking-widest">
              SYSTEM ELEMENT SPECIFICATIONS // {asset.asset_id}
            </span>
            <AssetBadge status={asset.status} />
          </div>
          <h1 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-[#F8FAFC]">
            {asset.name}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {asset.type} — Registered Grid Asset
          </p>
        </div>

        <div className="flex items-center gap-4">
          {health && <HealthGauge score={health.health_score} />}
          <button
            onClick={fetchDetails}
            className="flex items-center justify-center p-2 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-[#2A313C] rounded-[4px] hover:bg-slate-50 dark:hover:bg-[#11161D] transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Specifications & Diagnostics */}
        <div className="lg:col-span-2 space-y-6">
          {/* Health Diagnostics Card */}
          {health && <HealthStatusCard health={health} />}

          {/* Maintenance Predictor Card */}
          {health && <MaintenanceCard maintenance={health} />}

          {/* AI Decision Panel */}
          <AssetAIRecommendationPanel assetId={asset.id} />

          {/* Metadata Card */}
          {asset.metadata && <AssetMetadataCard metadata={asset.metadata} />}

          {/* Location Card */}
          {asset.location && <AssetLocationCard location={asset.location} />}
        </div>

        {/* Sidebar Info - Timeline, Registration details */}
        <div className="space-y-6">
          {/* Chronological Lifecycle Timeline */}
          <AssetTimeline events={timeline} />

          {/* Registration Details */}
          <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-[#2A313C]">
              <Calendar className="w-4 h-4 text-emerald-500" />
              <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-[#F8FAFC]">
                Registration Details
              </h3>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">
                  Installation Date
                </p>
                <p className="text-slate-800 dark:text-slate-200">
                  {asset.metadata?.installation_date
                    ? new Date(asset.metadata.installation_date).toLocaleDateString()
                    : "Unknown"}
                </p>
              </div>

              <div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">
                  Commission Date
                </p>
                <p className="text-slate-800 dark:text-slate-200">
                  {asset.metadata?.commission_date
                    ? new Date(asset.metadata.commission_date).toLocaleDateString()
                    : "Unknown"}
                </p>
              </div>

              <div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">
                  System Owner
                </p>
                <p className="text-slate-800 dark:text-slate-200">
                  {asset.metadata?.owner || "GPO Corporation"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
