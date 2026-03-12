from datetime import date
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from .. import models, schemas
from ..availability import get_available_slots_for_date
from ..database import get_db


router = APIRouter(prefix="/availability", tags=["Availability"])


@router.post(
    "/event-types/{event_type_id}/schedules",
    response_model=schemas.AvailabilityScheduleRead,
)
def create_schedule(
    event_type_id: int, payload: schemas.AvailabilityScheduleCreate, db: Session = Depends(get_db)
):
    event = db.query(models.EventType).get(event_type_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event type not found")

    schedule = models.AvailabilitySchedule(
        event_type_id=event.id,
        name=payload.name,
        timezone=payload.timezone or event.timezone,
        buffer_before_minutes=payload.buffer_before_minutes,
        buffer_after_minutes=payload.buffer_after_minutes,
    )
    db.add(schedule)
    db.flush()

    for rule in payload.weekly_rules:
        db.add(
            models.WeeklyAvailabilityRule(
                schedule_id=schedule.id,
                day_of_week=rule.day_of_week,
                start_time=rule.start_time,
                end_time=rule.end_time,
            )
        )
    for override in payload.date_overrides:
        db.add(
            models.DateOverride(
                schedule_id=schedule.id,
                date=override.date,
                is_blocked=override.is_blocked,
                start_time=override.start_time,
                end_time=override.end_time,
            )
        )

    db.commit()
    db.refresh(schedule)
    return schedule


@router.get(
    "/event-types/{event_type_id}/schedules",
    response_model=List[schemas.AvailabilityScheduleRead],
)
def list_schedules(event_type_id: int, db: Session = Depends(get_db)):
    return (
        db.query(models.AvailabilitySchedule)
        .filter(models.AvailabilitySchedule.event_type_id == event_type_id)
        .all()
    )


@router.delete(
    "/schedules/{schedule_id}",
    status_code=204,
)
def delete_schedule(schedule_id: int, db: Session = Depends(get_db)):
    schedule = db.query(models.AvailabilitySchedule).get(schedule_id)
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    db.delete(schedule)
    db.commit()
    return

@router.get(
    "/event-types/{slug}/slots",
    response_model=schemas.AvailableSlotsResponse,
)
def get_slots_for_public_event(
    slug: str,
    target_date: date = Query(..., alias="date"),
    db: Session = Depends(get_db),
):
    event = db.query(models.EventType).filter(models.EventType.slug == slug).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event type not found")

    schedule = (
        db.query(models.AvailabilitySchedule)
        .filter(models.AvailabilitySchedule.event_type_id == event.id)
        .order_by(models.AvailabilitySchedule.id.asc())
        .first()
    )
    if not schedule:
        raise HTTPException(status_code=404, detail="No availability schedule configured")

    slots = get_available_slots_for_date(db, event, schedule, target_date)

    return schemas.AvailableSlotsResponse(
        date=target_date,
        timezone=schedule.timezone,
        slots=[
            schemas.AvailableSlot(start_time=s[0], end_time=s[1])
            for s in slots
        ],
    )

