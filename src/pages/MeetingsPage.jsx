import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { api } from "../lib/api";

function MeetingRow({ meeting, onCancel }) {
  const start = new Date(meeting.start_time);
  const end = new Date(meeting.end_time);
  const cancelled = meeting.status === "cancelled";

  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-900 shadow-soft-xl">
      <div>
        <p className="font-medium">
          {meeting.invitee_name}{" "}
          {cancelled && <span className="text-[10px] text-rose-400">(cancelled)</span>}
        </p>
        <p className="text-slate-500">{meeting.invitee_email}</p>
        {meeting.cancellation_reason && (
          <p className="mt-1 text-[11px] text-slate-500">Reason: {meeting.cancellation_reason}</p>
        )}
      </div>
        <div className="flex items-center gap-4 text-right text-[11px] text-slate-500">
        <div>
          <p>
            {start.toLocaleDateString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric"
            })}
          </p>
          <p>
            {start.toLocaleTimeString(undefined, {
              hour: "2-digit",
              minute: "2-digit"
            })}{" "}
            –{" "}
            {end.toLocaleTimeString(undefined, {
              hour: "2-digit",
              minute: "2-digit"
            })}
          </p>
        </div>
        {!cancelled && (
          <motion.button
            type="button"
            onClick={() => onCancel(meeting)}
            className="rounded-full border border-rose-400 px-3 py-1 text-[11px] font-medium text-rose-600 hover:bg-rose-50"
            whileTap={{ scale: 0.95 }}
          >
            Cancel
          </motion.button>
        )}
      </div>
    </div>
  );
}

export default function MeetingsPage() {
  const [scope, setScope] = useState("upcoming");
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async (s = scope) => {
    setLoading(true);
    try {
      const res = await api.get("/meetings", { params: { scope: s } });
      setMeetings(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load("upcoming");
  }, []);

  const handleScopeChange = (s) => {
    setScope(s);
    load(s);
  };

  const handleCancel = async (meeting) => {
    const reason = window.prompt("Optional: reason for cancelling this meeting?", "");
    await api.post(`/meetings/${meeting.id}/cancel`, { reason });
    load(scope);
  };

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Meetings</h2>
          <p className="text-sm font-semibold text-slate-700">
            View upcoming and past bookings, and cancel existing ones.
          </p>
        </div>
        <div className="inline-flex items-center gap-1 rounded-full bg-slate-100 p-1 text-[11px] text-slate-600 ring-1 ring-slate-200">
          {["upcoming", "past"].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => handleScopeChange(s)}
              className={[
                "rounded-full px-3 py-1 capitalize transition",
                scope === s
                  ? "bg-primary-600 text-white"
                  : "text-slate-500 hover:bg-slate-200"
              ].join(" ")}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto pr-1">
        {loading ? (
          <p className="text-xs text-slate-400">Loading meetings…</p>
        ) : meetings.length === 0 ? (
        <p className="text-sm text-slate-500">
            No meetings in this view yet. Once someone books via your public page, they will show
            up here.
          </p>
        ) : (
          meetings.map((m) => <MeetingRow key={m.id} meeting={m} onCancel={handleCancel} />)
        )}
      </div>
    </div>
  );
}

