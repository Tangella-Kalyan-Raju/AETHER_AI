import React from "react";
import { Calendar, AlertCircle, FileText, CheckCircle2, ShieldAlert } from "lucide-react";

interface TimelineEvent {
  type: string;
  timestamp: string;
  title: string;
  description: string;
}

interface AssetTimelineProps {
  events: TimelineEvent[];
}

export function AssetTimeline({ events }: AssetTimelineProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case "Installation":
      case "Commission":
        return <Calendar className="w-4 h-4 text-blue-500" />;
      case "Inspection":
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case "Service":
        return <FileText className="w-4 h-4 text-amber-500" />;
      case "Planned Maintenance":
        return <ShieldAlert className="w-4 h-4 text-purple-500" />;
      case "Prediction":
        return <AlertCircle className="w-4 h-4 text-rose-500" />;
      default:
        return <Calendar className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="bg-white dark:bg-[#181F2A] border border-slate-200 dark:border-[#2A313C] rounded-[4px] p-5 shadow-sm space-y-4">
      <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-[#2A313C]">
        <Calendar className="w-4 h-4 text-emerald-500" />
        <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-[#F8FAFC]">
          Life-Cycle Operational Timeline
        </h3>
      </div>

      <div className="relative pl-6 border-l border-slate-200 dark:border-[#2A313C] space-y-6 ml-3">
        {events.map((event, index) => (
          <div key={index} className="relative">
            {/* Timeline Marker */}
            <span className="absolute -left-[35px] top-0.5 bg-slate-50 dark:bg-[#11161D] border border-slate-200 dark:border-[#2A313C] rounded-full p-1.5 flex items-center justify-center">
              {getIcon(event.type)}
            </span>

            {/* Event Content */}
            <div className="space-y-1">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <h4 className="font-heading font-bold text-xs text-slate-900 dark:text-[#F8FAFC]">
                  {event.title}
                </h4>
                <span className="font-mono text-[9px] text-slate-450 dark:text-slate-500">
                  {new Date(event.timestamp).toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono leading-relaxed">
                {event.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
