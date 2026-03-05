import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios from "axios";

const API = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api`;
const axiosCfg = { withCredentials: true };

/**
 * Nudge types:
 *  - task_overdue       : tasks past their due date
 *  - task_due_today     : tasks due today
 *  - task_due_soon      : tasks due within next 2 days
 *  - streak_at_risk     : study streak will break if no session today
 *  - streak_milestone   : celebrate streak milestones
 *  - no_focus_today     : no focus sessions recorded today
 *  - focus_goal         : you've studied a lot today — keep going or rest
 *  - event_today        : events happening today
 *  - event_tomorrow     : events happening tomorrow
 *  - pending_tasks_high : more than 5 tasks pending
 *  - all_tasks_done     : congrats — all tasks complete
 *  - idle_reminder      : haven't studied in 2+ days
 *  - welcome_back       : first visit of the day
 */

const NUDGE_ICONS = {
  task_overdue: "🔴",
  task_due_today: "📋",
  task_due_soon: "⏰",
  streak_at_risk: "🔥",
  streak_milestone: "🏆",
  no_focus_today: "🧘",
  focus_goal: "⚡",
  event_today: "📅",
  event_tomorrow: "📆",
  pending_tasks_high: "📊",
  all_tasks_done: "🎉",
  idle_reminder: "💤",
  welcome_back: "👋",
};

const NUDGE_PRIORITY = {
  task_overdue: 10,
  event_today: 9,
  task_due_today: 8,
  streak_at_risk: 7,
  no_focus_today: 6,
  task_due_soon: 5,
  event_tomorrow: 4,
  pending_tasks_high: 3,
  focus_goal: 2,
  streak_milestone: 2,
  all_tasks_done: 1,
  idle_reminder: 1,
  welcome_back: 0,
};

const generateNudges = (dashData, tasks, events) => {
  const nudges = [];
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfterTomorrow = new Date(today);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

  // ── Task-based nudges ──
  const allTasks = [...(tasks.todo || []), ...(tasks.inProgress || [])];
  const completedTasks = tasks.completed || [];

  const overdueTasks = allTasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < today,
  );
  const dueTodayTasks = allTasks.filter((t) => {
    if (!t.dueDate) return false;
    const d = new Date(t.dueDate);
    return d >= today && d < tomorrow;
  });
  const dueSoonTasks = allTasks.filter((t) => {
    if (!t.dueDate) return false;
    const d = new Date(t.dueDate);
    return d >= tomorrow && d < dayAfterTomorrow;
  });

  if (overdueTasks.length > 0) {
    nudges.push({
      id: "task_overdue",
      type: "task_overdue",
      icon: NUDGE_ICONS.task_overdue,
      title: `${overdueTasks.length} overdue task${overdueTasks.length > 1 ? "s" : ""}`,
      message:
        overdueTasks.length === 1
          ? `"${overdueTasks[0].title}" is past its due date. You've got this!`
          : `Tasks like "${overdueTasks[0].title}" need your attention. One at a time!`,
      priority: NUDGE_PRIORITY.task_overdue,
      actionLabel: "View Tasks",
      actionRoute: "/todos",
      color: "rose",
    });
  }

  if (dueTodayTasks.length > 0) {
    nudges.push({
      id: "task_due_today",
      type: "task_due_today",
      icon: NUDGE_ICONS.task_due_today,
      title: `${dueTodayTasks.length} task${dueTodayTasks.length > 1 ? "s" : ""} due today`,
      message:
        dueTodayTasks.length === 1
          ? `"${dueTodayTasks[0].title}" is due today. You can do it!`
          : `Including "${dueTodayTasks[0].title}" — chip away at them one by one.`,
      priority: NUDGE_PRIORITY.task_due_today,
      actionLabel: "Start Working",
      actionRoute: "/todos",
      color: "amber",
    });
  }

  if (dueSoonTasks.length > 0) {
    nudges.push({
      id: "task_due_soon",
      type: "task_due_soon",
      icon: NUDGE_ICONS.task_due_soon,
      title: `${dueSoonTasks.length} task${dueSoonTasks.length > 1 ? "s" : ""} due tomorrow`,
      message: `Heads up — "${dueSoonTasks[0].title}" is coming up. Plan ahead!`,
      priority: NUDGE_PRIORITY.task_due_soon,
      actionLabel: "View Tasks",
      actionRoute: "/todos",
      color: "blue",
    });
  }

  if (allTasks.length === 0 && completedTasks.length > 0) {
    nudges.push({
      id: "all_tasks_done",
      type: "all_tasks_done",
      icon: NUDGE_ICONS.all_tasks_done,
      title: "All tasks complete!",
      message:
        "You've finished everything on your plate. Amazing work — take a well-deserved break!",
      priority: NUDGE_PRIORITY.all_tasks_done,
      color: "emerald",
    });
  }

  if (allTasks.length > 5) {
    nudges.push({
      id: "pending_tasks_high",
      type: "pending_tasks_high",
      icon: NUDGE_ICONS.pending_tasks_high,
      title: `${allTasks.length} tasks pending`,
      message:
        "That's a solid list! Focus on the most important one first — momentum builds fast.",
      priority: NUDGE_PRIORITY.pending_tasks_high,
      actionLabel: "Prioritize",
      actionRoute: "/todos",
      color: "purple",
    });
  }

  // ── Focus & study nudges ──
  const stats = dashData.stats || {};
  const todayHours = stats.todayHours || 0;
  const streak = stats.currentStreak || 0;
  const todayFocusSeconds = dashData.todayFocusSeconds || 0;

  if (todayFocusSeconds === 0) {
    nudges.push({
      id: "no_focus_today",
      type: "no_focus_today",
      icon: NUDGE_ICONS.no_focus_today,
      title: "No study session today yet",
      message:
        "Even 15 minutes of focused study makes a difference. Ready when you are!",
      priority: NUDGE_PRIORITY.no_focus_today,
      actionLabel: "Start Focus",
      actionRoute: "/dashboard",
      color: "sky",
    });
  }

  if (todayHours >= 2) {
    nudges.push({
      id: "focus_goal",
      type: "focus_goal",
      icon: NUDGE_ICONS.focus_goal,
      title: `${todayHours}h of study today!`,
      message:
        "Amazing focus! Remember to take breaks — your brain consolidates learning during rest.",
      priority: NUDGE_PRIORITY.focus_goal,
      color: "emerald",
    });
  }

  // Streak nudges
  if (streak > 0 && todayFocusSeconds === 0) {
    nudges.push({
      id: "streak_at_risk",
      type: "streak_at_risk",
      icon: NUDGE_ICONS.streak_at_risk,
      title: `${streak}-day streak at risk!`,
      message: `You've been consistent for ${streak} day${streak > 1 ? "s" : ""}. A quick session keeps it alive!`,
      priority: NUDGE_PRIORITY.streak_at_risk,
      actionLabel: "Study Now",
      actionRoute: "/dashboard",
      color: "orange",
    });
  }

  if (streak > 0 && streak % 7 === 0 && todayFocusSeconds > 0) {
    nudges.push({
      id: "streak_milestone",
      type: "streak_milestone",
      icon: NUDGE_ICONS.streak_milestone,
      title: `${streak}-day streak! 🎉`,
      message: `${streak} days of consistent studying — that's real discipline. Keep going!`,
      priority: NUDGE_PRIORITY.streak_milestone,
      color: "amber",
    });
  }

  // ── Event nudges ──
  const todayEvents = (events || []).filter((e) => {
    const d = new Date(e.date);
    return d >= today && d < tomorrow;
  });
  const tomorrowEvents = (events || []).filter((e) => {
    const d = new Date(e.date);
    return d >= tomorrow && d < dayAfterTomorrow;
  });

  if (todayEvents.length > 0) {
    nudges.push({
      id: "event_today",
      type: "event_today",
      icon: NUDGE_ICONS.event_today,
      title: `${todayEvents.length} event${todayEvents.length > 1 ? "s" : ""} today`,
      message:
        todayEvents.length === 1
          ? `"${todayEvents[0].title}" is today. Make sure you're prepared!`
          : `"${todayEvents[0].title}" and ${todayEvents.length - 1} more. Stay on top of it!`,
      priority: NUDGE_PRIORITY.event_today,
      actionLabel: "View Calendar",
      actionRoute: "/calendar",
      color: "red",
    });
  }

  if (tomorrowEvents.length > 0) {
    nudges.push({
      id: "event_tomorrow",
      type: "event_tomorrow",
      icon: NUDGE_ICONS.event_tomorrow,
      title: `${tomorrowEvents.length} event${tomorrowEvents.length > 1 ? "s" : ""} tomorrow`,
      message:
        tomorrowEvents.length === 1
          ? `"${tomorrowEvents[0].title}" is tomorrow. Good time to prepare!`
          : `"${tomorrowEvents[0].title}" and more tomorrow. Plan ahead!`,
      priority: NUDGE_PRIORITY.event_tomorrow,
      actionLabel: "View Calendar",
      actionRoute: "/calendar",
      color: "blue",
    });
  }

  // ── Idle reminder ──
  if (todayFocusSeconds === 0 && streak === 0 && allTasks.length > 0) {
    nudges.push({
      id: "idle_reminder",
      type: "idle_reminder",
      icon: NUDGE_ICONS.idle_reminder,
      title: "Ready to get back in?",
      message:
        "It's been a while since your last session. No pressure — just start small.",
      priority: NUDGE_PRIORITY.idle_reminder,
      color: "slate",
    });
  }

  // Sort by priority (high first)
  nudges.sort((a, b) => b.priority - a.priority);

  return nudges;
};

