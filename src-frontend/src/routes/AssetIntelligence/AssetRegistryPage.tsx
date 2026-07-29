import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Database, RefreshCw, Grid, List } from "lucide-react";
import { assetApi, Asset } from "../../api/assets";
import { AssetTable } from "./components/AssetTable";
import { AssetCard } from "./components/AssetCard";
import { AssetSearchBar } from "./components/AssetSearchBar";
import { AssetFilterPanel } from "./components/AssetFilterPanel";
import { LoadingState, ErrorState, EmptyState } from "./components/StateStates";

export default function AssetRegistryPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter State
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("all");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [voltage, setVoltage] = useState("all");

  // Layout View Preferences
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  const pageSize = 15;

  const fetchAssets = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {
        page,
        size: pageSize,
      };

      if (search.trim()) params.search = search;
      if (region !== "all") params.region = region;
      if (type !== "all") params.type = type;
      if (status !== "all") params.status = status;
      if (voltage !== "all") params.voltage_level = parseFloat(voltage);

      const res = await assetApi.listAssets(params);
      setAssets(res.items);
      setTotal(res.total);
    } catch (err: any) {
      console.error(err);
      setError("Failed to fetch registered assets from system registry.");
    } finally {
      setLoading(false);
    }
  };

  // Trigger search/filter updates on state change
  useEffect(() => {
    fetchAssets();
  }, [page, region, type, status, voltage]);

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 1) {
        fetchAssets();
      } else {
        setPage(1);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6 py-2 select-text">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
            GRID CORE DATABASE
          </p>
          <h1 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-[#F8FAFC]">
            Asset Registry
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Displaying all physical components, substations, and equipment currently in service.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex border border-slate-200 dark:border-[#2A313C] rounded-[4px] overflow-hidden">
            <button
              onClick={() => setViewMode("table")}
              className={`p-2 transition ${
                viewMode === "table"
                  ? "bg-slate-100 dark:bg-[#202731] text-emerald-500"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 transition ${
                viewMode === "grid"
                  ? "bg-slate-100 dark:bg-[#202731] text-emerald-500"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={fetchAssets}
            className="flex items-center justify-center p-2 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-[#2A313C] rounded-[4px] hover:bg-slate-50 dark:hover:bg-[#11161D] transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <Link
            to="/asset-intelligence"
            className="px-3 py-2 bg-slate-100 dark:bg-[#1C222B] text-slate-700 dark:text-slate-350 border border-slate-250 dark:border-[#2A313C] hover:bg-slate-200 dark:hover:bg-[#252D37] rounded-[4px] font-mono text-xs transition"
          >
            Dashboard
          </Link>
        </div>
      </div>

      {/* Main Grid Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Filters Panel */}
        <div className="lg:col-span-1">
          <AssetFilterPanel
            region={region}
            type={type}
            status={status}
            voltage={voltage}
            setRegion={setRegion}
            setType={setType}
            setStatus={setStatus}
            setVoltage={setVoltage}
          />
        </div>

        {/* Assets List/Grid Section */}
        <div className="lg:col-span-3 space-y-4">
          <AssetSearchBar value={search} onChange={setSearch} />

          {loading ? (
            <LoadingState message="Fetching matching assets..." />
          ) : error ? (
            <ErrorState message={error} retry={fetchAssets} />
          ) : assets.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {viewMode === "table" ? (
                <AssetTable assets={assets} />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {assets.map((asset) => (
                    <AssetCard key={asset.id} asset={asset} />
                  ))}
                </div>
              )}

              {/* Pagination Footer */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-[#2A313C] font-mono text-xs text-slate-500 dark:text-slate-400">
                  <span>
                    Showing {page * pageSize - pageSize + 1} to {Math.min(page * pageSize, total)}{" "}
                    of {total} elements
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-1.5 border border-slate-200 dark:border-[#2A313C] rounded-[4px] disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-[#11161D] transition"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span>
                      Page {page} of {totalPages}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="p-1.5 border border-slate-200 dark:border-[#2A313C] rounded-[4px] disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-[#11161D] transition"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
