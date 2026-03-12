from datetime import time

from sqlalchemy.orm import Session

from .database import SessionLocal, Base, engine
from . import models


def seed():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    if db.query(models.EventType).first():
        db.close()
        return

    # Sample event types
    intro_call = models.EventType(
        name="30 min Intro Call",
        duration_minutes=30,
        slug="intro-30",
        description="Get to know each other and discuss requirements.",
        color_hex="#4F46E5",
        timezone="Asia/Kolkata",
    )
    deep_dive = models.EventType(
        name="60 min Deep Dive",
        duration_minutes=60,
        slug="deep-dive-60",
        description="Detailed discussion about your product and architecture.",
        color_hex="#0EA5E9",
        timezone="Asia/Kolkata",
    )
    db.add_all([intro_call, deep_dive])
    db.flush()

    # Custom questions
    db.add_all(
        [
            models.CustomQuestion(
                event_type_id=intro_call.id,
                question="What do you want to achieve from this call?",
                required=True,
            ),
            models.CustomQuestion(
                event_type_id=deep_dive.id,
                question="Share any relevant links or repos.",
                required=False,
            ),
        ]
    )

    # Availability schedule for intro_call (Mon–Fri, 10:00–18:00 IST)
    schedule = models.AvailabilitySchedule(
        event_type_id=intro_call.id,
        name="Weekday Working Hours",
        timezone="Asia/Kolkata",
        buffer_before_minutes=10,
        buffer_after_minutes=10,
    )
    db.add(schedule)
    db.flush()

    for dow in range(0, 5):
        db.add(
            models.WeeklyAvailabilityRule(
                schedule_id=schedule.id,
                day_of_week=dow,
                start_time=time(hour=10, minute=0),
                end_time=time(hour=18, minute=0),
            )
        )

    db.commit()
    db.close()


if __name__ == "__main__":
    seed()

