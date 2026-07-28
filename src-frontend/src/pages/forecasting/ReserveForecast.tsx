import React from "react";
import { GenericForecastPage } from "./GenericForecastPage";

export default function ReserveForecast() {
  return (
    <GenericForecastPage
      domain="reserve"
      title="Reserve Forecast"
      description="Spinning reserve and operating reserve margin forecasting."
      color="#3b82f6" // blue
      unit="MW"
      kpiTitle="Reserve Margin"
    />
  );
}
