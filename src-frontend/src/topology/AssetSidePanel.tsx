import { useState } from "react";
import {
  Server,
  GitBranch,
  Power,
  Zap,
  Cpu,
  Cable,
  Activity,
  Info,
  Calendar,
  Layers,
  FileCode,
  CheckCircle,
  AlertOctagon,
  X,
  Edit2,
  Save,
} from "lucide-react";

interface AssetSidePanelProps {
  asset: any; // Substation | Bus | Generator | Load | Switch | Line | Transformer
  type:
    | "substation"
    | "bus"
    | "generator"
    | "load"
    | "switch"
    | "transmission_line"
    | "transformer"
    | null;
  onClose: () => void;
  relationships: {
    parentSubstation?: string;
    connectedBuses?: string[];
    generators?: string[];
    loads?: string[];
    switches?: string[];
    lines?: string[];
  };
}

export function AssetSidePanel({ asset, type, onClose, relationships }: AssetSidePanelProps) {
  const [activeTab, setActiveTab] = useState<"info" | "relations" | "metadata">("info");
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState(asset?.description || "");

  if (!asset || !type) return null;

  const getAssetIcon = () => {
    switch (type) {
      case "substation":
        return <Server className="w-4 h-4 text-cyan-500" />;
      case "bus":
        return <GitBranch className="w-4 h-4 text-yellow-500" />;
      case "generator":
        return <Power className="w-4 h-4 text-emerald-500" />;
      case "load":
        return <Zap className="w-4 h-4 text-red-500" />;
      case "switch":
        return <Cpu className="w-4 h-4 text-purple-500" />;
      case "transmission_line":
        return <Cable className="w-4 h-4 text-orange-500" />;
      case "transformer":
        return <Activity className="w-4 h-4 text-violet-500" />;
      default:
        return <Info className="w-4 h-4 text-slate-500" />;
    }
  };

  const formatType = (t: string) => t.toUpperCase().replace("_", " ");

  const metadata = asset.metadata_json || asset.metadata || null;

  return (
    <div className="w-80 border-l border-slate-200 dark:border-[#2A313C] bg-white dark:bg-[#151A21] flex flex-col h-full z-10 shadow-2xl select-text">
      {/* Panel Header */}
      <div className="p-4 border-b border-slate-200 dark:border-[#2A313C] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-[3px] border border-slate-200 dark:border-[#2A313C] bg-slate-50 dark:bg-[#1C222B] flex items-center justify-center">
            {getAssetIcon()}
          </div>
          <div>
            <div className="text-[9px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">
              Asset Inspector
            </div>
            <div className="text-xs font-mono font-bold text-slate-800 dark:text-[#F8FAFC] uppercase tracking-wide mt-1.5">
              {formatType(type)}
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-700 dark:hover:text-[#F8FAFC] p-1 transition-colors"
          title="Close Inspector"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-[#2A313C] bg-slate-50/50 dark:bg-[#0F1318]/50 text-[10px] font-mono font-bold text-slate-500">
        <button
          onClick={() => setActiveTab("info")}
          className={`flex-1 py-2 text-center border-b-2 transition-all ${
            activeTab === "info"
              ? "border-[#FF7A1A] text-[#FF7A1A] bg-white dark:bg-[#151A21]"
              : "border-transparent hover:text-slate-800 dark:hover:text-slate-300"
          }`}
        >
          INFO
        </button>
        <button
          onClick={() => setActiveTab("relations")}
          className={`flex-1 py-2 text-center border-b-2 transition-all ${
            activeTab === "relations"
              ? "border-[#FF7A1A] text-[#FF7A1A] bg-white dark:bg-[#151A21]"
              : "border-transparent hover:text-slate-800 dark:hover:text-slate-300"
          }`}
        >
          RELATIONS
        </button>
        <button
          onClick={() => setActiveTab("metadata")}
          className={`flex-1 py-2 text-center border-b-2 transition-all ${
            activeTab === "metadata"
              ? "border-[#FF7A1A] text-[#FF7A1A] bg-white dark:bg-[#151A21]"
              : "border-transparent hover:text-slate-800 dark:hover:text-slate-300"
          }`}
        >
          METADATA
        </button>
      </div>

      {/* Tab Panels */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* TAB 1: Core parameters info */}
        {activeTab === "info" && (
          <div className="space-y-4 font-sans">
            <div>
              <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 block uppercase">
                Asset Name
              </span>
              <span className="font-bold text-sm text-slate-800 dark:text-[#F8FAFC]">
                {asset.name}
              </span>
            </div>

            <div>
              <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 block uppercase">
                UUID
              </span>
              <span className="font-mono text-[10px] text-slate-500 select-all block break-all">
                {asset.uuid}
              </span>
            </div>

            {/* Render dynamic attributes based on asset type */}
            <div className="grid grid-cols-2 gap-3 border-t border-b border-slate-100 dark:border-[#2A313C] py-3 my-2 font-mono text-[10.5px]">
              <div>
                <span className="text-[8.5px] text-slate-400 dark:text-slate-500 block uppercase">
                  Operational Status
                </span>
                <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded-[2px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[9px] font-bold uppercase">
                  <CheckCircle className="w-2.5 h-2.5" />
                  {asset.status || "active"}
                </span>
              </div>

              {asset.base_kv !== undefined && (
                <div>
                  <span className="text-[8.5px] text-slate-400 dark:text-slate-500 block uppercase font-mono">
                    Voltage Rating
                  </span>
                  <span className="font-bold text-slate-200">{asset.base_kv} kV</span>
                </div>
              )}

              {asset.capacity_mw !== undefined && (
                <div>
                  <span className="text-[8.5px] text-slate-400 dark:text-slate-500 block uppercase">
                    Capacity
                  </span>
                  <span className="font-bold text-slate-200">{asset.capacity_mw} MW</span>
                </div>
              )}

              {asset.p_mw !== undefined && (
                <div>
                  <span className="text-[8.5px] text-slate-400 dark:text-slate-500 block uppercase">
                    Active Power
                  </span>
                  <span className="font-bold text-slate-200">{asset.p_mw} MW</span>
                </div>
              )}

              {asset.q_mvar !== undefined && (
                <div>
                  <span className="text-[8.5px] text-slate-400 dark:text-slate-500 block uppercase">
                    Reactive Power
                  </span>
                  <span className="font-bold text-slate-200">{asset.q_mvar} MVAR</span>
                </div>
              )}

              {asset.rating_mva !== undefined && (
                <div>
                  <span className="text-[8.5px] text-slate-400 dark:text-slate-500 block uppercase">
                    Power Rating
                  </span>
                  <span className="font-bold text-slate-200">{asset.rating_mva} MVA</span>
                </div>
              )}

              {asset.state !== undefined && (
                <div>
                  <span className="text-[8.5px] text-slate-400 dark:text-slate-500 block uppercase">
                    Breaker State
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded-[2px] text-[9px] font-bold uppercase ${
                      asset.state === "closed"
                        ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-500"
                        : "bg-red-500/10 border border-red-500/20 text-red-500"
                    }`}
                  >
                    {asset.state}
                  </span>
                </div>
              )}

              {asset.latitude !== undefined && asset.longitude !== undefined && (
                <div className="col-span-2">
                  <span className="text-[8.5px] text-slate-400 dark:text-slate-500 block uppercase">
                    Geo Coordinates
                  </span>
                  <span className="text-slate-300">
                    Lat: {asset.latitude}, Lng: {asset.longitude}
                  </span>
                </div>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 uppercase">
                  Description
                </span>
                <button
                  onClick={() => {
                    if (isEditing) {
                      asset.description = description; // local state edit representation
                      setIsEditing(false);
                    } else {
                      setIsEditing(true);
                    }
                  }}
                  className="text-slate-400 hover:text-white flex items-center gap-1 font-mono text-[9px]"
                >
                  {isEditing ? (
                    <>
                      <Save className="w-3 h-3 text-[#FF7A1A]" />
                      SAVE
                    </>
                  ) : (
                    <>
                      <Edit2 className="w-3 h-3" />
                      EDIT
                    </>
                  )}
                </button>
              </div>
              {isEditing ? (
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-900 border border-[#2A313C] rounded-[3px] p-2 text-slate-200 text-xs font-mono focus:outline-none focus:border-[#FF7A1A] h-20"
                />
              ) : (
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-sans select-text">
                  {asset.description || "No description provided for this asset."}
                </p>
              )}
            </div>

            <div className="border-t border-[#2A313C] pt-3 text-[9.5px] text-slate-500 space-y-1.5 font-mono">
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" />
                <span>Created: {new Date(asset.created_at).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" />
                <span>Updated: {new Date(asset.updated_at).toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Asset relationships list */}
        {activeTab === "relations" && (
          <div className="space-y-4 font-mono text-[10.5px]">
            <span className="block text-[9px] text-[#64748B] uppercase tracking-wider font-semibold">
              Asset Hierarchy
            </span>

            <div className="space-y-3">
              {relationships.parentSubstation && (
                <div>
                  <span className="text-[8px] text-slate-500 block uppercase">
                    PARENT SUBSTATION
                  </span>
                  <div className="flex items-center gap-2 text-slate-300 mt-1">
                    <Server className="w-3.5 h-3.5 text-cyan-500" />
                    <span>{relationships.parentSubstation}</span>
                  </div>
                </div>
              )}

              {relationships.connectedBuses && relationships.connectedBuses.length > 0 && (
                <div>
                  <span className="text-[8px] text-slate-500 block uppercase">CONNECTED BUSES</span>
                  <div className="space-y-1.5 mt-1">
                    {relationships.connectedBuses.map((b) => (
                      <div key={b} className="flex items-center gap-2 text-slate-300">
                        <GitBranch className="w-3.5 h-3.5 text-yellow-500" />
                        <span>{b}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {relationships.generators && relationships.generators.length > 0 && (
                <div>
                  <span className="text-[8px] text-slate-500 block uppercase">
                    GENERATION DEVICES
                  </span>
                  <div className="space-y-1.5 mt-1">
                    {relationships.generators.map((g) => (
                      <div key={g} className="flex items-center gap-2 text-slate-300">
                        <Power className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{g}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {relationships.loads && relationships.loads.length > 0 && (
                <div>
                  <span className="text-[8px] text-slate-500 block uppercase">
                    CONNECTED LOAD SINKS
                  </span>
                  <div className="space-y-1.5 mt-1">
                    {relationships.loads.map((l) => (
                      <div key={l} className="flex items-center gap-2 text-slate-300">
                        <Zap className="w-3.5 h-3.5 text-red-500" />
                        <span>{l}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {relationships.switches && relationships.switches.length > 0 && (
                <div>
                  <span className="text-[8px] text-slate-500 block uppercase">
                    ASSOCIATED SWITCHES
                  </span>
                  <div className="space-y-1.5 mt-1">
                    {relationships.switches.map((s) => (
                      <div key={s} className="flex items-center gap-2 text-slate-300">
                        <Cpu className="w-3.5 h-3.5 text-purple-500" />
                        <span>{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {relationships.lines && relationships.lines.length > 0 && (
                <div>
                  <span className="text-[8px] text-slate-500 block uppercase">
                    LINE CONNECTIONS
                  </span>
                  <div className="space-y-1.5 mt-1">
                    {relationships.lines.map((l) => (
                      <div key={l} className="flex items-center gap-2 text-slate-300">
                        <Cable className="w-3.5 h-3.5 text-orange-500" />
                        <span>{l}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Default fallbacks if no relationships exist */}
              {!relationships.parentSubstation &&
                (!relationships.connectedBuses || relationships.connectedBuses.length === 0) &&
                (!relationships.generators || relationships.generators.length === 0) &&
                (!relationships.loads || relationships.loads.length === 0) &&
                (!relationships.switches || relationships.switches.length === 0) &&
                (!relationships.lines || relationships.lines.length === 0) && (
                  <div className="text-slate-500 text-[10px]">
                    No linked relationships mapped for this asset.
                  </div>
                )}
            </div>
          </div>
        )}

        {/* TAB 3: Metadata JSON Explorer */}
        {activeTab === "metadata" && (
          <div className="space-y-3 font-mono text-[10.5px]">
            <span className="block text-[9px] text-[#64748B] uppercase tracking-wider font-semibold">
              Structured Metadata
            </span>

            {metadata ? (
              <pre className="w-full overflow-x-auto bg-slate-900 border border-[#2A313C] rounded-[3px] p-3 text-emerald-500 text-[10px] leading-relaxed max-h-80 select-text">
                {JSON.stringify(metadata, null, 2)}
              </pre>
            ) : (
              <div className="text-slate-500 text-[10px] py-4 text-center border border-dashed border-[#2A313C] rounded-[3px]">
                No custom JSON metadata present.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
export default AssetSidePanel;
