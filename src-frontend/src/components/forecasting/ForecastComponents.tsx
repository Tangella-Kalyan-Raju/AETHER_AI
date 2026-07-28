import React from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Database,
  Settings,
  ShieldAlert,
} from "lucide-react";

export const StatusBadge = ({ status }: { status: string }) => {
  let color = "bg-slate-500/10 text-slate-500";
  if (status === "Completed") color = "bg-emerald-500/10 text-emerald-500";
  if (status === "Running") color = "bg-blue-500/10 text-blue-500";
  if (status === "Failed") color = "bg-red-500/10 text-red-500";
  if (status === "Scheduled") color = "bg-purple-500/10 text-purple-500";

  return (
    <span className={`px-2 py-1 rounded text-xs font-semibold uppercase tracking-wider ${color}`}>
      {status}
    </span>
  );
};

export const ForecastSummaryCard = ({ title, value, description, trend }: any) => {
  return (
    <Card className="bg-white dark:bg-[#1E232B] border-slate-200 dark:border-[#2A313C]">
      <CardContent className="p-6 flex flex-col justify-between h-full">
        <div className="flex justify-between items-start mb-4">
          <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">{title}</span>
          {trend === "up" && <Activity className="w-4 h-4 text-emerald-500" />}
          {trend === "down" && <Activity className="w-4 h-4 text-red-500" />}
        </div>
        <div>
          <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{value}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export const MetadataCard = ({ dataSource, processingDuration, confidenceScore }: any) => {
  return (
    <Card className="bg-white dark:bg-[#1E232B] border-slate-200 dark:border-[#2A313C]">
      <CardHeader className="pb-3 border-b border-slate-100 dark:border-[#2A313C]">
        <CardTitle className="text-sm font-medium flex items-center text-slate-700 dark:text-slate-300">
          <Database className="w-4 h-4 mr-2 text-indigo-500" />
          Forecast Metadata
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-4 space-y-4">
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-500 dark:text-slate-400">Data Source</span>
          <span className="font-mono text-slate-700 dark:text-slate-300">
            {dataSource || "N/A"}
          </span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-500 dark:text-slate-400">Processing Time</span>
          <span className="font-mono text-slate-700 dark:text-slate-300">
            {processingDuration ? `${processingDuration}ms` : "N/A"}
          </span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-500 dark:text-slate-400">Confidence Score</span>
          <span className="font-mono text-emerald-600 dark:text-emerald-400">
            {confidenceScore ? `${confidenceScore}%` : "N/A"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export const ConfidenceCard = ({ level, score }: any) => {
  return (
    <Card className="bg-white dark:bg-[#1E232B] border-slate-200 dark:border-[#2A313C]">
      <CardHeader className="pb-3 border-b border-slate-100 dark:border-[#2A313C]">
        <CardTitle className="text-sm font-medium flex items-center text-slate-700 dark:text-slate-300">
          <ShieldAlert className="w-4 h-4 mr-2 text-emerald-500" />
          Confidence Framework
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 flex items-center justify-between">
        <div>
          <h4 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{score}%</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            Confidence Level
          </p>
        </div>
        <div className="text-right">
          <StatusBadge status={level || "Unknown"} />
        </div>
      </CardContent>
    </Card>
  );
};
