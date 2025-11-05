from __future__ import annotations

import argparse
import asyncio
import os
from contextlib import asynccontextmanager
from typing import AsyncIterator

import socketio
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .utils.rng import seed_all
from .utils.logging import get_logger
from .api.race import router as race_router
from .api.event import router as event_router
from .api.agent import router as agent_router
from .api.telemetry import router as telemetry_router
from .api.weather import router as weather_router


logger = get_logger(__name__)


sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    logger.info("Starting Velora backend...")
    # Create background tasks container
    app.state.background_tasks: list[asyncio.Task] = []
    yield
    # Gracefully cancel background tasks
    for task in app.state.background_tasks:
        task.cancel()
    logger.info("Velora backend stopped.")


app = FastAPI(title="Velora Racing Simulator", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(race_router, prefix="/api/race", tags=["race"])
app.include_router(event_router, prefix="/api/event", tags=["event"])
app.include_router(agent_router, prefix="/api/agent", tags=["agent"])
app.include_router(telemetry_router, prefix="/api/telemetry", tags=["telemetry"])
app.include_router(weather_router, prefix="/api/weather", tags=["weather"])

# Expose Socket.IO app
socket_app = socketio.ASGIApp(sio, other_asgi_app=app)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Velora backend server")
    parser.add_argument("--host", default=os.environ.get("VELORA_HOST", "0.0.0.0"))
    parser.add_argument("--port", type=int, default=int(os.environ.get("VELORA_PORT", 8000)))
    parser.add_argument("--laps", type=int, default=int(os.environ.get("VELORA_LAPS", 5)))
    parser.add_argument("--track", default=os.environ.get("VELORA_TRACK", "../config/track_def.json"))
    parser.add_argument("--cars", type=int, default=int(os.environ.get("VELORA_CARS", 8)))
    parser.add_argument("--gpu", action="store_true", help="Enable GPU if available")
    parser.add_argument("--seed", type=int, default=int(os.environ.get("VELORA_SEED", 1234)))
    parser.add_argument("--render-quality", default=os.environ.get("VELORA_RENDER_QUALITY", "medium"))
    parser.add_argument("--demo", action="store_true", help="Run in demo mode")
    return parser.parse_args()


@sio.event
async def connect(sid, environ):  # type: ignore[no-untyped-def]
    logger.info("Socket connected: %s", sid)


@sio.event
async def disconnect(sid):  # type: ignore[no-untyped-def]
    logger.info("Socket disconnected: %s", sid)


def main() -> None:
    args = parse_args()
    seed_all(args.seed)
    # Save defaults in app state for APIs to access
    app.state.default_args = args
    uvicorn.run(socket_app, host=args.host, port=args.port, log_level="info")


if __name__ == "__main__":
    main()



