from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import Base, engine
from .routers import event_types, availability, meetings
from .seed_sample_data import seed as seed_sample_data


Base.metadata.create_all(bind=engine)
# Auto-seed sample data in production if the database is empty.
seed_sample_data()

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins_list(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(event_types.router)
app.include_router(availability.router)
app.include_router(meetings.router)


@app.get("/health")
def health():
    return {"status": "ok"}

