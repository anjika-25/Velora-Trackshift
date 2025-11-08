from __future__ import annotations

import argparse
import asyncio
import os
import sys
from contextlib import asynccontextmanager
from typing import AsyncIterator

import socketio
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Use absolute package imports so the module works when run as a package
# Preferred: run with `python -m app.main` from the `backend` directory.
#
# But also support running this file directly (python main.py) by adding a
# fallback that inserts the `backend` directory into sys.path when the
# top-level `app` package isn't importable.
try:
    from app.utils.rng import seed_all
    from app.utils.logging import get_logger
    from app.api.race import router as race_router
    from app.api.event import router as event_router
    from app.api.agent import router as agent_router
    from app.api.telemetry import router as telemetry_router
    from app.api.weather import router as weather_router
except ModuleNotFoundError:
    # If `app` isn't a top-level package (common when running `python main.py`
    # from inside the `app` folder), add the parent directory (backend) to
    # sys.path and retry imports.
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    if backend_dir not in sys.path:
        sys.path.insert(0, backend_dir)
    from app.utils.rng import seed_all
    from app.utils.logging import get_logger
    from app.api.race import router as race_router
    from app.api.event import router as event_router
    from app.api.agent import router as agent_router
    from app.api.telemetry import router as telemetry_router
    from app.api.weather import router as weather_router

logger = get_logger(__name__)

# Configure CORS origins
origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001"
]

# Configure Socket.IO with CORS (single initialization)
sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins=origins,
    logger=True,
    engineio_logger=True
)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    logger.info("Starting Velora backend...")
    # Create background tasks container
    # type: list[asyncio.Task]
    app.state.background_tasks = []
    yield
    # Gracefully cancel background tasks
    for task in app.state.background_tasks:
        task.cancel()
    logger.info("Velora backend stopped.")


app = FastAPI(title="Velora Racing Simulator", version="0.1.0", lifespan=lifespan)

# Configure CORS for FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
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

# Create Socket.IO app and mount FastAPI
# Keep reference to FastAPI app for state management
fastapi_app = app
socket_app = socketio.ASGIApp(sio, app)


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
    # Save defaults in FastAPI app state for APIs to access
    fastapi_app.state.default_args = args
    uvicorn.run(socket_app, host=args.host, port=args.port, log_level="info")


if __name__ == "__main__":
    main()
