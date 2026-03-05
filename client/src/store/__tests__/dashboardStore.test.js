import { describe, test, expect, vi, beforeEach } from "vitest";
import axios from "axios";

vi.mock("axios");

// Must import after mocking axios
const { useDashboardStore } = await import("../dashboardStore");

describe("dashboardStore", () => {
  beforeEach(() => {
    useDashboardStore.getState().reset();
    vi.clearAllMocks();
  });

  test("initial state has loading=true and zero stats", () => {
    const state = useDashboardStore.getState();
    expect(state.loading).toBe(true);
    expect(state.stats.studyHours).toBe(0);
    expect(state.lastFetched).toBe(0);
    expect(state.subjects).toEqual([]);
  });

  test("fetch populates store with server data", async () => {
    const mockData = {
      stats: {
        studyHours: 5.2,
        todayHours: 1.1,
        tasksDone: 3,
        currentStreak: 7,
        focusScore: 12,
      },
      subjects: [{ name: "Math" }],
      pendingTasks: 4,
      totalTasks: 7,
      completedTasks: 3,
      upcomingEvents: [{ title: "Exam" }],
      weeklyActivity: [{ day: "Mon", minutes: 30, percent: 100 }],
      recentSketches: [],
      todayFocusSeconds: 3960,
    };

    axios.get.mockResolvedValue({ data: mockData });

    await useDashboardStore.getState().fetch();

    const state = useDashboardStore.getState();
    expect(state.loading).toBe(false);
    expect(state.stats.studyHours).toBe(5.2);
    expect(state.stats.currentStreak).toBe(7);
    expect(state.subjects).toHaveLength(1);
    expect(state.pendingTasks).toBe(4);
    expect(state.todayFocusSeconds).toBe(3960);
    expect(state.lastFetched).toBeGreaterThan(0);
  });

  test("fetch handles error gracefully", async () => {
    axios.get.mockRejectedValue(new Error("Network error"));

    await useDashboardStore.getState().fetch();

    const state = useDashboardStore.getState();
    expect(state.loading).toBe(false);
  });

  test("fetchIfStale skips fetch if data is fresh", async () => {
    axios.get.mockResolvedValue({
      data: {
        stats: {},
        subjects: [],
        pendingTasks: 0,
        totalTasks: 0,
        completedTasks: 0,
        upcomingEvents: [],
        weeklyActivity: [],
        recentSketches: [],
        todayFocusSeconds: 0,
      },
    });

    // First fetch
    await useDashboardStore.getState().fetch();
    const callCount = axios.get.mock.calls.length;

    // Should not fetch again (within 5s)
    await useDashboardStore.getState().fetchIfStale();
    expect(axios.get.mock.calls.length).toBe(callCount);
  });

  test("fetchIfStale fetches if data is stale", async () => {
    axios.get.mockResolvedValue({
      data: {
        stats: {},
        subjects: [],
        pendingTasks: 0,
        totalTasks: 0,
        completedTasks: 0,
        upcomingEvents: [],
        weeklyActivity: [],
        recentSketches: [],
        todayFocusSeconds: 0,
      },
    });

    // Set lastFetched to long ago
    useDashboardStore.setState({ lastFetched: Date.now() - 10000 });

    await useDashboardStore.getState().fetchIfStale(5000);
    expect(axios.get).toHaveBeenCalled();
  });

  test("reset restores initial state", async () => {
    useDashboardStore.setState({
      stats: { studyHours: 10 },
      loading: false,
      lastFetched: Date.now(),
    });

    useDashboardStore.getState().reset();

    const state = useDashboardStore.getState();
    expect(state.loading).toBe(true);
    expect(state.lastFetched).toBe(0);
    expect(state.stats.studyHours).toBe(0);
  });

  test("fetch handles missing optional fields with defaults", async () => {
    axios.get.mockResolvedValue({ data: {} });

    await useDashboardStore.getState().fetch();

    const state = useDashboardStore.getState();
    expect(state.stats.studyHours).toBe(0);
    expect(state.subjects).toEqual([]);
    expect(state.todayFocusSeconds).toBe(0);
  });
});
