import React from "react";
import { GenericForecastPage } from "./GenericForecastPage";

export default function WeatherForecast() {
  return (
    <GenericForecastPage
      domain="weather"
      title="Weather Forecast"
      description="High-resolution atmospheric predictions for temperature, wind, and solar irradiance."
      color="#0ea5e9" // sky
      unit="°C"
      kpiTitle="Temperature"
    />
  );
}
