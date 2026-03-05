import { describe, test, expect, vi, beforeEach } from "vitest";
import axios from "axios";

vi.mock("axios");

const { useNudgeStore } = await import("../nudgeStore");

describe("nudgeStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useNudgeStore.setState({
      nudges: [],
      dismissedIds: [],
      lastFetchedAt: null,
      isOpen: false,
      loading: false,
    });
  });

  test("initial state", () => {
    const state = useNudgeStore.getState();
    expect(state.nudges).toEqual([]);
    expect(state.dismissedIds).toEqual([]);
    expect(state.isOpen).toBe(false);
    expect(state.loading).toBe(false);
  });

  test("setOpen and toggleOpen", () => {
    useNudgeStore.getState().setOpen(true);
    expect(useNudgeStore.getState().isOpen).toBe(true);

    useNudgeStore.getState().toggleOpen();
    expect(useNudgeStore.getState().isOpen).toBe(false);
  });

  test("dismiss adds nudge id to dismissed list", () => {
    useNudgeStore.getState().dismiss("task_overdue");
    expect(useNudgeStore.getState().dismissedIds).toContain("task_overdue");
  });

  test("dismiss deduplicates ids", () => {
    useNudgeStore.getState().dismiss("task_overdue");
    useNudgeStore.getState().dismiss("task_overdue");
    const ids = useNudgeStore.getState().dismissedIds;
    expect(ids.filter((id) => id === "task_overdue")).toHaveLength(1);
  });

  test("clearDismissed resets dismissed list", () => {
    useNudgeStore.setState({ dismissedIds: ["a", "b", "c"] });
    useNudgeStore.getState().clearDismissed();
    expect(useNudgeStore.getState().dismissedIds).toEqual([]);
  });

  test("getVisibleNudges filters out dismissed nudges", () => {
    useNudgeStore.setState({
      nudges: [
        { id: "task_overdue", type: "task_overdue" },
        { id: "no_focus_today", type: "no_focus_today" },
      ],
      dismissedIds: ["task_overdue"],
    });

    const visible = useNudgeStore.getState().getVisibleNudges();
    expect(visible).toHaveLength(1);
    expect(visible[0].id).toBe("no_focus_today");
  });

  test("getCount returns count of non-dismissed nudges", () => {
    useNudgeStore.setState({
      nudges: [{ id: "a" }, { id: "b" }, { id: "c" }],
      dismissedIds: ["a"],
    });
    expect(useNudgeStore.getState().getCount()).toBe(2);
  });

  test("refresh fetches data and generates nudges", async () => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);

    axios.get.mockImplementation((url) => {
      if (url.includes("dashboard")) {
        return Promise.resolve({
          data: {
            stats: { todayHours: 0, currentStreak: 0 },
            todayFocusSeconds: 0,
          },
        });
      }
      if (url.includes("tasks")) {
        return Promise.resolve({
          data: { todo: [], inProgress: [], completed: [] },
        });
      }
      if (url.includes("events")) {
        return Promise.resolve({ data: [] });
      }
    });

    await useNudgeStore.getState().refresh();

    const state = useNudgeStore.getState();
    expect(state.loading).toBe(false);
    expect(state.lastFetchedAt).not.toBeNull();
    // Should have at least "no_focus_today" nudge
    expect(state.nudges.some((n) => n.type === "no_focus_today")).toBe(true);
  });

  test("refresh generates overdue task nudges", async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 2);

    axios.get.mockImplementation((url) => {
      if (url.includes("dashboard")) {
        return Promise.resolve({
          data: {
            stats: { todayHours: 0, currentStreak: 0 },
            todayFocusSeconds: 0,
          },
        });
      }
      if (url.includes("tasks")) {
        return Promise.resolve({
          data: {
            todo: [{ title: "Overdue Task", dueDate: yesterday.toISOString() }],
            inProgress: [],
            completed: [],
          },
        });
      }
      if (url.includes("events")) {
        return Promise.resolve({ data: [] });
      }
    });

    await useNudgeStore.getState().refresh();

    expect(
      useNudgeStore.getState().nudges.some((n) => n.type === "task_overdue")
    ).toBe(true);
  });

  test("refresh generates streak_at_risk nudge", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("dashboard")) {
        return Promise.resolve({
          data: {
            stats: { todayHours: 0, currentStreak: 5 },
            todayFocusSeconds: 0,
          },
        });
      }
      if (url.includes("tasks")) {
        return Promise.resolve({
          data: { todo: [], inProgress: [], completed: [] },
        });
      }
      if (url.includes("events")) {
        return Promise.resolve({ data: [] });
      }
    });

    await useNudgeStore.getState().refresh();

    expect(
      useNudgeStore.getState().nudges.some((n) => n.type === "streak_at_risk")
    ).toBe(true);
  });

  test("refresh generates all_tasks_done nudge", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("dashboard")) {
        return Promise.resolve({
          data: {
            stats: { todayHours: 0, currentStreak: 0 },
            todayFocusSeconds: 0,
          },
        });
      }
      if (url.includes("tasks")) {
        return Promise.resolve({
          data: { todo: [], inProgress: [], completed: [{ title: "Done!" }] },
        });
      }
      if (url.includes("events")) {
        return Promise.resolve({ data: [] });
      }
    });

    await useNudgeStore.getState().refresh();

    expect(
      useNudgeStore.getState().nudges.some((n) => n.type === "all_tasks_done")
    ).toBe(true);
  });

  test("refresh generates pending_tasks_high nudge when > 5 pending", async () => {
    const tasks = Array.from({ length: 6 }, (_, i) => ({ title: `Task ${i}` }));

    axios.get.mockImplementation((url) => {
      if (url.includes("dashboard")) {
        return Promise.resolve({
          data: {
            stats: { todayHours: 0, currentStreak: 0 },
            todayFocusSeconds: 0,
          },
        });
      }
      if (url.includes("tasks")) {
        return Promise.resolve({
          data: { todo: tasks, inProgress: [], completed: [] },
        });
      }
      if (url.includes("events")) {
        return Promise.resolve({ data: [] });
      }
    });

    await useNudgeStore.getState().refresh();

    expect(
      useNudgeStore.getState().nudges.some((n) => n.type === "pending_tasks_high")
    ).toBe(true);
  });

  test("nudges are sorted by priority (highest first)", async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 2);

    axios.get.mockImplementation((url) => {
      if (url.includes("dashboard")) {
        return Promise.resolve({
          data: {
            stats: { todayHours: 0, currentStreak: 3 },
            todayFocusSeconds: 0,
          },
        });
      }
      if (url.includes("tasks")) {
        return Promise.resolve({
          data: {
            todo: [{ title: "Overdue", dueDate: yesterday.toISOString() }],
            inProgress: [],
            completed: [],
          },
        });
      }
      if (url.includes("events")) {
        return Promise.resolve({ data: [] });
      }
    });

    await useNudgeStore.getState().refresh();

    const nudges = useNudgeStore.getState().nudges;
    for (let i = 0; i < nudges.length - 1; i++) {
      expect(nudges[i].priority).toBeGreaterThanOrEqual(nudges[i + 1].priority);
    }
  });

  test("refresh handles API error gracefully", async () => {
    axios.get.mockRejectedValue(new Error("Network error"));

    await useNudgeStore.getState().refresh();

    expect(useNudgeStore.getState().loading).toBe(false);
  });
});
