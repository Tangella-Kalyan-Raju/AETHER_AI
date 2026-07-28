import React, { useState, useEffect } from "react";
import { useMonitoring } from "../../context/MonitoringContext";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export function RealTimeCharts() {
  const { latestData } = useMonitoring();
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    if (
      latestData &&
      (latestData.measurement_type === "power" || latestData.measurement_type === "frequency")
    ) {
      setData((prev) => {
        const newData = [...prev];
        const timeStr = new Date(latestData.timestamp).toLocaleTimeString();

        // Find existing time point
        let point = newData.find((p) => p.time === timeStr);
        if (!point) {
          point = { time: timeStr };
          newData.push(point);
        }

        point[latestData.measurement_type] = latestData.value;

        // Keep last 30 points
        if (newData.length > 30) {
          newData.shift();
        }
        return newData;
      });
    }
  }, [latestData]);

  return (
    <div className="h-full w-full flex flex-col bg-slate-950">
      <div className="flex-1 min-h-0 pt-4 pr-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickMargin={8} />
            <YAxis yAxisId="left" stroke="#3b82f6" fontSize={10} width={40} />
            <YAxis yAxisId="right" orientation="right" stroke="#10b981" fontSize={10} width={40} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                borderColor: "#1e293b",
                color: "#f8fafc",
                fontSize: "12px",
              }}
              itemStyle={{ color: "#f8fafc" }}
            />
            <Legend wrapperStyle={{ fontSize: "12px" }} />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="power"
              name="Power (MW)"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="frequency"
              name="Freq (Hz)"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