export const useNudgeStore = create(
  persist(
    (set, get) => ({
      nudges: [],
      dismissedIds: [],
      lastFetchedAt: null,
      isOpen: false,
      loading: false,

      setOpen: (open) => set({ isOpen: open }),
      toggleOpen: () => set((s) => ({ isOpen: !s.isOpen })),

      dismiss: (nudgeId) =>
        set((s) => ({
          dismissedIds: [...new Set([...s.dismissedIds, nudgeId])],
        })),

      clearDismissed: () => set({ dismissedIds: [] }),

      // Fetch data & generate nudges
      refresh: async () => {
        set({ loading: true });
        try {
          const [dashRes, taskRes, eventRes] = await Promise.all([
            axios.get(`${API}/dashboard`, axiosCfg),
            axios.get(`${API}/tasks`, axiosCfg),
            axios.get(`${API}/events`, axiosCfg),
          ]);

          const nudges = generateNudges(
            dashRes.data,
            taskRes.data,
            eventRes.data,
          );

          // Reset dismissed IDs daily
          const today = new Date().toDateString();
          const lastDate = get().lastFetchedAt
            ? new Date(get().lastFetchedAt).toDateString()
            : null;

          set({
            nudges,
            loading: false,
            lastFetchedAt: new Date().toISOString(),
            dismissedIds: today !== lastDate ? [] : get().dismissedIds,
          });
        } catch (err) {
          console.error("Nudge refresh error:", err);
          set({ loading: false });
        }
      },

      // Visible (non-dismissed) nudges
      get visibleNudges() {
        return get().nudges.filter((n) => !get().dismissedIds.includes(n.id));
      },

      getVisibleNudges: () => {
        const s = get();
        return s.nudges.filter((n) => !s.dismissedIds.includes(n.id));
      },

      getCount: () => {
        const s = get();
        return s.nudges.filter((n) => !s.dismissedIds.includes(n.id)).length;
      },
    }),
    {
      name: "nudge-storage",
      partialize: (state) => ({
        dismissedIds: state.dismissedIds,
        lastFetchedAt: state.lastFetchedAt,
      }),
    },
  ),
);
