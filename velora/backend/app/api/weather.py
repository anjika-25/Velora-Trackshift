from __future__ import annotations

from fastapi import APIRouter

from ..schemas import WeatherQuery, WeatherData
from ..utils.weatherapi import WeatherAPIClient


router = APIRouter()


@router.post("/sync", response_model=WeatherData)
async def sync_weather(query: WeatherQuery) -> WeatherData:
    client = WeatherAPIClient()
    data = await client.fetch_weather(query.latitude, query.longitude)
    return data



