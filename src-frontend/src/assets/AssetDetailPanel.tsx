import { useState, useEffect } from "react";
import {
  Server,
  GitBranch,
  Power,
  Zap,
  Cpu,
  Cable,
  Activity,
  X,
  Edit,
  Save,
  CheckCircle,
  AlertTriangle,
  History,
} from "lucide-react";

interface AssetDetailPanelProps {
  asset: any;
  type: string;
  onClose: () => void;
  relationships: {
    parentSubstation?: string;
    connectedBuses?: string[];
    generators?: string[];
    loads?: string[];
    switches?: string[];
    lines?: string[];
  };
  onUpdate: (type: string, id: number, data: any) => Promise<void>;
  substations: any[];
  buses: any[];
  lines: any[];
}

export function AssetDetailPanel({
  asset,
  type,
  onClose,
  relationships,
  onUpdate,
  substations,
  buses,
  lines,
}: AssetDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<"specs" | "relations" | "metadata">("specs");
  const [editValues, setEditValues] = useState<Record<string, any>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Initialize edit fields
  useEffect(() => {
    if (asset) {
      setEditValues({ ...asset });
      setIsEditing(false);
      setValidationError(null);
    }
  }, [asset]);

  if (!asset) return null;

  const handleInputChange = (field: string, val: any) => {
    setEditValues((prev) => ({ ...prev, [field]: val }));
    setValidationError(null);
  };

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
        return <Activity className="w-4 h-4 text-slate-500" />;
    }
  };

  const validateEdit = (): boolean => {
    if (!editValues.name || !editValues.name.trim()) {
      setValidationError("Asset name cannot be empty.");
      return false;
    }

    if (type === "bus") {
      if (parseFloat(editValues.base_kv || 0) <= 0) {
        setValidationError("Voltage rating base_kv must be greater than 0.");
        return false;
      }
    }

    if (type === "generator") {
      const p = parseFloat(editValues.p_mw || 0);
      const cap = parseFloat(editValues.capacity_mw || 0);
      if (cap <= 0) {
        setValidationError("Capacity MW must be greater than 0.");
        return false;
      }
      if (p < 0 || p > cap) {
        setValidationError(
          `Active power output (${p} MW) cannot exceed capacity limit (${cap} MW).`
        );
        return false;
      }
    }

    if (type === "transmission_line" || type === "transformer") {
      const from = parseInt(editValues.from_bus_id);
      const to = parseInt(editValues.to_bus_id);
      if (from && to && from === to) {
        setValidationError(
          "Source and Destination buses must be different (self-loops not allowed)."
        );
        return false;
      }
      if (parseFloat(editValues.rating_mva || 0) <= 0) {
        setValidationError("MVA Rating must be greater than 0.");
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateEdit()) return;

    // Detect differences to send only modified fields
    const changes: Record<string, any> = {};
    Object.keys(editValues).forEach((key) => {
      if (editValues[key] !== asset[key]) {
        changes[key] = editValues[key];
      }
    });

    if (Object.keys(changes).length === 0) {
      setIsEditing(false);
      return;
    }

    if (!window.confirm("CONFIRM DATABASE UPDATE?\nCommit edits to the grid database?")) {
      return;
    }

    setIsSaving(true);
    try {
      await onUpdate(type, asset.id, changes);
      setIsEditing(false);
    } catch (e: any) {
      console.error(e);
      setValidationError(e.message || "Failed to commit database modifications.");
    } finally {
      setIsSaving(true); // Wait, setting false on end
      setIsSaving(false);
    }
  };

  const metadata = asset.metadata_json || asset.metadata || null;

  return (
    <div className="w-80 border-l border-slate-200 dark:border-[#2A313C] bg-white dark:bg-[#151A21] flex flex-col h-full z-10 shadow-2xl select-text font-mono text-xs text-[#94A3B8]">
      {/* Header Info */}
      <div className="p-4 border-b border-[#2A313C] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-[3px] border border-slate-200 dark:border-[#2A313C] bg-slate-50 dark:bg-[#1C222B] flex items-center justify-center">
            {getAssetIcon()}
          </div>
          <div>
            <div className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">
              GRID PROPERTY EDITOR
            </div>
            <div className="text-[11px] font-bold text-slate-200 uppercase tracking-wide mt-1.5 truncate max-w-[160px]">
              {asset.name}
            </div>
          </div>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white p-1 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#2A313C] bg-slate-50/50 dark:bg-[#0F1318]/50 text-[10px] font-bold">
        <button
          onClick={() => setActiveTab("specs")}
          className={`flex-1 py-2 text-center border-b-2 transition-all ${
            activeTab === "specs"
              ? "border-[#FF7A1A] text-[#FF7A1A]"
              : "border-transparent text-slate-500 hover:text-slate-300"
          }`}
        >
          SPECS
        </button>
        <button
          onClick={() => setActiveTab("relations")}
          className={`flex-1 py-2 text-center border-b-2 transition-all ${
            activeTab === "relations"
              ? "border-[#FF7A1A] text-[#FF7A1A]"
              : "border-transparent text-slate-500 hover:text-slate-300"
          }`}
        >
          LINKS
        </button>
        <button
          onClick={() => setActiveTab("metadata")}
          className={`flex-1 py-2 text-center border-b-2 transition-all ${
            activeTab === "metadata"
              ? "border-[#FF7A1A] text-[#FF7A1A]"
              : "border-transparent text-slate-500 hover:text-slate-300"
          }`}
        >
          METADATA
        </button>
      </div>

      {/* Panel Scroll Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {validationError && (
          <div className="p-2 border border-red-500/30 bg-red-500/5 text-red-500 rounded-[2px] text-[10px] flex items-start gap-1">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* TAB 1: SCADA Specifications */}
        {activeTab === "specs" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-1 border-b border-slate-800">
              <span className="text-[9px] text-[#64748B] uppercase tracking-wider font-semibold">
                PARAMETERS
              </span>
              {isEditing ? (
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="text-emerald-500 hover:text-emerald-400 font-bold text-[10px] flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  SAVE
                </button>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-slate-400 hover:text-[#FF7A1A] font-bold text-[10px] flex items-center gap-1.5"
                >
                  <Edit className="w-3.5 h-3.5" />
                  EDIT
                </button>
              )}
            </div>

            <div className="space-y-3">
              {/* Name Editor */}
              <div className="flex flex-col gap-1">
                <span className="text-[8.5px] text-slate-500 uppercase">ASSET NAME</span>
                {isEditing ? (
                  <input
                    type="text"
                    value={editValues.name || ""}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="bg-slate-900 border border-[#2A313C] rounded-[2px] px-2 py-1 text-slate-200 focus:outline-none focus:border-[#FF7A1A]"
                  />
                ) : (
                  <span className="font-bold text-slate-200 text-xs">{asset.name}</span>
                )}
              </div>

              {/* Status Indicator */}
              <div className="flex flex-col gap-1">
                <span className="text-[8.5px] text-slate-500 uppercase">OPERATIONAL STATE</span>
                {isEditing ? (
                  <select
                    value={editValues.status || "active"}
                    onChange={(e) => handleInputChange("status", e.target.value)}
                    className="bg-slate-900 border border-[#2A313C] rounded-[2px] px-2 py-1 text-slate-200 focus:outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="tripped">Tripped</option>
                  </select>
                ) : (
                  <span className="inline-flex items-center gap-1 self-start px-1.5 py-0.5 rounded-[2px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[9px] font-bold uppercase">
                    <CheckCircle className="w-2.5 h-2.5" />
                    {asset.status || "active"}
                  </span>
                )}
              </div>

              {/* Dynamic properties base on Type */}
              {type === "bus" && (
                <div className="flex flex-col gap-1">
                  <span className="text-[8.5px] text-slate-500 uppercase">
                    Voltage base_kv (kV)
                  </span>
                  {isEditing ? (
                    <input
                      type="number"
                      step="0.1"
                      value={editValues.base_kv || ""}
                      onChange={(e) => handleInputChange("base_kv", parseFloat(e.target.value))}
                      className="bg-slate-900 border border-[#2A313C] rounded-[2px] px-2 py-1 text-slate-200 focus:outline-none"
                    />
                  ) : (
                    <span className="font-bold text-slate-200">{asset.base_kv} kV</span>
                  )}
                </div>
              )}

              {type === "generator" && (
                <>
                  <div className="flex flex-col gap-1">
                    <span className="text-[8.5px] text-slate-500 uppercase">Capacity (MW)</span>
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.1"
                        value={editValues.capacity_mw || ""}
                        onChange={(e) =>
                          handleInputChange("capacity_mw", parseFloat(e.target.value))
                        }
                        className="bg-slate-900 border border-[#2A313C] rounded-[2px] px-2 py-1 text-slate-200"
                      />
                    ) : (
                      <span className="font-bold text-slate-200">{asset.capacity_mw} MW</span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[8.5px] text-slate-500 uppercase">
                      Active Power (p_mw)
                    </span>
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.1"
                        value={editValues.p_mw || 0.0}
                        onChange={(e) => handleInputChange("p_mw", parseFloat(e.target.value))}
                        className="bg-slate-900 border border-[#2A313C] rounded-[2px] px-2 py-1 text-slate-200"
                      />
                    ) : (
                      <span className="font-bold text-slate-200">{asset.p_mw} MW</span>
                    )}
                  </div>
                </>
              )}

              {type === "transmission_line" && (
                <>
                  <div className="flex flex-col gap-1">
                    <span className="text-[8.5px] text-slate-500 uppercase">
                      Rating Limit (MVA)
                    </span>
                    {isEditing ? (
                      <input
                        type="number"
                        step="1"
                        value={editValues.rating_mva || ""}
                        onChange={(e) =>
                          handleInputChange("rating_mva", parseFloat(e.target.value))
                        }
                        className="bg-slate-900 border border-[#2A313C] rounded-[2px] px-2 py-1 text-slate-200"
                      />
                    ) : (
                      <span className="font-bold text-slate-200">{asset.rating_mva} MVA</span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[8.5px] text-slate-500 uppercase">Resistance (r_pu)</span>
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.001"
                        value={editValues.r_pu || ""}
                        onChange={(e) => handleInputChange("r_pu", parseFloat(e.target.value))}
                        className="bg-slate-900 border border-[#2A313C] rounded-[2px] px-2 py-1 text-slate-200"
                      />
                    ) : (
                      <span className="text-slate-300">{asset.r_pu} p.u.</span>
                    )}
                  </div>
                </>
              )}

              {/* Description field */}
              <div className="flex flex-col gap-1">
                <span className="text-[8.5px] text-slate-500 uppercase">DESCRIPTION</span>
                {isEditing ? (
                  <textarea
                    value={editValues.description || ""}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    className="bg-slate-900 border border-[#2A313C] rounded-[2px] px-2 py-1 text-slate-200 h-16 resize-none focus:outline-none"
                  />
                ) : (
                  <p className="text-slate-400 leading-normal">
                    {asset.description || "No annotation logs."}
                  </p>
                )}
              </div>
            </div>

            {/* Time audit info */}
            <div className="border-t border-slate-800 pt-3 text-[9.5px] text-slate-500 space-y-1">
              <div className="flex items-center gap-1.5">
                <History className="w-3.5 h-3.5" />
                <span>Created: {new Date(asset.created_at).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <History className="w-3.5 h-3.5" />
                <span>Updated: {new Date(asset.updated_at).toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Mapped links/relations */}
        {activeTab === "relations" && (
          <div className="space-y-4">
            <span className="text-[9px] text-[#64748B] uppercase tracking-wider font-semibold block border-b border-slate-800 pb-1">
              RELATIONAL TREE
            </span>

            <div className="space-y-3 font-mono text-[10.5px]">
              {relationships.parentSubstation && (
                <div>
                  <span className="text-[8px] text-slate-500 block uppercase">
                    PARENT SUBSTATION
                  </span>
                  <div className="flex items-center gap-1.5 text-slate-300 mt-1">
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
                      <div key={b} className="flex items-center gap-1.5 text-slate-300">
                        <GitBranch className="w-3.5 h-3.5 text-yellow-500" />
                        <span>{b}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {relationships.generators && relationships.generators.length > 0 && (
                <div>
                  <span className="text-[8px] text-slate-500 block uppercase">GENERATORS</span>
                  <div className="space-y-1.5 mt-1">
                    {relationships.generators.map((g) => (
                      <div key={g} className="flex items-center gap-1.5 text-slate-300">
                        <Power className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{g}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {relationships.loads && relationships.loads.length > 0 && (
                <div>
                  <span className="text-[8px] text-slate-500 block uppercase">LOADS</span>
                  <div className="space-y-1.5 mt-1">
                    {relationships.loads.map((l) => (
                      <div key={l} className="flex items-center gap-1.5 text-slate-300">
                        <Zap className="w-3.5 h-3.5 text-red-500" />
                        <span>{l}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {relationships.lines && relationships.lines.length > 0 && (
                <div>
                  <span className="text-[8px] text-slate-500 block uppercase">CONNECTIONS</span>
                  <div className="space-y-1.5 mt-1">
                    {relationships.lines.map((l) => (
                      <div key={l} className="flex items-center gap-1.5 text-slate-300">
                        <Cable className="w-3.5 h-3.5 text-orange-500" />
                        <span>{l}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!relationships.parentSubstation &&
                (!relationships.connectedBuses || relationships.connectedBuses.length === 0) &&
                (!relationships.generators || relationships.generators.length === 0) &&
                (!relationships.loads || relationships.loads.length === 0) &&
                (!relationships.lines || relationships.lines.length === 0) && (
                  <div className="text-slate-500 text-[10px]">No linked relationships.</div>
                )}
            </div>
          </div>
        )}

        {/* TAB 3: Metadata Pre JSON */}
        {activeTab === "metadata" && (
          <div className="space-y-3">
            <span className="text-[9px] text-[#64748B] uppercase tracking-wider font-semibold block border-b border-slate-800 pb-1">
              METADATA JSON
            </span>

            {metadata ? (
              <pre className="overflow-x-auto bg-slate-900 border border-[#2A313C] rounded-[3px] p-2 text-emerald-500 text-[10px] leading-relaxed max-h-80 select-text">
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
export default AssetDetailPanel;
