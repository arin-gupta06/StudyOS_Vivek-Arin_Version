import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import RightPanel from "../components/RightPanel";
import { useAuth } from "../context/AuthContext";
import {
  Search,
  Bell,
  Plus,
  MoreHorizontal,
  CheckCircle2,
  Circle,
  Menu,
  Filter,
  Pin,
  X,
  Trash2,
  ListChecks,
  Type,
  PlusCircle,
  XCircle,
  Pencil,
  StickyNote,
  ClipboardList,
  Clock,
  Tag,
  FileText,
  Loader2,
  Sparkles,
  PanelRightOpen,
  PanelRightClose,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useThemeStore } from "../store/themeStore";
import { useNudgeStore } from "../store/nudgeStore";
import { useLayoutStore } from "../store/layoutStore";
import NudgesPanel from "../components/NudgesPanel";

const API = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/notes`;
const axiosCfg = { withCredentials: true };

/* ───────── categories ───────── */
const CATEGORIES = ["All", "Work", "Study", "Personal"];

/* ───── colour map ───── */
const getPalette = (isDark) => ({
  emerald: {
    card: isDark ? "bg-emerald-950/35" : "bg-emerald-50",
    border: isDark ? "border-emerald-500/20" : "border-emerald-200/80",
    hoverBorder: isDark
      ? "hover:border-emerald-400/40"
      : "hover:border-emerald-300",
    glow: isDark ? "shadow-[0_0_15px_rgba(16,185,129,0.05)]" : "shadow-sm",
    accent: isDark ? "bg-emerald-400" : "bg-emerald-500",
    label: isDark ? "text-emerald-400" : "text-emerald-600",
    labelBg: isDark ? "bg-emerald-400/10" : "bg-emerald-100",
    title: isDark ? "text-white" : "text-emerald-900",
    text: isDark ? "text-slate-200" : "text-emerald-800",
    check: isDark ? "text-emerald-400" : "text-primary",
    uncheck: isDark ? "text-emerald-700" : "text-emerald-300",
    meta: isDark ? "text-slate-400" : "text-emerald-500/80",
    dot: isDark ? "bg-emerald-400" : "bg-emerald-400",
    progressBg: isDark ? "bg-emerald-900/40" : "bg-emerald-200/60",
    progressFill: isDark ? "bg-emerald-400" : "bg-emerald-500",
    typeBg: isDark ? "bg-emerald-400/10" : "bg-emerald-100/80",
    typeText: isDark ? "text-emerald-400" : "text-emerald-600",
  },
  purple: {
    card: isDark ? "bg-purple-950/40" : "bg-purple-50",
    border: isDark ? "border-purple-500/25" : "border-purple-200/80",
    hoverBorder: isDark
      ? "hover:border-purple-400/45"
      : "hover:border-purple-300",
    glow: isDark ? "shadow-[0_0_15px_rgba(168,85,247,0.06)]" : "shadow-sm",
    accent: isDark ? "bg-purple-400" : "bg-purple-500",
    label: isDark ? "text-purple-300" : "text-purple-600",
    labelBg: isDark ? "bg-purple-400/10" : "bg-purple-100",
    title: isDark ? "text-white" : "text-purple-900",
    text: isDark ? "text-slate-200" : "text-purple-800",
    check: isDark ? "text-purple-400" : "text-primary",
    uncheck: isDark ? "text-purple-700" : "text-purple-300",
    meta: isDark ? "text-slate-400" : "text-purple-500/80",
    dot: isDark ? "bg-purple-400" : "bg-purple-400",
    progressBg: isDark ? "bg-purple-900/40" : "bg-purple-200/60",
    progressFill: isDark ? "bg-purple-400" : "bg-purple-500",
    typeBg: isDark ? "bg-purple-400/10" : "bg-purple-100/80",
    typeText: isDark ? "text-purple-300" : "text-purple-600",
  },
  amber: {
    card: isDark ? "bg-amber-950/35" : "bg-amber-50",
    border: isDark ? "border-amber-500/20" : "border-amber-200/80",
    hoverBorder: isDark
      ? "hover:border-amber-400/40"
      : "hover:border-amber-300",
    glow: isDark ? "shadow-[0_0_15px_rgba(245,158,11,0.05)]" : "shadow-sm",
    accent: isDark ? "bg-amber-400" : "bg-amber-500",
    label: isDark ? "text-amber-300" : "text-amber-700",
    labelBg: isDark ? "bg-amber-400/10" : "bg-amber-100",
    title: isDark ? "text-white" : "text-amber-900",
    text: isDark ? "text-slate-200" : "text-amber-800",
    check: isDark ? "text-amber-400" : "text-primary",
    uncheck: isDark ? "text-amber-700" : "text-amber-300",
    meta: isDark ? "text-slate-400" : "text-amber-500/80",
    dot: isDark ? "bg-amber-400" : "bg-amber-400",
    progressBg: isDark ? "bg-amber-900/40" : "bg-amber-200/60",
    progressFill: isDark ? "bg-amber-400" : "bg-amber-500",
    typeBg: isDark ? "bg-amber-400/10" : "bg-amber-100/80",
    typeText: isDark ? "text-amber-300" : "text-amber-700",
  },
  blue: {
    card: isDark ? "bg-blue-950/35" : "bg-blue-50",
    border: isDark ? "border-blue-500/20" : "border-blue-200/80",
    hoverBorder: isDark ? "hover:border-blue-400/40" : "hover:border-blue-300",
    glow: isDark ? "shadow-[0_0_15px_rgba(59,130,246,0.05)]" : "shadow-sm",
    accent: isDark ? "bg-blue-400" : "bg-blue-500",
    label: isDark ? "text-blue-300" : "text-blue-600",
    labelBg: isDark ? "bg-blue-400/10" : "bg-blue-100",
    title: isDark ? "text-white" : "text-blue-900",
    text: isDark ? "text-slate-200" : "text-blue-800",
    check: isDark ? "text-blue-400" : "text-primary",
    uncheck: isDark ? "text-blue-700" : "text-blue-300",
    meta: isDark ? "text-slate-400" : "text-blue-500/80",
    dot: isDark ? "bg-blue-400" : "bg-blue-400",
    progressBg: isDark ? "bg-blue-900/40" : "bg-blue-200/60",
    progressFill: isDark ? "bg-blue-400" : "bg-blue-500",
    typeBg: isDark ? "bg-blue-400/10" : "bg-blue-100/80",
    typeText: isDark ? "text-blue-300" : "text-blue-600",
  },
  rose: {
    card: isDark ? "bg-rose-950/35" : "bg-rose-50",
    border: isDark ? "border-rose-500/20" : "border-rose-200/80",
    hoverBorder: isDark ? "hover:border-rose-400/40" : "hover:border-rose-300",
    glow: isDark ? "shadow-[0_0_15px_rgba(244,63,94,0.05)]" : "shadow-sm",
    accent: isDark ? "bg-rose-400" : "bg-rose-500",
    label: isDark ? "text-rose-300" : "text-rose-600",
    labelBg: isDark ? "bg-rose-400/10" : "bg-rose-100",
    title: isDark ? "text-white" : "text-rose-900",
    text: isDark ? "text-slate-200" : "text-rose-800",
    check: isDark ? "text-rose-400" : "text-primary",
    uncheck: isDark ? "text-rose-700" : "text-rose-300",
    meta: isDark ? "text-slate-400" : "text-rose-500/80",
    dot: isDark ? "bg-rose-400" : "bg-rose-400",
    progressBg: isDark ? "bg-rose-900/40" : "bg-rose-200/60",
    progressFill: isDark ? "bg-rose-400" : "bg-rose-500",
    typeBg: isDark ? "bg-rose-400/10" : "bg-rose-100/80",
    typeText: isDark ? "text-rose-300" : "text-rose-600",
  },
});

/* ═══════════════════════════════════════════════════════════════ */

const StickyNotes = () => {
  const { user } = useAuth();
  const { isDarkMode } = useThemeStore();
  const { isRightPanelOpen: isRightPanelOpenDesktop, toggleRightPanel } = useLayoutStore();
  const [activeCategory, setActiveCategory] = useState("All");
  const [notes, setNotes] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);

  const {
    toggleOpen: toggleNudges,
    getCount: getNudgeCount,
    refresh: refreshNudges,
  } = useNudgeStore();
  const nudgeCount = getNudgeCount();

  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newNote, setNewNote] = useState({
    title: "",
    category: "Personal",
    type: "text",
    body: "",
    color: "emerald",
    items: [],
  });
  const [newSubtask, setNewSubtask] = useState("");
  const [editingNote, setEditingNote] = useState(null);
  const [editSubtask, setEditSubtask] = useState("");

  // Get current palette based on theme
  const palette = getPalette(isDarkMode);

  // Fetch notes from API
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const { data } = await axios.get(API, axiosCfg);
        setNotes(data);
      } catch (err) {
        console.error("Failed to fetch notes:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotes();
    refreshNudges();
  }, []);

  // Add subtask to new note (modal)
  const addSubtaskToNew = () => {
    if (!newSubtask.trim()) return;
    setNewNote((prev) => ({
      ...prev,
      items: [...prev.items, { text: newSubtask.trim(), done: false }],
    }));
    setNewSubtask("");
  };

  // Remove subtask from new note (modal)
  const removeSubtaskFromNew = (idx) => {
    setNewNote((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx),
    }));
  };

  // ── Edit modal helpers ──
  const openEditModal = (note) => {
    setEditingNote({
      ...note,
      items: note.items ? note.items.map((i) => ({ ...i })) : [],
    });
    setEditSubtask("");
  };

  const toggleEditItem = (idx) => {
    setEditingNote((prev) => {
      const items = [...prev.items];
      items[idx] = { ...items[idx], done: !items[idx].done };
      return { ...prev, items };
    });
  };

  const addEditSubtask = () => {
    if (!editSubtask.trim()) return;
    setEditingNote((prev) => ({
      ...prev,
      items: [...prev.items, { text: editSubtask.trim(), done: false }],
    }));
    setEditSubtask("");
  };

  const removeEditSubtask = (idx) => {
    setEditingNote((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx),
    }));
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingNote) return;
    try {
      const {
        _id,
        __v,
        user: u,
        createdAt,
        updatedAt,
        ...payload
      } = editingNote;
      payload.label = payload.category;
      if (payload.type !== "checklist") delete payload.items;
      await axios.put(`${API}/${_id}`, payload, axiosCfg);
      setNotes((prev) =>
        prev.map((n) =>
          n._id === _id
            ? { ...n, ...payload, updatedAt: new Date().toISOString() }
            : n,
        ),
      );
      setEditingNote(null);
    } catch (err) {
      console.error("Failed to update note:", err);
    }
  };

  // Create note
  const handleCreateNote = async (e) => {
    e.preventDefault();
    if (newNote.type === "checklist") {
      if (!newNote.title.trim() && newNote.items.length === 0) return;
    } else {
      if (!newNote.title.trim() && !newNote.body.trim()) return;
    }
    try {
      const payload = { ...newNote, label: newNote.category };
      if (newNote.type !== "checklist") delete payload.items;
      const { data } = await axios.post(API, payload, axiosCfg);
      setNotes((prev) => [data, ...prev]);
      setNewNote({
        title: "",
        category: "Personal",
        type: "text",
        body: "",
        color: "emerald",
        items: [],
      });
      setNewSubtask("");
      setShowAddModal(false);
    } catch (err) {
      console.error("Failed to create note:", err);
    }
  };

  // Delete note
  const handleDeleteNote = async (id) => {
    try {
      await axios.delete(`${API}/${id}`, axiosCfg);
      setNotes((prev) => prev.filter((n) => n._id !== id));
    } catch (err) {
      console.error("Failed to delete note:", err);
    }
  };

  /* filter */
  const filtered = notes.filter((n) => {
    const matchCat = activeCategory === "All" || n.category === activeCategory;
    const matchSearch =
      !searchQuery ||
      n.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.body?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  /* toggle checklist item directly on card */
  const toggleItem = async (noteId, idx) => {
    const note = notes.find((n) => n._id === noteId);
    if (!note || note.type !== "checklist") return;
    const updatedItems = [...note.items];
    updatedItems[idx] = { ...updatedItems[idx], done: !updatedItems[idx].done };
    try {
      await axios.put(`${API}/${noteId}`, { items: updatedItems }, axiosCfg);
      setNotes((prev) =>
        prev.map((n) =>
          n._id === noteId
            ? { ...n, items: updatedItems, updatedAt: new Date().toISOString() }
            : n,
        ),
      );
    } catch (err) {
      console.error("Failed to update note:", err);
    }
  };

  /* ─── render card body ───────────────────────────── */
  const renderBody = (note) => {
    const c = palette[note.color] || palette.emerald;

    if (note.type === "checklist") {
      return (
        <div>
          {/* brief description */}
          {note.body && (
            <p
              className={`${c.text} text-sm leading-relaxed mb-3 opacity-80 line-clamp-2`}
            >
              {note.body}
            </p>
          )}
          <ul className="space-y-2">
            {(note.items || []).slice(0, 5).map((item, idx) => (
              <li
                key={idx}
                className={`flex items-start gap-2.5 cursor-pointer group/item ${c.text}`}
                onClick={() => toggleItem(note._id, idx)}
              >
                {item.done ? (
                  <CheckCircle2
                    size={17}
                    className={`${c.check} shrink-0 mt-0.5`}
                  />
                ) : (
                  <Circle
                    size={17}
                    className={`${c.uncheck} shrink-0 mt-0.5 group-hover/item:opacity-80`}
                  />
                )}
                <span
                  className={`text-sm leading-snug ${item.done ? "line-through opacity-50" : ""}`}
                >
                  {item.text}
                </span>
              </li>
            ))}
            {(note.items || []).length > 5 && (
              <li className={`text-xs ${c.meta} pl-6`}>
                +{(note.items || []).length - 5} more items
              </li>
            )}
          </ul>
        </div>
      );
    }

    if (note.type === "bullets") {
      return (
        <ul className="space-y-1.5">
          {note.items.slice(0, 6).map((item, idx) => (
            <li
              key={idx}
              className={`flex items-start gap-2 text-sm ${c.text}`}
            >
              <span className={`mt-2 w-1 h-1 rounded-full ${c.dot} shrink-0`} />
              <span className="leading-snug">{item}</span>
            </li>
          ))}
        </ul>
      );
    }

    if (note.type === "quote") {
      return (
        <>
          <p
            className={`${c.title} text-base font-medium leading-relaxed italic line-clamp-4`}
          >
            {note.body}
          </p>
          {note.author && (
            <p className={`mt-3 text-sm ${c.text}`}>— {note.author}</p>
          )}
        </>
      );
    }

    /* text */
    return (
      <p
        className={`${c.text} text-sm leading-relaxed line-clamp-6 ${note.type === "text" && !note.title ? "italic" : ""}`}
      >
        {note.body}
      </p>
    );
  };

  /* ─── component ────────────────────────────── */
  return (
    <div className="min-h-screen bg-background flex font-sans text-text-main relative overflow-hidden">
      {/* mobile overlay */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
        />
      )}

      {/* sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <Sidebar onMobileClose={() => setIsSidebarOpen(false)} />
      </div>

      {/* Mobile RightPanel Overlay */}
      {isRightPanelOpen && (
        <div
          onClick={() => setIsRightPanelOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 xl:hidden backdrop-blur-sm"
        />
      )}

      

      {/* main content */}
      <main className={`flex-1 md:ml-20 main-content right-panel-transition p-4 md:p-8 overflow-y-auto h-screen relative z-0 `}>
        {/* ── header ── */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          {/* mobile top bar */}
          <div className="flex items-center justify-between w-full md:hidden mb-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 bg-surface rounded-xl text-text-secondary hover:text-primary transition-colors border border-border/50"
            >
              <Menu size={24} />
            </button>
            <div className="flex items-center gap-2">
              <img src="/logo.jpeg" alt="Mantessa" className="w-8 h-8 rounded-lg object-contain" />
              <span className="font-bold text-lg text-text-main">Mantessa</span>
            </div>
            <button
              onClick={() => setIsRightPanelOpen(true)}
              className="p-2 bg-surface rounded-xl text-text-secondary hover:text-primary transition-colors border border-border/50"
            >
              <Filter size={24} />
            </button>
          </div>

          {/* search */}
          <div className="relative w-full md:w-96 group">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors"
              size={20}
            />
            <input
              type="text"
              placeholder="Search tasks, notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-surface border border-transparent focus:bg-surface focus:border-primary/20 focus:ring-4 focus:ring-primary/5 rounded-2xl text-text-main shadow-card hover:shadow-soft transition-all outline-none placeholder:text-text-muted"
            />
          </div>

          {/* right controls */}
          <div className="hidden md:flex items-center gap-8">
            <button
              onClick={toggleNudges}
              className="relative p-3 bg-surface rounded-xl text-text-secondary hover:text-primary hover:shadow-soft transition-all duration-200 border border-transparent hover:border-border/50"
            >
              <Sparkles size={22} />
              {nudgeCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold border-2 border-surface">
                  {nudgeCount > 9 ? "9+" : nudgeCount}
                </span>
              )}
            </button>
            <button
              onClick={toggleRightPanel}
              className="p-3 bg-surface rounded-xl text-text-secondary hover:text-primary hover:shadow-soft transition-all duration-200 border border-transparent hover:border-border/50"
              title={isRightPanelOpenDesktop ? "Close Right Panel" : "Open Right Panel"}
            >
              {isRightPanelOpenDesktop ? <PanelRightClose size={22} /> : <PanelRightOpen size={22} />}
            </button>
            <div className="flex items-center gap-4 pl-8 border-l border-border/60">
              <div className="text-right hidden lg:block">
                <p className="text-sm font-bold text-text-main tracking-tight">
                  {user?.username || "Student"}
                </p>
                <p className="text-xs text-text-secondary font-medium">
                  Level 1 Scholar
                </p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-bold text-lg shadow-inner cursor-pointer hover:scale-105 transition-transform">
                {user?.avatar ? <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" style={{ borderRadius: 'inherit' }} /> : (user?.username ? user.username[0].toUpperCase() : "A")}
              </div>
            </div>
          </div>
        </header>

        {/* ── title row ── */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold">Sticky Notes</h1>
              <p className="text-sm text-text-muted mt-0.5">
                {filtered.length} {filtered.length === 1 ? "note" : "notes"}
                {activeCategory !== "All" && ` in ${activeCategory}`}
              </p>
            </div>

            {/* category pills */}
            <div className="flex bg-background rounded-xl p-1 shadow-inner overflow-x-auto">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                    activeCategory === cat
                      ? "bg-surface shadow-soft text-text-main"
                      : "text-text-muted hover:text-text-secondary"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={18} /> New Note
          </button>
        </div>

        {/* ── loading state ── */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 size={36} className="text-primary animate-spin" />
            <p className="text-text-muted text-sm">Loading your notes...</p>
          </div>
        )}

        {/* ── masonry grid ── */}
        {!loading && filtered.length > 0 && (
          <div className="columns-1 sm:columns-2 xl:columns-3 gap-5 [column-fill:balance]">
            <AnimatePresence mode="popLayout">
              {filtered.map((note) => {
                const c = palette[note.color] || palette.emerald;
                const isChecklist = note.type === "checklist";
                const totalItems = isChecklist ? (note.items || []).length : 0;
                const doneItems = isChecklist
                  ? (note.items || []).filter((i) => i.done).length
                  : 0;
                const progress =
                  totalItems > 0
                    ? Math.round((doneItems / totalItems) * 100)
                    : 0;

                return (
                  <motion.div
                    key={note._id}
                    layout
                    initial={{ opacity: 0, y: 16, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.93, y: -8 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className={`break-inside-avoid mb-5 group relative ${c.card} rounded-2xl border ${c.border} ${c.hoverBorder} ${c.glow} backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 overflow-hidden`}
                  >
                    {/* ─ top accent stripe ─ */}
                    <div className={`h-0.5 w-full ${c.accent} opacity-60`} />

                    {/* ─ card content ─ */}
                    <div className="p-5">
                      {/* header row: type badge + category | actions */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {/* type icon badge */}
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider ${c.typeBg} ${c.typeText}`}
                          >
                            {isChecklist ? (
                              <ClipboardList size={11} />
                            ) : (
                              <FileText size={11} />
                            )}
                            {isChecklist ? "Checklist" : "Note"}
                          </span>

                          {/* category tag */}
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider ${c.labelBg} ${c.label}`}
                          >
                            <Tag size={9} />
                            {note.label || note.category}
                          </span>

                          {note.pinned && (
                            <Pin
                              size={13}
                              className={`${c.label} -rotate-45`}
                            />
                          )}
                        </div>

                        {/* action buttons */}
                        <div className="flex items-center gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
                          <button
                            onClick={() => openEditModal(note)}
                            className="p-1.5 rounded-lg hover:bg-surface/80 text-text-muted hover:text-primary transition-colors"
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteNote(note._id)}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-text-muted hover:text-red-400 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* title */}
                      {note.title && (
                        <h3
                          className={`font-bold text-[15px] leading-snug mb-2 ${c.title} line-clamp-2`}
                        >
                          {note.title}
                        </h3>
                      )}

                      {/* body content */}
                      <div className="mb-3">{renderBody(note)}</div>

                      {/* checklist progress bar */}
                      {isChecklist && totalItems > 0 && (
                        <div className="mt-1 mb-3">
                          <div className="flex items-center justify-between mb-1.5">
                            <span
                              className={`text-[11px] font-medium ${c.meta}`}
                            >
                              {doneItems}/{totalItems} completed
                            </span>
                            <span
                              className={`text-[11px] font-bold ${c.label}`}
                            >
                              {progress}%
                            </span>
                          </div>
                          <div
                            className={`h-1.5 w-full rounded-full ${c.progressBg} overflow-hidden`}
                          >
                            <div
                              className={`h-full rounded-full ${c.progressFill} transition-all duration-500 ease-out`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* footer: timestamp */}
                      <div
                        className={`flex items-center gap-1.5 pt-3 border-t ${isDarkMode ? "border-white/5" : "border-black/5"}`}
                      >
                        <Clock size={11} className={c.meta} />
                        <p className={`text-[11px] font-medium ${c.meta}`}>
                          {note.updatedAt
                            ? new Date(note.updatedAt).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                },
                              )
                            : "Just now"}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* ── empty state ── */}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-2">
              <StickyNote size={36} className="text-primary/60" />
            </div>
            <h3 className="text-lg font-semibold text-text-main">
              {searchQuery ? "No matching notes" : "No notes yet"}
            </h3>
            <p className="text-sm text-text-muted text-center max-w-xs">
              {searchQuery
                ? `No notes match "${searchQuery}". Try a different search.`
                : "Create your first sticky note to start organizing your thoughts."}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowAddModal(true)}
                className="btn-primary flex items-center gap-2 mt-2"
              >
                <Plus size={18} /> Create Note
              </button>
            )}
          </div>
        )}
      </main>

      {/* Add Note Modal */}
      { showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-60 flex items-center justify-center p-4">
          <div className="bg-surface rounded-3xl p-6 w-full max-w-md shadow-xl border border-border/50 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-text-main">New Note</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-text-muted hover:text-text-main"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateNote} className="space-y-4">
              {/* Note type toggle */}
              <div>
                <label className="text-sm font-medium text-text-secondary mb-1 block">
                  Type
                </label>
                <div className="flex bg-background rounded-xl p-1 border border-border/50">
                  <button
                    type="button"
                    onClick={() => setNewNote({ ...newNote, type: "text" })}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      newNote.type === "text"
                        ? "bg-surface shadow-soft text-text-main"
                        : "text-text-muted hover:text-text-secondary"
                    }`}
                  >
                    <Type size={16} /> Text
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setNewNote({ ...newNote, type: "checklist" })
                    }
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      newNote.type === "checklist"
                        ? "bg-surface shadow-soft text-text-main"
                        : "text-text-muted hover:text-text-secondary"
                    }`}
                  >
                    <ListChecks size={16} /> Checklist
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-text-secondary mb-1 block">
                  Title
                </label>
                <input
                  type="text"
                  value={newNote.title}
                  onChange={(e) =>
                    setNewNote({ ...newNote, title: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-background border border-border/50 rounded-xl text-text-main focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Note title..."
                  autoFocus
                />
              </div>

              {/* Conditional: text body or checklist items */}
              {newNote.type === "text" ? (
                <div>
                  <label className="text-sm font-medium text-text-secondary mb-1 block">
                    Content
                  </label>
                  <textarea
                    value={newNote.body}
                    onChange={(e) =>
                      setNewNote({ ...newNote, body: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-background border border-border/50 rounded-xl text-text-main focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none h-32"
                    placeholder="Write your note..."
                  />
                </div>
              ) : (
                <div>
                  <label className="text-sm font-medium text-text-secondary mb-1 block">
                    Description
                  </label>
                  <textarea
                    value={newNote.body}
                    onChange={(e) =>
                      setNewNote({ ...newNote, body: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-background border border-border/50 rounded-xl text-text-main focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none h-20 mb-3"
                    placeholder="Brief description of this task..."
                  />
                  <label className="text-sm font-medium text-text-secondary mb-1 block">
                    Subtasks
                  </label>
                  {/* Existing items list */}
                  {newNote.items.length > 0 && (
                    <ul className="space-y-2 mb-3">
                      {newNote.items.map((item, idx) => (
                        <li
                          key={idx}
                          className="flex items-center gap-3 px-3 py-2 bg-background rounded-lg border border-border/30"
                        >
                          <Circle
                            size={18}
                            className="text-text-muted shrink-0"
                          />
                          <span className="flex-1 text-sm text-text-main">
                            {item.text}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeSubtaskFromNew(idx)}
                            className="text-red-400 hover:text-red-500 shrink-0"
                          >
                            <XCircle size={16} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {/* Add new subtask input */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newSubtask}
                      onChange={(e) => setNewSubtask(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addSubtaskToNew();
                        }
                      }}
                      className="flex-1 px-4 py-3 bg-background border border-border/50 rounded-xl text-text-main focus:outline-none focus:ring-2 focus:ring-primary/30"
                      placeholder="Add a subtask..."
                    />
                    <button
                      type="button"
                      onClick={addSubtaskToNew}
                      className="p-3 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-colors"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-text-secondary mb-1 block">
                    Category
                  </label>
                  <select
                    value={newNote.category}
                    onChange={(e) =>
                      setNewNote({ ...newNote, category: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-background border border-border/50 rounded-xl text-text-main focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="Work">Work</option>
                    <option value="Study">Study</option>
                    <option value="Personal">Personal</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-text-secondary mb-1 block">
                    Color
                  </label>
                  <div className="flex gap-2 mt-1">
                    {["emerald", "purple", "amber", "blue", "rose"].map(
                      (clr) => (
                        <button
                          key={clr}
                          type="button"
                          onClick={() => setNewNote({ ...newNote, color: clr })}
                          className={`w-8 h-8 rounded-full transition-all ${
                            clr === "emerald"
                              ? "bg-emerald-400"
                              : clr === "purple"
                                ? "bg-purple-400"
                                : clr === "amber"
                                  ? "bg-amber-400"
                                  : clr === "blue"
                                    ? "bg-blue-400"
                                    : "bg-rose-400"
                          } ${newNote.color === clr ? "ring-2 ring-offset-2 ring-offset-surface ring-primary scale-110" : "opacity-60 hover:opacity-100"}`}
                        />
                      ),
                    )}
                  </div>
                </div>
              </div>
              <button type="submit" className="w-full btn-primary py-3 mt-2">
                Create Note
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Note Modal */}
      {editingNote && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-60 flex items-center justify-center p-4">
          <div className="bg-surface rounded-3xl p-6 w-full max-w-md shadow-xl border border-border/50 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-text-main">Edit Note</h2>
              <button
                onClick={() => setEditingNote(null)}
                className="text-text-muted hover:text-text-main"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              {/* Title */}
              <div>
                <label className="text-sm font-medium text-text-secondary mb-1 block">
                  Title
                </label>
                <input
                  type="text"
                  value={editingNote.title || ""}
                  onChange={(e) =>
                    setEditingNote({ ...editingNote, title: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-background border border-border/50 rounded-xl text-text-main focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Note title..."
                  autoFocus
                />
              </div>

              {/* Conditional body or checklist */}
              {editingNote.type === "checklist" ? (
                <div>
                  <label className="text-sm font-medium text-text-secondary mb-1 block">
                    Description
                  </label>
                  <textarea
                    value={editingNote.body || ""}
                    onChange={(e) =>
                      setEditingNote({ ...editingNote, body: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-background border border-border/50 rounded-xl text-text-main focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none h-20 mb-3"
                    placeholder="Brief description of this task..."
                  />
                  <label className="text-sm font-medium text-text-secondary mb-1 block">
                    Subtasks
                  </label>
                  {editingNote.items.length > 0 && (
                    <ul className="space-y-2 mb-3">
                      {editingNote.items.map((item, idx) => (
                        <li
                          key={idx}
                          className="flex items-center gap-3 px-3 py-2 bg-background rounded-lg border border-border/30"
                        >
                          <button
                            type="button"
                            onClick={() => toggleEditItem(idx)}
                            className="shrink-0"
                          >
                            {item.done ? (
                              <CheckCircle2
                                size={18}
                                className="text-primary"
                              />
                            ) : (
                              <Circle size={18} className="text-text-muted" />
                            )}
                          </button>
                          <span
                            className={`flex-1 text-sm text-text-main ${
                              item.done ? "line-through opacity-60" : ""
                            }`}
                          >
                            {item.text}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeEditSubtask(idx)}
                            className="text-red-400 hover:text-red-500 shrink-0"
                          >
                            <XCircle size={16} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editSubtask}
                      onChange={(e) => setEditSubtask(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addEditSubtask();
                        }
                      }}
                      className="flex-1 px-4 py-3 bg-background border border-border/50 rounded-xl text-text-main focus:outline-none focus:ring-2 focus:ring-primary/30"
                      placeholder="Add a subtask..."
                    />
                    <button
                      type="button"
                      onClick={addEditSubtask}
                      className="p-3 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-colors"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-sm font-medium text-text-secondary mb-1 block">
                    Content
                  </label>
                  <textarea
                    value={editingNote.body || ""}
                    onChange={(e) =>
                      setEditingNote({ ...editingNote, body: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-background border border-border/50 rounded-xl text-text-main focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none h-32"
                    placeholder="Write your note..."
                  />
                </div>
              )}

              {/* Category + Color */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-text-secondary mb-1 block">
                    Category
                  </label>
                  <select
                    value={editingNote.category || "Personal"}
                    onChange={(e) =>
                      setEditingNote({
                        ...editingNote,
                        category: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 bg-background border border-border/50 rounded-xl text-text-main focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="Work">Work</option>
                    <option value="Study">Study</option>
                    <option value="Personal">Personal</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-text-secondary mb-1 block">
                    Color
                  </label>
                  <div className="flex gap-2 mt-1">
                    {["emerald", "purple", "amber", "blue", "rose"].map(
                      (clr) => (
                        <button
                          key={clr}
                          type="button"
                          onClick={() =>
                            setEditingNote({ ...editingNote, color: clr })
                          }
                          className={`w-8 h-8 rounded-full transition-all ${
                            clr === "emerald"
                              ? "bg-emerald-400"
                              : clr === "purple"
                                ? "bg-purple-400"
                                : clr === "amber"
                                  ? "bg-amber-400"
                                  : clr === "blue"
                                    ? "bg-blue-400"
                                    : "bg-rose-400"
                          } ${editingNote.color === clr ? "ring-2 ring-offset-2 ring-offset-surface ring-primary scale-110" : "opacity-60 hover:opacity-100"}`}
                        />
                      ),
                    )}
                  </div>
                </div>
              </div>

              <button type="submit" className="w-full btn-primary py-3 mt-2">
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}

      {/* mobile FAB */}
      <button
        onClick={() => setShowAddModal(true)}
        className="xl:hidden fixed bottom-6 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-glow flex items-center justify-center z-50 hover:scale-105 transition-transform"
      >
        <Plus size={24} />
      </button>

      {/* Nudges Panel */}
      <NudgesPanel />
    
      {/* right panel */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-full sm:w-80 transform transition-transform duration-300 ease-in-out shrink-0 ${isRightPanelOpen ? "translate-x-0" : "translate-x-full"} ${isRightPanelOpenDesktop ? "xl:relative xl:transform-none xl:translate-x-0" : "xl:fixed xl:translate-x-full"}`}
      >
        <RightPanel onClose={() => setIsRightPanelOpen(false)} />
      </div>
</div>
  );
};

export default StickyNotes;
 

