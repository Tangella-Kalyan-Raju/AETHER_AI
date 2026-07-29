import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronRight, Database, Folder, Shield, Zap } from "lucide-react";
import { AssetHierarchyNode } from "../../../api/assets";

interface AssetHierarchyTreeProps {
  nodes: AssetHierarchyNode[];
}

export function AssetHierarchyTree({ nodes }: AssetHierarchyTreeProps) {
  // Identify root nodes (nodes where parent_id is null or not found in the list)
  const rootNodes = nodes.filter((n) => !n.parent_id || !nodes.some((p) => p.id === n.parent_id));

  return (
    <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-4 shadow-sm">
      <div className="space-y-1">
        {rootNodes.map((node) => (
          <TreeNode key={node.id} node={node} allNodes={nodes} depth={0} />
        ))}
      </div>
    </div>
  );
}

function TreeNode({
  node,
  allNodes,
  depth,
}: {
  node: AssetHierarchyNode;
  allNodes: AssetHierarchyNode[];
  depth: number;
}) {
  const [isOpen, setIsOpen] = useState(true);

  // Find children
  const children = allNodes.filter((n) => n.parent_id === node.id);
  const hasChildren = children.length > 0;

  const getIcon = (type: string) => {
    const t = type?.toLowerCase() || "";
    if (t.includes("substation")) return Folder;
    if (t.includes("solar") || t.includes("wind") || t.includes("gen")) return Zap;
    if (t.includes("breaker") || t.includes("relay")) return Shield;
    return Database;
  };

  const IconComponent = getIcon(node.type);

  return (
    <div className="select-none">
      <div
        className="flex items-center gap-1.5 py-1 px-2 hover:bg-slate-50 dark:hover:bg-[#1c2431]/30 rounded-[4px] cursor-pointer text-sm"
        style={{ paddingLeft: `${Math.max(8, depth * 16)}px` }}
        onClick={() => setIsOpen(!isOpen)}
      >
        {hasChildren ? (
          isOpen ? (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          )
        ) : (
          <span className="w-3.5 shrink-0" />
        )}
        <IconComponent className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <Link
          to={`/asset-intelligence/assets/${node.id}`}
          className="font-mono text-xs text-slate-900 dark:text-[#F8FAFC] hover:text-emerald-500 font-bold"
          onClick={(e) => e.stopPropagation()}
        >
          {node.name}
        </Link>
        <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-auto">
          {node.level}
        </span>
      </div>

      {hasChildren && isOpen && (
        <div className="mt-0.5">
          {children.map((child) => (
            <TreeNode key={child.id} node={child} allNodes={allNodes} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
