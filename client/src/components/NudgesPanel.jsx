import React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ChevronRight,
  Sparkles,
  CheckCheck,
  Bell,
  Trash2,
} from "lucide-react";
import { useNudgeStore } from "../store/nudgeStore";
import { useNavigate } from "react-router-dom";

const COLOR_MAP = {
  rose: {
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
    text: "text-rose-400",
    hover: "hover:bg-rose-500/20",
    dot: "bg-rose-500",
  },
  amber: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    text: "text-amber-400",
    hover: "hover:bg-amber-500/20",
    dot: "bg-amber-500",
  },
  blue: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    text: "text-blue-400",
    hover: "hover:bg-blue-500/20",
    dot: "bg-blue-500",
  },
  emerald: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    text: "text-emerald-400",
    hover: "hover:bg-emerald-500/20",
    dot: "bg-emerald-500",
  },
  purple: {
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    text: "text-purple-400",
    hover: "hover:bg-purple-500/20",
    dot: "bg-purple-500",
  },
  sky: {
    bg: "bg-sky-500/10",
    border: "border-sky-500/20",
    text: "text-sky-400",
    hover: "hover:bg-sky-500/20",
    dot: "bg-sky-500",
  },
  orange: {
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    text: "text-orange-400",
    hover: "hover:bg-orange-500/20",
    dot: "bg-orange-500",
  },
  red: {
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    text: "text-red-400",
    hover: "hover:bg-red-500/20",
    dot: "bg-red-500",
  },
  slate: {
    bg: "bg-slate-500/10",
    border: "border-slate-500/20",
    text: "text-slate-400",
    hover: "hover:bg-slate-500/20",
    dot: "bg-slate-500",
  },
};

const NudgesPanel = () => {
  const navigate = useNavigate();
  const {
    isOpen,
    setOpen,
    dismiss,
    clearDismissed,
    getVisibleNudges,
    loading,
    nudges,
  } = useNudgeStore();
  const visible = getVisibleNudges();
  const allDismissed = nudges.length > 0 && visible.length === 0;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[90]"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, x: 60, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.98 }}
            transition={{ type: "spring", damping: 26, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full sm:w-96 bg-surface border-l border-border shadow-2xl z-[100] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Sparkles size={18} className="text-primary" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-text-main">Nudges</h2>
                  <p className="text-[10px] text-text-muted">
                    {visible.length > 0
                      ? `${visible.length} insight${visible.length > 1 ? "s" : ""} for you`
                      : "You're all caught up!"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {nudges.length > 0 && visible.length > 0 && (
                  <button
                    onClick={() => {
                      visible.forEach((n) => dismiss(n.id));
                    }}
                    className="p-2 text-text-muted hover:text-text-main hover:bg-surface-hover rounded-lg transition-colors"
                    title="Dismiss all"
                  >
                    <CheckCheck size={16} />
                  </button>
                )}
                {allDismissed && (
                  <button
                    onClick={clearDismissed}
                    className="p-2 text-text-muted hover:text-text-main hover:bg-surface-hover rounded-lg transition-colors"
                    title="Show dismissed"
                  >
                    <Bell size={16} />
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="p-2 text-text-muted hover:text-text-main hover:bg-surface-hover rounded-lg transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 custom-scrollbar">
              {loading && nudges.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin mb-3" />
                  <p className="text-xs text-text-muted">
                    Loading your insights...
                  </p>
                </div>
              )}

              {!loading && nudges.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
                    <Sparkles size={24} className="text-primary" />
                  </div>
                  <p className="text-sm font-bold text-text-main mb-1">
                    No nudges yet
                  </p>
                  <p className="text-[11px] text-text-muted max-w-[220px]">
                    Start adding tasks, events, and focus sessions — we'll keep
                    you on track with gentle reminders.
                  </p>
                </div>
              )}

              {allDismissed && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-3">
                    <CheckCheck size={24} className="text-emerald-400" />
                  </div>
                  <p className="text-sm font-bold text-text-main mb-1">
                    All caught up!
                  </p>
                  <p className="text-[11px] text-text-muted max-w-[220px]">
                    You've reviewed all your nudges. Nice work staying on top of
                    things!
                  </p>
                </div>
              )}

              <AnimatePresence mode="popLayout">
                {visible.map((nudge, i) => {
                  const c = COLOR_MAP[nudge.color] || COLOR_MAP.blue;
                  return (
                    <motion.div
                      key={nudge.id}
                      layout
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 80, scale: 0.95 }}
                      transition={{ delay: i * 0.04 }}
                      className={`${c.bg} border ${c.border} rounded-2xl p-4 group relative`}
                    >
                      {/* Dismiss button */}
                      <button
                        onClick={() => dismiss(nudge.id)}
                        className="absolute top-2.5 right-2.5 p-1 rounded-lg text-text-muted/50 hover:text-text-main hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all"
                        title="Dismiss"
                      >
                        <X size={12} />
                      </button>

                      <div className="flex gap-3">
                        {/* Icon */}
                        <span className="text-xl leading-none mt-0.5 shrink-0">
                          {nudge.icon}
                        </span>

                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-xs font-bold ${c.text} mb-0.5 leading-tight`}
                          >
                            {nudge.title}
                          </p>
                          <p className="text-[11px] text-text-secondary leading-relaxed">
                            {nudge.message}
                          </p>

                          {nudge.actionLabel && nudge.actionRoute && (
                            <button
                              onClick={() => {
                                setOpen(false);
                                navigate(nudge.actionRoute);
                              }}
                              className={`mt-2.5 inline-flex items-center gap-1 text-[10px] font-bold ${c.text} ${c.hover} px-2.5 py-1 rounded-lg transition-colors`}
                            >
                              {nudge.actionLabel}
                              <ChevronRight size={10} />
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-border/50">
              <p className="text-[9px] text-text-muted text-center">
                Nudges refresh automatically based on your tasks, events & study
                habits
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default NudgesPanel;
