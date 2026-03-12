from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db


router = APIRouter(prefix="/event-types", tags=["Event Types"])


@router.get("/", response_model=List[schemas.EventTypeRead])
def list_event_types(db: Session = Depends(get_db)):
    return db.query(models.EventType).all()


@router.post("/", response_model=schemas.EventTypeRead, status_code=status.HTTP_201_CREATED)
def create_event_type(payload: schemas.EventTypeCreate, db: Session = Depends(get_db)):
    existing = (
        db.query(models.EventType).filter(models.EventType.slug == payload.slug).first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Slug already in use. Please choose a different URL.",
        )

    event = models.EventType(
        name=payload.name,
        duration_minutes=payload.duration_minutes,
        slug=payload.slug,
        description=payload.description,
        color_hex=payload.color_hex,
        timezone=payload.timezone,
    )
    db.add(event)
    db.flush()  # to get event.id

    for q in payload.custom_questions:
        db.add(
            models.CustomQuestion(
                event_type_id=event.id,
                question=q.question,
                required=q.required,
            )
        )

    db.commit()
    db.refresh(event)
    return event


@router.get("/{event_type_id}", response_model=schemas.EventTypeRead)
def get_event_type(event_type_id: int, db: Session = Depends(get_db)):
    event = db.query(models.EventType).get(event_type_id)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event type not found")
    return event


@router.put("/{event_type_id}", response_model=schemas.EventTypeRead)
def update_event_type(
    event_type_id: int, payload: schemas.EventTypeUpdate, db: Session = Depends(get_db)
):
    event = db.query(models.EventType).get(event_type_id)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event type not found")

    if payload.slug and payload.slug != event.slug:
        exists = (
            db.query(models.EventType)
            .filter(models.EventType.slug == payload.slug, models.EventType.id != event.id)
            .first()
        )
        if exists:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Slug already in use. Please choose a different URL.",
            )

    for field, value in payload.dict(exclude_unset=True).items():
        setattr(event, field, value)

    db.commit()
    db.refresh(event)
    return event


@router.delete("/{event_type_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event_type(event_type_id: int, db: Session = Depends(get_db)):
    event = db.query(models.EventType).get(event_type_id)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event type not found")
    db.delete(event)
    db.commit()
    return

