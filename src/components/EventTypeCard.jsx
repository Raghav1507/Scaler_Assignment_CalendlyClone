import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function EventTypeCard({ eventType, onDelete }) {
  const color = eventType.color_hex || "#4F46E5";

  return (
    <motion.div
      className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white px-4 py-2.5 transition-colors hover:border-primary-200"
      whileHover={{ translateY: -3 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-24 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(circle at center, ${color}1a, transparent 70%)`
        }}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: color }}
            />
            <p className="text-[11px] uppercase tracking-wide text-slate-500">Event type</p>
          </div>
          <h3 className="text-sm font-semibold text-slate-900">{eventType.name}</h3>
          {eventType.description && (
            <p className="mt-0.5 line-clamp-2 text-[11px] text-slate-500">
              {eventType.description}
            </p>
          )}
          <p className="mt-1 text-[11px] text-slate-500">
            {eventType.duration_minutes} min · Timezone {eventType.timezone}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 text-right text-[11px]">
          <code className="rounded-full bg-slate-50 px-3 py-1 text-[10px] text-slate-500 ring-1 ring-slate-200">
            /book/{eventType.slug}
          </code>
          <Link
            to={`/book/${eventType.slug}`}
            className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-primary-600 px-3 py-1.5 text-[11px] font-medium text-white transition hover:bg-primary-700"
          >
            Preview booking
          </Link>
          {onDelete && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`Delete event type "${eventType.name}"?`)) {
                  onDelete(eventType.id);
                }
              }}
              className="mt-1 text-[10px] font-medium text-rose-500 hover:text-rose-600"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

