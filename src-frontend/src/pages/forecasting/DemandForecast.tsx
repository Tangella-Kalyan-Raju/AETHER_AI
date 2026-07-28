import React from "react";
import { GenericForecastPage } from "./GenericForecastPage";

export default function DemandForecast() {
  return (
    <GenericForecastPage
      domain="demand"
      title="Demand Forecast"
      description="Short, medium, and long-term base load and peak demand predictions."
      color="#8b5cf6" // purple
      unit="MW"
      kpiTitle="Peak Demand"
    />
  );
}
