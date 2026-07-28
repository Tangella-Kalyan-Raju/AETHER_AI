import React from "react";
import { GenericForecastPage } from "./GenericForecastPage";

export default function FrequencyForecast() {
  return (
    <GenericForecastPage
      domain="frequency"
      title="Frequency Forecast"
      description="High-resolution grid frequency deviations and stability predictions."
      color="#ec4899" // pink
      unit="Hz"
      kpiTitle="Grid Frequency"
    />
  );
}
