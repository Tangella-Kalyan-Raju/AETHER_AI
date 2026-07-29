import React from "react";
import { Filter, Calendar, Clock } from "lucide-react";

export const ForecastControls = ({ selectedType, onTypeChange }: any) => {
  return (
    <div className="flex flex-wrap gap-4 items-center mb-6 p-4 bg-slate-50 dark:bg-[#1C222B] border border-slate-200 dark:border-[#2A313C] rounded-lg">
      <div className="flex items-center text-sm">
        <Filter className="w-4 h-4 mr-2 text-slate-400" />
        <span className="text-slate-700 dark:text-slate-300 font-medium">Filters:</span>
      </div>

      <div className="flex items-center bg-white dark:bg-[#161B22] border border-slate-200 dark:border-[#2A313C] rounded px-3 py-1.5 text-sm">
        <span className="text-slate-500 mr-2">Type</span>
        <select
          value={selectedType}
          onChange={(e) => onTypeChange && onTypeChange(e.target.value)}
          className="bg-transparent text-slate-900 dark:text-white outline-none border-none cursor-pointer"
        >
          <option
            value="All Forecasts"
            className="bg-white dark:bg-[#161B22] text-slate-900 dark:text-white"
          >
            All Forecasts
          </option>
          <option
            value="Demand"
            className="bg-white dark:bg-[#161B22] text-slate-900 dark:text-white"
          >
            Demand
          </option>
          <option
            value="Generation"
            className="bg-white dark:bg-[#161B22] text-slate-900 dark:text-white"
          >
            Generation
          </option>
          <option
            value="Weather"
            className="bg-white dark:bg-[#161B22] text-slate-900 dark:text-white"
          >
            Weather
          </option>
          <option
            value="Price"
            className="bg-white dark:bg-[#161B22] text-slate-900 dark:text-white"
          >
            Price
          </option>
          <option
            value="Frequency"
            className="bg-white dark:bg-[#161B22] text-slate-900 dark:text-white"
          >
            Frequency
          </option>
          <option
            value="Voltage"
            className="bg-white dark:bg-[#161B22] text-slate-900 dark:text-white"
          >
            Voltage
          </option>
          <option
            value="Reserve"
            className="bg-white dark:bg-[#161B22] text-slate-900 dark:text-white"
          >
            Reserve
          </option>
          <option
            value="Renewable"
            className="bg-white dark:bg-[#161B22] text-slate-900 dark:text-white"
          >
            Renewable
          </option>
          <option
            value="Battery"
            className="bg-white dark:bg-[#161B22] text-slate-900 dark:text-white"
          >
            Battery
          </option>
        </select>
      </div>

      <div className="flex items-center bg-white dark:bg-[#161B22] border border-slate-200 dark:border-[#2A313C] rounded px-3 py-1.5 text-sm">
        <Calendar className="w-4 h-4 mr-2 text-slate-400" />
        <span className="text-slate-700 dark:text-slate-300">Last 7 Days</span>
      </div>

      <div className="flex items-center bg-white dark:bg-[#161B22] border border-slate-200 dark:border-[#2A313C] rounded px-3 py-1.5 text-sm">
        <Clock className="w-4 h-4 mr-2 text-slate-400" />
        <span className="text-slate-700 dark:text-slate-300">1H Interval</span>
      </div>
    </div>
  );
};
