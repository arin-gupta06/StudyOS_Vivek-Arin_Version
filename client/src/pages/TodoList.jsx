import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import RightPanel from "../components/RightPanel";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useLayoutStore } from "../store/layoutStore";
import {
  Menu,
  Plus,
  MoreHorizontal,
  Calendar,
  Clock,
  CheckCircle2,
  X,
  ChevronRight,
  ChevronLeft,
  Trash2,
  AlertTriangle,
  Target,
  Flame,
  Filter,
  ArrowUpDown,
  ListTodo,
  Loader2,
  ClipboardList,
  ArrowRight,
  Search,
  BarChart3,
  Zap,
  PanelRightOpen,
  PanelRightClose,
} from "lucide-react";

const API = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/tasks`;
const axiosCfg = { withCredentials: true };

/* ── Priority mapping ── */
const priorityConfig = {
  Low: {
    label: "LOW",
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/20",
    dot: "bg-emerald-400",
    weight: 1,
  },
  Medium: {
    label: "MEDIUM",
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    border: "border-amber-500/20",
    dot: "bg-amber-400",
    weight: 2,
  },
  High: {
    label: "HIGH",
    bg: "bg-rose-500/10",
    text: "text-rose-400",
    border: "border-rose-500/20",
    dot: "bg-rose-400",
    weight: 3,
  },
  Urgent: {
    label: "URGENT",
    bg: "bg-red-500/15",
    text: "text-red-400",
    border: "border-red-500/30",
    dot: "bg-red-500",
    weight: 4,
  },
};

const columnConfig = {
  todo: {
    label: "To Do",
    dotColor: "bg-slate-400",
    headerBg: "bg-slate-500/5",
    icon: ListTodo,
    emptyText: "No pending tasks — nice!",
    emptyIcon: ClipboardList,
  },
  inProgress: {
    label: "In Progress",
    dotColor: "bg-blue-400",
    headerBg: "bg-blue-500/5",
    icon: Loader2,
    emptyText: "Nothing in progress yet",
    emptyIcon: Zap,
  },
  completed: {
    label: "Completed",
    dotColor: "bg-emerald-400",
    headerBg: "bg-emerald-500/5",
    icon: CheckCircle2,
    emptyText: "Complete a task to see it here",
    emptyIcon: Target,
  },
};

const mapTask = (t) => ({
  id: t._id,
  title: t.title,
  description: t.description || "",
  priorityKey: t.priority || "Medium",
  progress: t.status === "completed" ? 100 : t.progress || 0,
  dueDate: t.dueDate || null,
  createdAt: t.createdAt || null,
  _raw: t,
});

/* ── Helpers ── */
const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : "";

const isOverdue = (d) =>
  d &&
  new Date(d) < new Date() &&
  new Date(d).toDateString() !== new Date().toDateString();
const isToday = (d) =>
  d && new Date(d).toDateString() === new Date().toDateString();
const daysUntil = (d) => {
  if (!d) return null;
  const diff = Math.ceil((new Date(d) - new Date()) / (1000 * 60 * 60 * 24));
  return diff;
};

/* ═══════════════ TaskCard ═══════════════ */
const TaskCard = ({ task, columnId, moveTask, deleteTask }) => {
  const [showMenu, setShowMenu] = useState(false);
  const pCfg = priorityConfig[task.priorityKey] || priorityConfig.Medium;
  const overdue = isOverdue(task.dueDate);
  const today = isToday(task.dueDate);
  const due = daysUntil(task.dueDate);

  const canMoveLeft =
    columnId === "inProgress"
      ? "todo"
      : columnId === "completed"
        ? "inProgress"
        : null;
  const canMoveRight =
    columnId === "todo"
      ? "inProgress"
      : columnId === "inProgress"
        ? "completed"
        : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`group relative bg-surface rounded-2xl border border-border/40 hover:border-border transition-all hover:shadow-card ${
        columnId === "completed" ? "opacity-70 hover:opacity-100" : ""
      }`}
    >
      {/* Left accent strip */}
      <div
        className={`absolute left-0 top-3 bottom-3 w-[3px] rounded-full ${
          columnId === "completed" ? "bg-emerald-400" : pCfg.dot
        }`}
      />

      <div className="p-4 pl-5">
        {/* Top row: priority + actions */}
        <div className="flex items-center justify-between mb-2.5">
          <span
            className={`text-[9px] font-extrabold px-2 py-[3px] rounded-md tracking-widest uppercase ${
              columnId === "completed"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : `${pCfg.bg} ${pCfg.text} border ${pCfg.border}`
            }`}
          >
            {columnId === "completed" ? "DONE" : pCfg.label}
          </span>

          <div className="flex items-center gap-0.5 relative">
            {canMoveLeft && (
              <button
                onClick={() => moveTask(task.id, columnId, canMoveLeft)}
                className="p-1 text-text-muted/50 hover:text-blue-400 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all rounded-lg hover:bg-blue-500/10"
                title={`Move to ${columnConfig[canMoveLeft].label}`}
              >
                <ChevronLeft size={14} />
              </button>
            )}
            {canMoveRight && (
              <button
                onClick={() => moveTask(task.id, columnId, canMoveRight)}
                className="p-1 text-text-muted/50 hover:text-primary opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all rounded-lg hover:bg-primary/10"
                title={`Move to ${columnConfig[canMoveRight].label}`}
              >
                <ChevronRight size={14} />
              </button>
            )}
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 text-text-muted/60 hover:text-text-main transition-colors rounded-lg hover:bg-surface-hover"
            >
              <MoreHorizontal size={15} />
            </button>
            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute right-0 top-8 bg-surface border border-border rounded-xl shadow-float z-30 py-1.5 w-40"
                >
                  {canMoveRight && (
                    <button
                      onClick={() => {
                        moveTask(task.id, columnId, canMoveRight);
                        setShowMenu(false);
                      }}
                      className="w-full px-3 py-2 text-xs text-text-secondary hover:bg-surface-hover flex items-center gap-2 transition-colors"
                    >
                      <ArrowRight size={12} />
                      Move to {columnConfig[canMoveRight].label}
                    </button>
                  )}
                  {columnId !== "completed" && (
                    <button
                      onClick={() => {
                        moveTask(task.id, columnId, "completed");
                        setShowMenu(false);
                      }}
                      className="w-full px-3 py-2 text-xs text-primary hover:bg-primary/5 flex items-center gap-2 transition-colors"
                    >
                      <CheckCircle2 size={12} />
                      Mark Complete
                    </button>
                  )}
                  <button
                    onClick={() => {
                      deleteTask(task.id, columnId);
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/5 flex items-center gap-2 transition-colors"
                  >
                    <Trash2 size={12} />
                    Delete Task
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Title */}
        <h3
          className={`font-bold text-[15px] leading-snug mb-1 ${
            columnId === "completed"
              ? "line-through text-text-muted"
              : "text-text-main"
          }`}
        >
          {task.title}
        </h3>

        {/* Description */}
        {task.description && (
          <p className="text-[12px] text-text-muted leading-relaxed mb-3 line-clamp-2">
            {task.description}
          </p>
        )}

        {/* Progress (only for non-completed) */}
        {columnId !== "completed" && task.progress > 0 && (
          <div className="mb-3">
            <div className="flex justify-between text-[10px] font-bold text-text-muted mb-1 uppercase tracking-wider">
              <span>Progress</span>
              <span className="text-primary">{task.progress}%</span>
            </div>
            <div className="w-full h-1 bg-border/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary/80 to-primary rounded-full transition-all duration-500"
                style={{ width: `${task.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Completed bar */}
        {columnId === "completed" && (
          <div className="mb-3">
            <div className="w-full h-1 bg-emerald-400/40 rounded-full" />
          </div>
        )}

        {/* Footer: date + status indicators */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {task.dueDate && (
              <span
                className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                  overdue
                    ? "bg-red-500/10 text-red-400 border border-red-500/20"
                    : today
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      : "text-text-muted"
                }`}
              >
                <Calendar size={11} />
                {fmtDate(task.dueDate)}
                {overdue && (
                  <span className="text-[9px] ml-0.5 font-extrabold">
                    OVERDUE
                  </span>
                )}
                {today && (
                  <span className="text-[9px] ml-0.5 font-extrabold">
                    TODAY
                  </span>
                )}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {due !== null &&
              due > 0 &&
              due <= 3 &&
              columnId !== "completed" && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-md">
                  <Clock size={10} />
                  {due}d left
                </span>
              )}
            {columnId === "completed" && (
              <CheckCircle2 size={15} className="text-emerald-400" />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/* ═══════════════ Stat Card ═══════════════ */
const StatCard = ({ icon: Icon, label, value, accent, sub }) => (
  <div className="bg-surface rounded-2xl border border-border/40 p-4 flex items-center gap-3.5 min-w-0">
    <div
      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${accent}`}
    >
      <Icon size={18} />
    </div>
    <div className="min-w-0">
      <p className="text-xl font-extrabold text-text-main leading-none">
        {value}
      </p>
      <p className="text-[11px] text-text-muted font-medium mt-0.5 truncate">
        {label}
      </p>
      {sub && (
        <p className="text-[10px] text-primary font-bold mt-0.5">{sub}</p>
      )}
    </div>
  </div>
);

