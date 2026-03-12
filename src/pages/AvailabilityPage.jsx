import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { api } from "../lib/api";

const defaultSchedule = {
  name: "Weekday working hours",
  timezone: "Asia/Kolkata",
  buffer_before_minutes: 10,
  buffer_after_minutes: 10,
  weekly_rules: [
    { day_of_week: 0, start_time: "10:00", end_time: "18:00" },
    { day_of_week: 1, start_time: "10:00", end_time: "18:00" },
    { day_of_week: 2, start_time: "10:00", end_time: "18:00" },
    { day_of_week: 3, start_time: "10:00", end_time: "18:00" },
    { day_of_week: 4, start_time: "10:00", end_time: "18:00" }
  ],
  date_overrides: []
};

const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function AvailabilityPage() {
  const [eventTypes, setEventTypes] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [schedules, setSchedules] = useState([]);
  const [form, setForm] = useState(defaultSchedule);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/event-types/").then((res) => {
      setEventTypes(res.data);
      if (res.data.length > 0) {
        setSelectedEventId(String(res.data[0].id));
        loadSchedules(res.data[0].id);
      }
    });
  }, []);

  const loadSchedules = (eventId) => {
    api
      .get(`/availability/event-types/${eventId}/schedules`)
      .then((res) => setSchedules(res.data))
      .catch(() => {});
  };

  const handleDeleteSchedule = async (scheduleId) => {
    try {
      if (!window.confirm("Delete this availability schedule?")) return;
      await api.delete(`/availability/schedules/${scheduleId}`);
      if (selectedEventId) {
        loadSchedules(selectedEventId);
      }
    } catch {
      // ignore for now
    }
  };

  const handleToggleDay = (idx) => {
    setForm((f) => {
      const exists = f.weekly_rules.find((r) => r.day_of_week === idx);
      if (exists) {
        return { ...f, weekly_rules: f.weekly_rules.filter((r) => r.day_of_week !== idx) };
      }
      return {
        ...f,
        weekly_rules: [
          ...f.weekly_rules,
          { day_of_week: idx, start_time: "10:00", end_time: "18:00" }
        ]
      };
    });
  };

  const handleRuleTimeChange = (idx, field, value) => {
    setForm((f) => ({
      ...f,
      weekly_rules: f.weekly_rules.map((r) =>
        r.day_of_week === idx ? { ...r, [field]: value } : r
      )
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedEventId) return;
    setSaving(true);
    try {
      await api.post(`/availability/event-types/${selectedEventId}/schedules`, form);
      loadSchedules(selectedEventId);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid h-full gap-5 lg:grid-cols-[minmax(0,1.5fr),minmax(0,1.1fr)]">
      <section className="space-y-3 max-w-2xl">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Availability schedules</h2>
          <p className="text-xs text-slate-500">
            Configure reusable hours for each event type. Date-specific overrides are supported at
            the API level; here we focus on weekly rules.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs shadow-soft-xl">
          <form onSubmit={handleSave} className="space-y-2.5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-[11px] text-slate-500">Event type</label>
                <select
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none ring-primary-500/60 focus:ring"
                  value={selectedEventId}
                  onChange={(e) => {
                    setSelectedEventId(e.target.value);
                    loadSchedules(e.target.value);
                  }}
                >
                  {eventTypes.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[11px] text-slate-500">Schedule name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none ring-primary-500/60 focus:ring"
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-[11px] text-slate-500">Timezone</label>
                <input
                  value={form.timezone}
                  onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none ring-primary-500/60 focus:ring"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] text-slate-500">Buffer before (min)</label>
                <input
                  type="number"
                  min={0}
                  value={form.buffer_before_minutes}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      buffer_before_minutes: Number(e.target.value || 0)
                    }))
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none ring-primary-500/60 focus:ring"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] text-slate-500">Buffer after (min)</label>
                <input
                  type="number"
                  min={0}
                  value={form.buffer_after_minutes}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      buffer_after_minutes: Number(e.target.value || 0)
                    }))
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none ring-primary-500/60 focus:ring"
                />
              </div>
            </div>

            <div className="pb-1">
              <label className="mb-1.5 block text-[11px] text-slate-500">
                Weekly hours (date-specific overrides can be added directly in DB or via API)
              </label>
              <div className="space-y-2">
                {dayNames.map((label, idx) => {
                  const rule = form.weekly_rules.find((r) => r.day_of_week === idx);
                  const active = Boolean(rule);
                  return (
                    <div
                      key={idx}
                      className={[
                        "flex items-center justify-between rounded-xl border px-3 py-1.5",
                        active
                          ? "border-primary-500/60 bg-primary-50"
                          : "border-slate-200 bg-slate-50"
                      ].join(" ")}
                    >
                      <button
                        type="button"
                        onClick={() => handleToggleDay(idx)}
                        className={[
                          "flex items-center gap-2 rounded-full px-2 py-1 text-[11px]",
                          active
                            ? "bg-primary-100 text-primary-700"
                            : "bg-slate-100 text-slate-500"
                        ].join(" ")}
                      >
                        <span
                          className={[
                            "flex h-4 w-7 items-center justify-center rounded-full border",
                            active
                              ? "border-primary-500 bg-primary-500/60 text-white"
                              : "border-slate-300 bg-white text-slate-400"
                          ].join(" ")}
                        >
                          {active ? "On" : "Off"}
                        </span>
                        <span>{label}</span>
                      </button>
                      {active && (
                        <div className="flex items-center gap-2 text-[11px] text-slate-700">
                          <input
                            type="time"
                            value={rule.start_time}
                            onChange={(e) =>
                              handleRuleTimeChange(idx, "start_time", e.target.value)
                            }
                            className="rounded-lg border border-slate-300 bg-white px-2 py-1 outline-none"
                          />
                          <span>–</span>
                          <input
                            type="time"
                            value={rule.end_time}
                            onChange={(e) =>
                              handleRuleTimeChange(idx, "end_time", e.target.value)
                            }
                            className="rounded-lg border border-slate-300 bg-white px-2 py-1 outline-none"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <motion.button
              type="submit"
              disabled={saving || !selectedEventId}
              className="inline-flex items-center justify-center rounded-full bg-primary-600 px-4 py-2 text-[11px] font-medium text-white shadow-soft-xl transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
              whileTap={{ scale: 0.97 }}
            >
              {saving ? "Saving..." : "Save schedule for event type"}
            </motion.button>
          </form>
        </div>
      </section>

      <section className="space-y-3 overflow-y-auto pl-1">
        <h3 className="text-sm font-semibold text-slate-900">Existing schedules</h3>
        {schedules.length === 0 ? (
          <p className="text-xs text-slate-400">
            No schedules for this event type yet. Create one on the left to enable booking.
          </p>
        ) : (
          <div className="space-y-3 text-xs">
            {schedules.map((s) => (
              <div
                key={s.id}
                className="rounded-2xl border border-slate-200 bg-white p-3"
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="text-[11px] font-semibold text-slate-900">
                    {s.name} · {s.timezone}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleDeleteSchedule(s.id)}
                    className="text-[10px] font-medium text-rose-500 hover:text-rose-600"
                  >
                    Delete
                  </button>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {s.weekly_rules.map((r) => (
                    <span
                      key={r.id}
                      className="rounded-full bg-slate-100 px-2 py-1 text-[11px] text-slate-700"
                    >
                      {dayNames[r.day_of_week]} {r.start_time.slice(0, 5)}–{r.end_time.slice(0, 5)}
                    </span>
                  ))}
                  {s.weekly_rules.length === 0 && (
                    <span className="text-[11px] text-slate-400">No active weekly rules.</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

