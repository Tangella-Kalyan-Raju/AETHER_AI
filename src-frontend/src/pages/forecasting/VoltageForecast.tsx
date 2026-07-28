import React from "react";
import { GenericForecastPage } from "./GenericForecastPage";

export default function VoltageForecast() {
  return (
    <GenericForecastPage
      domain="voltage"
      title="Voltage Forecast"
      description="Voltage level stability and deviation forecasting across main buses."
      color="#ef4444" // red
      unit="pu"
      kpiTitle="Avg Voltage"
    />
  );
}
