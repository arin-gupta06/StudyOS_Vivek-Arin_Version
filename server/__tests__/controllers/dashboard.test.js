/**
 * Dashboard Controller Tests
 */

const mongoose = require("mongoose");
const { createMockRes } = require("../helpers");

jest.mock("../../models/UserStat");
jest.mock("../../models/Subject");
jest.mock("../../models/Task");
jest.mock("../../models/Event");
jest.mock("../../models/Sketch");
jest.mock("../../models/FocusSession");

const UserStat = require("../../models/UserStat");
const Subject = require("../../models/Subject");
const Task = require("../../models/Task");
const Event = require("../../models/Event");
const Sketch = require("../../models/Sketch");
const FocusSession = require("../../models/FocusSession");

const { getDashboardData } = require("../../controllers/dashboardController");

describe("Dashboard Controller", () => {
  let mockUserId;
  let req;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUserId = new mongoose.Types.ObjectId();
    req = { user: { _id: mockUserId } };

    // Default mocks — empty state
    UserStat.findOne.mockResolvedValue(null);
    FocusSession.find.mockResolvedValue([]);
    Task.find.mockResolvedValue([]);
    Subject.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([]),
      }),
    });
    Event.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([]),
      }),
    });
    Sketch.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue([]),
        }),
      }),
    });
  });

  test("should return dashboard with zero stats for new user", async () => {
    const res = createMockRes();
    await getDashboardData(req, res);

    const data = res.json.mock.calls[0][0];
    expect(data.stats.studyHours).toBe(0);
    expect(data.stats.todayHours).toBe(0);
    expect(data.stats.tasksDone).toBe(0);
    expect(data.stats.focusScore).toBe(0);
    expect(data.pendingTasks).toBe(0);
    expect(data.totalTasks).toBe(0);
    expect(data.completedTasks).toBe(0);
    expect(data.subjects).toEqual([]);
    expect(data.upcomingEvents).toEqual([]);
    expect(data.weeklyActivity).toHaveLength(7);
  });

  test("should compute studyHours from completed focus sessions", async () => {
    FocusSession.find.mockResolvedValue([
      { duration: 3600, startedAt: new Date(), status: "completed" },
      { duration: 1800, startedAt: new Date(), status: "completed" },
    ]);

    const res = createMockRes();
    await getDashboardData(req, res);

    const data = res.json.mock.calls[0][0];
    expect(data.stats.studyHours).toBe(1.5); // 5400s / 3600
  });

  test("should count completed and pending tasks correctly", async () => {
    Task.find.mockResolvedValue([
      { status: "completed" },
      { status: "completed" },
      { status: "todo" },
      { status: "inProgress" },
    ]);

    const res = createMockRes();
    await getDashboardData(req, res);

    const data = res.json.mock.calls[0][0];
    expect(data.stats.tasksDone).toBe(2);
    expect(data.pendingTasks).toBe(2);
    expect(data.totalTasks).toBe(4);
  });

  test("should compute streak of consecutive days", async () => {
    const today = new Date();
    today.setHours(10, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const dayBefore = new Date(today);
    dayBefore.setDate(dayBefore.getDate() - 2);

    FocusSession.find.mockResolvedValue([
      { duration: 600, startedAt: today, status: "completed" },
      { duration: 600, startedAt: yesterday, status: "completed" },
      { duration: 600, startedAt: dayBefore, status: "completed" },
    ]);

    const res = createMockRes();
    await getDashboardData(req, res);

    const data = res.json.mock.calls[0][0];
    expect(data.stats.currentStreak).toBe(3);
  });

  test("should allow today to have no session without breaking streak", async () => {
    // yesterday and day before have sessions but today doesn't
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(10, 0, 0, 0);
    const dayBefore = new Date();
    dayBefore.setDate(dayBefore.getDate() - 2);
    dayBefore.setHours(10, 0, 0, 0);

    FocusSession.find.mockResolvedValue([
      { duration: 600, startedAt: yesterday, status: "completed" },
      { duration: 600, startedAt: dayBefore, status: "completed" },
    ]);

    const res = createMockRes();
    await getDashboardData(req, res);

    const data = res.json.mock.calls[0][0];
    expect(data.stats.currentStreak).toBe(2);
  });

  test("should compute focusScore as total completed sessions count", async () => {
    FocusSession.find.mockResolvedValue([
      { duration: 100, startedAt: new Date(), status: "completed" },
      { duration: 200, startedAt: new Date(), status: "completed" },
      { duration: 300, startedAt: new Date(), status: "completed" },
    ]);

    const res = createMockRes();
    await getDashboardData(req, res);

    const data = res.json.mock.calls[0][0];
    expect(data.stats.focusScore).toBe(3);
  });

  test("should map subjects with chapter and pending tasks info", async () => {
    Subject.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([
          {
            _id: "s1",
            name: "Math",
            icon: "📐",
            progress: 75,
            chapters: ["ch1", "ch2"],
            completedChapters: 1,
            totalTasks: 10,
            completedTasks: 7,
          },
        ]),
      }),
    });

    const res = createMockRes();
    await getDashboardData(req, res);

    const data = res.json.mock.calls[0][0];
    expect(data.subjects[0]).toEqual({
      _id: "s1",
      name: "Math",
      icon: "📐",
      progress: 75,
      chapter: "Chapter 2",
      tasksPending: 3,
    });
  });

  test("should show 'No chapters' for subject without chapters", async () => {
    Subject.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([
          {
            _id: "s2",
            name: "Art",
            icon: "🎨",
            progress: 0,
            chapters: [],
            completedChapters: 0,
            totalTasks: 0,
            completedTasks: 0,
          },
        ]),
      }),
    });

    const res = createMockRes();
    await getDashboardData(req, res);

    const data = res.json.mock.calls[0][0];
    expect(data.subjects[0].chapter).toBe("No chapters");
  });

  test("should normalize weeklyActivity percentages against max", async () => {
    const today = new Date();
    today.setHours(10, 0, 0, 0);

    FocusSession.find.mockResolvedValue([
      { duration: 3600, startedAt: today, status: "completed" }, // 60 mins today
    ]);

    const res = createMockRes();
    await getDashboardData(req, res);

    const data = res.json.mock.calls[0][0];
    expect(data.weeklyActivity).toHaveLength(7);
    // Today should be 100%
    const todayEntry = data.weeklyActivity[data.weeklyActivity.length - 1];
    expect(todayEntry.minutes).toBe(60);
    expect(todayEntry.percent).toBe(100);
    // Other days 0%
    expect(data.weeklyActivity[0].percent).toBe(0);
  });

  test("should handle null duration in focus sessions gracefully", async () => {
    FocusSession.find.mockResolvedValue([
      { duration: null, startedAt: new Date(), status: "completed" },
      { duration: undefined, startedAt: new Date(), status: "completed" },
    ]);

    const res = createMockRes();
    await getDashboardData(req, res);

    const data = res.json.mock.calls[0][0];
    expect(data.stats.studyHours).toBe(0);
    expect(data.stats.focusScore).toBe(2);
  });

  test("should return 500 on unexpected error", async () => {
    UserStat.findOne.mockRejectedValue(new Error("DB down"));

    const res = createMockRes();
    await getDashboardData(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Server Error" })
    );
  });
});
