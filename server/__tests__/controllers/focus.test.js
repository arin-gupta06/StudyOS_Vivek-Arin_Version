/**
 * Focus Controller Tests
 *
 * Tests the focus session lifecycle:
 * - Starting sessions (auto-ending previous)
 * - Pause/resume with elapsed tracking
 * - Stop with UserStat updates
 * - Active session hydration
 * - Daily and weekly aggregation
 * - Edge cases (no active session, double pause, etc.)
 */

const { createMockRes } = require("../helpers");
const mongoose = require("mongoose");

jest.mock("../../models/FocusSession");
jest.mock("../../models/UserStat");

const FocusSession = require("../../models/FocusSession");
const UserStat = require("../../models/UserStat");

const {
  getActiveSession,
  startSession,
  pauseSession,
  resumeSession,
  stopSession,
  getTodayFocus,
  getWeeklyActivity,
} = require("../../controllers/focusController");

describe("Focus Controller", () => {
  let mockUserId;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUserId = new mongoose.Types.ObjectId();
  });

  // ═══════════════════════════════════════════════════════════════
  // GET ACTIVE SESSION
  // ═══════════════════════════════════════════════════════════════
  describe("getActiveSession", () => {
    test("should return null when no active session", async () => {
      FocusSession.findOne.mockReturnValue({
        sort: jest.fn().mockResolvedValue(null),
      });

      const req = { user: { _id: mockUserId } };
      const res = createMockRes();

      await getActiveSession(req, res);

      expect(res.json).toHaveBeenCalledWith({ session: null });
    });

    test("should return active session with elapsed time", async () => {
      const fiveMinAgo = new Date(Date.now() - 300000); // 5 minutes ago
      const session = {
        _id: "sess1",
        status: "active",
        startedAt: fiveMinAgo,
        pausedDuration: 0,
        lastPausedAt: null,
      };
      FocusSession.findOne.mockReturnValue({
        sort: jest.fn().mockResolvedValue(session),
      });

      const req = { user: { _id: mockUserId } };
      const res = createMockRes();

      await getActiveSession(req, res);

      const result = res.json.mock.calls[0][0];
      expect(result.session).toBeDefined();
      expect(result.session.status).toBe("active");
      expect(result.session.elapsed).toBeGreaterThanOrEqual(299); // ~5 minutes
      expect(result.session.elapsed).toBeLessThanOrEqual(302);
    });

    test("should return paused session with correct elapsed (excluding pause time)", async () => {
      const tenMinAgo = new Date(Date.now() - 600000);
      const twoMinAgo = new Date(Date.now() - 120000);
      const session = {
        _id: "sess2",
        status: "paused",
        startedAt: tenMinAgo,
        pausedDuration: 60, // 1 minute already paused before
        lastPausedAt: twoMinAgo, // paused 2 minutes ago
      };
      FocusSession.findOne.mockReturnValue({
        sort: jest.fn().mockResolvedValue(session),
      });

      const req = { user: { _id: mockUserId } };
      const res = createMockRes();

      await getActiveSession(req, res);

      const result = res.json.mock.calls[0][0];
      // Total: 600s - 60s (previous pause) - 120s (current pause) = ~420s
      expect(result.session.elapsed).toBeGreaterThanOrEqual(418);
      expect(result.session.elapsed).toBeLessThanOrEqual(422);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // START SESSION
  // ═══════════════════════════════════════════════════════════════
  describe("startSession", () => {
    test("should end previous sessions and start a new one", async () => {
      FocusSession.updateMany.mockResolvedValue({ modifiedCount: 1 });
      FocusSession.create.mockResolvedValue({
        _id: "newSess",
        status: "active",
        startedAt: new Date(),
      });

      const req = { user: { _id: mockUserId } };
      const res = createMockRes();

      await startSession(req, res);

      expect(FocusSession.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          user: mockUserId,
          status: { $in: ["active", "paused"] },
        }),
        expect.objectContaining({
          $set: expect.objectContaining({ status: "completed" }),
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          session: expect.objectContaining({ elapsed: 0 }),
        })
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // PAUSE SESSION
  // ═══════════════════════════════════════════════════════════════
  describe("pauseSession", () => {
    test("should pause an active session", async () => {
      const session = {
        _id: "sess1",
        status: "active",
        startedAt: new Date(Date.now() - 300000),
        pausedDuration: 0,
        save: jest.fn().mockResolvedValue(true),
      };
      FocusSession.findOne.mockResolvedValue(session);

      const req = { user: { _id: mockUserId } };
      const res = createMockRes();

      await pauseSession(req, res);

      expect(session.status).toBe("paused");
      expect(session.lastPausedAt).toBeInstanceOf(Date);
      expect(session.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          session: expect.objectContaining({ status: "paused" }),
        })
      );
    });

    test("should return 404 when no active session to pause", async () => {
      FocusSession.findOne.mockResolvedValue(null);

      const req = { user: { _id: mockUserId } };
      const res = createMockRes();

      await pauseSession(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "No active session" })
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // RESUME SESSION
  // ═══════════════════════════════════════════════════════════════
  describe("resumeSession", () => {
    test("should resume a paused session and track pause duration", async () => {
      const twoMinAgo = new Date(Date.now() - 120000);
      const session = {
        _id: "sess1",
        status: "paused",
        startedAt: new Date(Date.now() - 600000),
        pausedDuration: 30,
        lastPausedAt: twoMinAgo,
        save: jest.fn().mockResolvedValue(true),
      };
      FocusSession.findOne.mockResolvedValue(session);

      const req = { user: { _id: mockUserId } };
      const res = createMockRes();

      await resumeSession(req, res);

      expect(session.status).toBe("active");
      expect(session.lastPausedAt).toBeNull();
      // pausedDuration should be 30 + ~120 seconds
      expect(session.pausedDuration).toBeGreaterThanOrEqual(148);
      expect(session.pausedDuration).toBeLessThanOrEqual(152);
      expect(session.save).toHaveBeenCalled();
    });

    test("should return 404 when no paused session to resume", async () => {
      FocusSession.findOne.mockResolvedValue(null);

      const req = { user: { _id: mockUserId } };
      const res = createMockRes();

      await resumeSession(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // STOP SESSION
  // ═══════════════════════════════════════════════════════════════
  describe("stopSession", () => {
    test("should stop an active session and update user stats", async () => {
      const session = {
        _id: "sess1",
        status: "active",
        startedAt: new Date(Date.now() - 3600000), // 1 hour ago
        pausedDuration: 0,
        lastPausedAt: null,
        save: jest.fn().mockResolvedValue(true),
      };
      FocusSession.findOne.mockResolvedValue(session);
      UserStat.findOneAndUpdate.mockResolvedValue({});

      const req = { user: { _id: mockUserId } };
      const res = createMockRes();

      await stopSession(req, res);

      expect(session.status).toBe("completed");
      expect(session.endedAt).toBeInstanceOf(Date);
      expect(session.duration).toBeGreaterThanOrEqual(3598);
      expect(session.save).toHaveBeenCalled();
      expect(UserStat.findOneAndUpdate).toHaveBeenCalledWith(
        { user: mockUserId },
        expect.objectContaining({
          $inc: expect.objectContaining({ focusScore: 1 }),
        }),
        { upsert: true, new: true }
      );
    });

    test("should stop a paused session and add final pause gap", async () => {
      const twoMinAgo = new Date(Date.now() - 120000);
      const session = {
        _id: "sess1",
        status: "paused",
        startedAt: new Date(Date.now() - 600000), // 10 min ago
        pausedDuration: 60,
        lastPausedAt: twoMinAgo,
        save: jest.fn().mockResolvedValue(true),
      };
      FocusSession.findOne.mockResolvedValue(session);
      UserStat.findOneAndUpdate.mockResolvedValue({});

      const req = { user: { _id: mockUserId } };
      const res = createMockRes();

      await stopSession(req, res);

      // pausedDuration should include the final gap (60 + ~120)
      expect(session.pausedDuration).toBeGreaterThanOrEqual(178);
      expect(session.status).toBe("completed");
    });

    test("should return 404 when no session to stop", async () => {
      FocusSession.findOne.mockResolvedValue(null);

      const req = { user: { _id: mockUserId } };
      const res = createMockRes();

      await stopSession(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // GET TODAY FOCUS
  // ═══════════════════════════════════════════════════════════════
  describe("getTodayFocus", () => {
    test("should return today's total seconds and session count", async () => {
      FocusSession.find.mockResolvedValue([
        { duration: 1800 },
        { duration: 900 },
        { duration: 600 },
      ]);

      const req = { user: { _id: mockUserId } };
      const res = createMockRes();

      await getTodayFocus(req, res);

      expect(res.json).toHaveBeenCalledWith({
        todaySeconds: 3300,
        sessionCount: 3,
      });
    });

    test("should return zeros when no sessions today", async () => {
      FocusSession.find.mockResolvedValue([]);

      const req = { user: { _id: mockUserId } };
      const res = createMockRes();

      await getTodayFocus(req, res);

      expect(res.json).toHaveBeenCalledWith({
        todaySeconds: 0,
        sessionCount: 0,
      });
    });

    test("should handle sessions with null duration", async () => {
      FocusSession.find.mockResolvedValue([
        { duration: null },
        { duration: 600 },
        { duration: undefined },
      ]);

      const req = { user: { _id: mockUserId } };
      const res = createMockRes();

      await getTodayFocus(req, res);

      expect(res.json).toHaveBeenCalledWith({
        todaySeconds: 600,
        sessionCount: 3,
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // GET WEEKLY ACTIVITY
  // ═══════════════════════════════════════════════════════════════
  describe("getWeeklyActivity", () => {
    test("should return 7 days of data", async () => {
      FocusSession.find.mockResolvedValue([]); // no sessions

      const req = { user: { _id: mockUserId } };
      const res = createMockRes();

      await getWeeklyActivity(req, res);

      const result = res.json.mock.calls[0][0];
      expect(result).toHaveLength(7);
      result.forEach((day) => {
        expect(day).toHaveProperty("date");
        expect(day).toHaveProperty("day");
        expect(day).toHaveProperty("minutes");
        expect(day).toHaveProperty("percent");
      });
    });

    test("should normalize percentages with max = 100", async () => {
      // Return sessions only for the mock calls (7 calls to find)
      FocusSession.find
        .mockResolvedValueOnce([{ duration: 3600 }]) // 60 min
        .mockResolvedValueOnce([{ duration: 1800 }]) // 30 min
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const req = { user: { _id: mockUserId } };
      const res = createMockRes();

      await getWeeklyActivity(req, res);

      const result = res.json.mock.calls[0][0];
      const maxPercent = Math.max(...result.map((d) => d.percent));
      expect(maxPercent).toBe(100);
    });
  });
});
