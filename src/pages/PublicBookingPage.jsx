import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import CalendarMonth from "../components/CalendarMonth";
import BackgroundScene from "../components/BackgroundScene";
import { api } from "../lib/api";

export default function PublicBookingPage() {
  const { slug } = useParams();
  const [eventType, setEventType] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [step, setStep] = useState("pick-date"); // pick-date | details | confirmed
  const [form, setForm] = useState({
    invitee_name: "",
    invitee_email: ""
  });
  const [confirmation, setConfirmation] = useState(null);
  const [error, setError] = useState("");

  const buildIcsAndDownload = () => {
    if (!confirmation || !eventType) return;

    const start = new Date(confirmation.start_time);
    const end = new Date(confirmation.end_time);

    const pad = (n) => String(n).padStart(2, "0");
    const toIcsDate = (d) =>
      `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(
        d.getUTCHours()
      )}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;

    const dtStart = toIcsDate(start);
    const dtEnd = toIcsDate(end);
    const uid = `scaler-${confirmation.id}@local`;

    const icsLines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Scaler Scheduling//EN",
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${toIcsDate(new Date())}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${eventType.name}`,
      `DESCRIPTION:Meeting booked via Scaler Scheduling for ${confirmation.invitee_name}`,
      "END:VEVENT",
      "END:VCALENDAR"
    ];

    const blob = new Blob([icsLines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${eventType.slug || "meeting"}-${confirmation.id}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    api
      .get("/event-types/")
      .then((res) => {
        const ev = res.data.find((e) => e.slug === slug);
        setEventType(ev || null);
      })
      .catch(() => {});
  }, [slug]);

  const loadSlots = async (dateObj) => {
    setLoadingSlots(true);
    setError("");
    try {
      const iso = dateObj.toISOString().slice(0, 10); // YYYY-MM-DD
      const res = await api.get(`/availability/event-types/${slug}/slots`, {
        params: { date: iso }
      });
      setSlots(res.data.slots);
    } catch (err) {
      setSlots([]);
      setError(err.response?.data?.detail || "Unable to load slots for this date");
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleSelectDate = (d) => {
    setSelectedDate(d);
    setSelectedSlot(null);
    setStep("pick-date");
    loadSlots(d);
  };

  const handleBook = async (e) => {
    e.preventDefault();
    if (!selectedSlot) return;
    setError("");
    try {
      const res = await api.post(`/meetings/public/${slug}`, {
        invitee_name: form.invitee_name,
        invitee_email: form.invitee_email,
        start_time: selectedSlot.start_time,
        timezone: eventType?.timezone || "Asia/Kolkata",
        answers: Object.fromEntries(
          (eventType?.custom_questions || []).map((q) => [q.id, form[`q_${q.id}`] || ""])
        )
      });
      setConfirmation(res.data);
      setStep("confirmed");
    } catch (err) {
      setError(err.response?.data?.detail || "Could not complete booking");
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden text-slate-900">
      <BackgroundScene />
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-4 lg:px-6">
        <main className="glass-panel relative flex-1 overflow-hidden rounded-3xl">
          <div className="pointer-events-none absolute inset-x-10 -top-24 h-40 bg-gradient-to-b from-primary-100 via-slate-50 to-transparent blur-3xl" />
          <div className="relative flex h-full flex-col gap-5 p-4 sm:p-6 lg:p-7">
        {/* Top task bar */}
        <div className="flex items-center justify-between rounded-full border border-slate-200 bg-gradient-to-r from-primary-50 via-indigo-50 to-sky-50 px-4 py-2 text-[11px] text-slate-600 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-[10px] font-semibold text-white">
              1
            </span>
            <span className="font-medium">Choose date &amp; time</span>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <span className="h-1 w-16 rounded-full bg-primary-500" />
            <span className="h-1 w-10 rounded-full bg-slate-200" />
            <span className="h-1 w-10 rounded-full bg-slate-200" />
          </div>
          {eventType && (
            <div className="hidden items-center gap-3 text-[10px] text-slate-500 sm:flex">
              <span className="font-medium text-slate-600">
                {eventType.duration_minutes} min
              </span>
              <span className="h-1 w-1 rounded-full bg-slate-300" />
              <span>{eventType.timezone}</span>
            </div>
          )}
        </div>

        {/* Main header row */}
        <header className="flex flex-col items-center justify-center text-center">
          <h2 className="text-xl font-bold text-slate-900">
            {eventType ? `Booking page : ${eventType.name}` : "Loading event…"}
          </h2>
          {eventType && (
            <p className="mt-1 text-base font-bold text-slate-700">
              {eventType.description || "Pick a date and time that works for you."}
            </p>
          )}
        </header>

        <div className="grid flex-1 gap-8 lg:grid-cols-[minmax(0,1.4fr),minmax(0,1.2fr)]">
          <section className="max-w-lg">
            <CalendarMonth selectedDate={selectedDate} onSelect={handleSelectDate} />
          </section>

          <section className="flex flex-col rounded-3xl border border-slate-200 bg-white px-6 py-5 text-xs shadow-soft-xl">
            {step === "confirmed" && confirmation ? (
              <div className="flex flex-1 flex-col items-start justify-center gap-3">
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[11px] text-emerald-700 ring-1 ring-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Booking confirmed
                </div>
                <h3 className="text-sm font-semibold text-slate-900">
                  You&apos;re scheduled, {confirmation.invitee_name}.
                </h3>
                <p className="text-[11px] text-slate-500">
                  We&apos;ve stored this in the system and sent notifications. You can also add it
                  to your local calendar.
                </p>
                <button
                  type="button"
                  onClick={buildIcsAndDownload}
                  className="mt-1 inline-flex items-center rounded-full border border-primary-500 px-3 py-1.5 text-[11px] font-medium text-primary-700 hover:bg-primary-50"
                >
                  Add to calendar (.ics)
                </button>
              </div>
            ) : (
              <>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-base font-semibold text-slate-900">
                    {selectedDate
                      ? selectedDate.toLocaleDateString(undefined, {
                          weekday: "long",
                          month: "short",
                          day: "numeric"
                        })
                      : "Pick a date to see times"}
                  </h3>
                </div>

                {selectedDate && (
                  <div
                    className={[
                      "mb-3 flex gap-6",
                      !(step === "details" && selectedSlot) ? "justify-center" : ""
                    ].join(" ")}
                  >
                    <div className="w-full max-w-[11rem] space-y-2 rounded-3xl border border-primary-100 bg-gradient-to-b from-sky-50 via-indigo-50 to-sky-100 px-3 py-3">
                      {loadingSlots ? (
                        <p className="text-[11px] text-slate-500">Loading available slots…</p>
                      ) : slots.length === 0 ? (
                        <p className="text-[11px] text-slate-500">
                          No slots left for this day. Try a different date.
                        </p>
                      ) : (
                        <div className="flex max-h-60 flex-col gap-1.5 overflow-y-auto pr-1">
                          {slots.map((slot) => {
                            const start = new Date(slot.start_time);
                            const isSelected =
                              selectedSlot && selectedSlot.start_time === slot.start_time;
                            return (
                              <motion.button
                                key={slot.start_time}
                                type="button"
                                onClick={() => {
                                  setSelectedSlot(slot);
                                  setStep("details");
                                }}
                                className={[
                                  "rounded-xl border px-3 py-1.5 text-[11px] transition",
                                  isSelected
                                    ? "border-primary-600 bg-primary-500 text-white"
                                    : "border-primary-100 bg-transparent text-slate-900 hover:border-primary-400 hover:bg-white/10 hover:text-primary-800"
                                ].join(" ")}
                                whileTap={{ scale: 0.96 }}
                              >
                                {start.toLocaleTimeString(undefined, {
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })}
                              </motion.button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {step === "details" && selectedSlot && (
                      <form onSubmit={handleBook} className="flex-1 space-y-3 max-w-sm">
                        <div>
                          <label className="mb-1 block text-[11px] text-slate-500">
                            Your name
                          </label>
                          <input
                            required
                            value={form.invitee_name}
                            onChange={(e) =>
                              setForm((f) => ({ ...f, invitee_name: e.target.value }))
                            }
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none ring-primary-500/60 focus:ring"
                            placeholder="Your full name"
                          />
                        </div>
                        {eventType?.custom_questions?.length ? (
                          <div className="space-y-2">
                            {eventType.custom_questions.map((q) => (
                              <div key={q.id}>
                                <label className="mb-1 block text-[11px] text-slate-500">
                                  {q.question}
                                  {q.required && <span className="text-rose-400"> *</span>}
                                </label>
                                <input
                                  required={q.required}
                                  value={form[`q_${q.id}`] || ""}
                                  onChange={(e) =>
                                    setForm((f) => ({ ...f, [`q_${q.id}`]: e.target.value }))
                                  }
                                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none ring-primary-500/60 focus:ring"
                                  placeholder="Your answer"
                                />
                              </div>
                            ))}
                          </div>
                        ) : null}
                        <div>
                          <label className="mb-1 block text-[11px] text-slate-500">
                            Email address
                          </label>
                          <input
                            required
                            type="email"
                            value={form.invitee_email}
                            onChange={(e) =>
                              setForm((f) => ({ ...f, invitee_email: e.target.value }))
                            }
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none ring-primary-500/60 focus:ring"
                            placeholder="you@example.com"
                          />
                        </div>
                        {error && <p className="text-[11px] text-rose-400">{error}</p>}
                        <motion.button
                          type="submit"
                          className="inline-flex items-center justify-center rounded-full bg-primary-600 px-4 py-2 text-[11px] font-medium text-white shadow-soft-xl transition hover:bg-primary-700"
                          whileTap={{ scale: 0.97 }}
                        >
                          Confirm booking
                        </motion.button>
                      </form>
                    )}
                  </div>
                )}

                {!selectedDate && (
                  <p className="text-[11px] text-slate-500">
                    Start by picking a date on the calendar. Available times will appear here.
                  </p>
                )}
              </>
            )}
          </section>
        </div>
          </div>
        </main>
      </div>
    </div>
  );
}