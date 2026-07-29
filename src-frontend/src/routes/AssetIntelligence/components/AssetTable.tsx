import React from "react";
import { Link } from "react-router-dom";
import { AssetBadge } from "./AssetBadge";
import { Asset } from "../../../api/assets";

interface AssetTableProps {
  assets: Asset[];
}

export function AssetTable({ assets }: AssetTableProps) {
  return (
    <div className="overflow-x-auto border border-slate-200 dark:border-[#2A313C] rounded-[4px] bg-white dark:bg-[#181F2A] shadow-sm">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-200 dark:border-[#2A313C] bg-slate-50 dark:bg-[#11161D] text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            <th className="px-4 py-3">Asset ID</th>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Region</th>
            <th className="px-4 py-3">Voltage Level</th>
            <th className="px-4 py-3">Capacity</th>
            <th className="px-4 py-3">Manufacturer</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-[#2A313C] text-sm text-slate-700 dark:text-slate-300">
          {assets.map((asset) => (
            <tr
              key={asset.id}
              className="hover:bg-slate-50/50 dark:hover:bg-[#1c2431]/30 transition"
            >
              <td className="px-4 py-3 font-mono text-xs">{asset.asset_id}</td>
              <td className="px-4 py-3 font-heading font-bold text-slate-900 dark:text-[#F8FAFC]">
                <Link
                  to={`/asset-intelligence/assets/${asset.id}`}
                  className="hover:text-emerald-500 transition"
                >
                  {asset.name}
                </Link>
              </td>
              <td className="px-4 py-3 font-mono text-xs">{asset.type}</td>
              <td className="px-4 py-3">{asset.region}</td>
              <td className="px-4 py-3 font-mono text-xs">
                {asset.voltage_level ? `${asset.voltage_level} kV` : "—"}
              </td>
              <td className="px-4 py-3 font-mono text-xs">
                {asset.capacity ? `${asset.capacity} MW` : "—"}
              </td>
              <td className="px-4 py-3">{asset.manufacturer || "—"}</td>
              <td className="px-4 py-3">
                <AssetBadge status={asset.status} />
              </td>
              <td className="px-4 py-3 text-right">
                <Link
                  to={`/asset-intelligence/assets/${asset.id}`}
                  className="text-xs text-emerald-500 dark:text-emerald-400 hover:underline font-mono"
                >
                  Inspect
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
