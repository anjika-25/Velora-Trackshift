from __future__ import annotations

from fastapi import APIRouter

from ..schemas import TelemetrySnapshot


router = APIRouter()


@router.get("/snapshot", response_model=TelemetrySnapshot)
async def get_snapshot() -> TelemetrySnapshot:
    # Placeholder: return empty telemetry frame
    return TelemetrySnapshot(
        timestamp=0.0,
        cars=[],
        leaderboards=[],
        events=[],
    )



