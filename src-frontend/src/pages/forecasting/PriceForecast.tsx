import React from "react";
import { GenericForecastPage } from "./GenericForecastPage";

export default function PriceForecast() {
  return (
    <GenericForecastPage
      domain="price"
      title="Price Forecast"
      description="Market electricity pricing and operational cost trend predictions."
      color="#10b981" // emerald
      unit="$/MWh"
      kpiTitle="Market Price"
    />
  );
}
