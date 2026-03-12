# Scaler Scheduling – Calendly‑style Booking App

Full‑stack scheduling app built for the Scaler assignment. It mimics Calendly's core flows while keeping the implementation small and understandable.

## Tech Stack

- **Frontend**: React 18, Vite, React Router, TailwindCSS, Framer Motion, Axios  
- **Backend**: Python, FastAPI, SQLAlchemy  
- **Database**: MySQL (InnoDB)  

## Features Implemented

- **Event Types**
  - Create, list, edit (via API) and delete event types
  - Fields: name, duration (minutes), slug, description, color, timezone
  - Each event type exposes a public URL: `/book/:slug`
- **Availability**
  - Multiple availability schedules per event type
  - Weekly rules (days of week + time ranges)
  - Date‑specific overrides (API + DB level)
  - Buffer time before/after meetings
- **Public Booking Page**
  - Calendar month view to select a date
  - Fetches live available slots from backend (prevents double booking)
  - Booking form collects invitee name + email
  - Confirmation screen after booking
- **Meetings Page**
  - Upcoming / past filter
  - Cancel existing meetings (with optional reason)
- **Extras**
  - Modern, light UI with animated transitions and premium gradients
  - Global 3D background (Three.js) with double‑layer dot pattern
  - Gradient calendar + time‑slot styling to mimic Calendly’s look and feel
  - Sample data seeding for event types and schedules

> **Email delivery**: booking / cancellation email hooks are implemented and can be enabled via SMTP configuration in `.env`. If SMTP is not configured, the rest of the app still works and email sends become no‑ops.

## 1. MySQL Setup

1. **Install MySQL** (if not already)
   - On Windows, you can use MySQL Installer or WAMP/XAMPP.

2. **Create database**

   ```sql
   CREATE DATABASE scaler_calendly CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

3. **Create / use a MySQL user**

   - For local dev you can reuse `root` or create a dedicated user:

   ```sql
   CREATE USER 'scaler_user'@'localhost' IDENTIFIED BY 'strongpassword';
   GRANT ALL PRIVILEGES ON scaler_calendly.* TO 'scaler_user'@'localhost';
   FLUSH PRIVILEGES;
   ```

4. **Configure connection string**

   In `backend/config.py` the default is:

   ```python
   database_url: str = "mysql+pymysql://root:password@localhost:3306/scaler_calendly"
   ```

   Either:

   - Change `root:password` to your local credentials, **or**
   - Create a `.env` file in the project root and override:

   ```env
   DATABASE_URL=mysql+pymysql://scaler_user:strongpassword@localhost:3306/scaler_calendly
   ```

## 2. Backend Setup (FastAPI)

From the project root (`Scaler_Assignment`):

```bash
python -m venv venv
venv\Scripts\activate      # on Windows PowerShell
pip install -r requirements.txt
```

Run DB migrations (tables are created automatically via SQLAlchemy metadata on startup, no separate Alembic step is required for this demo).

### Seed sample data

This will insert:
- A couple of event types (30‑min intro, 60‑min deep dive)
- A default weekday availability schedule for the intro event

```bash
python -m backend.seed_sample_data
```

### Start the backend

```bash
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

You can verify it is running:

- Health check: `GET http://localhost:8000/health`
- OpenAPI docs: `http://localhost:8000/docs`

## 3. Frontend Setup (React + Vite)

From the same project root:

```bash
npm install
npm run dev
```

By default Vite runs on `http://localhost:5173`.  
The frontend is already configured to call the backend at `http://localhost:8000`.

## 4. How to Use the App

1. **Open the app** at `http://localhost:5173`
2. **Dashboard**
   - Shows a quick list of event types and upcoming meetings.
3. **Event Types**
   - Create new event types with:
     - Name, duration, slug, description, color
   - The public booking URL is shown as `/book/<slug>`.
4. **Availability**
   - Pick an event type, then define:
     - Weekly working days and time ranges
     - Buffer minutes before/after
   - Multiple schedules per event type are supported through the backend.
5. **Public Booking**
   - Use `/book/<slug>` (e.g. `/book/intro-30`).
   - Flow:
     1. Select a date from the calendar (left).
     2. Pick an available time slot (middle).
     3. Fill in your name + email and confirm.
   - Double bookings are prevented by recomputing availability server‑side right before booking.
6. **Meetings**
   - See upcoming or past meetings (filters).
   - Cancel any meeting with an optional reason.

## 5. Database Design (High‑Level)

- `event_types`
  - Basic metadata about each event type (name, duration, slug, color, timezone).
- `availability_schedules`
  - One‑to‑many with event types.
  - Stores timezone and buffer configuration.
- `weekly_availability_rules`
  - One‑to‑many with schedules.
  - Each row: `day_of_week`, `start_time`, `end_time`.
- `date_overrides`
  - Per‑schedule date‑specific rules.
  - Either block a date entirely or define custom hours for that day.
- `meetings`
  - Stores actual booked meetings, with:
    - Invitee details
    - Start/end time (stored in UTC)
    - Status (`scheduled` / `cancelled`)
    - Cancellation reason
- `custom_questions` and `meeting_custom_answers`
  - Allow custom questions per event and recorded answers per meeting (API support is there; UI uses the basic fields for now).

## 6. Assumptions

- **Single owner**: no authentication; all admin screens assume one default user.
- **Timezone**:
  - Each event type and schedule has a stored timezone.
  - Availability calculations use that timezone and then convert to UTC.
  - Frontend displays times in the browser’s local timezone.
- **Email**:
  - Not implemented to keep the assignment focused on core scheduling logic.
  - Easy to extend by adding background tasks or hooks in the booking endpoint.
- **Rescheduling**:
  - For now, rescheduling = cancel + rebook. The data model can easily support a separate reschedule flow later.

## 7. Environment configuration (`.env`)

This project uses a `.env` file for secrets and environment‑specific settings.

- **Never commit `.env` to Git** – it is git‑ignored by default.
- Instead, use the provided `env.example` as a template:

```bash
cp env.example .env    # then edit values inside .env
```

### Required

- `DATABASE_URL` – MySQL connection string in the format  
  `mysql+pymysql://user:password@localhost:3306/scaler_calendly`

### Optional (for real email notifications)

If you want booking/cancellation emails:

- `SMTP_HOST`, `SMTP_PORT`
- `SMTP_USERNAME`, `SMTP_PASSWORD` (e.g. Gmail app password)
- `EMAIL_FROM` – from address shown in emails
- `OWNER_EMAIL` – email to notify the “host” of new/cancelled meetings

If SMTP is not configured, the application still works; email sends become no‑ops.

## 8. Running Backend & Frontend Together

1. Ensure **MySQL is running** and the `scaler_calendly` DB exists.
2. Start FastAPI backend:

   ```bash
   venv\Scripts\activate
   uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
   ```

3. In a separate terminal, start React frontend:

   ```bash
   npm run dev
   ```

4. Visit `http://localhost:5173` in the browser and walk through:
   - Create / view event types
   - Configure availability
   - Share and use `/book/:slug`
   - Inspect meetings

This covers the full end‑to‑end flow expected for the Scaler assignment while keeping the code readable and modular for discussion during evaluation.

