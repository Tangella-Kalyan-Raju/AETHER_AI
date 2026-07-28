import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { InteractiveGridMap } from "@/components/digital-twin/InteractiveGridMap";
import { AssetDetailPanel } from "@/components/digital-twin/AssetDetailPanel";
import { AssetSummaryCard } from "@/components/digital-twin/AssetCards";
import { api } from "@/lib/api";
import { Loader2, Server, Activity, Zap, Layers } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function EnterpriseDigitalTwinDashboard() {
  const [assets, setAssets] = useState<any[]>([]);
  const [topology, setTopology] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string | null>(null);

  useEffect(() => {
    const fetchDT = async () => {
      try {
        const [assetRes, topoRes] = await Promise.all([
          api.get("/dt/assets"),
          api.get("/dt/grid/topology"),
        ]);
        setAssets(assetRes.data);
        setTopology(topoRes.data);
        if (assetRes.data.length > 0) setSelectedAsset(assetRes.data[0]);
      } catch (err) {
        console.error("Failed to load Digital Twin", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDT();
  }, []);

  const filteredAssets = assets.filter((a) => {
    if (filterType && a.type !== filterType) return false;
    if (search && !a.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const activeAssets = assets.filter((a) => a.state?.operational_state === "Online").length;
  const totalPower = assets
    .filter((a) => a.state?.active_power)
    .reduce((acc, a) => acc + (a.state.active_power || 0), 0);

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-500">
      <PageHeader
        title="Enterprise Digital Twin Foundation"
        description="Live virtual representation of all connected grid assets, topological hierarchy, and dynamic state telemetry."
      />

      {loading ? (
        <div className="h-[400px] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <AssetSummaryCard title="Total Monitored Assets" value={assets.length} icon={Server} />
            <AssetSummaryCard
              title="Active Operational Units"
              value={activeAssets}
              icon={Activity}
            />
            <AssetSummaryCard
              title="Live Power Flow"
              value={`${totalPower.toFixed(1)} MW`}
              icon={Zap}
            />
            <AssetSummaryCard
              title="Topological Connections"
              value={topology.length}
              icon={Layers}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-4">
              <Card className="border border-slate-200 dark:border-[#2A313C] bg-white dark:bg-[#1E232B] shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-[#2A313C] bg-slate-50 dark:bg-[#161B22] flex justify-between items-center">
                  <h3 className="font-semibold text-slate-900 dark:text-white flex items-center">
                    <Layers className="w-4 h-4 mr-2 text-indigo-500" /> Interactive Grid Map
                  </h3>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Search assets..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-64 h-8 text-sm"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFilterType(null)}
                      className={
                        !filterType ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600" : ""
                      }
                    >
                      All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFilterType("Substation")}
                      className={
                        filterType === "Substation"
                          ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600"
                          : ""
                      }
                    >
                      Substations
                    </Button>
                  </div>
                </div>
                <InteractiveGridMap
                  assets={filteredAssets}
                  topology={topology}
                  selectedAssetId={selectedAsset?.id}
                  onAssetSelect={setSelectedAsset}
                />
              </Card>
            </div>
            <div className="lg:col-span-4">
              <Card className="h-full border border-slate-200 dark:border-[#2A313C] bg-white dark:bg-[#1E232B] shadow-sm">
                <div className="p-4 border-b border-slate-100 dark:border-[#2A313C] bg-slate-50 dark:bg-[#161B22]">
                  <h3 className="font-semibold text-slate-900 dark:text-white flex items-center">
                    <Activity className="w-4 h-4 mr-2 text-blue-500" /> Asset Inspection
                  </h3>
                </div>
                <div className="p-6">
                  <AssetDetailPanel asset={selectedAsset} />
                </div>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
