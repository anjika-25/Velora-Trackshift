from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field


class RaceConfig(BaseModel):
    laps: int = Field(ge=1, default=5)
    num_cars: int = Field(ge=1, le=40, default=8)
    track_path: str
    seed: int = 1234
    gpu: bool = False


class RaceCreateResponse(BaseModel):
    message: str


class RaceStatus(BaseModel):
    running: bool
    laps: int
    num_cars: int
    track_path: str


class EventAck(BaseModel):
    accepted: bool
    message: str


class ScheduledEvent(BaseModel):
    type: Literal[
        "crash",
        "pit_stop",
        "engine_failure",
        "weather_change",
        "debris",
        "tyre_puncture",
    ]
    car_id: Optional[int] = None
    timestamp: float = 0.0
    payload: dict = Field(default_factory=dict)


class AgentControl(BaseModel):
    car_id: int
    command: Literal["push", "conserve", "box_now", "engine_cut", "resume"]
    value: Optional[float] = None


class CarTelemetry(BaseModel):
    car_id: int
    position: tuple[float, float]
    velocity: float
    lap: int
    tyre_temp: float
    tyre_wear: float
    status: Literal["racing", "pit", "dnf", "finished"]


class LeaderboardEntry(BaseModel):
    car_id: int
    gap_to_leader: float
    lap_time: float
    pit_stops: int


class TelemetryEvent(BaseModel):
    timestamp: float
    type: str
    message: str
    car_id: Optional[int] = None


class TelemetrySnapshot(BaseModel):
    timestamp: float
    cars: list[CarTelemetry]
    leaderboards: list[LeaderboardEntry]
    events: list[TelemetryEvent]


class WeatherQuery(BaseModel):
    latitude: float
    longitude: float


class WeatherData(BaseModel):
    temperature_c: float
    humidity: float
    pressure_hpa: float
    condition: Literal["clear", "cloudy", "rain"]



