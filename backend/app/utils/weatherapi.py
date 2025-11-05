from __future__ import annotations

import os
from typing import Any

import aiohttp

from ..schemas import WeatherData


class WeatherAPIClient:
    """Simple client stub. If no API key, return deterministic fake weather."""

    def __init__(self) -> None:
        self.api_key = os.environ.get("WEATHER_API_KEY")
        self.base_url = os.environ.get("WEATHER_API_URL", "https://api.open-meteo.com/v1/forecast")

    async def fetch_weather(self, lat: float, lon: float) -> WeatherData:
        if not self.api_key:
            # Deterministic fallback
            return WeatherData(temperature_c=21.0, humidity=0.55, pressure_hpa=1013.0, condition="clear")

        params = {
            "latitude": lat,
            "longitude": lon,
            "hourly": "temperature_2m,relative_humidity_2m,surface_pressure",
        }
        async with aiohttp.ClientSession() as session:
            async with session.get(self.base_url, params=params, timeout=10) as resp:
                resp.raise_for_status()
                data: Any = await resp.json()
        # Map roughly; real integration would use a specific API
        temp = float(data.get("hourly", {}).get("temperature_2m", [21])[0])
        rh = float(data.get("hourly", {}).get("relative_humidity_2m", [55])[0]) / 100.0
        p = float(data.get("hourly", {}).get("surface_pressure", [1013])[0])
        condition = "clear"
        return WeatherData(temperature_c=temp, humidity=rh, pressure_hpa=p, condition=condition)



