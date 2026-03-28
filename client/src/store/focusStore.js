import { create } from "zustand";
import axios from "axios";

const API = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/focus`;
const cfg = {};

export const useFocusStore = create((set, get) => ({
  // state
  isActive: false,
  isPaused: false,
  sessionId: null,
  elapsed: 0, // seconds
  _interval: null,

  // ---------- helpers ----------
  _startTicking: () => {
    const existing = get()._interval;
    if (existing) clearInterval(existing);
    const id = setInterval(() => {
      set((s) => ({ elapsed: s.elapsed + 1 }));
    }, 1000);
    set({ _interval: id });
  },

  _stopTicking: () => {
    const id = get()._interval;
    if (id) clearInterval(id);
    set({ _interval: null });
  },

  // ---------- actions ----------

  /** Hydrate from server on app mount */
  hydrate: async () => {
    try {
      const { data } = await axios.get(`${API}/active`, cfg);
      if (data.session) {
        set({
          isActive: true,
          isPaused: data.session.status === "paused",
          sessionId: data.session._id,
          elapsed: data.session.elapsed || 0,
        });
        if (data.session.status === "active") {
          get()._startTicking();
        }
      }
    } catch (err) {
      console.error("Focus hydrate error:", err);
    }
  },

  /** Start a new focus session */
  start: async () => {
    try {
      const { data } = await axios.post(`${API}/start`, {}, cfg);
      set({
        isActive: true,
        isPaused: false,
        sessionId: data.session._id,
        elapsed: 0,
      });
      get()._startTicking();
    } catch (err) {
      console.error("Focus start error:", err);
    }
  },

  /** Pause active session */
  pause: async () => {
    try {
      await axios.post(`${API}/pause`, {}, cfg);
      get()._stopTicking();
      set({ isPaused: true });
    } catch (err) {
      console.error("Focus pause error:", err);
    }
  },

  /** Resume paused session */
  resume: async () => {
    try {
      const { data } = await axios.post(`${API}/resume`, {}, cfg);
      set({
        isPaused: false,
        elapsed: data.session.elapsed || get().elapsed,
      });
      get()._startTicking();
    } catch (err) {
      console.error("Focus resume error:", err);
    }
  },

  /** Stop session entirely */
  stop: async () => {
    try {
      await axios.post(`${API}/stop`, {}, cfg);
      get()._stopTicking();
      set({
        isActive: false,
        isPaused: false,
        sessionId: null,
        elapsed: 0,
      });
    } catch (err) {
      console.error("Focus stop error:", err);
    }
  },

  /** Toggle: start → pause → resume cycle */
  toggle: async () => {
    const { isActive, isPaused } = get();
    if (!isActive) return get().start();
    if (isPaused) return get().resume();
    return get().pause();
  },

  /** Format elapsed for display */
  get formatted() {
    const t = get().elapsed;
    const h = Math.floor(t / 3600);
    const m = Math.floor((t % 3600) / 60);
    const s = t % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  },
}));
