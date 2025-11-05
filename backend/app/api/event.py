from __future__ import annotations

from fastapi import APIRouter

from ..schemas import ScheduledEvent, EventAck


router = APIRouter()


@router.post("/schedule", response_model=EventAck)
async def schedule_event(event: ScheduledEvent) -> EventAck:
    # Real implementation will enqueue into the event loop.
    return EventAck(accepted=True, message=f"scheduled {event.type} at {event.timestamp}")



