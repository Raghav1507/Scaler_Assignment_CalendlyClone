from datetime import datetime, time, date
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field


class CustomQuestionBase(BaseModel):
    question: str
    required: bool = False


class CustomQuestionCreate(CustomQuestionBase):
    pass


class CustomQuestionRead(CustomQuestionBase):
    id: int

    class Config:
        from_attributes = True


class EventTypeBase(BaseModel):
    name: str
    duration_minutes: int = Field(gt=0)
    slug: str
    description: Optional[str] = None
    color_hex: Optional[str] = None
    timezone: str = "Asia/Kolkata"


class EventTypeCreate(EventTypeBase):
    custom_questions: List[CustomQuestionCreate] = []


class EventTypeUpdate(BaseModel):
    name: Optional[str] = None
    duration_minutes: Optional[int] = Field(default=None, gt=0)
    slug: Optional[str] = None
    description: Optional[str] = None
    color_hex: Optional[str] = None
    timezone: Optional[str] = None


class EventTypeRead(EventTypeBase):
    id: int
    custom_questions: List[CustomQuestionRead] = []

    class Config:
        from_attributes = True


class WeeklyRuleBase(BaseModel):
    day_of_week: int = Field(ge=0, le=6)
    start_time: time
    end_time: time


class WeeklyRuleCreate(WeeklyRuleBase):
    pass


class WeeklyRuleRead(WeeklyRuleBase):
    id: int

    class Config:
        from_attributes = True


class DateOverrideBase(BaseModel):
    date: date
    is_blocked: bool = False
    start_time: Optional[time] = None
    end_time: Optional[time] = None


class DateOverrideCreate(DateOverrideBase):
    pass


class DateOverrideRead(DateOverrideBase):
    id: int

    class Config:
        from_attributes = True


class AvailabilityScheduleBase(BaseModel):
    name: str
    timezone: str = "Asia/Kolkata"
    buffer_before_minutes: int = 0
    buffer_after_minutes: int = 0


class AvailabilityScheduleCreate(AvailabilityScheduleBase):
    weekly_rules: List[WeeklyRuleCreate] = []
    date_overrides: List[DateOverrideCreate] = []


class AvailabilityScheduleRead(AvailabilityScheduleBase):
    id: int
    event_type_id: int
    weekly_rules: List[WeeklyRuleRead] = []
    date_overrides: List[DateOverrideRead] = []

    class Config:
        from_attributes = True


class MeetingBase(BaseModel):
    invitee_name: str
    invitee_email: EmailStr
    start_time: datetime
    end_time: datetime
    timezone: str = "Asia/Kolkata"


class MeetingCreate(BaseModel):
    invitee_name: str
    invitee_email: EmailStr
    start_time: datetime
    timezone: str = "Asia/Kolkata"
    answers: dict[int, str] = {}


class MeetingRead(MeetingBase):
    id: int
    status: str
    cancellation_reason: Optional[str] = None
    event_type_id: int

    class Config:
        from_attributes = True


class MeetingCancelRequest(BaseModel):
    reason: Optional[str] = None


class AvailableSlot(BaseModel):
    start_time: datetime
    end_time: datetime


class AvailableSlotsResponse(BaseModel):
    date: date
    timezone: str
    slots: List[AvailableSlot]

