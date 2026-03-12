from datetime import datetime, time, date, timedelta

from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Date,
    Time,
    Boolean,
    ForeignKey,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship, Mapped, mapped_column

from .database import Base


class EventType(Base):
    __tablename__ = "event_types"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=30)
    slug: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    description: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    color_hex: Mapped[str | None] = mapped_column(String(7), nullable=True)  # e.g. #3b82f6

    timezone: Mapped[str] = mapped_column(String(64), default="Asia/Kolkata")

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    availability_schedules: Mapped[list["AvailabilitySchedule"]] = relationship(
        back_populates="event_type", cascade="all, delete-orphan"
    )
    meetings: Mapped[list["Meeting"]] = relationship(
        back_populates="event_type", cascade="all, delete-orphan"
    )


class AvailabilitySchedule(Base):
    """
    Represents a reusable schedule for an event type.
    Example: \"Weekday Office Hours\", \"Evening Slots\", etc.
    """

    __tablename__ = "availability_schedules"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    event_type_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("event_types.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    timezone: Mapped[str] = mapped_column(String(64), default="Asia/Kolkata")

    buffer_before_minutes: Mapped[int] = mapped_column(Integer, default=0)
    buffer_after_minutes: Mapped[int] = mapped_column(Integer, default=0)

    event_type: Mapped[EventType] = relationship(back_populates="availability_schedules")
    weekly_rules: Mapped[list["WeeklyAvailabilityRule"]] = relationship(
        back_populates="schedule", cascade="all, delete-orphan"
    )
    date_overrides: Mapped[list["DateOverride"]] = relationship(
        back_populates="schedule", cascade="all, delete-orphan"
    )


class WeeklyAvailabilityRule(Base):
    """
    Day-of-week rule, e.g. Monday 09:00–17:00
    day_of_week: 0=Monday ... 6=Sunday
    """

    __tablename__ = "weekly_availability_rules"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    schedule_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("availability_schedules.id", ondelete="CASCADE"), nullable=False
    )

    day_of_week: Mapped[int] = mapped_column(Integer, nullable=False)
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time] = mapped_column(Time, nullable=False)

    schedule: Mapped[AvailabilitySchedule] = relationship(back_populates="weekly_rules")

    __table_args__ = (
        UniqueConstraint(
            "schedule_id",
            "day_of_week",
            "start_time",
            "end_time",
            name="uq_schedule_day_time_range",
        ),
    )


class DateOverride(Base):
    """
    Date-specific override for availability.
    Can define custom hours or mark date as blocked.
    """

    __tablename__ = "date_overrides"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    schedule_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("availability_schedules.id", ondelete="CASCADE"), nullable=False
    )

    date: Mapped[date] = mapped_column(Date, nullable=False)
    is_blocked: Mapped[bool] = mapped_column(Boolean, default=False)
    start_time: Mapped[time | None] = mapped_column(Time, nullable=True)
    end_time: Mapped[time | None] = mapped_column(Time, nullable=True)

    schedule: Mapped[AvailabilitySchedule] = relationship(back_populates="date_overrides")


class Meeting(Base):
    __tablename__ = "meetings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    event_type_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("event_types.id", ondelete="CASCADE"), nullable=False
    )

    invitee_name: Mapped[str] = mapped_column(String(255), nullable=False)
    invitee_email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)

    start_time: Mapped[datetime] = mapped_column(DateTime, nullable=False, index=True)
    end_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)

    timezone: Mapped[str] = mapped_column(String(64), default="Asia/Kolkata")

    status: Mapped[str] = mapped_column(String(32), default="scheduled")  # scheduled/cancelled
    cancellation_reason: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    event_type: Mapped[EventType] = relationship(back_populates="meetings")
    custom_answers: Mapped[list["MeetingCustomAnswer"]] = relationship(
        back_populates="meeting", cascade="all, delete-orphan"
    )


class CustomQuestion(Base):
    """
    Custom questions configured per event type shown on booking form.
    """

    __tablename__ = "custom_questions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    event_type_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("event_types.id", ondelete="CASCADE"), nullable=False
    )

    question: Mapped[str] = mapped_column(String(500), nullable=False)
    required: Mapped[bool] = mapped_column(Boolean, default=False)

    event_type: Mapped[EventType] = relationship()
    answers: Mapped[list["MeetingCustomAnswer"]] = relationship(
        back_populates="question", cascade="all, delete-orphan"
    )


class MeetingCustomAnswer(Base):
    __tablename__ = "meeting_custom_answers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    meeting_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False
    )
    question_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("custom_questions.id", ondelete="CASCADE"), nullable=False
    )

    answer_text: Mapped[str] = mapped_column(String(1000), nullable=False)

    meeting: Mapped[Meeting] = relationship(back_populates="custom_answers")
    question: Mapped[CustomQuestion] = relationship(back_populates="answers")

