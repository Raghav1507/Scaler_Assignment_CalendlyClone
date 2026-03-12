import axios from "axios";

// In production, always call the deployed Railway backend directly.
// For local dev, you can temporarily change this back to localhost:8000.
const BASE_URL =
  import.meta.env.PROD
    ? "https://scalerassignmentcalendlyclone-production.up.railway.app"
    : "http://localhost:8000";

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json"
  }
});

