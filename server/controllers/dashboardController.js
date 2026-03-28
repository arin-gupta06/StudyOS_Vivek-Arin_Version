const UserStat = require("../models/UserStat");
const Subject = require("../models/Subject");
const Task = require("../models/Task");
const Event = require("../models/Event");
const Sketch = require("../models/Sketch");
const FocusSession = require("../models/FocusSession");
const mongoose = require("mongoose");

exports.getDashboardData = async (req, res) => {
  try {
    const userId = req.user._id;

    // --- User stats (accumulated) ---
    const userStat = (await UserStat.findOne({ user: userId })) || {
      studyHours: 0,
      tasksDone: 0,
      currentStreak: 0,
      focusScore: 0,
    };

    // --- Compute real study hours from completed focus sessions ---
    // Added .lean() and selected only the 'duration' field to drastically reduce memory usage
    const allCompleted = await FocusSession.find({
      user: userId,
      status: "completed",
    })
      .select("duration")
      .lean();
    const totalFocusSeconds = allCompleted.reduce(
      (sum, s) => sum + (s.duration || 0),
      0,
    );
    const totalStudyHours = parseFloat((totalFocusSeconds / 3600).toFixed(1));

    // --- Today's focus time ---
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const todaySessions = await FocusSession.find({
      user: userId,
      status: "completed",
      startedAt: { $gte: startOfDay },
    })
      .select("duration")
      .lean();
    const todaySeconds = todaySessions.reduce(
      (sum, s) => sum + (s.duration || 0),
      0,
    );
    const todayHours = parseFloat((todaySeconds / 3600).toFixed(1));

    // --- Tasks ---
    const tasks = await Task.find({ user: userId }).select("status").lean();
    const completedTasks = tasks.filter((t) => t.status === "completed").length;
    const pendingTasks = tasks.filter(
      (t) => t.status === "todo" || t.status === "inProgress",
    ).length;

    // --- Streak: consecutive days with at least 1 completed focus session ---
    let streak = 0;
    const checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);
    for (let i = 0; i < 365; i++) {
      const dayStart = new Date(checkDate);
      dayStart.setDate(dayStart.getDate() - i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      const hasSession = allCompleted.some(
        (s) => s.startedAt >= dayStart && s.startedAt < dayEnd,
      );
      if (hasSession) {
        streak++;
      } else if (i > 0) {
        break; // streak broken
      }
      // allow today to have no session yet without breaking streak
      if (i === 0 && !hasSession) continue;
    }

    // --- Focus score: total completed sessions ---
    const focusScore = allCompleted.length;

    // --- Subjects (top 4 for focus widget) ---
    const subjects = await Subject.find({ user: userId })
      .sort({ progress: -1 })
      .limit(4)
      .lean();

    // --- Upcoming events ---
    const upcomingEvents = await Event.find({
      user: userId,
      date: { $gte: new Date() },
    })
      .sort({ date: 1 })
      .limit(3)
      .lean();

    // --- Recent sketches ---
    const recentSketches = await Sketch.find({ user: userId })
      .sort({ updatedAt: -1 })
      .limit(3)
      .select("title thumbnail updatedAt")
      .lean();

    // --- Weekly activity (last 7 days) ---
    const weeklyActivity = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      const daySessions = allCompleted.filter(
        (s) => s.startedAt >= d && s.startedAt < next,
      );
      const mins = Math.round(
        daySessions.reduce((sum, s) => sum + (s.duration || 0), 0) / 60,
      );
      weeklyActivity.push({
        day: d.toLocaleDateString("en-US", { weekday: "short" }),
        minutes: mins,
      });
    }
    const maxMins = Math.max(...weeklyActivity.map((w) => w.minutes), 1);
    weeklyActivity.forEach((w) => {
      w.percent = Math.round((w.minutes / maxMins) * 100);
    });

    res.json({
      stats: {
        studyHours: totalStudyHours || userStat.studyHours || 0,
        todayHours,
        tasksDone: completedTasks,
        currentStreak: streak || userStat.currentStreak || 0,
        focusScore,
      },
      subjects: subjects.map((s) => ({
        _id: s._id,
        name: s.name,
        icon: s.icon,
        progress: s.progress,
        chapter: s.chapters?.length
          ? `Chapter ${s.completedChapters + 1}`
          : "No chapters",
        tasksPending: s.totalTasks - s.completedTasks,
      })),
      pendingTasks,
      totalTasks: tasks.length,
      completedTasks,
      upcomingEvents,
      recentSketches,
      weeklyActivity,
      todayFocusSeconds: todaySeconds,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};
