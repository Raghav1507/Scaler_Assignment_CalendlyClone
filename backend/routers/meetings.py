from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..availability import get_available_slots_for_date
from ..database import get_db
from ..email_utils import send_email
from ..config import settings


router = APIRouter(prefix="/meetings", tags=["Meetings & Booking"])


@router.get("/", response_model=List[schemas.MeetingRead])
def list_meetings(
    scope: str = "upcoming",
    db: Session = Depends(get_db),
):
    now = datetime.utcnow()
    q = db.query(models.Meeting).filter(models.Meeting.status == "scheduled")
    if scope == "upcoming":
        q = q.filter(models.Meeting.start_time >= now).order_by(models.Meeting.start_time.asc())
    elif scope == "past":
        q = q.filter(models.Meeting.start_time < now).order_by(models.Meeting.start_time.desc())
    else:
        q = q.order_by(models.Meeting.start_time.desc())
    return q.all()


@router.post(
    "/public/{slug}",
    response_model=schemas.MeetingRead,
    status_code=status.HTTP_201_CREATED,
)
def book_public_meeting(
    slug: str,
    payload: schemas.MeetingCreate,
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

    # Verify slot is still available (prevent double booking)
    slot_date = payload.start_time.date()
    available_slots = get_available_slots_for_date(db, event, schedule, slot_date)

    matching_slot = None
    for start_utc, end_utc in available_slots:
        if start_utc == payload.start_time:
            matching_slot = (start_utc, end_utc)
            break

    if not matching_slot:
        raise HTTPException(
            status_code=400,
            detail="Selected time is no longer available. Please pick another slot.",
        )

    meeting = models.Meeting(
        event_type_id=event.id,
        invitee_name=payload.invitee_name,
        invitee_email=payload.invitee_email,
        start_time=matching_slot[0],
        end_time=matching_slot[1],
        timezone=payload.timezone or event.timezone,
    )
    db.add(meeting)
    db.flush()

    # Save custom answers
    if payload.answers:
        for q_id, answer in payload.answers.items():
            db.add(
                models.MeetingCustomAnswer(
                    meeting_id=meeting.id,
                    question_id=q_id,
                    answer_text=answer,
                )
            )

    db.commit()
    db.refresh(meeting)

    # Send confirmation emails (best effort)
    subject = f"Booking confirmed: {event.name}"
    start_local = matching_slot[0]
    body = (
        f"Hi {meeting.invitee_name},\n\n"
        f"Your meeting '{event.name}' is confirmed.\n"
        f"Start time (UTC): {start_local.isoformat()}\n"
        f"Duration: {event.duration_minutes} minutes\n\n"
        "Thank you for scheduling!"
    )
    recipients = [meeting.invitee_email]
    if settings.owner_email:
        recipients.append(settings.owner_email)
    send_email(subject, body, recipients)

    return meeting


@router.post("/{meeting_id}/cancel", response_model=schemas.MeetingRead)
def cancel_meeting(
    meeting_id: int,
    payload: schemas.MeetingCancelRequest,
    db: Session = Depends(get_db),
):
    meeting = db.query(models.Meeting).get(meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    if meeting.status == "cancelled":
        return meeting

    meeting.status = "cancelled"
    meeting.cancellation_reason = payload.reason

    db.commit()
    db.refresh(meeting)

    # Send cancellation email (best effort)
    subject = f"Meeting cancelled: {meeting.event_type.name}"
    body = (
        f"Hi {meeting.invitee_name},\n\n"
        "Your meeting has been cancelled.\n"
        f"Original start time (UTC): {meeting.start_time.isoformat()}\n"
        f"Reason: {meeting.cancellation_reason or 'Not specified'}\n"
    )
    recipients = [meeting.invitee_email]
    if settings.owner_email:
        recipients.append(settings.owner_email)
    send_email(subject, body, recipients)

    return meeting

