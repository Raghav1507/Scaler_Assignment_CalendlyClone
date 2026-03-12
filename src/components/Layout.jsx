import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import BackgroundScene from "./BackgroundScene";

const navItems = [
  { to: "/", label: "Scheduling" },
  { to: "/event-types", label: "Event Types" },
  { to: "/availability", label: "Availability" },
  { to: "/meetings", label: "Meetings" }
];

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <div className="relative min-h-screen overflow-hidden text-slate-900">
      {/* Outer 3D background - show on all pages */}
      <BackgroundScene />

      <div className="mx-auto flex h-screen max-w-6xl gap-6 px-4 py-4 lg:px-6">
        {/* Sidebar */}
        <aside className="hidden w-60 flex-shrink-0 flex-col rounded-3xl border border-slate-200 bg-gradient-to-b from-white via-slate-50 to-indigo-50 px-4 py-5 shadow-soft-xl lg:flex">
          <div className="mb-6 flex items-center gap-3">
            <motion.div
              className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary-500 to-accent-500 text-white shadow-soft-xl"
              initial={{ scale: 0.85, rotate: -6, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 18 }}
            >
              <span className="text-lg font-bold">S</span>
            </motion.div>
            <div>
              <p className="text-xs font-semibold tracking-wide text-primary-600">
                Scaler Scheduling
              </p>
              <p className="text-xs text-slate-500">Calendly‑style booking demo</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate("/event-types")}
            className="mb-5 inline-flex items-center justify-center rounded-full bg-primary-600 px-5 py-2.5 text-xs font-semibold text-white shadow-soft-xl hover:bg-primary-700"
          >
            + Create
          </button>

          <nav className="flex-1 space-y-2 pt-1 text-sm">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  [
                    "flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-gradient-to-r from-primary-50 via-indigo-50 to-sky-50 text-primary-700 shadow-soft-xl"
                      : "text-slate-600 hover:bg-slate-100"
                  ].join(" ")
                }
              >
                <span>{item.label}</span>
                <span
                  className={[
                    "h-1.5 w-1.5 rounded-full transition-colors",
                    // brighter dot when active
                    location.pathname === item.to ? "bg-primary-500" : "bg-slate-300"
                  ].join(" ")}
                />
              </NavLink>
            ))}
          </nav>

          <div className="mt-6 border-t border-slate-200 pt-4 text-xs text-slate-500">
            <p className="font-medium">Interview demo</p>
            <p>Local data for the Scaler round</p>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="mb-3 flex items-center justify-end">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 shadow-sm sm:inline-flex"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-600 text-[11px] font-semibold text-white">
                  RS
                </span>
                <span>Raghav · Demo profile</span>
              </button>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700 lg:hidden">
                RS
              </div>
            </div>
          </header>

          <main className="glass-panel relative flex-1 overflow-hidden rounded-3xl">
            <div className="pointer-events-none absolute inset-x-10 -top-24 h-40 bg-gradient-to-b from-primary-100 via-slate-50 to-transparent blur-3xl" />
            <div className="relative flex h-full flex-col p-4 sm:p-6 lg:p-7">
              {isHome && (
                <div className="mb-4">
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    Scheduling
                  </h1>
                  <p className="mt-1 text-sm font-semibold text-slate-700">
                    Event types configured for the Scaler interview demo.
                  </p>
                </div>
              )}
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

