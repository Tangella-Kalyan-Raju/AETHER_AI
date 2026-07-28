import React, { useMemo } from "react";
import { useMonitoring } from "../../context/MonitoringContext";
import { Zap, Activity, Battery, Hash } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const KPICard = ({ title, value, unit, icon: Icon, colorClass }: any) => (
  <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col justify-between shadow-sm">
    <div className="flex items-center justify-between mb-2">
      <span className="text-sm font-medium text-slate-400">{title}</span>
      <Icon className={`w-5 h-5 ${colorClass}`} />
    </div>
    <div className="flex items-baseline gap-2">
      <AnimatePresence mode="popLayout">
        <motion.span
          key={value}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold text-white tracking-tight"
        >
          {value !== undefined && value !== null
            ? value.toLocaleString(undefined, { maximumFractionDigits: 2 })
            : "--"}
        </motion.span>
      </AnimatePresence>
      <span className="text-xs font-semibold text-slate-500">{unit}</span>
    </div>
  </div>
);

export function LiveKPICards() {
  const { getAllLatest } = useMonitoring();

  // Aggregate data for KPIs
  const kpiData = useMemo(() => {
    const allPower = getAllLatest("power");
    const allVoltage = getAllLatest("voltage");
    const allFreq = getAllLatest("frequency");

    const totalPower = allPower.reduce((sum, item) => sum + item.value, 0);
    const avgVoltage =
      allVoltage.length > 0
        ? allVoltage.reduce((sum, item) => sum + item.value, 0) / allVoltage.length
        : 0;
    const avgFreq =
      allFreq.length > 0 ? allFreq.reduce((sum, item) => sum + item.value, 0) / allFreq.length : 0;

    return {
      totalPower,
      avgVoltage,
      avgFreq,
      measurementsCount: getAllLatest().length,
    };
  }, [getAllLatest]);

  return (
    <div className="grid grid-cols-4 gap-4 h-full">
      <KPICard
        title="Grid Frequency"
        value={kpiData.avgFreq}
        unit="Hz"
        icon={Activity}
        colorClass="text-blue-400"
      />
      <KPICard
        title="Avg Voltage"
        value={kpiData.avgVoltage}
        unit="kV"
        icon={Zap}
        colorClass="text-amber-400"
      />
      <KPICard
        title="Total Power (Gen/Load)"
        value={kpiData.totalPower}
        unit="MW"
        icon={Battery}
        colorClass="text-emerald-400"
      />
      <KPICard
        title="Active Measurements"
        value={kpiData.measurementsCount}
        unit="Sensors"
        icon={Hash}
        colorClass="text-purple-400"
      />
    </div>
  );
}
