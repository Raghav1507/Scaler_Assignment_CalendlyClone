import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import EventTypeCard from "../components/EventTypeCard";

export default function Dashboard() {
  const [eventTypes, setEventTypes] = useState([]);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    api.get("/event-types").then((res) => setEventTypes(res.data)).catch(() => {});
  }, []);

  return (
    <div
      className="relative flex h-full flex-col gap-4 overflow-hidden"
      onMouseMove={(e) =>
        setCursorPos({
          x: e.clientX,
          y: e.clientY
        })
      }
    >
      {/* Colorful cursor glow in background */}
      <motion.div
        className="pointer-events-none absolute -z-10 h-64 w-64 rounded-full bg-gradient-to-tr from-primary-400/55 via-accent-400/50 to-purple-400/50 blur-3xl"
        animate={{ x: cursorPos.x - 220, y: cursorPos.y - 220 }}
        transition={{ type: "spring", stiffness: 80, damping: 20, mass: 0.4 }}
      />

      <div className="relative flex h-full flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-500 shadow-sm">
            <span className="text-slate-400">Search event types</span>
          </div>
        </div>
        <Link
          to="/event-types"
          className="hidden rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 sm:inline-flex"
        >
          Manage event types
        </Link>
        </div>

        <div className="mb-1 flex items-center gap-4 border-b border-slate-200 pb-2 text-xs font-medium text-slate-500">
          <button className="border-b-2 border-primary-600 pb-1 text-primary-700">
            Event types
          </button>
          <button className="pb-1 text-slate-400" disabled>
            Single‑use links
          </button>
          <button className="pb-1 text-slate-400" disabled>
            Meeting polls
          </button>
        </div>

        <section className="flex-1 space-y-3 overflow-y-auto pr-1">
          {eventTypes.length === 0 ? (
            <div className="flex flex-col items-start justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
              <p className="font-medium text-slate-700">No event types yet</p>
              <p className="mt-1 text-xs">
                Use the Event Types screen to create your first 30‑minute or 60‑minute meeting
                type.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {eventTypes.map((e) => (
                <EventTypeCard key={e.id} eventType={e} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

