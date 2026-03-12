import { AnimatePresence, motion } from "framer-motion";
import { Route, Routes, useLocation } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import EventTypesPage from "./pages/EventTypesPage";
import AvailabilityPage from "./pages/AvailabilityPage";
import MeetingsPage from "./pages/MeetingsPage";
import PublicBookingPage from "./pages/PublicBookingPage";

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 }
};

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="h-full"
      >
        <Routes location={location}>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="/event-types" element={<EventTypesPage />} />
            <Route path="/availability" element={<AvailabilityPage />} />
            <Route path="/meetings" element={<MeetingsPage />} />
          </Route>
          <Route path="/book/:slug" element={<PublicBookingPage />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  return <AnimatedRoutes />;
}

