import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings,
  User,
  Edit3,
  LogOut,
  Moon,
  Sun,
  Bell,
  Clock,
  Square,
  Calendar,
  Maximize,
  Minimize,
  Zap,
  CheckCircle2,
  TrendingUp,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useThemeStore } from "../store/themeStore";
import { useFocusStore } from "../store/focusStore";
import { useNudgeStore } from "../store/nudgeStore";
import { useDashboardStore } from "../store/dashboardStore";
import { useLayoutStore } from "../store/layoutStore";
import PdfToolModal, { pdfTools } from "./PdfTools";
import NudgesPanel from "./NudgesPanel";
import {
  FaLinkedin,
  FaGithub,
  FaReddit,
  FaDiscord,
  FaQuora,
} from "react-icons/fa";

const socialIconsConfig = [
  { key: "linkedin", icon: <FaLinkedin size={12} />, color: "#0077B5", label: "LinkedIn" },
  { key: "github", icon: <FaGithub size={12} />, color: "#6e5494", label: "GitHub" },
  { key: "reddit", icon: <FaReddit size={12} />, color: "#FF4500", label: "Reddit" },
  { key: "discord", icon: <FaDiscord size={12} />, color: "#5865F2", label: "Discord" },
  { key: "quora", icon: <FaQuora size={12} />, color: "#B92B27", label: "Quora" },
];

// --- Circular Progress Ring -------------------------------------------------
const ProgressRing = ({
  progress = 0,
  size = 44,
  strokeWidth = 4,
  color = "#10B981",
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-white/10"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-all duration-1000 ease-out"
      />
    </svg>
  );
};

