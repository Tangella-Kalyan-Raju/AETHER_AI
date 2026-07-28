import React from "react";
import { GenericForecastPage } from "./GenericForecastPage";

export default function GenerationForecast() {
  return (
    <GenericForecastPage
      domain="generation"
      title="Generation Forecast"
      description="Predictive availability and output for thermal, hydro, and nuclear assets."
      color="#f59e0b" // amber
      unit="MW"
      kpiTitle="Expected Generation"
    />
  );
}
