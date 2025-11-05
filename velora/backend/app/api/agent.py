from __future__ import annotations

from fastapi import APIRouter

from ..schemas import AgentControl, EventAck


router = APIRouter()


@router.post("/control", response_model=EventAck)
async def control_agent(cmd: AgentControl) -> EventAck:
    # Real implementation will dispatch control commands to car agent tasks
    return EventAck(accepted=True, message=f"control {cmd.car_id}: {cmd.command}")



