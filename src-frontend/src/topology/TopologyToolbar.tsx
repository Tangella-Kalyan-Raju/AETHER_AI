import { useState, useRef, useEffect } from "react";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCcw,
  Search,
  MapPin,
  GitPullRequest,
  Grid,
  CheckCircle,
  X,
} from "lucide-react";

interface TopologyToolbarProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitToScreen: () => void;
  onReset: () => void;
  layoutMode: "geo" | "schematic";
  onChangeLayoutMode: (mode: "geo" | "schematic") => void;
  snapToGrid: boolean;
  onToggleSnapToGrid: () => void;
  allAssets: Array<{ id: number; name: string; type: string; uuid: string }>;
  onSelectAsset: (asset: { id: number; type: string }) => void;
}

export function TopologyToolbar({
  onZoomIn,
  onZoomOut,
  onFitToScreen,
  onReset,
  layoutMode,
  onChangeLayoutMode,
  snapToGrid,
  onToggleSnapToGrid,
  allAssets,
  onSelectAsset,
}: TopologyToolbarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter assets based on search query
  const filteredAssets = allAssets.filter(
    (asset) =>
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.uuid.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (asset: { id: number; type: string; name: string }) => {
    onSelectAsset({ id: asset.id, type: asset.type });
    setSearchQuery(asset.name);
    setShowDropdown(false);
  };

  return (
    <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-3 w-[calc(100%-2rem)] max-w-4xl select-text">
      {/* Search Input Box */}
      <div ref={dropdownRef} className="relative flex-1 min-w-[200px] max-w-[280px]">
        <div className="flex items-center bg-slate-900/90 border border-[#2A313C] rounded-[3px] px-3 py-1.5 shadow-lg backdrop-blur-md">
          <Search className="w-3.5 h-3.5 text-slate-500 mr-2 flex-shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            placeholder="Search grid assets..."
            className="bg-transparent border-none text-[#F8FAFC] placeholder-slate-500 text-xs w-full focus:outline-none font-mono"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setShowDropdown(false);
              }}
              className="text-slate-500 hover:text-white flex-shrink-0"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Autocomplete Dropdown List */}
        {showDropdown && searchQuery && filteredAssets.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-slate-950/95 border border-[#2A313C] rounded-[3px] max-h-60 overflow-y-auto shadow-2xl z-30 font-mono text-[10.5px]">
            {filteredAssets.map((asset) => (
              <button
                key={`${asset.type}-${asset.id}`}
                onClick={() => handleSelect(asset)}
                className="w-full text-left px-3 py-2 border-b border-[#2A313C]/35 hover:bg-slate-900/90 text-[#94A3B8] hover:text-[#F8FAFC] flex justify-between items-center transition-colors"
              >
                <div className="truncate pr-2">
                  <span className="font-semibold text-slate-200">{asset.name}</span>
                  <span className="block text-[8.5px] text-slate-500 truncate">{asset.uuid}</span>
                </div>
                <span className="px-1.5 py-0.5 rounded-[2px] bg-slate-800 text-[#FF7A1A] text-[8.5px] uppercase font-semibold">
                  {asset.type.replace("_", " ")}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Grid Rendering Layout Mode Selection */}
      <div className="flex bg-slate-900/90 border border-[#2A313C] rounded-[3px] p-0.5 shadow-lg backdrop-blur-md">
        <button
          onClick={() => onChangeLayoutMode("schematic")}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] text-[10.5px] font-mono font-bold transition-all ${
            layoutMode === "schematic"
              ? "bg-[#FF7A1A] text-white"
              : "text-slate-400 hover:text-[#F8FAFC]"
          }`}
          title="Switch to schematic grid one-line layout"
        >
          <GitPullRequest className="w-3.5 h-3.5" />
          SCHEMATIC
        </button>
        <button
          onClick={() => onChangeLayoutMode("geo")}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] text-[10.5px] font-mono font-bold transition-all ${
            layoutMode === "geo" ? "bg-[#FF7A1A] text-white" : "text-slate-400 hover:text-[#F8FAFC]"
          }`}
          title="Switch to geographic substation map layout"
        >
          <MapPin className="w-3.5 h-3.5" />
          GEOGRAPHIC
        </button>
      </div>

      {/* Snap-to-Grid Toggle Button */}
      <button
        onClick={onToggleSnapToGrid}
        className={`flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-900/90 border rounded-[3px] text-[10.5px] font-mono font-bold shadow-lg backdrop-blur-md transition-all ${
          snapToGrid
            ? "border-orange-500 text-orange-500"
            : "border-[#2A313C] text-slate-400 hover:text-white"
        }`}
        title="Snap elements to engineering grid bounds"
      >
        <Grid className="w-3.5 h-3.5" />
        <span>SNAP-TO-GRID: {snapToGrid ? "ON" : "OFF"}</span>
      </button>

      {/* Canvas Zoom & View controls */}
      <div className="flex bg-slate-900/90 border border-[#2A313C] rounded-[3px] p-0.5 shadow-lg backdrop-blur-md">
        <button
          onClick={onZoomIn}
          className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-[2px] transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onZoomOut}
          className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-[2px] transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <div className="w-px bg-[#2A313C] my-1" />
        <button
          onClick={onFitToScreen}
          className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-[2px] transition-colors"
          title="Fit entire topology to screen view"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onReset}
          className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-[2px] transition-colors"
          title="Reset zoom and center view"
        >
          <RefreshCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
export default TopologyToolbar;
