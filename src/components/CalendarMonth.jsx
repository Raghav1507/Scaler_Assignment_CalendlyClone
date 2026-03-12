import { motion } from "framer-motion";

const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function buildCalendar(year, month) {
  const first = new Date(year, month, 1);
  const firstWeekday = (first.getDay() + 6) % 7; // make Monday=0
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstWeekday; i++) {
    cells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(new Date(year, month, d));
  }
  return cells;
}

export default function CalendarMonth({ selectedDate, onSelect, monthOffset = 0 }) {
  const base = selectedDate || new Date();
  const display = new Date(base.getFullYear(), base.getMonth() + monthOffset, 1);
  const cells = buildCalendar(display.getFullYear(), display.getMonth());

  const isSameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const today = new Date();

  return (
    <div className="w-full rounded-3xl bg-primary-50 px-6 py-4 shadow-soft-xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Select a date
          </p>
          <p className="text-base font-semibold text-slate-900">
            {display.toLocaleString("default", { month: "long" })} {display.getFullYear()}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2 text-center text-[11px] text-slate-700">
        {dayLabels.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-2 text-sm">
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const isPast = d < new Date(today.getFullYear(), today.getMonth(), today.getDate());
          const isSelected = selectedDate && isSameDay(d, selectedDate);
          const isToday = isSameDay(d, today);

          return (
            <motion.button
              key={d.toISOString()}
              type="button"
              disabled={isPast}
              onClick={() => onSelect?.(d)}
              className={[
                "relative flex h-10 items-center justify-center rounded-full border text-xs transition-all",
                isSelected
                  ? "border-primary-600 bg-primary-500 text-white"
                  : "border-slate-300 bg-white/90 text-slate-900 hover:border-primary-400 hover:text-primary-800",
                isPast ? "cursor-not-allowed opacity-30 hover:border-slate-200" : ""
              ].join(" ")}
              whileTap={{ scale: 0.9 }}
            >
              {isToday && !isSelected && (
                <span className="absolute -top-1 h-1 w-1 rounded-full bg-accent-500" />
              )}
              <span>{d.getDate()}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

