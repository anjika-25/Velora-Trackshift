from __future__ import annotations

import asyncio
from typing import Any

from fastapi import APIRouter, Depends, HTTPException

from ..schemas import RaceConfig, RaceStatus, RaceCreateResponse
from ..utils.logging import get_logger


router = APIRouter()
logger = get_logger(__name__)


class RaceEngine:
    """Minimal race engine placeholder to wire APIs and sockets.

    The full implementation (physics, RK4, agents) will be provided in the
    physics-agents task. This stub keeps API stable and testable.
    """

    def __init__(self) -> None:
        self._lock = asyncio.Lock()
        self._running: bool = False
        self._laps: int = 0
        self._cars: int = 0
        self._track: str = ""

    async def create(self, config: RaceConfig) -> None:
        async with self._lock:
            if self._running:
                raise RuntimeError("Race already running")
            self._laps = config.laps
            self._cars = config.num_cars
            self._track = config.track_path

    async def start(self) -> None:
        async with self._lock:
            self._running = True

    async def stop(self) -> None:
        async with self._lock:
            self._running = False

    async def status(self) -> RaceStatus:
        async with self._lock:
            return RaceStatus(
                running=self._running,
                laps=self._laps,
                num_cars=self._cars,
                track_path=self._track,
            )


_ENGINE = RaceEngine()


async def get_engine() -> RaceEngine:
    return _ENGINE


@router.post("/create", response_model=RaceCreateResponse)
async def create_race(config: RaceConfig, engine: RaceEngine = Depends(get_engine)) -> Any:
    try:
        await engine.create(config)
    except RuntimeError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return RaceCreateResponse(message="race_created")


@router.post("/start")
async def start_race(engine: RaceEngine = Depends(get_engine)) -> Any:
    await engine.start()
    return {"message": "race_started"}


@router.post("/stop")
async def stop_race(engine: RaceEngine = Depends(get_engine)) -> Any:
    await engine.stop()
    return {"message": "race_stopped"}


@router.get("/status", response_model=RaceStatus)
async def get_status(engine: RaceEngine = Depends(get_engine)) -> RaceStatus:
    return await engine.status()



