from __future__ import annotations

from datetime import datetime, date, time, timedelta
from typing import List

import pytz
from sqlalchemy.orm import Session

from . import models


def _daterange(start: datetime, end: datetime, step: timedelta):
    current = start
    while current + step <= end:
        yield current
        current += step


def get_available_slots_for_date(
    db: Session,
    event_type: models.EventType,
    schedule: models.AvailabilitySchedule,
    target_date: date,
) -> List[tuple[datetime, datetime]]:
    """
    Compute available slots for a given event type, schedule and date.
    Applies weekly rules, date overrides, existing meetings and buffers.
    """
    tz = pytz.timezone(schedule.timezone or event_type.timezone)
    weekday = target_date.weekday()  # Monday=0

    # Check date overrides first
    override = (
        db.query(models.DateOverride)
        .filter(
            models.DateOverride.schedule_id == schedule.id,
            models.DateOverride.date == target_date,
        )
        .first()
    )
    if override:
        if override.is_blocked:
            return []
        base_start = datetime.combine(target_date, override.start_time)
        base_end = datetime.combine(target_date, override.end_time)
    else:
        rules = (
            db.query(models.WeeklyAvailabilityRule)
            .filter(
                models.WeeklyAvailabilityRule.schedule_id == schedule.id,
                models.WeeklyAvailabilityRule.day_of_week == weekday,
            )
            .all()
        )
        if not rules:
            return []
        # For simplicity, merge rules into a single continuous block per day for now
        earliest_start = min(r.start_time for r in rules)
        latest_end = max(r.end_time for r in rules)
        base_start = datetime.combine(target_date, earliest_start)
        base_end = datetime.combine(target_date, latest_end)

    base_start = tz.localize(base_start)
    base_end = tz.localize(base_end)

    duration = timedelta(minutes=event_type.duration_minutes)
    buffer_before = timedelta(minutes=schedule.buffer_before_minutes)
    buffer_after = timedelta(minutes=schedule.buffer_after_minutes)

    # fetch existing meetings for this date
    day_start_utc = base_start.astimezone(pytz.UTC).replace(hour=0, minute=0, second=0, microsecond=0)
    day_end_utc = day_start_utc + timedelta(days=1)

    meetings = (
        db.query(models.Meeting)
        .filter(
            models.Meeting.event_type_id == event_type.id,
            models.Meeting.status == "scheduled",
            models.Meeting.start_time >= day_start_utc,
            models.Meeting.start_time < day_end_utc,
        )
        .all()
    )

    meeting_intervals = [
        (m.start_time - buffer_before, m.end_time + buffer_after) for m in meetings
    ]

    available_slots: List[tuple[datetime, datetime]] = []

    for slot_start in _daterange(base_start, base_end, duration):
        slot_end = slot_start + duration
        # Ensure slot end within base window
        if slot_end > base_end:
            continue

        slot_start_utc = slot_start.astimezone(pytz.UTC)
        slot_end_utc = slot_end.astimezone(pytz.UTC)

        # Check overlaps with existing meetings (with buffer)
        overlaps = False
        for m_start, m_end in meeting_intervals:
            if not (slot_end_utc <= m_start or slot_start_utc >= m_end):
                overlaps = True
                break
        if overlaps:
            continue

        available_slots.append((slot_start_utc, slot_end_utc))

    return available_slots

