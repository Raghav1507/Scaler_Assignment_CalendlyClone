FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend ./backend

# Run the app
ENV PORT=8000
EXPOSE 8000
CMD uvicorn backend.main:app --host 0.0.0.0 --port $PORT
