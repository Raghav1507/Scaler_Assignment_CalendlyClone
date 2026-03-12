import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { api } from "../lib/api";
import EventTypeCard from "../components/EventTypeCard";

const emptyForm = {
  name: "",
  duration_minutes: 30,
  slug: "",
  description: "",
  color_hex: "#4F46E5",
  timezone: "Asia/Kolkata"
};

export default function EventTypesPage() {
  const [eventTypes, setEventTypes] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = () =>
    api.get("/event-types/").then((res) => setEventTypes(res.data)).catch(() => {});

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/event-types/${id}`);
      load();
    } catch {
      // ignore for now; could surface toast
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: name === "duration_minutes" ? Number(value) : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.post("/event-types/", { ...form, custom_questions: [] });
      setForm(emptyForm);
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || "Could not create event type");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid h-full gap-6 lg:grid-cols-[minmax(0,1.6fr),minmax(0,1.1fr)]">
      <section className="flex flex-col gap-3 overflow-y-auto pr-1">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Event types</h2>
          <p className="text-xs text-slate-500">
            Reusable templates for calls, interviews, or deep‑dives. Each one gets a public URL.
          </p>
        </div>
        {eventTypes.length === 0 ? (
          <div className="mt-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
            Run the backend seed script to generate sample event types, or create your first one
            with the form on the right.
          </div>
        ) : (
          <div className="mt-1.5 flex max-w-xl flex-col gap-2.5">
            {eventTypes.map((e) => (
              <EventTypeCard key={e.id} eventType={e} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft-xl">
        <h3 className="text-sm font-semibold text-slate-900">Create a new event type</h3>
        <p className="mb-3 mt-1 text-xs text-slate-500">
          Keep slugs short and descriptive. They become part of your booking URL.
        </p>
        <form className="space-y-3 text-xs" onSubmit={handleSubmit}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] text-slate-500">Name</label>
              <input
                required
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none ring-primary-500/60 focus:ring"
                placeholder="30 min Interview"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-slate-500">Duration (min)</label>
              <input
                required
                type="number"
                min={5}
                step={5}
                name="duration_minutes"
                value={form.duration_minutes}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none ring-primary-500/60 focus:ring"
              />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1.6fr),minmax(0,0.8fr)]">
            <div>
              <label className="mb-1 block text-[11px] text-slate-500">Slug</label>
              <div className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-500">
                <span className="hidden sm:inline">/book/</span>
                <input
                  required
                  name="slug"
                  value={form.slug}
                  onChange={handleChange}
                  className="flex-1 bg-transparent text-slate-900 outline-none"
                  placeholder="intro-30"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-slate-500">Accent color</label>
              <div className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2">
                <input
                  type="color"
                  name="color_hex"
                  value={form.color_hex}
                  onChange={handleChange}
                  className="h-6 w-6 rounded-full border border-slate-300 bg-white"
                />
                <span className="text-[11px] text-slate-600">{form.color_hex}</span>
              </div>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-slate-500">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className="w-full resize-none rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none ring-primary-500/60 focus:ring"
              placeholder="Short description shown on your booking page."
            />
          </div>
          {error && <p className="text-[11px] text-rose-400">{error}</p>}
          <motion.button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-primary-500 to-accent-500 px-4 py-2 text-[11px] font-medium text-slate-50 shadow-soft-xl transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            whileTap={{ scale: 0.97 }}
          >
            {loading ? "Creating..." : "Create event type"}
          </motion.button>
        </form>
      </section>
    </div>
  );
}