/* ═══════════════ Column ═══════════════ */
const Column = ({ columnId, tasks, moveTask, deleteTask, onAdd }) => {
  const cfg = columnConfig[columnId];
  const Icon = cfg.icon;
  const EmptyIcon = cfg.emptyIcon;

  return (
    <div className="min-w-[280px] w-[280px] sm:min-w-[310px] sm:w-[310px] flex-shrink-0 flex flex-col">
      {/* Column header */}
      <div
        className={`flex items-center justify-between mb-4 px-3 py-2.5 rounded-xl ${cfg.headerBg}`}
      >
        <div className="flex items-center gap-2.5">
          <div
            className={`w-2 h-2 rounded-full ${cfg.dotColor} ${
              columnId === "inProgress" ? "animate-pulse" : ""
            }`}
          />
          <Icon size={15} className="text-text-secondary" />
          <h2 className="font-bold text-sm text-text-main">{cfg.label}</h2>
          <span className="text-[11px] font-extrabold text-text-muted bg-background/80 px-2 py-0.5 rounded-full">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={onAdd}
          className="w-6 h-6 flex items-center justify-center rounded-lg text-text-muted hover:text-primary hover:bg-primary/10 transition-all"
        >
          <Plus size={15} />
        </button>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-3 flex-1">
        <AnimatePresence>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              columnId={columnId}
              moveTask={moveTask}
              deleteTask={deleteTask}
            />
          ))}
        </AnimatePresence>

        {tasks.length === 0 && (
          <div className="border-2 border-dashed border-border/30 rounded-2xl py-10 flex flex-col items-center justify-center gap-2">
            <EmptyIcon size={28} className="text-text-muted/40" />
            <p className="text-[12px] text-text-muted/60 font-medium">
              {cfg.emptyText}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

/* ═══════════════ TodoList ═══════════════ */
const TodoList = () => {
  const { isRightPanelOpen: isRightPanelOpenDesktop, toggleRightPanel } = useLayoutStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
  const [tasks, setTasks] = useState({
    todo: [],
    inProgress: [],
    completed: [],
  });
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterPriority, setFilterPriority] = useState("All");
  const [sortBy, setSortBy] = useState("default");
  const [searchQuery, setSearchQuery] = useState("");
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "Medium",
    dueDate: "",
  });

  /* ── Fetch ── */
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const { data } = await axios.get(API, axiosCfg);
        setTasks({
          todo: (data.todo || []).map(mapTask),
          inProgress: (data.inProgress || []).map(mapTask),
          completed: (data.completed || []).map(mapTask),
        });
      } catch (err) {
        console.error("Failed to fetch tasks:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  /* ── Computed stats ── */
  const stats = useMemo(() => {
    const all = [...tasks.todo, ...tasks.inProgress, ...tasks.completed];
    const total = all.length;
    const done = tasks.completed.length;
    const rate = total ? Math.round((done / total) * 100) : 0;
    const overdueCount = [...tasks.todo, ...tasks.inProgress].filter((t) =>
      isOverdue(t.dueDate),
    ).length;
    const highPriority = [...tasks.todo, ...tasks.inProgress].filter(
      (t) => t.priorityKey === "High" || t.priorityKey === "Urgent",
    ).length;
    const todayDue = [...tasks.todo, ...tasks.inProgress].filter((t) =>
      isToday(t.dueDate),
    ).length;
    return { total, done, rate, overdueCount, highPriority, todayDue };
  }, [tasks]);

  /* ── Filter & sort ── */
  const filterAndSort = (arr) => {
    let result = [...arr];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q),
      );
    }

    if (filterPriority !== "All") {
      result = result.filter((t) => t.priorityKey === filterPriority);
    }

    if (sortBy === "priority") {
      result.sort(
        (a, b) =>
          (priorityConfig[b.priorityKey]?.weight || 0) -
          (priorityConfig[a.priorityKey]?.weight || 0),
      );
    } else if (sortBy === "dueDate") {
      result.sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      });
    } else if (sortBy === "name") {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }

    return result;
  };

  /* ── Move task ── */
  const moveTask = async (taskId, sourceCol, destCol) => {
    const statusMap = {
      todo: "todo",
      inProgress: "inProgress",
      completed: "completed",
    };
    try {
      const updateData = { status: statusMap[destCol] };
      if (destCol === "completed") updateData.progress = 100;
      else if (destCol === "inProgress") updateData.progress = 50;
      else updateData.progress = 0;

      await axios.put(`${API}/${taskId}`, updateData, axiosCfg);

      setTasks((prev) => {
        const up = { ...prev };
        const task = up[sourceCol].find((t) => t.id === taskId);
        if (task) {
          up[sourceCol] = up[sourceCol].filter((t) => t.id !== taskId);
          task.progress = updateData.progress;
          up[destCol] = [task, ...up[destCol]];
        }
        return up;
      });
    } catch (err) {
      console.error("Failed to move task:", err);
    }
  };

  /* ── Create ── */
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;
    try {
      const payload = {
        title: newTask.title,
        description: newTask.description,
        priority: newTask.priority,
        dueDate: newTask.dueDate || undefined,
      };
      const { data } = await axios.post(API, payload, axiosCfg);
      setTasks((prev) => ({
        ...prev,
        todo: [mapTask(data), ...prev.todo],
      }));
      setNewTask({
        title: "",
        description: "",
        priority: "Medium",
        dueDate: "",
      });
      setShowAddModal(false);
    } catch (err) {
      console.error("Failed to create task:", err);
    }
  };

  /* ── Delete ── */
  const deleteTask = async (taskId, column) => {
    try {
      await axios.delete(`${API}/${taskId}`, axiosCfg);
      setTasks((prev) => ({
        ...prev,
        [column]: prev[column].filter((t) => t.id !== taskId),
      }));
    } catch (err) {
      console.error("Failed to delete task:", err);
    }
  };

  return (
    <div className="flex bg-background min-h-screen text-text-main font-sans overflow-hidden">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
        />
      )}

      {/* Left Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar onMobileClose={() => setIsSidebarOpen(false)} />
      </div>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col md:ml-20 min-h-screen relative transition-all duration-300 z-10 `}>
        <main className="flex-1 p-5 md:p-7 overflow-y-auto w-full  h-screen flex flex-col">
          {/* ── Header ── */}
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 bg-surface rounded-xl text-text-secondary hover:text-primary transition-colors border border-border/50 md:hidden"
              >
                <Menu size={22} />
              </button>
              <div>
                <h1 className="text-2xl font-extrabold text-text-main tracking-tight">
                  Task Board
                </h1>
                <p className="text-xs text-text-muted mt-0.5">
                  {stats.total} tasks · {stats.rate}% complete
                </p>
              </div>
              <button
                onClick={() => setIsRightPanelOpen(true)}
                className="p-2 bg-surface rounded-xl text-text-secondary hover:text-primary transition-colors border border-border/50 xl:hidden ml-auto md:hidden"
              >
                <Filter size={20} />
              </button>
              <button
                onClick={toggleRightPanel}
                className="hidden xl:flex p-2 bg-surface rounded-xl text-text-secondary hover:text-primary transition-colors border border-border/50 ml-auto md:ml-0"
                title={isRightPanelOpenDesktop ? "Close Right Panel" : "Open Right Panel"}
              >
                {isRightPanelOpenDesktop ? <PanelRightClose size={20} /> : <PanelRightOpen size={20} />}
              </button>
            </div>

            {/* Actions row */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              {/* Search */}
              <div className="relative flex-1 md:flex-initial md:w-52">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tasks..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-surface border border-border/50 rounded-xl text-text-main placeholder:text-text-muted outline-none focus:border-primary/50 transition-colors"
                />
              </div>

              {/* Filter */}
              <div className="relative">
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="appearance-none pl-8 pr-6 py-2 text-xs bg-surface border border-border/50 rounded-xl text-text-main outline-none focus:border-primary/50 cursor-pointer"
                >
                  <option value="All">All</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
                <Filter
                  size={12}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                />
              </div>

              {/* Sort */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none pl-8 pr-6 py-2 text-xs bg-surface border border-border/50 rounded-xl text-text-main outline-none focus:border-primary/50 cursor-pointer"
                >
                  <option value="default">Default</option>
                  <option value="priority">Priority</option>
                  <option value="dueDate">Due Date</option>
                  <option value="name">Name</option>
                </select>
                <ArrowUpDown
                  size={12}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                />
              </div>

              {/* Add button */}
              <button
                onClick={() => setShowAddModal(true)}
                className="btn-primary flex items-center gap-1.5 !px-4 !py-2 text-xs !rounded-xl shrink-0"
              >
                <Plus size={15} /> New Task
              </button>
            </div>
          </header>

          {/* ── Stats Row ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-3 mb-6 shrink-0">
            <StatCard
              icon={BarChart3}
              label="Total Tasks"
              value={stats.total}
              accent="bg-blue-500/10 text-blue-400"
            />
            <StatCard
              icon={Target}
              label="Completion Rate"
              value={`${stats.rate}%`}
              accent="bg-emerald-500/10 text-emerald-400"
              sub={`${stats.done} of ${stats.total} done`}
            />
            <StatCard
              icon={Flame}
              label="High Priority"
              value={stats.highPriority}
              accent="bg-rose-500/10 text-rose-400"
              sub={stats.highPriority > 0 ? "Needs attention" : null}
            />
            <StatCard
              icon={AlertTriangle}
              label="Overdue"
              value={stats.overdueCount}
              accent={
                stats.overdueCount > 0
                  ? "bg-red-500/15 text-red-400"
                  : "bg-slate-500/10 text-slate-400"
              }
              sub={stats.overdueCount > 0 ? "Action required!" : null}
            />
            <div className="hidden xl:block">
              <StatCard
                icon={Clock}
                label="Due Today"
                value={stats.todayDue}
                accent="bg-amber-500/10 text-amber-400"
                sub={stats.todayDue > 0 ? "Focus on these" : null}
              />
            </div>
          </div>

          {/* ── Kanban Columns ── */}
          <div className="flex-1 flex gap-5 overflow-x-auto pb-4 items-start">
            {loading ? (
              <div className="flex-1 flex items-center justify-center py-20">
                <Loader2 size={28} className="animate-spin text-primary" />
              </div>
            ) : (
              <>
                <Column
                  columnId="todo"
                  tasks={filterAndSort(tasks.todo)}
                  moveTask={moveTask}
                  deleteTask={deleteTask}
                  onAdd={() => setShowAddModal(true)}
                />
                <Column
                  columnId="inProgress"
                  tasks={filterAndSort(tasks.inProgress)}
                  moveTask={moveTask}
                  deleteTask={deleteTask}
                  onAdd={() => setShowAddModal(true)}
                />
                <Column
                  columnId="completed"
                  tasks={filterAndSort(tasks.completed)}
                  moveTask={moveTask}
                  deleteTask={deleteTask}
                  onAdd={() => setShowAddModal(true)}
                />
              </>
            )}
          </div>
        </main>
      </div>

      {/* ── Add Task Modal ── */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface rounded-2xl p-6 w-full max-w-md shadow-float border border-border/50"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-5">
                <div>
                  <h2 className="text-lg font-bold text-text-main">
                    Create Task
                  </h2>
                  <p className="text-xs text-text-muted mt-0.5">
                    Add a new task to your board
                  </p>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-xl text-text-muted hover:text-text-main hover:bg-surface-hover transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateTask} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-text-secondary mb-1.5 block uppercase tracking-wider">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={newTask.title}
                    onChange={(e) =>
                      setNewTask({ ...newTask, title: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-background border border-border/50 rounded-xl text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all placeholder:text-text-muted"
                    placeholder="What needs to be done?"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-text-secondary mb-1.5 block uppercase tracking-wider">
                    Description
                  </label>
                  <textarea
                    value={newTask.description}
                    onChange={(e) =>
                      setNewTask({ ...newTask, description: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-background border border-border/50 rounded-xl text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none h-20 transition-all placeholder:text-text-muted"
                    placeholder="Add details (optional)"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-text-secondary mb-1.5 block uppercase tracking-wider">
                      Priority
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {["Low", "Medium", "High", "Urgent"].map((p) => {
                        const cfg = priorityConfig[p];
                        return (
                          <button
                            key={p}
                            type="button"
                            onClick={() =>
                              setNewTask({ ...newTask, priority: p })
                            }
                            className={`px-2 py-1.5 text-[11px] font-bold rounded-lg border transition-all ${
                              newTask.priority === p
                                ? `${cfg.bg} ${cfg.text} ${cfg.border}`
                                : "border-border/50 text-text-muted hover:border-border"
                            }`}
                          >
                            {p}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-text-secondary mb-1.5 block uppercase tracking-wider">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={newTask.dueDate}
                      onChange={(e) =>
                        setNewTask({ ...newTask, dueDate: e.target.value })
                      }
                      className="w-full px-3 py-2.5 bg-background border border-border/50 rounded-xl text-xs text-text-main focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full btn-primary !py-2.5 text-sm mt-1 flex items-center justify-center gap-2"
                >
                  <Plus size={16} />
                  Create Task
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile RightPanel Overlay */}
      {isRightPanelOpen && (
        <div
          onClick={() => setIsRightPanelOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 xl:hidden backdrop-blur-sm"
        />
      )}

      {/* Right Panel */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-full sm:w-80 transform transition-transform duration-300 ease-in-out shrink-0 ${isRightPanelOpen ? "translate-x-0" : "translate-x-full"} ${isRightPanelOpenDesktop ? "xl:relative xl:transform-none xl:translate-x-0" : "xl:fixed xl:translate-x-full"}`}
      >
        <RightPanel onClose={() => setIsRightPanelOpen(false)} />
      </div>
    </div>
  );
};

export default TodoList;
