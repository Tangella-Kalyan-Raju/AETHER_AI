import os
import requests
import logging
from typing import Dict, Any, Optional
from app.config.settings import settings

logger = logging.getLogger("gpo.weather")

class WeatherService:
    @staticmethod
    def get_weather_data(lat: float = 17.3850, lon: float = 78.4867, region_name: str = "Hyderabad, Telangana") -> Dict[str, Any]:
        """
        Fetches current weather and forecast from OpenWeather Map, with fallback to Open-Meteo.
        Coordinates default to Hyderabad, Telangana.
        """
        api_key = os.getenv("OPENWEATHER_API_KEY") or getattr(settings, "OPENWEATHER_API_KEY", "")
        
        # Try OpenWeather first if API key is present
        if api_key:
            try:
                url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={api_key}&units=metric"
                response = requests.get(url, timeout=5)
                if response.status_code == 200:
                    data = response.json()
                    logger.info("Successfully fetched weather from OpenWeather Map")
                    
                    sys_data = data.get("sys", {})
                    import datetime
                    sunrise_time = datetime.datetime.fromtimestamp(sys_data.get("sunrise", 0), datetime.timezone.utc).strftime("%I:%M %p")
                    sunset_time = datetime.datetime.fromtimestamp(sys_data.get("sunset", 0), datetime.timezone.utc).strftime("%I:%M %p")
                    
                    weather_desc = data.get("weather", [{}])[0].get("main", "Clear")
                    cloud_cover = data.get("clouds", {}).get("all", 0.0)
                    
                    # Estimate weather impact based on cloud cover
                    weather_impact = "Nominal conditions."
                    if cloud_cover > 50:
                        loss_est = int(cloud_cover * 25) # Mock calculation
                        weather_impact = f"Cloud cover is high ({cloud_cover}%). Solar generation is expected to drop by -{loss_est} MW."
                    elif cloud_cover > 25:
                        weather_impact = "Light cloud cover detected. Minor solar output fluctuations possible."
                        
                    return {
                        "region": region_name,
                        "temperature": data.get("main", {}).get("temp", 25.0),
                        "humidity": data.get("main", {}).get("humidity", 60.0),
                        "wind_speed": round(data.get("wind", {}).get("speed", 0.0) * 3.6, 1), # convert m/s to km/h
                        "cloud_cover": float(cloud_cover),
                        "pressure": data.get("main", {}).get("pressure", 1013.25),
                        "visibility": data.get("visibility", 10000) / 1000.0, # convert meters to km
                        "sunrise": sunrise_time,
                        "sunset": sunset_time,
                        "weather_alerts": [],
                        "weather_impact": weather_impact,
                        "forecast_summary": weather_desc
                    }
            except Exception as e:
                logger.warning(f"Failed to fetch from OpenWeather, falling back to Open-Meteo: {e}")
        
        # Fallback to Open-Meteo API (Free, no key required)
        try:
            url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m,cloud_cover,pressure_msl,visibility,wind_speed_10m&daily=sunrise,sunset&timezone=auto"
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                data = response.json()
                logger.info("Successfully fetched weather from Open-Meteo")
                current = data.get("current", {})
                daily = data.get("daily", {})
                
                sunrise_val = daily.get("sunrise", [""])[0]
                sunset_val = daily.get("sunset", [""])[0]
                sunrise_time = sunrise_val.split("T")[-1] if sunrise_val else "05:45"
                sunset_time = sunset_val.split("T")[-1] if sunset_val else "18:45"
                
                cloud_cover = current.get("cloud_cover", 0.0)
                weather_impact = "Nominal conditions."
                if cloud_cover > 50:
                    loss_est = int(cloud_cover * 25)
                    weather_impact = f"Cloud cover is high ({cloud_cover}%). Solar generation is expected to drop by -{loss_est} MW."
                elif cloud_cover > 25:
                    weather_impact = "Light cloud cover detected. Minor solar output fluctuations possible."
                
                return {
                    "region": region_name,
                    "temperature": current.get("temperature_2m", 25.0),
                    "humidity": current.get("relative_humidity_2m", 60.0),
                    "wind_speed": current.get("wind_speed_10m", 10.0),
                    "cloud_cover": float(cloud_cover),
                    "pressure": current.get("pressure_msl", 1013.25),
                    "visibility": current.get("visibility", 10000) / 1000.0,
                    "sunrise": sunrise_time,
                    "sunset": sunset_time,
                    "weather_alerts": [
                        {"title": "Cloud Cover Alert", "time": "Current", "desc": f"Cloud cover is currently {cloud_cover}%"}
                    ] if cloud_cover > 30 else [],
                    "weather_impact": weather_impact,
                    "forecast_summary": "Partly Cloudy" if cloud_cover > 25 else "Mostly Sunny"
                }
        except Exception as e:
            logger.error(f"Fallback to Open-Meteo failed: {e}")
            
        # Return fallback mocked values if all requests fail
        return {
            "region": region_name,
            "temperature": 32.1,
            "humidity": 46.0,
            "wind_speed": 12.0,
            "cloud_cover": 18.0,
            "pressure": 1011.0,
            "visibility": 8.0,
            "sunrise": "05:42 AM",
            "sunset": "06:48 PM",
            "weather_alerts": [
                {"title": "Cloud Cover Increase", "time": "14:25", "desc": "Expected in 30 mins"}
            ],
            "weather_impact": "Cloud cover is increasing rapidly. Solar generation expected to drop by -1,850 MW.",
            "forecast_summary": "Mostly Sunny"
        }
