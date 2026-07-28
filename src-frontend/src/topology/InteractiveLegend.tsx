import { useState } from "react";
import {
  Server,
  GitBranch,
  Power,
  Zap,
  Cpu,
  Cable,
  Activity,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

interface InteractiveLegendProps {
  onHighlightCategory: (category: string | null) => void;
  onHighlightVoltage: (voltage: number | null) => void;
  activeCategory: string | null;
  activeVoltage: number | null;
}

export function InteractiveLegend({
  onHighlightCategory,
  onHighlightVoltage,
  activeCategory,
  activeVoltage,
}: InteractiveLegendProps) {
  const [isOpen, setIsOpen] = useState(true);

  const categories = [
    {
      id: "substation",
      label: "Substation",
      icon: Server,
      color: "text-cyan-500",
      desc: "Geographic container bounding grid devices",
    },
    {
      id: "bus",
      label: "Busbar",
      icon: GitBranch,
      color: "text-yellow-500",
      desc: "Thick node distributing power within substation",
    },
    {
      id: "generator",
      label: "Generator",
      icon: Power,
      color: "text-emerald-500",
      desc: "Generation unit (Gas peaker, Hydro, Solar, etc.)",
    },
    {
      id: "load",
      label: "Load Bar",
      icon: Zap,
      color: "text-red-500",
      desc: "Power demand sink (Industrial, Municipal load)",
    },
    {
      id: "switch",
      label: "Switch / Breaker",
      icon: Cpu,
      color: "text-purple-500",
      desc: "Line breaker switch (Open/Closed position)",
    },
    {
      id: "line",
      label: "Transmission Line",
      icon: Cable,
      color: "text-orange-500",
      desc: "Underground or overhead high-voltage connection",
    },
    {
      id: "transformer",
      label: "Transformer",
      icon: Activity,
      color: "text-violet-500",
      desc: "Step-up or step-down dual coil winding",
    },
  ];

  const voltages = [
    { value: 230, label: "230 kV", color: "bg-[#EF4444]" },
    { value: 138, label: "138 kV", color: "bg-[#F59E0B]" },
    { value: 69, label: "69 kV", color: "bg-[#3B82F6]" },
    { value: 13.8, label: "13.8 kV", color: "bg-[#10B981]" },
  ];

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="absolute bottom-4 right-4 z-20 px-3 py-1.5 bg-slate-900/90 border border-slate-700 text-[#F8FAFC] text-[10px] font-mono font-bold rounded-[3px] shadow-lg hover:border-orange-500 transition-colors"
      >
        SHOW LEGEND
      </button>
    );
  }

  return (
    <div className="absolute bottom-4 right-4 z-20 w-72 bg-slate-950/95 border border-[#2A313C] rounded-[3px] p-4 text-xs font-mono text-[#94A3B8] shadow-2xl backdrop-blur-md select-text">
      <div className="flex justify-between items-center border-b border-[#2A313C] pb-2 mb-3">
        <span className="font-bold text-[#F8FAFC] tracking-wider uppercase text-[10px]">
          GRID SYMBOLOGY LEGEND
        </span>
        <button
          onClick={() => setIsOpen(false)}
          className="text-slate-500 hover:text-[#F8FAFC] font-bold text-[10px]"
        >
          [HIDE]
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <span className="block text-[9px] text-[#64748B] uppercase tracking-wider mb-2 font-semibold">
            Asset Categories (Click to filter)
          </span>
          <div className="space-y-1.5">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isHighlighted = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => onHighlightCategory(isHighlighted ? null : cat.id)}
                  className={`w-full text-left flex items-start gap-2.5 p-1.5 rounded-[2px] transition-all border ${
                    isHighlighted
                      ? "bg-[#FF7A1A]/10 border-[#FF7A1A] text-[#F8FAFC]"
                      : activeCategory
                        ? "border-transparent opacity-40 hover:opacity-75"
                        : "border-transparent hover:bg-[#1C222B]/60 text-[#94A3B8]"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 mt-0.5 ${cat.color}`} />
                  <div className="flex-1">
                    <div className="font-semibold text-slate-200 text-[10.5px] leading-tight">
                      {cat.label}
                    </div>
                    <div className="text-[9px] text-slate-500 mt-0.5 leading-normal">
                      {cat.desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-t border-[#2A313C] pt-3">
          <span className="block text-[9px] text-[#64748B] uppercase tracking-wider mb-2 font-semibold">
            Voltage Classifications
          </span>
          <div className="grid grid-cols-2 gap-2">
            {voltages.map((volt) => {
              const isHighlighted = activeVoltage === volt.value;
              return (
                <button
                  key={volt.value}
                  onClick={() => onHighlightVoltage(isHighlighted ? null : volt.value)}
                  className={`flex items-center gap-2 p-1 border rounded-[2px] text-[10px] text-left transition-all ${
                    isHighlighted
                      ? "bg-[#FF7A1A]/15 border-[#FF7A1A] text-[#F8FAFC]"
                      : activeVoltage
                        ? "border-transparent opacity-40 hover:opacity-75"
                        : "border-transparent hover:bg-[#1C222B]/60 text-slate-300"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${volt.color}`} />
                  <span>{volt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-t border-[#2A313C] pt-3 text-[9px] text-slate-500 leading-relaxed">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            <span>Green border / text indicates NOMINAL status.</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <AlertTriangle className="w-3 h-3 text-red-500 animate-pulse" />
            <span>Red/tripped state represents anomaly or open state.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
export default InteractiveLegend;
