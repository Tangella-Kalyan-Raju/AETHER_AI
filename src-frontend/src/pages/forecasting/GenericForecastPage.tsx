import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { ForecastAreaChart } from "@/components/forecasting/ForecastCharts";
import { ForecastKpiCard } from "@/components/forecasting/ForecastCards";
import { ForecastControls } from "@/components/forecasting/ForecastControls";
import { api } from "@/lib/api";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

export const GenericForecastPage = ({
  domain,
  title,
  description,
  color,
  dataKey,
  unit,
  kpiTitle,
}: any) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadForecast = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/forecasting/${domain}`);
        setData(res.data);
        setError(null);
      } catch (err: any) {
        console.error(`Error loading ${domain} forecast`, err);
        setError(`Failed to load ${domain} forecast.`);
      } finally {
        setLoading(false);
      }
    };
    loadForecast();
  }, [domain]);

  if (loading) {
    return (
      <div className="p-6 max-w-[1600px] mx-auto h-[500px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 max-w-[1600px] mx-auto">
        <PageHeader title={title} description={description} />
        <div className="mt-8 p-6 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 flex items-center">
          {error || "No forecast available."}
        </div>
      </div>
    );
  }

  const currentVal = data.forecasts.length > 0 ? data.forecasts[0].predicted_value : 0;
  const futureVal =
    data.forecasts.length > 1
      ? data.forecasts[data.forecasts.length - 1].predicted_value
      : currentVal;
  const trend = futureVal > currentVal ? "up" : futureVal < currentVal ? "down" : "stable";
  const confidence = data.forecasts.length > 0 ? data.forecasts[0].confidence_score : 0;
  const lastUpdated = format(new Date(data.generated_at), "HH:mm");

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">
      <PageHeader title={title} description={description} />

      <ForecastControls />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <ForecastKpiCard
            title={kpiTitle}
            currentValue={currentVal.toFixed(1)}
            forecastValue={futureVal.toFixed(1)}
            unit={unit}
            trend={trend}
            confidence={confidence}
            lastUpdated={lastUpdated}
          />
          {/* Could add more KPIs here */}
        </div>

        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-[#1E232B] border border-slate-200 dark:border-[#2A313C] rounded-lg shadow-sm p-6 h-full min-h-[400px]">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-6 uppercase tracking-wider">
              {title} Horizon
            </h3>
            <ForecastAreaChart
              data={data.forecasts}
              dataKey="predicted_value"
              color={color}
              name={kpiTitle}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
