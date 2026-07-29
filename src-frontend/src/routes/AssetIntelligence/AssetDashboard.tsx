import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Database, Plus, RefreshCw, BarChart3, Map, Network, ArrowRight } from "lucide-react";
import { assetApi, AssetDashboardData } from "../../api/assets";
import { LoadingState, ErrorState } from "./components/StateStates";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

export default function AssetDashboard() {
  const [data, setData] = useState<AssetDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await assetApi.getDashboard();
      setData(res);
    } catch (err: any) {
      console.error(err);
      setError("Failed to synchronize with physical asset registry telemetry.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) return <LoadingState message="Compiling assets database telemetry..." />;
  if (error || !data) return <ErrorState message={error || ""} retry={fetchDashboard} />;

  // Prepare chart data
  const categoryChartData = Object.entries(data.assets_by_category).map(([name, count]) => ({
    name,
    count,
  }));

  const regionChartData = Object.entries(data.assets_by_region).map(([name, count]) => ({
    name,
    count,
  }));

  const statusChartData = Object.entries(data.assets_by_status).map(([name, count]) => ({
    name,
    value: count,
  }));

  return (
    <div className="space-y-6 py-2 select-text">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
            GRID ASSET OPERATIONAL OVERVIEW
          </p>
          <h1 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-[#F8FAFC]">
            Asset Intelligence Center
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Central repository database for all physical electrical grid components.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchDashboard}
            className="flex items-center justify-center p-2 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-[#2A313C] rounded-[4px] hover:bg-slate-50 dark:hover:bg-[#11161D] transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            to="/asset-intelligence/registry"
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[4px] font-mono text-xs transition"
          >
            <Database className="w-3.5 h-3.5" />
            <span>Asset Registry</span>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Assets */}
        <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5 shadow-sm">
          <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
            Total Grid Assets
          </p>
          <h3 className="font-heading text-2xl font-bold text-slate-900 dark:text-[#F8FAFC]">
            {data.total_assets}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Physical components registered
          </p>
        </div>

        {/* Active Ratio */}
        <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5 shadow-sm">
          <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
            Active Ratio
          </p>
          <h3 className="font-heading text-2xl font-bold text-emerald-500">
            {data.registry_summary.active_percentage}%
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Operating online without anomalies
          </p>
        </div>

        {/* Total Capacity */}
        <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5 shadow-sm">
          <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
            Total Cap (Gen/Storage)
          </p>
          <h3 className="font-heading text-2xl font-bold text-slate-900 dark:text-[#F8FAFC]">
            {data.registry_summary.total_capacity_mw.toFixed(1)} MW
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Aggregated grid asset capacity
          </p>
        </div>

        {/* Total Categories */}
        <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5 shadow-sm">
          <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
            Asset Divisions
          </p>
          <h3 className="font-heading text-2xl font-bold text-slate-900 dark:text-[#F8FAFC]">
            {data.registry_summary.categories_count}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Distinct asset categories
          </p>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          to="/asset-intelligence/registry"
          className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] hover:border-slate-350 dark:hover:border-[#3E4A5C] rounded-[4px] p-5 shadow-sm flex items-start gap-4 transition"
        >
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-[4px]">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-[#F8FAFC] flex items-center gap-1.5">
              <span>Interactive Asset Registry</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Browse, filter, and inspect physical grid units using sortable operational inventory
              tables.
            </p>
          </div>
        </Link>

        <Link
          to="/asset-intelligence/explorer"
          className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] hover:border-slate-350 dark:hover:border-[#3E4A5C] rounded-[4px] p-5 shadow-sm flex items-start gap-4 transition"
        >
          <div className="p-3 bg-blue-500/10 text-blue-500 rounded-[4px]">
            <Network className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-[#F8FAFC] flex items-center gap-1.5">
              <span>Hierarchy & Topology Browser</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Inspect child relationship trees of regional substations, transformers, and feeders.
            </p>
          </div>
        </Link>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Assets by Category */}
        <div className="lg:col-span-2 bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 pb-3 border-b border-slate-100 dark:border-[#2A313C]">
              <BarChart3 className="w-4 h-4 text-emerald-500" />
              <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-[#F8FAFC]">
                Asset Distribution by Class
              </h3>
            </div>
            <div className="h-64 w-full mt-4 text-xs font-mono">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryChartData}>
                  <XAxis dataKey="name" stroke="#64748B" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={10} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1E293B",
                      border: "none",
                      color: "#F8FAFC",
                      borderRadius: "4px",
                    }}
                  />
                  <Bar dataKey="count" fill="#10B981" radius={[2, 2, 0, 0]}>
                    {categoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Assets by Status */}
        <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5 shadow-sm">
          <div className="flex items-center gap-1.5 pb-3 border-b border-slate-100 dark:border-[#2A313C]">
            <Map className="w-4 h-4 text-emerald-500" />
            <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-[#F8FAFC]">
              Operational Status Distribution
            </h3>
          </div>
          <div className="h-48 w-full mt-4 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1E293B",
                    border: "none",
                    color: "#F8FAFC",
                    borderRadius: "4px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 space-y-2 text-xs font-mono">
            {statusChartData.map((item, idx) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  />
                  <span className="capitalize">{item.name}</span>
                </div>
                <span>{item.value} units</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recently Registered Assets */}
      <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#2A313C]">
          <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-[#F8FAFC]">
            Recently Registered System Elements
          </h3>
          <Link
            to="/asset-intelligence/registry"
            className="text-xs font-mono text-emerald-500 dark:text-emerald-400 hover:underline"
          >
            Full Registry List ➔
          </Link>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-[#2A313C] text-slate-400 dark:text-slate-500">
                <th className="py-2.5">Asset ID</th>
                <th className="py-2.5">Name</th>
                <th className="py-2.5">Type</th>
                <th className="py-2.5">Region</th>
                <th className="py-2.5">Status</th>
                <th className="py-2.5 text-right">Created At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-55 dark:divide-[#2A313C] text-slate-700 dark:text-slate-300">
              {data.recently_added.map((asset) => (
                <tr key={asset.id} className="hover:bg-slate-50/50 dark:hover:bg-[#1c2431]/20">
                  <td className="py-2.5">{asset.asset_id}</td>
                  <td className="py-2.5 font-bold text-slate-900 dark:text-[#F8FAFC]">
                    <Link
                      to={`/asset-intelligence/assets/${asset.id}`}
                      className="hover:underline hover:text-emerald-500"
                    >
                      {asset.name}
                    </Link>
                  </td>
                  <td className="py-2.5">{asset.type}</td>
                  <td className="py-2.5">{asset.region}</td>
                  <td className="py-2.5">
                    <span className="px-1.5 py-0.5 rounded-[4px] border text-[9px] border-emerald-500/20 bg-emerald-500/10 text-emerald-500">
                      {asset.status}
                    </span>
                  </td>
                  <td className="py-2.5 text-right text-slate-400">
                    {new Date(asset.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
