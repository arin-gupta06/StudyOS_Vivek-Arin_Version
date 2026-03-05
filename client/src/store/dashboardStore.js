import { create } from "zustand";
import axios from "axios";

const API_URL = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/dashboard`;

/**
 * Shared dashboard store – used by Dashboard, RightPanel and Sidebar
 * so that every widget displays the same data from a single fetch.
 */
export const useDashboardStore = create((set, get) => ({
  // ── data ──────────────────────────────────────────────────────────────
  stats: {
    studyHours: 0,
    todayHours: 0,
    tasksDone: 0,
    currentStreak: 0,
    focusScore: 0,
  },
  subjects: [],
  pendingTasks: 0,
  totalTasks: 0,
  completedTasks: 0,
  upcomingEvents: [],
  weeklyActivity: [],
  recentSketches: [],
  todayFocusSeconds: 0,

  loading: true,
  lastFetched: 0, // timestamp of last successful fetch

  // ── actions ───────────────────────────────────────────────────────────

  /** Fetch dashboard data from the server and update the store. */
  fetch: async () => {
    try {
      const { data } = await axios.get(API_URL, { withCredentials: true });
      set({
        stats: {
          studyHours: data.stats?.studyHours || 0,
          todayHours: data.stats?.todayHours || 0,
          tasksDone: data.stats?.tasksDone || 0,
          currentStreak: data.stats?.currentStreak || 0,
          focusScore: data.stats?.focusScore || 0,
        },
        subjects: data.subjects || [],
        pendingTasks: data.pendingTasks || 0,
        totalTasks: data.totalTasks || 0,
        completedTasks: data.completedTasks || 0,
        upcomingEvents: data.upcomingEvents || [],
        weeklyActivity: data.weeklyActivity || [],
        recentSketches: data.recentSketches || [],
        todayFocusSeconds: data.todayFocusSeconds || 0,
        loading: false,
        lastFetched: Date.now(),
      });
    } catch (error) {
      console.error("Dashboard fetch error:", error);
      set({ loading: false });
    }
  },

  /**
   * Fetch only if more than `staleMs` milliseconds have passed since the
   * last fetch.  Default stale window = 5 seconds.  This prevents
   * duplicate network requests when multiple components mount at once.
   */
  fetchIfStale: async (staleMs = 5000) => {
    const { lastFetched, fetch: doFetch } = get();
    if (Date.now() - lastFetched > staleMs) {
      await doFetch();
    }
  },

  /** Reset store to initial state (call on logout / user switch). */
  reset: () =>
    set({
      stats: {
        studyHours: 0,
        todayHours: 0,
        tasksDone: 0,
        currentStreak: 0,
        focusScore: 0,
      },
      subjects: [],
      pendingTasks: 0,
      totalTasks: 0,
      completedTasks: 0,
      upcomingEvents: [],
      weeklyActivity: [],
      recentSketches: [],
      todayFocusSeconds: 0,
      loading: true,
      lastFetched: 0,
    }),
}));
