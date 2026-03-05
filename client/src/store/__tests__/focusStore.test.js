import { describe, test, expect, vi, beforeEach } from "vitest";
import axios from "axios";

vi.mock("axios");

const { useFocusStore } = await import("../focusStore");

describe("focusStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    // Reset store
    useFocusStore.setState({
      isActive: false,
      isPaused: false,
      sessionId: null,
      elapsed: 0,
      _interval: null,
    });
  });

  afterEach(() => {
    // Clear any running intervals
    const id = useFocusStore.getState()._interval;
    if (id) clearInterval(id);
    vi.useRealTimers();
  });

  test("initial state is inactive", () => {
    const state = useFocusStore.getState();
    expect(state.isActive).toBe(false);
    expect(state.isPaused).toBe(false);
    expect(state.elapsed).toBe(0);
    expect(state.sessionId).toBeNull();
  });

  test("hydrate sets state from active server session", async () => {
    axios.get.mockResolvedValue({
      data: {
        session: {
          _id: "session123",
          status: "active",
          elapsed: 120,
        },
      },
    });

    await useFocusStore.getState().hydrate();

    const state = useFocusStore.getState();
    expect(state.isActive).toBe(true);
    expect(state.isPaused).toBe(false);
    expect(state.sessionId).toBe("session123");
    expect(state.elapsed).toBe(120);
  });

  test("hydrate sets paused state from paused server session", async () => {
    axios.get.mockResolvedValue({
      data: {
        session: {
          _id: "session456",
          status: "paused",
          elapsed: 60,
        },
      },
    });

    await useFocusStore.getState().hydrate();

    const state = useFocusStore.getState();
    expect(state.isActive).toBe(true);
    expect(state.isPaused).toBe(true);
  });

  test("hydrate does nothing when no active session", async () => {
    axios.get.mockResolvedValue({ data: {} });

    await useFocusStore.getState().hydrate();

    expect(useFocusStore.getState().isActive).toBe(false);
  });

  test("start creates a new session", async () => {
    axios.post.mockResolvedValue({
      data: { session: { _id: "new-session" } },
    });

    await useFocusStore.getState().start();

    const state = useFocusStore.getState();
    expect(state.isActive).toBe(true);
    expect(state.isPaused).toBe(false);
    expect(state.sessionId).toBe("new-session");
    expect(state.elapsed).toBe(0);
  });

  test("pause stops ticking and sets isPaused", async () => {
    // Start first
    axios.post.mockResolvedValue({
      data: { session: { _id: "s1" } },
    });
    await useFocusStore.getState().start();

    // Pause
    axios.post.mockResolvedValue({});
    await useFocusStore.getState().pause();

    const state = useFocusStore.getState();
    expect(state.isPaused).toBe(true);
    expect(state._interval).toBeNull();
  });

  test("resume resumes ticking", async () => {
    axios.post.mockResolvedValue({
      data: { session: { _id: "s1", elapsed: 30 } },
    });
    useFocusStore.setState({ isActive: true, isPaused: true, sessionId: "s1" });

    await useFocusStore.getState().resume();

    const state = useFocusStore.getState();
    expect(state.isPaused).toBe(false);
    expect(state.elapsed).toBe(30);
  });

  test("stop resets all state", async () => {
    useFocusStore.setState({
      isActive: true,
      isPaused: false,
      sessionId: "s1",
      elapsed: 300,
    });
    axios.post.mockResolvedValue({});

    await useFocusStore.getState().stop();

    const state = useFocusStore.getState();
    expect(state.isActive).toBe(false);
    expect(state.isPaused).toBe(false);
    expect(state.sessionId).toBeNull();
    expect(state.elapsed).toBe(0);
  });

  test("toggle starts when inactive", async () => {
    axios.post.mockResolvedValue({
      data: { session: { _id: "t1" } },
    });

    await useFocusStore.getState().toggle();

    expect(useFocusStore.getState().isActive).toBe(true);
  });

  test("toggle pauses when active and not paused", async () => {
    useFocusStore.setState({ isActive: true, isPaused: false });
    axios.post.mockResolvedValue({});

    await useFocusStore.getState().toggle();

    expect(useFocusStore.getState().isPaused).toBe(true);
  });

  test("toggle resumes when active and paused", async () => {
    useFocusStore.setState({ isActive: true, isPaused: true, sessionId: "s1" });
    axios.post.mockResolvedValue({
      data: { session: { elapsed: 50 } },
    });

    await useFocusStore.getState().toggle();

    expect(useFocusStore.getState().isPaused).toBe(false);
  });

  test("elapsed increments every second when ticking", async () => {
    axios.post.mockResolvedValue({
      data: { session: { _id: "tick-test" } },
    });

    await useFocusStore.getState().start();
    expect(useFocusStore.getState().elapsed).toBe(0);

    vi.advanceTimersByTime(3000);
    expect(useFocusStore.getState().elapsed).toBe(3);
  });
});
