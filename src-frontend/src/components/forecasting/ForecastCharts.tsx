import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
  BarChart,
  Bar,
} from "recharts";
import { format } from "date-fns";

export const ForecastAreaChart = ({ data, dataKey, color, name }: any) => {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`color${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.8} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#2A313C" vertical={false} />
          <XAxis
            dataKey="timestamp"
            tickFormatter={(val) => format(new Date(val), "HH:mm")}
            stroke="#64748b"
            fontSize={12}
          />
          <YAxis stroke="#64748b" fontSize={12} />
          <Tooltip
            contentStyle={{ backgroundColor: "#1E232B", borderColor: "#2A313C", color: "#fff" }}
            labelFormatter={(val) => format(new Date(val), "MMM dd, HH:mm")}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            fillOpacity={1}
            fill={`url(#color${dataKey})`}
            name={name}
          />
          <Area
            type="monotone"
            dataKey="lower_bound"
            stroke="none"
            fill={color}
            fillOpacity={0.1}
            name="Lower Bound"
          />
          <Area
            type="monotone"
            dataKey="upper_bound"
            stroke="none"
            fill={color}
            fillOpacity={0.1}
            name="Upper Bound"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export const ForecastLineChart = ({ data, lines }: any) => {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2A313C" vertical={false} />
          <XAxis
            dataKey="timestamp"
            tickFormatter={(val) => format(new Date(val), "HH:mm")}
            stroke="#64748b"
            fontSize={12}
          />
          <YAxis stroke="#64748b" fontSize={12} />
          <Tooltip
            contentStyle={{ backgroundColor: "#1E232B", borderColor: "#2A313C", color: "#fff" }}
            labelFormatter={(val) => format(new Date(val), "MMM dd, HH:mm")}
          />
          <Legend />
          {lines.map((l: any, idx: number) => (
            <Line
              key={idx}
              type="monotone"
              dataKey={l.dataKey}
              stroke={l.color}
              name={l.name}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
