import React from "react";
import { GenericForecastPage } from "./GenericForecastPage";

export default function RenewableForecast() {
  return (
    <GenericForecastPage
      domain="renewable"
      title="Renewable Forecast"
      description="Predictive generation output for connected solar and wind assets."
      color="#22c55e" // green
      unit="MW"
      kpiTitle="Renewable Output"
    />
  );
}
