import React from "react";
import { GenericForecastPage } from "./GenericForecastPage";

export default function BatteryForecast() {
  return (
    <GenericForecastPage
      domain="battery"
      title="Battery Forecast"
      description="State of Charge (SOC) predictions, charging/discharging cycles, and backup availability."
      color="#a855f7" // purple
      unit="%"
      kpiTitle="Avg SOC"
    />
  );
}