// --- Main Right Panel -------------------------------------------------------
const RightPanel = ({ onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { isDarkMode, toggleDarkMode } = useThemeStore();
  const { isRightPanelOpen: isOpen, toggleRightPanel } = useLayoutStore();

  // -- State ---------------------------------------------------------------
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTool, setActiveTool] = useState(null);

  // Shared dashboard store – single source of truth
  const {
    stats: dashStats,
    totalTasks,
    pendingTasks,
    upcomingEvents,
    fetch: fetchDashboard,
    fetchIfStale,
  } = useDashboardStore();

  // Derived local aliases for template compatibility
  const stats = {
    studyHours: dashStats.studyHours,
    todayHours: dashStats.todayHours,
    tasksDone: dashStats.tasksDone,
    totalTasks,
    pendingTasks,
    currentStreak: dashStats.currentStreak,
    focusScore: dashStats.focusScore,
  };

  useEffect(() => {
    document.body.classList.toggle("right-panel-closed", !isOpen);
    return () => document.body.classList.remove("right-panel-closed");
  }, [isOpen]);

  // Focus session from shared store
  const {
    isActive: focusActive,
    isPaused: focusPaused,
    elapsed: sessionSeconds,
    toggle: toggleFocus,
    stop: stopFocus,
    hydrate: hydrateFocus,
  } = useFocusStore();

  // Hydrate focus + fetch real stats on mount
  useEffect(() => {
    hydrateFocus();
    fetchIfStale();
  }, []);

  // Listen for fullscreen changes
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // Nudge store
  const {
    toggleOpen: toggleNudges,
    getCount: getNudgeCount,
    refresh: refreshNudges,
  } = useNudgeStore();
  const nudgeCount = getNudgeCount();

  useEffect(() => {
    refreshNudges();
  }, []);

  // Re-fetch stats when a focus session ends
  const prevFocusRef = useRef(focusActive);
  useEffect(() => {
    if (prevFocusRef.current && !focusActive) {
      fetchDashboard();
    }
    prevFocusRef.current = focusActive;
  }, [focusActive]);

  // Live today hours including active session elapsed time
  const liveTodayHours = focusActive
    ? parseFloat((stats.todayHours + sessionSeconds / 3600).toFixed(1))
    : stats.todayHours;

  const formatTime = (totalSec) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  // Task completion percentage
  const taskPercent =
    stats.totalTasks > 0
      ? Math.round((stats.tasksDone / stats.totalTasks) * 100)
      : 0;

  return (
    <>
      <button
        onClick={toggleRightPanel}
        className={`fixed top-1/2 -translate-y-1/2 z-60 bg-surface w-8 h-16 flex items-center justify-center rounded-l-2xl shadow-[0_4px_14px_rgba(0,0,0,0.05)] border border-border border-r-0 transition-all duration-300 ${isOpen ? "right-80" : "right-0"} hidden xl:flex`}
        title="Toggle Panel"
      >
        <div
          className={`w-1 h-8 rounded-full bg-border transition-all duration-300 ${isOpen ? "" : "bg-primary"}`}
        />
      </button>
      <aside
        className={`bg-surface h-full flex flex-col gap-5 py-6 z-40 border-l border-border overflow-y-auto overflow-x-hidden custom-scrollbar transition-all duration-300 ease-in-out ${isOpen ? "w-full sm:w-80 px-5 opacity-100" : "w-full sm:w-80 px-5 opacity-100 xl:w-0 xl:px-0 xl:border-none xl:opacity-0"}`}
      >
        {/* Mobile Header with Close Button */}
        <div className="flex xl:hidden justify-between items-center mb-2">
          <h2 className="text-lg font-bold text-text-main">Panel</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 -mr-2 text-text-secondary hover:text-text-main hover:bg-surface-hover rounded-lg transition-colors"
            >
              <ChevronRight size={24} />
            </button>
          )}
        </div>

        {/* ── 1. User Profile & Settings ── */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="relative w-11 h-11">
              <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center text-primary text-base font-bold shadow-inner group-hover:scale-105 transition-transform duration-300">
                {user?.avatar ? <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" style={{ borderRadius: 'inherit' }} /> : (user?.username ? user.username[0].toUpperCase() : "A")}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-surface" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-text-main leading-tight group-hover:text-primary transition-colors">
                {user?.username || "User"}
              </h3>
              <p className="text-[11px] text-text-secondary font-medium">
                {user?.email || "Pro Member"}
              </p>
              {/* Social Link Icons */}
              {user?.socialLinks &&
                Object.values(user.socialLinks).some((v) => v) && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    {socialIconsConfig
                      .filter((s) => user.socialLinks[s.key])
                      .map((s) => {
                        const val = user.socialLinks[s.key];
                        const isLink = val.startsWith("http");
                        const Tag = isLink ? "a" : "span";
                        const props = isLink
                          ? { href: val, target: "_blank", rel: "noopener noreferrer" }
                          : {};
                        return (
                          <Tag
                            key={s.key}
                            {...props}
                            title={isLink ? s.label : `${s.label}: ${val}`}
                            className="w-5 h-5 rounded flex items-center justify-center transition-all hover:scale-110 cursor-pointer"
                            style={{ backgroundColor: s.color + "20", color: s.color }}
                          >
                            {s.icon}
                          </Tag>
                        );
                      })}
                  </div>
                )}
            </div>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowSettingsMenu(!showSettingsMenu)}
              className={`p-2 rounded-lg transition-all duration-200 ${showSettingsMenu ? "bg-primary text-slate-900 shadow-glow" : "text-text-muted hover:bg-surface-hover hover:text-text-main"}`}
            >
              <Settings
                size={18}
                className={showSettingsMenu ? "animate-spin-slow" : ""}
              />
            </button>

            <AnimatePresence>
              {showSettingsMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="absolute right-0 top-10 w-48 bg-surface rounded-xl shadow-lg border border-border p-1.5 z-50 origin-top-right text-text-muted divide-y divide-border/50"
                >
                  <div className="space-y-0.5 p-1">
                    <button
                      onClick={() => {
                        setShowSettingsMenu(false);
                        navigate("/edit-profile");
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium hover:bg-surface-hover hover:text-text-main rounded-lg transition-colors group"
                    >
                      <User
                        size={14}
                        className="group-hover:text-primary transition-colors"
                      />{" "}
                      Edit Profile
                    </button>
                  </div>
                  <div className="p-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <LogOut size={14} /> Logout
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* --- 2. Focus Timer Card (Pomodoro UI) --- */}
          <div
            className="card relative bg-primary/10 cursor-pointer overflow-hidden transition-all duration-300"
            onClick={() => !focusActive && toggleFocus()}
          >
            {/* Background animated gradient when active */}
            {focusActive && !focusPaused && (
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-primary/20 to-transparent opacity-50 animate-pulse pointer-events-none" />
            )}

            {!focusActive && (
              <div className="flex items-center gap-2 relative z-10 w-full">
                <div className="w-2 h-2 rounded-full bg-primary text-primary shadow-[0_0_8px_currentColor]" />
                <span className="text-[10px] font-bold tracking-widest uppercase text-text-muted">
                  Focus Session
                </span>
                <span className="ml-auto text-xs font-semibold text-primary/70">START 25:00</span>
              </div>
            )}

            {focusActive && (
              <>
                <div className="flex items-center justify-between mb-4 relative z-10 w-full">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] ${!focusPaused ? "bg-primary text-primary animate-pulse" : "bg-amber-500 text-amber-500"}`}
                    />
                    <span className="text-[10px] font-bold tracking-widest uppercase text-text-muted">
                      {focusPaused ? "Paused" : "Deep Focus"}
                    </span>
                  </div>
                </div>

                <div className="flex justify-center mb-6 relative z-10">
                  {/* Circular Progress Ring */}
                  <div className="relative w-40 h-40 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      {/* Background Track */}
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="4"
                        className="text-black/5 dark:text-white/5"
                      />
                      {/* Progress Track (Pomodoro = 25 mins = 1500 sec) */}
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="4"
                        strokeLinecap="round"
                        className={`${!focusPaused ? "text-primary transition-all duration-1000 ease-linear" : "text-amber-500"}`}
                        strokeDasharray="282.74" /* 2 * PI * 45 */
                        strokeDashoffset={282.74 - (282.74 * Math.min(sessionSeconds, 1500)) / 1500}
                      />
                    </svg>

                    <div className="absolute flex flex-col items-center justify-center">
                      <span className="text-3xl font-mono font-bold tracking-wider text-text-main drop-shadow-md">
                        {formatTime(sessionSeconds)}
                      </span>
                      {sessionSeconds >= 1500 && (
                        <span className="text-[10px] font-bold text-green-500 mt-1 uppercase tracking-widest bg-green-500/10 px-2 py-0.5 rounded-full">
                          Goal Reached
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 relative z-10 w-full">
                  <button onClick={(e) => { e.stopPropagation(); toggleFocus(); }} className="flex-1 btn-primary text-sm py-2">
                    {focusPaused ? "Resume" : "Pause"}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); stopFocus(); }}
                    className="p-2 min-w-12 flex items-center justify-center bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-colors"
                    title="End Session"
                  >
                    <Square size={16} fill="currentColor" />
                  </button>
                </div>
              </>
            )}
          </div>

          {/* ── 3. Today's Stats (Real Data) ── */}
        <div className="space-y-2.5">
          <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-wider ml-1">
            Today's Progress
          </h4>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-background rounded-2xl p-3 text-center shadow-inner">
              <div className="w-8 h-8 mx-auto mb-1.5 flex items-center justify-center bg-blue-500/10 rounded-lg">
                <Clock size={14} className="text-blue-500" />
              </div>
              <p className="text-lg font-bold text-text-main leading-none">
                {liveTodayHours}h
              </p>
              <p className="text-[9px] text-text-muted mt-1 font-medium">
                Study
              </p>
            </div>
            <div className="bg-background rounded-2xl p-3 text-center shadow-inner">
              <div className="w-8 h-8 mx-auto mb-1.5 flex items-center justify-center bg-emerald-500/10 rounded-lg">
                <CheckCircle2 size={14} className="text-emerald-500" />
              </div>
              <p className="text-lg font-bold text-text-main leading-none">
                {stats.tasksDone}
                <span className="text-xs text-text-muted font-normal">
                  /{stats.totalTasks}
                </span>
              </p>
              <p className="text-[9px] text-text-muted mt-1 font-medium">
                Tasks
              </p>
            </div>
            <div className="bg-background rounded-2xl p-3 text-center shadow-inner">
              <div className="w-8 h-8 mx-auto mb-1.5 flex items-center justify-center bg-amber-500/10 rounded-lg">
                <Zap size={14} className="text-amber-500" />
              </div>
              <p className="text-lg font-bold text-text-main leading-none">
                {stats.currentStreak}
              </p>
              <p className="text-[9px] text-text-muted mt-1 font-medium">
                Streak
              </p>
            </div>
          </div>

          {/* Task completion mini-bar */}
          {stats.totalTasks > 0 && (
            <div className="px-1">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] text-text-muted font-medium">
                  Task Completion
                </span>
                <span className="text-[10px] font-bold text-primary">
                  {taskPercent}%
                </span>
              </div>
              <div className="w-full bg-background rounded-full h-1.5 shadow-inner overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${taskPercent}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="bg-primary h-1.5 rounded-full"
                />
              </div>
            </div>
          )}
        </div>

        {/* ── 4. PDF Tools ── */}
        <div className="space-y-2.5">
          <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-wider ml-1">
            PDF Tools
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {pdfTools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => setActiveTool(tool.id)}
                title={tool.title}
                className="flex items-center gap-2.5 p-3 bg-background rounded-xl shadow-inner hover:bg-surface hover:shadow-soft transition-all duration-200 group text-left"
              >
                <div
                  className={`w-9 h-9 shrink-0 flex items-center justify-center rounded-lg ${tool.bg} ${tool.color} group-hover:scale-110 transition-transform duration-200`}
                >
                  <tool.icon size={16} />
                </div>
                <span className="text-[11px] font-semibold text-text-secondary group-hover:text-text-main transition-colors leading-tight">
                  {tool.shortLabel}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* PDF Tool Modal */}
        <PdfToolModal tool={activeTool} onClose={() => setActiveTool(null)} />

        {/* ── 5. Quick Actions ── */}
        <div className="space-y-2.5">
          <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-wider ml-1">
            Quick Actions
          </h4>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={toggleDarkMode}
              className="flex flex-col items-center gap-2 p-3 bg-background rounded-2xl shadow-inner hover:bg-surface hover:shadow-soft transition-all duration-200 group"
            >
              <div className="w-9 h-9 flex items-center justify-center bg-surface rounded-xl shadow-soft group-hover:scale-110 transition-all duration-300">
                {isDarkMode ? (
                  <Sun size={16} className="text-amber-500" />
                ) : (
                  <Moon
                    size={16}
                    className="text-text-secondary group-hover:text-primary transition-colors"
                  />
                )}
              </div>
              <span className="text-[10px] font-medium text-text-muted group-hover:text-text-main transition-colors">
                {isDarkMode ? "Light" : "Dark"}
              </span>
            </button>

            <button
              onClick={toggleFullscreen}
              className="flex flex-col items-center gap-2 p-3 bg-background rounded-2xl shadow-inner hover:bg-surface hover:shadow-soft transition-all duration-200 group"
            >
              <div className="w-9 h-9 flex items-center justify-center bg-surface rounded-xl shadow-soft group-hover:scale-110 transition-all duration-300">
                {isFullscreen ? (
                  <Minimize
                    size={16}
                    className="text-text-secondary group-hover:text-primary transition-colors"
                  />
                ) : (
                  <Maximize
                    size={16}
                    className="text-text-secondary group-hover:text-primary transition-colors"
                  />
                )}
              </div>
              <span className="text-[10px] font-medium text-text-muted group-hover:text-text-main transition-colors">
                {isFullscreen ? "Exit" : "Full"}
              </span>
            </button>

            <button
              onClick={toggleNudges}
              className="flex flex-col items-center gap-2 p-3 bg-background rounded-2xl shadow-inner hover:bg-surface hover:shadow-soft transition-all duration-200 group relative"
            >
              <div className="w-9 h-9 flex items-center justify-center bg-surface rounded-xl shadow-soft group-hover:scale-110 transition-all duration-300">
                <Sparkles
                  size={16}
                  className="text-text-secondary group-hover:text-primary transition-colors"
                />
              </div>
              <span className="text-[10px] font-medium text-text-muted group-hover:text-text-main transition-colors">
                Nudges
              </span>
              {nudgeCount > 0 && (
                <span className="absolute top-2 right-3 w-4 h-4 bg-red-500 rounded-full text-[8px] text-white font-bold flex items-center justify-center">
                  {nudgeCount > 9 ? "9+" : nudgeCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ── 6. Upcoming Events ── */}
        <div className="space-y-2.5">
          <div className="flex justify-between items-center ml-1 mr-1">
            <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
              Upcoming
            </h4>
            <button
              onClick={() => navigate("/calendar")}
              className="text-[10px] font-semibold text-primary hover:text-primary-dark transition-colors"
            >
              View All
            </button>
          </div>

          {upcomingEvents.length > 0 ? (
            <div className="space-y-2">
              {upcomingEvents.slice(0, 3).map((event, i) => (
                <button
                  key={event._id || i}
                  onClick={() => navigate("/calendar")}
                  className="w-full flex items-center gap-3 p-2.5 bg-background rounded-xl shadow-inner hover:bg-surface hover:shadow-soft transition-all text-left group"
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      event.type === "Quiz"
                        ? "bg-amber-500/10 text-amber-500"
                        : event.type === "Exam"
                          ? "bg-red-500/10 text-red-500"
                          : event.type === "Assignment"
                            ? "bg-blue-500/10 text-blue-500"
                            : "bg-purple-500/10 text-purple-500"
                    }`}
                  >
                    <Calendar size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-text-main truncate group-hover:text-primary transition-colors">
                      {event.title}
                    </p>
                    <p className="text-[10px] text-text-muted mt-0.5">
                      {event.type} •{" "}
                      {new Date(event.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <ChevronRight
                    size={14}
                    className="text-text-muted opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0"
                  />
                </button>
              ))}
            </div>
          ) : (
            <div className="bg-background rounded-xl p-4 shadow-inner text-center">
              <Calendar size={20} className="mx-auto text-text-muted mb-1.5" />
              <p className="text-[11px] text-text-muted">No upcoming events</p>
              <button
                onClick={() => navigate("/calendar")}
                className="text-[10px] font-semibold text-primary mt-1 hover:underline"
              >
                Add Event
              </button>
            </div>
          )}
        </div>

        {/* ── 7. Study Stats Summary ── */}
        <div className="bg-background rounded-2xl p-4 shadow-inner">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp size={14} className="text-primary" />
              <h4 className="text-xs font-bold text-text-main">Overview</h4>
            </div>
            <button
              onClick={() => navigate("/dashboard")}
              className="text-[10px] font-semibold text-primary hover:text-primary-dark transition-colors"
            >
              Details
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-text-secondary">
                Total Study
              </span>
              <span className="text-xs font-bold text-text-main">
                {stats.studyHours}h
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-text-secondary">
                Focus Sessions
              </span>
              <span className="text-xs font-bold text-text-main">
                {stats.focusScore}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-text-secondary">
                Pending Tasks
              </span>
              <span
                className={`text-xs font-bold ${stats.pendingTasks > 0 ? "text-amber-500" : "text-emerald-500"}`}
              >
                {stats.pendingTasks}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Nudges Panel */}
      <NudgesPanel />
    </>
  );
};

export default RightPanel;
