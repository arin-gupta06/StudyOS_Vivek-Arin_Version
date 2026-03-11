const FocusSession = require("../models/FocusSession");
const UserStat = require("../models/UserStat");

// GET /api/focus/active  — get active session if any
exports.getActiveSession = async (req, res) => {
  try {
    const session = await FocusSession.findOne({
      user: req.user._id,
      status: { $in: ["active", "paused"] },
    }).sort({ startedAt: -1 });

    if (!session) return res.json({ session: null });

    // calculate elapsed seconds for active sessions
    let elapsed = 0;
    if (session.status === "active") {
      elapsed =
        Math.floor((Date.now() - session.startedAt.getTime()) / 1000) -
        session.pausedDuration;
    } else if (session.status === "paused") {
      // When paused, elapsed = total time since start - all paused duration (including current pause)
      const currentPauseDuration = session.lastPausedAt
        ? Math.floor((Date.now() - session.lastPausedAt.getTime()) / 1000)
        : 0;
      elapsed =
        Math.floor((Date.now() - session.startedAt.getTime()) / 1000) -
        session.pausedDuration -
        currentPauseDuration;
    }

    res.json({
      session: {
        _id: session._id,
        status: session.status,
        startedAt: session.startedAt,
        elapsed: Math.max(0, elapsed),
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
};

// POST /api/focus/start  — start a new focus session
exports.startSession = async (req, res) => {
  try {
    // end any existing active sessions first
    await FocusSession.updateMany(
      { user: req.user._id, status: { $in: ["active", "paused"] } },
      {
        $set: {
          status: "completed",
          endedAt: new Date(),
        },
      },
    );

    const session = await FocusSession.create({
      user: req.user._id,
      startedAt: new Date(),
      status: "active",
    });

    res.status(201).json({
      session: {
        _id: session._id,
        status: session.status,
        startedAt: session.startedAt,
        elapsed: 0,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
};

// POST /api/focus/pause  — pause the active session
exports.pauseSession = async (req, res) => {
  try {
    const session = await FocusSession.findOne({
      user: req.user._id,
      status: "active",
    });
    if (!session) return res.status(404).json({ message: "No active session" });

    session.status = "paused";
    session.lastPausedAt = new Date();
    await session.save();

    const elapsed =
      Math.floor((Date.now() - session.startedAt.getTime()) / 1000) -
      session.pausedDuration;

    res.json({
      session: {
        _id: session._id,
        status: "paused",
        startedAt: session.startedAt,
        elapsed: Math.max(0, elapsed),
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
};

// POST /api/focus/resume  — resume a paused session
exports.resumeSession = async (req, res) => {
  try {
    const session = await FocusSession.findOne({
      user: req.user._id,
      status: "paused",
    });
    if (!session) return res.status(404).json({ message: "No paused session" });

    // add pause duration
    if (session.lastPausedAt) {
      const pauseLength = Math.floor(
        (Date.now() - session.lastPausedAt.getTime()) / 1000,
      );
      session.pausedDuration += pauseLength;
    }
    session.status = "active";
    session.lastPausedAt = null;
    await session.save();

    const elapsed =
      Math.floor((Date.now() - session.startedAt.getTime()) / 1000) -
      session.pausedDuration;

    res.json({
      session: {
        _id: session._id,
        status: "active",
        startedAt: session.startedAt,
        elapsed: Math.max(0, elapsed),
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
};

// POST /api/focus/stop  — stop session & save stats
exports.stopSession = async (req, res) => {
  try {
    const session = await FocusSession.findOne({
      user: req.user._id,
      status: { $in: ["active", "paused"] },
    });
    if (!session) return res.status(404).json({ message: "No active session" });

    // if it was paused, add the final pause gap
    if (session.status === "paused" && session.lastPausedAt) {
      session.pausedDuration += Math.floor(
        (Date.now() - session.lastPausedAt.getTime()) / 1000,
      );
    }

    const totalElapsed =
      Math.floor((Date.now() - session.startedAt.getTime()) / 1000) -
      session.pausedDuration;

    session.status = "completed";
    session.endedAt = new Date();
    session.duration = Math.max(0, totalElapsed);
    await session.save();

    // update user stats
    const hours = session.duration / 3600;
    await UserStat.findOneAndUpdate(
      { user: req.user._id },
      {
        $inc: { studyHours: parseFloat(hours.toFixed(2)), focusScore: 1 },
        $set: { lastActive: new Date() },
      },
      { upsert: true, new: true },
    );

    res.json({
      message: "Session ended",
      duration: session.duration,
    });
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
};

// GET /api/focus/today  — get today's total focus time
exports.getTodayFocus = async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const sessions = await FocusSession.find({
      user: req.user._id,
      startedAt: { $gte: startOfDay },
      status: "completed",
    });

    const totalSeconds = sessions.reduce(
      (sum, s) => sum + (s.duration || 0),
      0,
    );

    res.json({ todaySeconds: totalSeconds, sessionCount: sessions.length });
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
};

// GET /api/focus/weekly  — weekly activity data (last 7 days)
exports.getWeeklyActivity = async (req, res) => {
  try {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);

      const sessions = await FocusSession.find({
        user: req.user._id,
        startedAt: { $gte: d, $lt: next },
        status: "completed",
      });

      const totalMinutes = sessions.reduce(
        (sum, s) => sum + (s.duration || 0) / 60,
        0,
      );

      days.push({
        date: d.toISOString().slice(0, 10),
        day: d.toLocaleDateString("en-US", { weekday: "short" }),
        minutes: Math.round(totalMinutes),
      });
    }

    // normalize to percentages (max = 100%)
    const maxMin = Math.max(...days.map((d) => d.minutes), 1);
    const result = days.map((d) => ({
      ...d,
      percent: Math.round((d.minutes / maxMin) * 100),
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
};
