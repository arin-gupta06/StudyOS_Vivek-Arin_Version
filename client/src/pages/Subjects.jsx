import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import RightPanel from "../components/RightPanel";
import {
  Search,
  Bell,
  Plus,
  BookOpen,
  Clock,
  CheckCircle,
  BarChart3,
  ChevronRight,
  Filter,
  SortAsc,
  X,
  Menu,
  Sparkles,
  PanelRightOpen,
  PanelRightClose,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useNudgeStore } from "../store/nudgeStore";
import { useLayoutStore } from "../store/layoutStore";
import NudgesPanel from "../components/NudgesPanel";

const API = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/subjects`;
const axiosCfg = { withCredentials: true };

const Subjects = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isRightPanelOpen: isRightPanelOpenDesktop, toggleRightPanel } = useLayoutStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSubject, setNewSubject] = useState({ name: "", icon: "📚" });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);

  const {
    toggleOpen: toggleNudges,
    getCount: getNudgeCount,
    refresh: refreshNudges,
  } = useNudgeStore();
  const nudgeCount = getNudgeCount();

  // Fetch subjects from API
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const { data } = await axios.get(API, axiosCfg);
        setSubjects(data);
      } catch (err) {
        console.error("Failed to fetch subjects:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSubjects();
    refreshNudges();
  }, []);

  // Create subject
  const handleCreateSubject = async (e) => {
    e.preventDefault();
    if (!newSubject.name.trim()) return;
    try {
      const { data } = await axios.post(API, newSubject, axiosCfg);
      setSubjects((prev) => [data, ...prev]);
      setNewSubject({ name: "", icon: "📚" });
      setShowAddModal(false);
    } catch (err) {
      console.error("Failed to create subject:", err);
    }
  };

  // Delete subject
  const handleDeleteSubject = async (id) => {
    try {
      await axios.delete(`${API}/${id}`, axiosCfg);
      setSubjects((prev) => prev.filter((s) => s._id !== id));
      if (selectedSubject?._id === id) setSelectedSubject(null);
    } catch (err) {
      console.error("Failed to delete subject:", err);
    }
  };

  const handleFeatureClick = (feature) => {
    alert(`${feature} feature is coming soon!`);
  };

  const filters = [
    { key: "all", label: "All Subjects" },
    { key: "in-progress", label: "In Progress" },
    { key: "needs-attention", label: "Needs Attention" },
    { key: "almost-done", label: "Almost Done" },
    { key: "completed", label: "Completed" },
  ];

  const filteredSubjects = subjects.filter((s) => {
    const matchesSearch = s.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === "all" || s.status === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status) => {
    const styles = {
      "in-progress": {
        bg: "bg-blue-500/10",
        text: "text-blue-400",
        label: "In Progress",
      },
      "needs-attention": {
        bg: "bg-amber-500/10",
        text: "text-amber-400",
        label: "Needs Attention",
      },
      "almost-done": {
        bg: "bg-emerald-500/10",
        text: "text-emerald-400",
        label: "Almost Done",
      },
      completed: {
        bg: "bg-green-500/10",
        text: "text-green-400",
        label: "Completed",
      },
    };
    return styles[status] || styles["in-progress"];
  };

  // ── Summary Stats ────────────────────────────────────────────────
  const totalSubjects = subjects.length;
  const totalStudyHours = subjects.reduce((acc, s) => acc + s.studyHours, 0);
  const avgProgress = Math.round(
    subjects.reduce((acc, s) => acc + s.progress, 0) / totalSubjects,
  );
  const completedSubjects = subjects.filter(
    (s) => s.status === "completed",
  ).length;

  return (
    <div className="min-h-screen bg-background flex font-sans text-text-main relative overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm transition-opacity"
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <Sidebar onMobileClose={() => setIsSidebarOpen(false)} />
      </div>

      <main className={`flex-1 md:ml-20 p-4 md:p-8 overflow-y-auto h-screen relative z-0 `}>
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          {/* Mobile top bar */}
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

          <div className="relative w-full md:w-96 group">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors"
              size={20}
            />
            <input
              type="text"
              placeholder="Search subjects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-surface border border-transparent focus:bg-surface focus:border-primary/20 focus:ring-4 focus:ring-primary/5 rounded-2xl text-text-main shadow-card hover:shadow-soft transition-all outline-none placeholder:text-text-muted"
            />
          </div>

          <div className="hidden md:flex items-center gap-6">
            <button
              onClick={toggleNudges}
              className="relative p-2 text-text-secondary hover:text-primary transition-colors hover:bg-surface-hover rounded-xl shadow-inner border border-transparent hover:border-border/50"
            >
              <Sparkles size={24} />
              {nudgeCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold border-2 border-surface">
                  {nudgeCount > 9 ? "9+" : nudgeCount}
                </span>
              )}
            </button>
            <button
              onClick={toggleRightPanel}
              className="p-2 text-text-secondary hover:text-primary transition-colors hover:bg-surface-hover rounded-xl shadow-inner border border-transparent hover:border-border/50"
              title={isRightPanelOpenDesktop ? "Close Right Panel" : "Open Right Panel"}
            >
              {isRightPanelOpenDesktop ? <PanelRightClose size={24} /> : <PanelRightOpen size={24} />}
            </button>
            <div className="flex items-center gap-3 pl-6 border-l border-border/50">
              <div className="text-right hidden lg:block">
                <p className="text-sm font-bold text-text-main">
                  {user?.username || "Arin GUPTA"}
                </p>
                <p className="text-xs text-text-secondary">Level 1 Scholar</p>
              </div>
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-bold cursor-pointer hover:bg-primary/20 transition-all">
                {user?.avatar ? <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" style={{ borderRadius: 'inherit' }} /> : (user?.username ? user.username[0].toUpperCase() : "A")}
              </div>
            </div>
          </div>
        </header>

        {/* Page Title & Add Button */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-text-main">My Subjects</h1>
            <p className="text-sm text-text-secondary mt-1">
              Track your progress across all subjects
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 btn-primary"
          >
            <Plus size={18} />
            Add Subject
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-8">
          {[
            {
              label: "Total Subjects",
              value: totalSubjects,
              icon: "📚",
              trend: `${completedSubjects} done`,
            },
            {
              label: "Study Hours",
              value: `${totalStudyHours.toFixed(1)}h`,
              icon: "⏱️",
              trend: "This semester",
            },
            {
              label: "Avg Progress",
              value: `${avgProgress}%`,
              icon: "📈",
              trend: "Across all",
            },
            {
              label: "Completed",
              value: completedSubjects,
              icon: "✅",
              trend: `of ${totalSubjects}`,
            },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="card"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="text-2xl group-hover:scale-110 transition-transform duration-200">
                  {stat.icon}
                </span>
                <span className="text-xs font-bold text-text-secondary bg-surface-hover px-2 py-1 rounded-md shadow-inner">
                  {stat.trend}
                </span>
              </div>
              <h4 className="text-2xl font-bold text-text-main mb-1">
                {stat.value}
              </h4>
              <p className="text-xs text-text-secondary font-medium">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-1">
          {filters.map((filter) => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                activeFilter === filter.key
                  ? "bg-primary text-white shadow-glow border-none"
                  : "bg-surface text-text-secondary shadow-soft hover:shadow-card hover:text-primary border border-transparent"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Subject Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <AnimatePresence mode="popLayout">
            {filteredSubjects.map((subject, i) => {
              const badge = getStatusBadge(subject.status);
              return (
                <motion.div
                  key={subject._id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ y: -4 }}
                  onClick={() =>
                    setSelectedSubject(
                      selectedSubject?._id === subject._id ? null : subject,
                    )
                  }
                  className={`card p-6 cursor-pointer transition-all duration-300 ${
                    selectedSubject?._id === subject._id
                      ? "shadow-inner border-transparent"
                      : "hover:shadow-float border-transparent"
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-xl ${subject.bgLight} flex items-center justify-center text-xl`}
                      >
                        {subject.icon}
                      </div>
                      <div>
                        <h3 className="font-bold text-text-main text-sm">
                          {subject.name}
                        </h3>
                        <p className="text-xs text-text-secondary mt-0.5">
                          {subject.completedChapters}/{subject.totalChapters}{" "}
                          chapters
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${badge.bg} ${badge.text}`}
                    >
                      {badge.label}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs text-text-secondary font-medium">
                        Progress
                      </span>
                      <span className="text-xs font-bold text-text-main">
                        {subject.progress}%
                      </span>
                    </div>
                    <div className="w-full bg-background rounded-full h-2 shadow-inner">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${subject.progress}%` }}
                        transition={{ duration: 0.8, delay: i * 0.1 }}
                        className={`h-2 rounded-full bg-linear-to-r ${subject.color}`}
                      />
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="flex items-center gap-4 text-xs text-text-secondary">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle size={13} className={subject.textColor} />
                      <span>
                        {subject.completedTasks}/{subject.totalTasks} tasks
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock size={13} className={subject.textColor} />
                      <span>{subject.studyHours}h studied</span>
                    </div>
                    <div className="flex items-center gap-1.5 ml-auto">
                      <span className="text-text-secondary">
                        {subject.lastStudied}
                      </span>
                    </div>
                  </div>

                  {/* Expanded Chapter View */}
                  <AnimatePresence>
                    {selectedSubject?._id === subject._id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-5 pt-5 border-t border-border space-y-3">
                          <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                            Chapters
                          </h4>
                          {subject.chapters.map((ch, ci) => (
                            <div
                              key={ci}
                              className="flex items-center gap-3 p-3 rounded-xl bg-background shadow-inner hover:bg-surface-hover transition-colors group/ch"
                            >
                              <div
                                className={`w-8 h-8 rounded-lg ${ch.progress === 100 ? "bg-green-500/20" : subject.bgLight} flex items-center justify-center shrink-0`}
                              >
                                {ch.progress === 100 ? (
                                  <CheckCircle
                                    size={14}
                                    className="text-green-400"
                                  />
                                ) : (
                                  <BookOpen
                                    size={14}
                                    className={subject.textColor}
                                  />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-semibold text-text-main truncate">
                                    {ch.name}
                                  </span>
                                  <span className="text-[11px] font-bold text-text-secondary ml-2">
                                    {ch.progress}%
                                  </span>
                                </div>
                                <div className="w-full bg-background rounded-full h-1 shadow-inner">
                                  <div
                                    className={`h-1 rounded-full transition-all ${ch.progress === 100 ? "bg-green-400" : "bg-primary"}`}
                                    style={{ width: `${ch.progress}%` }}
                                  />
                                </div>
                              </div>
                              <span className="text-[10px] text-text-secondary whitespace-nowrap">
                                {ch.completed}/{ch.tasks} tasks
                              </span>
                              <ChevronRight
                                size={14}
                                className="text-text-muted group-hover/ch:text-primary transition-colors shrink-0"
                              />
                            </div>
                          ))}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFeatureClick(`Study ${subject.name}`);
                            }}
                            className="w-full mt-2 py-2.5 rounded-xl bg-primary/10 text-primary text-sm font-bold hover:bg-primary/20 transition-colors"
                          >
                            Continue Studying
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Empty State */}
        {filteredSubjects.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="text-5xl mb-4">📭</div>
            <h3 className="text-lg font-bold text-text-main mb-2">
              No subjects found
            </h3>
            <p className="text-sm text-text-secondary">
              Try adjusting your search or filters
            </p>
          </motion.div>
        )}
      </main>

      {/* Add Subject Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-surface rounded-3xl p-6 w-full max-w-md shadow-xl border border-border/50">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-text-main">
                Add New Subject
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-text-muted hover:text-text-main"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateSubject} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-text-secondary mb-1 block">
                  Subject Name *
                </label>
                <input
                  type="text"
                  value={newSubject.name}
                  onChange={(e) =>
                    setNewSubject({ ...newSubject, name: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-background border border-border/50 rounded-xl text-text-main focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="e.g. Organic Chemistry"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm font-medium text-text-secondary mb-1 block">
                  Icon
                </label>
                <div className="flex gap-2 flex-wrap">
                  {["📚", "📐", "⚛️", "🧪", "💻", "📊", "🎨", "🌍"].map(
                    (icon) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setNewSubject({ ...newSubject, icon })}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all ${
                          newSubject.icon === icon
                            ? "bg-primary/20 ring-2 ring-primary"
                            : "bg-background hover:bg-surface-hover"
                        }`}
                      >
                        {icon}
                      </button>
                    ),
                  )}
                </div>
              </div>
              <button type="submit" className="w-full btn-primary py-3 mt-2">
                Create Subject
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Right Panel */}
      {isRightPanelOpen && (
        <div
          onClick={() => setIsRightPanelOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 xl:hidden backdrop-blur-sm transition-opacity"
        />
      )}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-full sm:w-80 transform transition-transform duration-300 ease-in-out shrink-0 ${isRightPanelOpen ? "translate-x-0" : "translate-x-full"} ${isRightPanelOpenDesktop ? "xl:relative xl:transform-none xl:translate-x-0" : "xl:fixed xl:translate-x-full"}`}
      >
        <RightPanel onClose={() => setIsRightPanelOpen(false)} />
      </div>

      {/* Nudges Panel */}
      <NudgesPanel />
    </div>
  );
};

export default Subjects;
