import React, { useState, useEffect } from "react";
import { X, Check, AlertOctagon, HelpCircle } from "lucide-react";

interface AssetFormProps {
  mode: "create" | "edit" | "duplicate";
  assetToEdit?: any;
  substations: any[];
  buses: any[];
  lines: any[];
  onClose: () => void;
  onSave: (type: string, data: any) => Promise<void>;
}

export function AssetForm({
  mode,
  assetToEdit,
  substations,
  buses,
  lines,
  onClose,
  onSave,
}: AssetFormProps) {
  const [assetType, setAssetType] = useState<string>("substation");
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize form fields based on asset type and edit/duplicate model
  useEffect(() => {
    if (mode === "edit" && assetToEdit) {
      setAssetType(assetToEdit.type || "substation");
      setFormData({
        ...assetToEdit,
        // Ensure dropdown fields are initialized as numeric IDs
        substation_id: assetToEdit.substation_id ? parseInt(assetToEdit.substation_id) : undefined,
        from_bus_id: assetToEdit.from_bus_id ? parseInt(assetToEdit.from_bus_id) : undefined,
        to_bus_id: assetToEdit.to_bus_id ? parseInt(assetToEdit.to_bus_id) : undefined,
        bus_id: assetToEdit.bus_id ? parseInt(assetToEdit.bus_id) : undefined,
        line_id: assetToEdit.line_id ? parseInt(assetToEdit.line_id) : undefined,
      });
    } else if (mode === "duplicate" && assetToEdit) {
      setAssetType(assetToEdit.type || "substation");
      setFormData({
        ...assetToEdit,
        id: undefined, // remove ID
        uuid: undefined, // remove UUID
        name: `${assetToEdit.name} - Copy`,
        substation_id: assetToEdit.substation_id ? parseInt(assetToEdit.substation_id) : undefined,
        from_bus_id: assetToEdit.from_bus_id ? parseInt(assetToEdit.from_bus_id) : undefined,
        to_bus_id: assetToEdit.to_bus_id ? parseInt(assetToEdit.to_bus_id) : undefined,
        bus_id: assetToEdit.bus_id ? parseInt(assetToEdit.bus_id) : undefined,
        line_id: assetToEdit.line_id ? parseInt(assetToEdit.line_id) : undefined,
      });
      setHasChanges(true); // forces unsaved warning check
    } else {
      // Default creation setups
      resetForm("substation");
    }
  }, [mode, assetToEdit]);

  const resetForm = (type: string) => {
    setErrors({});
    setHasChanges(false);
    switch (type) {
      case "substation":
        setFormData({
          name: "",
          description: "",
          latitude: 37.77,
          longitude: -122.42,
          metadata_json: {},
        });
        break;
      case "bus":
        setFormData({
          name: "",
          description: "",
          base_kv: 138.0,
          substation_id: substations[0]?.id || "",
        });
        break;
      case "transmission_line":
        setFormData({
          name: "",
          description: "",
          from_bus_id: buses[0]?.id || "",
          to_bus_id: buses[1]?.id || "",
          r_pu: 0.01,
          x_pu: 0.05,
          b_pu: 0.02,
          rating_mva: 100.0,
        });
        break;
      case "transformer":
        setFormData({
          name: "",
          description: "",
          from_bus_id: buses[0]?.id || "",
          to_bus_id: buses[1]?.id || "",
          r_pu: 0.005,
          x_pu: 0.04,
          rating_mva: 50.0,
        });
        break;
      case "generator":
        setFormData({
          name: "",
          description: "",
          bus_id: buses[0]?.id || "",
          type: "thermal",
          capacity_mw: 100.0,
          p_mw: 0.0,
          q_mvar: 0.0,
        });
        break;
      case "load":
        setFormData({
          name: "",
          description: "",
          bus_id: buses[0]?.id || "",
          p_mw: 0.0,
          q_mvar: 0.0,
        });
        break;
      case "switch":
        setFormData({
          name: "",
          description: "",
          line_id: lines[0]?.id || "",
          bus_id: buses[0]?.id || "",
          state: "closed",
        });
        break;
    }
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value;
    setAssetType(newType);
    resetForm(newType);
  };

  const handleChange = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setHasChanges(true);
    // clear target error inline
    if (errors[name]) {
      setErrors((prev) => {
        const u = { ...prev };
        delete u[name];
        return u;
      });
    }
  };

  // Perform client-side validation checks
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name || !formData.name.trim()) {
      newErrors.name = "Asset name is required.";
    }

    if (assetType === "bus") {
      if (!formData.base_kv || parseFloat(formData.base_kv) <= 0) {
        newErrors.base_kv = "Voltage rating base_kv must be greater than 0.";
      }
      if (!formData.substation_id) {
        newErrors.substation_id = "A parent substation is required.";
      }
    }

    if (assetType === "transmission_line" || assetType === "transformer") {
      const from = parseInt(formData.from_bus_id);
      const to = parseInt(formData.to_bus_id);
      if (!from) newErrors.from_bus_id = "Source connection bus is required.";
      if (!to) newErrors.to_bus_id = "Destination connection bus is required.";
      if (from && to && from === to) {
        newErrors.to_bus_id = "Source and Destination buses must be different (cannot self-loop).";
      }
      if (!formData.rating_mva || parseFloat(formData.rating_mva) <= 0) {
        newErrors.rating_mva = "Power MVA rating limit must be greater than 0.";
      }
    }

    if (assetType === "generator") {
      const p = parseFloat(formData.p_mw || 0);
      const cap = parseFloat(formData.capacity_mw || 0);
      if (!formData.bus_id) newErrors.bus_id = "Bus node attachment is required.";
      if (cap <= 0) newErrors.capacity_mw = "Total rated capacity must be greater than 0.";
      if (p < 0) newErrors.p_mw = "Active power p_mw must be non-negative.";
      if (p > cap) {
        newErrors.p_mw = `Active power output (${p} MW) cannot exceed capacity limit (${cap} MW).`;
      }
    }

    if (assetType === "load") {
      if (!formData.bus_id) newErrors.bus_id = "Bus node attachment is required.";
      if (parseFloat(formData.p_mw || 0) < 0)
        newErrors.p_mw = "Active load demand MW must be non-negative.";
    }

    if (assetType === "substation") {
      const lat = parseFloat(formData.latitude);
      const lon = parseFloat(formData.longitude);
      if (isNaN(lat) || lat < -90.0 || lat > 90.0)
        newErrors.latitude = "Latitude must be between -90 and 90.";
      if (isNaN(lon) || lon < -180.0 || lon > 180.0)
        newErrors.longitude = "Longitude must be between -180 and 180.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onSave(assetType, formData);
      setHasChanges(false);
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrors({ api: err.message || "An API database execution error occurred." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      if (window.confirm("You have unsaved changes. Discard and exit?")) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const isEdit = mode === "edit";

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 select-text font-mono text-xs">
      <div className="bg-[#151A21] border border-[#2A313C] rounded-[3px] w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Form Header */}
        <div className="p-4 border-b border-[#2A313C] flex items-center justify-between">
          <span className="font-bold text-[#F8FAFC] tracking-wider uppercase">
            {mode === "create"
              ? "Add Grid Asset"
              : mode === "edit"
                ? "Edit Grid Asset"
                : "Duplicate Grid Asset"}
          </span>
          <button
            onClick={handleCancel}
            className="text-slate-500 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {errors.api && (
            <div className="p-3 border border-red-500/30 bg-red-500/5 text-red-500 rounded-[2px] flex items-start gap-2 leading-relaxed">
              <AlertOctagon className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errors.api}</span>
            </div>
          )}

          {/* Dynamic Type Selector (disabled in Edit Mode) */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold">
              Asset Category {isEdit && "(READ-ONLY)"}
            </span>
            <select
              value={assetType}
              onChange={handleTypeChange}
              disabled={isEdit}
              className="w-full bg-[#1C222B] border border-[#2A313C] rounded-[2px] px-3 py-2 text-slate-200 focus:outline-none focus:border-[#FF7A1A] disabled:opacity-50"
            >
              <option value="substation">Substation</option>
              <option value="bus">Busbar Node</option>
              <option value="transmission_line">Transmission Line</option>
              <option value="transformer">Transformer</option>
              <option value="generator">Generator</option>
              <option value="load">Load Sink</option>
              <option value="switch">Switch / Breaker</option>
            </select>
          </div>

          <div className="w-full h-px bg-slate-800 my-2" />

          {/* Standard Fields (Name & Description) */}
          <div className="grid grid-cols-1 gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold flex items-center">
                Asset Name <span className="text-red-500 ml-1">*</span>
              </span>
              <input
                type="text"
                value={formData.name || ""}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Enter unique asset name"
                className={`w-full bg-[#1C222B] border rounded-[2px] px-3 py-2 text-slate-200 focus:outline-none focus:border-[#FF7A1A] ${
                  errors.name ? "border-red-500" : "border-[#2A313C]"
                }`}
              />
              {errors.name && <span className="text-red-500 text-[10px]">{errors.name}</span>}
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold">
                Description / Annotations
              </span>
              <textarea
                value={formData.description || ""}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Enter technical logs or description"
                className="w-full bg-[#1C222B] border border-[#2A313C] rounded-[2px] px-3 py-2 text-slate-200 focus:outline-none focus:border-[#FF7A1A] h-16 resize-none"
              />
            </div>
          </div>

          {/* Dynamic Fields Section based on selected Type */}

          {/* 1. Substation Fields */}
          {assetType === "substation" && (
            <div className="grid grid-cols-2 gap-4 border-t border-[#2A313C]/60 pt-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold">
                  Latitude
                </span>
                <input
                  type="number"
                  step="0.000001"
                  value={formData.latitude || ""}
                  onChange={(e) => handleChange("latitude", parseFloat(e.target.value))}
                  className="w-full bg-[#1C222B] border border-[#2A313C] rounded-[2px] px-3 py-2 text-slate-200 focus:outline-none focus:border-[#FF7A1A]"
                />
                {errors.latitude && (
                  <span className="text-red-500 text-[10px]">{errors.latitude}</span>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold">
                  Longitude
                </span>
                <input
                  type="number"
                  step="0.000001"
                  value={formData.longitude || ""}
                  onChange={(e) => handleChange("longitude", parseFloat(e.target.value))}
                  className="w-full bg-[#1C222B] border border-[#2A313C] rounded-[2px] px-3 py-2 text-slate-200 focus:outline-none focus:border-[#FF7A1A]"
                />
                {errors.longitude && (
                  <span className="text-red-500 text-[10px]">{errors.longitude}</span>
                )}
              </div>
            </div>
          )}

          {/* 2. Bus Fields */}
          {assetType === "bus" && (
            <div className="grid grid-cols-2 gap-4 border-t border-[#2A313C]/60 pt-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold">
                  Voltage (base_kv)
                </span>
                <input
                  type="number"
                  step="0.1"
                  value={formData.base_kv || ""}
                  onChange={(e) => handleChange("base_kv", parseFloat(e.target.value))}
                  className={`w-full bg-[#1C222B] border rounded-[2px] px-3 py-2 text-slate-200 focus:outline-none focus:border-[#FF7A1A] ${
                    errors.base_kv ? "border-red-500" : "border-[#2A313C]"
                  }`}
                />
                {errors.base_kv && (
                  <span className="text-red-500 text-[10px]">{errors.base_kv}</span>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold">
                  Parent Substation
                </span>
                <select
                  value={formData.substation_id || ""}
                  onChange={(e) => handleChange("substation_id", parseInt(e.target.value))}
                  className="w-full bg-[#1C222B] border border-[#2A313C] rounded-[2px] px-3 py-2 text-slate-200 focus:outline-none"
                >
                  <option value="">Select Substation</option>
                  {substations.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                {errors.substation_id && (
                  <span className="text-red-500 text-[10px]">{errors.substation_id}</span>
                )}
              </div>
            </div>
          )}

          {/* 3. Transmission Line Fields */}
          {assetType === "transmission_line" && (
            <div className="space-y-4 border-t border-[#2A313C]/60 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold">
                    From Bus
                  </span>
                  <select
                    value={formData.from_bus_id || ""}
                    onChange={(e) => handleChange("from_bus_id", parseInt(e.target.value))}
                    className="w-full bg-[#1C222B] border border-[#2A313C] rounded-[2px] px-3 py-2 text-slate-200 focus:outline-none"
                  >
                    <option value="">Select Bus</option>
                    {buses.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.base_kv} kV)
                      </option>
                    ))}
                  </select>
                  {errors.from_bus_id && (
                    <span className="text-red-500 text-[10px]">{errors.from_bus_id}</span>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold">
                    To Bus
                  </span>
                  <select
                    value={formData.to_bus_id || ""}
                    onChange={(e) => handleChange("to_bus_id", parseInt(e.target.value))}
                    className="w-full bg-[#1C222B] border border-[#2A313C] rounded-[2px] px-3 py-2 text-slate-200 focus:outline-none"
                  >
                    <option value="">Select Bus</option>
                    {buses.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.base_kv} kV)
                      </option>
                    ))}
                  </select>
                  {errors.to_bus_id && (
                    <span className="text-red-500 text-[10px]">{errors.to_bus_id}</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold">
                    Rating (MVA)
                  </span>
                  <input
                    type="number"
                    step="1"
                    value={formData.rating_mva || ""}
                    onChange={(e) => handleChange("rating_mva", parseFloat(e.target.value))}
                    className="w-full bg-[#1C222B] border border-[#2A313C] rounded-[2px] px-3 py-2 text-slate-200 focus:outline-none"
                  />
                  {errors.rating_mva && (
                    <span className="text-red-500 text-[10px]">{errors.rating_mva}</span>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold">
                    Resistance (r_pu)
                  </span>
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.r_pu || ""}
                    onChange={(e) => handleChange("r_pu", parseFloat(e.target.value))}
                    className="w-full bg-[#1C222B] border border-[#2A313C] rounded-[2px] px-3 py-2 text-slate-200 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 4. Transformer Fields */}
          {assetType === "transformer" && (
            <div className="space-y-4 border-t border-[#2A313C]/60 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold">
                    From Bus (Primary)
                  </span>
                  <select
                    value={formData.from_bus_id || ""}
                    onChange={(e) => handleChange("from_bus_id", parseInt(e.target.value))}
                    className="w-full bg-[#1C222B] border border-[#2A313C] rounded-[2px] px-3 py-2 text-slate-200 focus:outline-none"
                  >
                    <option value="">Select Bus</option>
                    {buses.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.base_kv} kV)
                      </option>
                    ))}
                  </select>
                  {errors.from_bus_id && (
                    <span className="text-red-500 text-[10px]">{errors.from_bus_id}</span>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold">
                    To Bus (Secondary)
                  </span>
                  <select
                    value={formData.to_bus_id || ""}
                    onChange={(e) => handleChange("to_bus_id", parseInt(e.target.value))}
                    className="w-full bg-[#1C222B] border border-[#2A313C] rounded-[2px] px-3 py-2 text-slate-200 focus:outline-none"
                  >
                    <option value="">Select Bus</option>
                    {buses.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.base_kv} kV)
                      </option>
                    ))}
                  </select>
                  {errors.to_bus_id && (
                    <span className="text-red-500 text-[10px]">{errors.to_bus_id}</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold">
                    Rating (MVA)
                  </span>
                  <input
                    type="number"
                    step="1"
                    value={formData.rating_mva || ""}
                    onChange={(e) => handleChange("rating_mva", parseFloat(e.target.value))}
                    className="w-full bg-[#1C222B] border border-[#2A313C] rounded-[2px] px-3 py-2 text-slate-200 focus:outline-none"
                  />
                  {errors.rating_mva && (
                    <span className="text-red-500 text-[10px]">{errors.rating_mva}</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 5. Generator Fields */}
          {assetType === "generator" && (
            <div className="space-y-4 border-t border-[#2A313C]/60 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold">
                    Generator Type
                  </span>
                  <select
                    value={formData.type || "thermal"}
                    onChange={(e) => handleChange("type", e.target.value)}
                    className="w-full bg-[#1C222B] border border-[#2A313C] rounded-[2px] px-3 py-2 text-slate-200 focus:outline-none"
                  >
                    <option value="thermal">Thermal</option>
                    <option value="solar">Solar</option>
                    <option value="wind">Wind</option>
                    <option value="hydro">Hydro</option>
                    <option value="gas">Peaker Gas</option>
                    <option value="nuclear">Nuclear</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold">
                    Bus Attachment
                  </span>
                  <select
                    value={formData.bus_id || ""}
                    onChange={(e) => handleChange("bus_id", parseInt(e.target.value))}
                    className="w-full bg-[#1C222B] border border-[#2A313C] rounded-[2px] px-3 py-2 text-slate-200 focus:outline-none"
                  >
                    <option value="">Select Bus</option>
                    {buses.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.base_kv} kV)
                      </option>
                    ))}
                  </select>
                  {errors.bus_id && (
                    <span className="text-red-500 text-[10px]">{errors.bus_id}</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold">
                    Capacity (MW)
                  </span>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.capacity_mw || ""}
                    onChange={(e) => handleChange("capacity_mw", parseFloat(e.target.value))}
                    className="w-full bg-[#1C222B] border border-[#2A313C] rounded-[2px] px-3 py-2 text-slate-200 focus:outline-none"
                  />
                  {errors.capacity_mw && (
                    <span className="text-red-500 text-[9px] leading-tight">
                      {errors.capacity_mw}
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold">
                    Active Power (p_mw)
                  </span>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.p_mw || 0.0}
                    onChange={(e) => handleChange("p_mw", parseFloat(e.target.value))}
                    className="w-full bg-[#1C222B] border border-[#2A313C] rounded-[2px] px-3 py-2 text-slate-200 focus:outline-none"
                  />
                  {errors.p_mw && (
                    <span className="text-red-500 text-[9px] leading-tight">{errors.p_mw}</span>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold">
                    Reactive Power (q_mvar)
                  </span>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.q_mvar || 0.0}
                    onChange={(e) => handleChange("q_mvar", parseFloat(e.target.value))}
                    className="w-full bg-[#1C222B] border border-[#2A313C] rounded-[2px] px-3 py-2 text-slate-200 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 6. Load Fields */}
          {assetType === "load" && (
            <div className="space-y-4 border-t border-[#2A313C]/60 pt-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold">
                  Bus Attachment
                </span>
                <select
                  value={formData.bus_id || ""}
                  onChange={(e) => handleChange("bus_id", parseInt(e.target.value))}
                  className="w-full bg-[#1C222B] border border-[#2A313C] rounded-[2px] px-3 py-2 text-slate-200 focus:outline-none"
                >
                  <option value="">Select Bus</option>
                  {buses.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.base_kv} kV)
                    </option>
                  ))}
                </select>
                {errors.bus_id && <span className="text-red-500 text-[10px]">{errors.bus_id}</span>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold">
                    Active Power Demand (p_mw)
                  </span>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.p_mw || 0.0}
                    onChange={(e) => handleChange("p_mw", parseFloat(e.target.value))}
                    className="w-full bg-[#1C222B] border border-[#2A313C] rounded-[2px] px-3 py-2 text-slate-200 focus:outline-none"
                  />
                  {errors.p_mw && <span className="text-red-500 text-[10px]">{errors.p_mw}</span>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold">
                    Reactive Power (q_mvar)
                  </span>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.q_mvar || 0.0}
                    onChange={(e) => handleChange("q_mvar", parseFloat(e.target.value))}
                    className="w-full bg-[#1C222B] border border-[#2A313C] rounded-[2px] px-3 py-2 text-slate-200 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 7. Switch Fields */}
          {assetType === "switch" && (
            <div className="space-y-4 border-t border-[#2A313C]/60 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold">
                    Breaker State
                  </span>
                  <select
                    value={formData.state || "closed"}
                    onChange={(e) => handleChange("state", e.target.value)}
                    className="w-full bg-[#1C222B] border border-[#2A313C] rounded-[2px] px-3 py-2 text-slate-200 focus:outline-none"
                  >
                    <option value="closed">Closed (Active)</option>
                    <option value="open">Open (Tripped)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold">
                    Associated Line
                  </span>
                  <select
                    value={formData.line_id || ""}
                    onChange={(e) => handleChange("line_id", parseInt(e.target.value))}
                    className="w-full bg-[#1C222B] border border-[#2A313C] rounded-[2px] px-3 py-2 text-slate-200 focus:outline-none"
                  >
                    <option value="">Select Transmission Line</option>
                    {lines.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold">
                  Associated Bus
                </span>
                <select
                  value={formData.bus_id || ""}
                  onChange={(e) => handleChange("bus_id", parseInt(e.target.value))}
                  className="w-full bg-[#1C222B] border border-[#2A313C] rounded-[2px] px-3 py-2 text-slate-200 focus:outline-none"
                >
                  <option value="">Select Bus</option>
                  {buses.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.base_kv} kV)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </form>

        {/* Form Footer */}
        <div className="p-4 border-t border-[#2A313C] flex justify-end gap-2 bg-[#0F1318]">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 border border-slate-700 hover:border-slate-500 rounded-[2px] transition-colors font-semibold"
          >
            CANCEL
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#FF7A1A] hover:bg-[#E06510] disabled:opacity-50 text-white rounded-[2px] transition-colors font-semibold"
          >
            <Check className="w-4 h-4" />
            {isSubmitting ? "SAVING..." : "SAVE ASSET"}
          </button>
        </div>
      </div>
    </div>
  );
}
export default AssetForm;
