import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import RightPanel from "../components/RightPanel";
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  Search,
  Bell,
  Plus,
  X,
  Edit3,
  Trash2,
  Clock,
  Calendar as CalendarIcon,
  BellRing,
  BellOff,
  Check,
  AlertCircle,
  Settings,
  Filter,
  Sparkles,
  PanelRightOpen,
  PanelRightClose,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNudgeStore } from "../store/nudgeStore";
import { useLayoutStore } from "../store/layoutStore";
import NudgesPanel from "../components/NudgesPanel";

const API = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/events`;
const axiosCfg = { withCredentials: true };

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const SHORT_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const WEEKDAYS_FULL = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

// Event type → color classes
const typeColor = {
  Quiz: "bg-blue-100 text-blue-600 border-blue-200",
  Exam: "bg-red-100 text-red-600 border-red-200",
  Assignment: "bg-green-100 text-green-700 border-green-200",
  Reminder: "bg-yellow-100 text-yellow-700 border-yellow-200",
};
const typeDot = {
  Quiz: "bg-blue-500",
  Exam: "bg-red-500",
  Assignment: "bg-green-500",
  Reminder: "bg-yellow-500",
};

// ─── Helpers ──────────────────────────────────────────────────────────

function isSameDay(d1, d2) {
  return (
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear()
  );
}

function formatDate(date) {
  const d = new Date(date);
  return `${WEEKDAYS_FULL[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function formatDateShort(date) {
  const d = new Date(date);
  return `${SHORT_MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function dateToInputValue(date) {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function getEventsForDate(events, date) {
  return events.filter((ev) => isSameDay(new Date(ev.date), date));
}

// Build month grid
function buildCalendar(year, month, events) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();
  const today = new Date();

  const cells = [];
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, daysInPrev - i);
    cells.push({
      num: daysInPrev - i,
      date: d,
      isCurrentMonth: false,
      events: getEventsForDate(events, d),
    });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const isToday = isSameDay(date, today);
    cells.push({
      num: d,
      date,
      isCurrentMonth: true,
      active: isToday,
      events: getEventsForDate(events, date),
    });
  }
  const remainder = cells.length % 7;
  if (remainder > 0) {
    for (let i = 1; i <= 7 - remainder; i++) {
      const d = new Date(year, month + 1, i);
      cells.push({
        num: i,
        date: d,
        isCurrentMonth: false,
        events: getEventsForDate(events, d),
      });
    }
  }
  return cells;
}

// Build week grid containing the given date
function buildWeek(date, events) {
  const day = date.getDay();
  const sunday = new Date(date);
  sunday.setDate(date.getDate() - day);
  const today = new Date();
  const cells = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    cells.push({
      num: d.getDate(),
      date: d,
      isCurrentMonth: true,
      active: isSameDay(d, today),
      events: getEventsForDate(events, d),
      dayName: WEEKDAYS[i],
      fullDate: formatDateShort(d),
    });
  }
  return cells;
}

// Hours for day view
const HOURS = Array.from({ length: 24 }, (_, i) => {
  const h = i % 12 || 12;
  const ampm = i < 12 ? "AM" : "PM";
  return `${h}:00 ${ampm}`;
});

const CalendarPage = () => {
  const { user } = useAuth();
  const { isRightPanelOpen: isRightPanelOpenDesktop, toggleRightPanel } = useLayoutStore();
  const [view, setView] = useState("Month");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState(
    new Date(now.getFullYear(), now.getMonth(), now.getDate()),
  );
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDayOverlay, setShowDayOverlay] = useState(false);
  const [overlayDate, setOverlayDate] = useState(null);
  const [showEventDetail, setShowEventDetail] = useState(false);
  const [detailEvent, setDetailEvent] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const [showReminderSettings, setShowReminderSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef(null);

  // Nudges
  const toggleNudges = useNudgeStore((s) => s.toggleOpen);
  const nudgeCount = useNudgeStore((s) => s.getCount());
  const refreshNudges = useNudgeStore((s) => s.refresh);

  // New event form
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    type: "Quiz",
    date: "",
    time: "",
    reminder: false,
    reminderMinutes: 30,
  });

  // Global reminder settings
  const [globalReminders, setGlobalReminders] = useState(() => {
    try {
      const saved = localStorage.getItem("calendarReminderSettings");
      return saved
        ? JSON.parse(saved)
        : { enabled: true, defaultMinutes: 30, sound: true, desktop: true };
    } catch {
      return { enabled: true, defaultMinutes: 30, sound: true, desktop: true };
    }
  });

  // Notification permission
  const [notifPermission, setNotifPermission] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "denied",
  );

  // Reminder tracking
  const notifiedRef = useRef(new Set());

  // ─── Fetch events ─────────────────────────────────────────────────
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { data } = await axios.get(API, axiosCfg);
        setEvents(data);
      } catch (err) {
        console.error("Failed to fetch events:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
    refreshNudges();
  }, []);

  // ─── Save global reminder settings ───────────────────────────────
  useEffect(() => {
    localStorage.setItem(
      "calendarReminderSettings",
      JSON.stringify(globalReminders),
    );
  }, [globalReminders]);

  // ─── Request notification permission ──────────────────────────────
  const requestNotifPermission = async () => {
    if (
      typeof Notification !== "undefined" &&
      Notification.permission === "default"
    ) {
      const perm = await Notification.requestPermission();
      setNotifPermission(perm);
    }
  };

  // ─── Close notification dropdown on outside click ────────────────
  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showNotifications]);

  // ─── Reminder check loop ────────────────────────────────────────
  useEffect(() => {
    if (!globalReminders.enabled) return;
    const interval = setInterval(() => {
      const now = new Date();
      events.forEach((ev) => {
        if (!ev.reminder) return;
        if (notifiedRef.current.has(ev._id)) return;
        const evDate = new Date(ev.date);
        if (ev.time) {
          const [h, m] = ev.time.split(":").map(Number);
          evDate.setHours(h, m, 0, 0);
        } else {
          evDate.setHours(9, 0, 0, 0);
        }
        const reminderTime = new Date(
          evDate.getTime() - (ev.reminderMinutes || 30) * 60 * 1000,
        );
        if (now >= reminderTime && now <= evDate) {
          notifiedRef.current.add(ev._id);
          if (
            globalReminders.desktop &&
            typeof Notification !== "undefined" &&
            Notification.permission === "granted"
          ) {
            new Notification(`📅 ${ev.title}`, {
              body: `${ev.type} - Starting ${ev.time || "today"}\n${ev.description || ""}`,
              icon: "/favicon.ico",
              tag: ev._id,
            });
          }
        }
      });
    }, 30000);
    return () => clearInterval(interval);
  }, [events, globalReminders]);

  // ─── CRUD ─────────────────────────────────────────────────────────
  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!newEvent.title.trim() || !newEvent.date) return;
    try {
      const payload = {
        ...newEvent,
        reminder: globalReminders.enabled ? newEvent.reminder : false,
        reminderMinutes: newEvent.reminder ? newEvent.reminderMinutes : 0,
      };
      const { data } = await axios.post(API, payload, axiosCfg);
      setEvents((prev) => [...prev, data]);
      setNewEvent({
        title: "",
        description: "",
        type: "Quiz",
        date: "",
        time: "",
        reminder: false,
        reminderMinutes: 30,
      });
      setShowAddModal(false);
    } catch (err) {
      console.error("Failed to create event:", err);
    }
  };

  const handleUpdateEvent = async (e) => {
    e.preventDefault();
    if (!editEvent || !editEvent.title.trim() || !editEvent.date) return;
    try {
      const { data } = await axios.put(
        `${API}/${editEvent._id}`,
        {
          title: editEvent.title,
          description: editEvent.description,
          type: editEvent.type,
          date: editEvent.date,
          time: editEvent.time,
          reminder: editEvent.reminder,
          reminderMinutes: editEvent.reminderMinutes,
        },
        axiosCfg,
      );
      setEvents((prev) => prev.map((ev) => (ev._id === data._id ? data : ev)));
      setShowEditModal(false);
      setEditEvent(null);
      if (showEventDetail && detailEvent && detailEvent._id === data._id)
        setDetailEvent(data);
    } catch (err) {
      console.error("Failed to update event:", err);
    }
  };

  const handleDeleteEvent = async (id) => {
    try {
      await axios.delete(`${API}/${id}`, axiosCfg);
      setEvents((prev) => prev.filter((ev) => ev._id !== id));
      setShowEventDetail(false);
      setDetailEvent(null);
    } catch (err) {
      console.error("Failed to delete event:", err);
    }
  };

  const toggleEventReminder = async (ev) => {
    try {
      const { data } = await axios.put(
        `${API}/${ev._id}`,
        {
          reminder: !ev.reminder,
          reminderMinutes: ev.reminderMinutes || globalReminders.defaultMinutes,
        },
        axiosCfg,
      );
      setEvents((prev) => prev.map((e) => (e._id === data._id ? data : e)));
      if (detailEvent && detailEvent._id === data._id) setDetailEvent(data);
    } catch (err) {
      console.error("Failed to toggle reminder:", err);
    }
  };

  // ─── Navigation ───────────────────────────────────────────────────
  const goNext = () => {
    if (view === "Month") {
      if (month === 11) {
        setMonth(0);
        setYear(year + 1);
      } else setMonth(month + 1);
    } else if (view === "Week") {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() + 7);
      setSelectedDate(d);
      setMonth(d.getMonth());
      setYear(d.getFullYear());
    } else {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() + 1);
      setSelectedDate(d);
      setMonth(d.getMonth());
      setYear(d.getFullYear());
    }
  };
  const goPrev = () => {
    if (view === "Month") {
      if (month === 0) {
        setMonth(11);
        setYear(year - 1);
      } else setMonth(month - 1);
    } else if (view === "Week") {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() - 7);
      setSelectedDate(d);
      setMonth(d.getMonth());
      setYear(d.getFullYear());
    } else {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() - 1);
      setSelectedDate(d);
      setMonth(d.getMonth());
      setYear(d.getFullYear());
    }
  };
  const goToday = () => {
    const t = new Date();
    setYear(t.getFullYear());
    setMonth(t.getMonth());
    setSelectedDate(new Date(t.getFullYear(), t.getMonth(), t.getDate()));
  };

  // ─── Filtered events ─────────────────────────────────────────────
  const filteredEvents = searchQuery.trim()
    ? events.filter(
        (ev) =>
          ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (ev.description &&
            ev.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
          ev.type.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : events;

  // ─── Calendar data ────────────────────────────────────────────────
  const monthDays = buildCalendar(year, month, filteredEvents);
  const weekDays = buildWeek(selectedDate, filteredEvents);
  const dayEvents = getEventsForDate(filteredEvents, selectedDate);

  // ─── Overlay helpers ──────────────────────────────────────────────
  const openDayOverlay = (date) => {
    setOverlayDate(date);
    setShowDayOverlay(true);
  };
  const openEventDetail = (ev) => {
    const full = events.find((e) => e._id === ev._id) || ev;
    setDetailEvent(full);
    setShowEventDetail(true);
  };
  const openEditModal = (ev) => {
    setEditEvent({
      ...ev,
      date: dateToInputValue(ev.date),
      time: ev.time || "",
      description: ev.description || "",
      reminder: ev.reminder || false,
      reminderMinutes: ev.reminderMinutes || 30,
    });
    setShowEditModal(true);
    setShowEventDetail(false);
  };
  const openAddForDate = (date) => {
    setNewEvent({
      title: "",
      description: "",
      type: "Quiz",
      date: dateToInputValue(date),
      time: "",
      reminder: false,
      reminderMinutes: globalReminders.defaultMinutes,
    });
    setShowAddModal(true);
    setShowDayOverlay(false);
  };

  // ─── View title ───────────────────────────────────────────────────
  const getTitle = () => {
    if (view === "Month") return `${MONTHS[month]} ${year}`;
    if (view === "Week") {
      const wk = buildWeek(selectedDate, []);
      return `${SHORT_MONTHS[wk[0].date.getMonth()]} ${wk[0].date.getDate()} – ${SHORT_MONTHS[wk[6].date.getMonth()]} ${wk[6].date.getDate()}, ${wk[6].date.getFullYear()}`;
    }
    return formatDate(selectedDate);
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

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <Sidebar onMobileClose={() => setIsSidebarOpen(false)} />
      </div>

      {/* Main */}
      <div className={`flex-1 flex flex-col md:ml-20 min-h-screen relative transition-all duration-300 z-10 `}>
        <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full  space-y-8">
          {/* Header */}
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center justify-between w-full md:hidden mb-4">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 bg-surface rounded-xl text-text-secondary hover:text-primary transition-colors border border-border/50"
              >
                <Menu size={24} />
              </button>
              <div className="flex items-center gap-2">
                <img src="/logo.jpeg" alt="Mantessa" className="w-8 h-8 rounded-lg object-contain" />
                <span className="font-bold text-lg text-text-main">
                  Mantessa
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowReminderSettings(true)}
                  className="p-2 bg-surface rounded-xl text-text-secondary hover:text-primary transition-colors border border-border/50"
                >
                  <Settings size={20} />
                </button>
                <button
                  onClick={() => setIsRightPanelOpen(true)}
                  className="p-2 bg-surface rounded-xl text-text-secondary hover:text-primary transition-colors border border-border/50"
                >
                  <Filter size={20} />
                </button>
              </div>
            </div>

            <div className="relative w-full md:w-96 group z-20">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors"
                size={20}
              />
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-10 py-3.5 bg-surface border border-transparent focus:bg-surface focus:border-primary/20 focus:ring-4 focus:ring-primary/5 rounded-2xl text-text-main shadow-card hover:shadow-soft transition-all outline-none placeholder:text-text-muted"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="hidden md:flex items-center gap-4 z-20">
              <button
                onClick={() => setShowReminderSettings(true)}
                className={`relative p-3 rounded-xl transition-all duration-200 border ${globalReminders.enabled ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20" : "bg-surface text-text-secondary border-transparent hover:text-text-main hover:border-border/50"}`}
                title="Reminder Settings"
              >
                {globalReminders.enabled ? (
                  <BellRing size={22} />
                ) : (
                  <BellOff size={22} />
                )}
                {globalReminders.enabled && (
                  <span className="absolute top-2 right-2.5 w-2 h-2 bg-green-500 rounded-full border-2 border-surface" />
                )}
              </button>
              <div className="relative" ref={notifRef}>
                <button
                  onClick={toggleNudges}
                  className="relative p-3 bg-surface rounded-xl text-text-secondary hover:text-primary hover:shadow-soft transition-all duration-200 border border-transparent hover:border-border/50"
                >
                  <Sparkles size={22} />
                  {nudgeCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full text-white text-xs flex items-center justify-center font-bold">
                      {nudgeCount}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-surface rounded-2xl shadow-xl border border-border/50 z-50 overflow-hidden">
                    <div className="p-4 border-b border-border/30 flex items-center justify-between">
                      <h3 className="text-sm font-bold text-text-main flex items-center gap-2">
                        <BellRing size={16} className="text-primary" /> Upcoming
                        Reminders
                      </h3>
                      <button
                        onClick={() => setShowNotifications(false)}
                        className="p-1 rounded-lg text-text-muted hover:text-text-main hover:bg-background transition-all"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {events
                        .filter((e) => e.reminder)
                        .sort((a, b) => new Date(a.date) - new Date(b.date))
                        .filter((e) => {
                          const evDate = new Date(e.date);
                          if (e.time) {
                            const [h, m] = e.time.split(":").map(Number);
                            evDate.setHours(h, m, 0, 0);
                          } else evDate.setHours(23, 59, 59, 999);
                          return evDate >= new Date();
                        }).length === 0 ? (
                        <div className="text-center py-8">
                          <BellOff
                            size={28}
                            className="mx-auto text-text-muted/40 mb-2"
                          />
                          <p className="text-sm text-text-muted">
                            No upcoming reminders
                          </p>
                        </div>
                      ) : (
                        events
                          .filter((e) => e.reminder)
                          .sort((a, b) => new Date(a.date) - new Date(b.date))
                          .filter((e) => {
                            const evDate = new Date(e.date);
                            if (e.time) {
                              const [h, m] = e.time.split(":").map(Number);
                              evDate.setHours(h, m, 0, 0);
                            } else evDate.setHours(23, 59, 59, 999);
                            return evDate >= new Date();
                          })
                          .map((ev) => (
                            <div
                              key={ev._id}
                              onClick={() => {
                                openEventDetail(ev);
                                setShowNotifications(false);
                              }}
                              className="p-3 border-b border-border/20 hover:bg-primary/5 transition-all cursor-pointer group"
                            >
                              <div className="flex items-start gap-3">
                                <div
                                  className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${typeDot[ev.type] || "bg-purple-500"}`}
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-text-main truncate group-hover:text-primary transition-colors">
                                    {ev.title}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-text-muted">
                                      {formatDateShort(ev.date)}
                                    </span>
                                    {ev.time && (
                                      <span className="text-xs text-text-muted flex items-center gap-1">
                                        <Clock size={10} />
                                        {ev.time}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-primary/70 mt-0.5 inline-block">
                                    {ev.reminderMinutes >= 1440
                                      ? `${ev.reminderMinutes / 1440}d`
                                      : ev.reminderMinutes >= 60
                                        ? `${ev.reminderMinutes / 60}h`
                                        : `${ev.reminderMinutes}m`}{" "}
                                    before
                                  </span>
                                </div>
                                <span
                                  className={`inline-flex px-1.5 py-0.5 text-[9px] font-bold rounded ${typeColor[ev.type]}`}
                                >
                                  {ev.type}
                                </span>
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                    {events.filter((e) => e.reminder).length > 0 && (
                      <div className="p-3 border-t border-border/30 bg-background/50">
                        <button
                          onClick={() => {
                            setShowReminderSettings(true);
                            setShowNotifications(false);
                          }}
                          className="w-full text-xs text-primary font-semibold hover:underline text-center"
                        >
                          Manage Reminder Settings
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={toggleRightPanel}
                className="p-3 bg-surface rounded-xl text-text-secondary hover:text-primary hover:shadow-soft transition-all duration-200 border border-transparent hover:border-border/50"
                title={isRightPanelOpenDesktop ? "Close Right Panel" : "Open Right Panel"}
              >
                {isRightPanelOpenDesktop ? <PanelRightClose size={22} /> : <PanelRightOpen size={22} />}
              </button>
              <div className="flex items-center gap-4 pl-4 border-l border-border/60">
                <div className="text-right hidden lg:block">
                  <p className="text-sm font-bold text-text-main tracking-tight">
                    {user?.username || "Arin"}
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

          {/* Calendar Container */}
          <div className="bg-surface rounded-2xl sm:rounded-3xl p-3 sm:p-6 md:p-8 shadow-card border border-border/50 w-full mb-8">
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-lg sm:text-2xl font-bold text-text-main">
                  {getTitle()}
                </h1>
                <div className="flex items-center gap-1 bg-background p-1 rounded-xl shadow-inner border border-transparent text-text-secondary">
                  <button
                    onClick={goPrev}
                    className="p-1.5 rounded-lg hover:bg-surface hover:text-primary hover:shadow-sm transition-all"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={goToday}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-surface hover:text-primary hover:shadow-sm transition-all"
                  >
                    Today
                  </button>
                  <button
                    onClick={goNext}
                    className="p-1.5 rounded-lg hover:bg-surface hover:text-primary hover:shadow-sm transition-all"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
                <button
                  onClick={() => {
                    setNewEvent({
                      ...newEvent,
                      date: dateToInputValue(selectedDate),
                      reminderMinutes: globalReminders.defaultMinutes,
                    });
                    setShowAddModal(true);
                  }}
                  className="ml-2 p-2 rounded-xl bg-primary text-white hover:bg-primary/90 transition-all shadow-sm flex items-center gap-1.5 text-sm font-semibold"
                >
                  <Plus size={18} /> Add Event
                </button>
              </div>

              <div className="flex bg-background p-1.5 rounded-xl shadow-inner border border-border/20">
                {["Month", "Week", "Day"].map((v) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={`px-3 sm:px-6 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-300 ${view === v ? "bg-surface text-primary shadow-soft" : "text-text-secondary hover:text-text-main"}`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* Loading */}
            {loading && (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            )}

            {/* ────── SEARCH RESULTS VIEW ────── */}
            {!loading && searchQuery.trim() && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-text-main flex items-center gap-2">
                    <Search size={18} className="text-primary" />
                    Search Results
                    <span className="text-sm font-normal text-text-muted">
                      — {filteredEvents.length} event
                      {filteredEvents.length !== 1 ? "s" : ""} found for "
                      {searchQuery}"
                    </span>
                  </h2>
                  <button
                    onClick={() => setSearchQuery("")}
                    className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
                  >
                    <X size={14} /> Clear Search
                  </button>
                </div>
                {filteredEvents.length === 0 ? (
                  <div className="text-center py-16 bg-background/50 rounded-2xl border border-border/30">
                    <Search
                      size={40}
                      className="mx-auto text-text-muted/30 mb-3"
                    />
                    <p className="text-text-muted font-medium">
                      No events found matching "{searchQuery}"
                    </p>
                    <p className="text-xs text-text-muted mt-1">
                      Try a different search term
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                    {[...filteredEvents]
                      .sort((a, b) => new Date(a.date) - new Date(b.date))
                      .map((ev) => (
                        <div
                          key={ev._id}
                          onClick={() => openEventDetail(ev)}
                          className="p-4 bg-background/80 rounded-2xl border border-border/30 hover:border-primary/30 hover:shadow-soft transition-all cursor-pointer group"
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-1.5 min-h-[44px] rounded-full flex-shrink-0 ${typeDot[ev.type] || "bg-purple-500"}`}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <p className="text-sm font-bold text-text-main group-hover:text-primary transition-colors">
                                  {ev.title}
                                </p>
                                <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                                  {ev.reminder && (
                                    <BellRing
                                      size={14}
                                      className="text-primary"
                                    />
                                  )}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openEditModal(ev);
                                    }}
                                    className="p-1 rounded-lg opacity-100 md:opacity-0 md:group-hover:opacity-100 text-text-muted hover:text-primary hover:bg-surface transition-all"
                                  >
                                    <Edit3 size={14} />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteEvent(ev._id);
                                    }}
                                    className="p-1 rounded-lg opacity-100 md:opacity-0 md:group-hover:opacity-100 text-text-muted hover:text-red-500 hover:bg-red-50 transition-all"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                              {ev.description && (
                                <p className="text-xs text-text-secondary mt-1 line-clamp-2">
                                  {ev.description}
                                </p>
                              )}
                              <div className="flex items-center gap-3 mt-2 flex-wrap">
                                <span
                                  className={`inline-flex px-2 py-0.5 text-[10px] font-bold rounded-md border ${typeColor[ev.type]}`}
                                >
                                  {ev.type}
                                </span>
                                <span className="text-xs text-text-muted flex items-center gap-1">
                                  <CalendarIcon size={11} />
                                  {formatDateShort(ev.date)}
                                </span>
                                {ev.time && (
                                  <span className="text-xs text-text-muted flex items-center gap-1">
                                    <Clock size={11} />
                                    {ev.time}
                                  </span>
                                )}
                                {ev.reminder && (
                                  <span className="text-xs text-primary/70 flex items-center gap-1">
                                    <BellRing size={11} />
                                    {ev.reminderMinutes >= 1440
                                      ? `${ev.reminderMinutes / 1440}d`
                                      : ev.reminderMinutes >= 60
                                        ? `${ev.reminderMinutes / 60}h`
                                        : `${ev.reminderMinutes}m`}{" "}
                                    before
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            {/* ────── MONTH VIEW ────── */}
            {!loading && !searchQuery.trim() && view === "Month" && (
              <>
                <div className="grid grid-cols-7 mb-4">
                  {WEEKDAYS.map((day) => (
                    <div
                      key={day}
                      className="text-center text-[10px] sm:text-xs font-bold text-text-muted tracking-wider sm:tracking-widest uppercase pb-2"
                    >
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 bg-border/30 gap-[1px] rounded-2xl overflow-hidden border border-border/50">
                  {monthDays.map((day, idx) => {
                    const isCurrent = day.isCurrentMonth;
                    const isToday = day.active;
                    const hasEvents = day.events.length > 0;
                    return (
                      <div
                        key={idx}
                        onClick={() => openDayOverlay(day.date)}
                        className={`min-h-[80px] sm:min-h-[110px] lg:min-h-[130px] p-1 sm:p-2 md:p-3 relative bg-surface hover:bg-primary/5 transition-all cursor-pointer group
                          ${!isCurrent ? "bg-background/30 opacity-60" : ""}`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span
                            className={`w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center rounded-full text-xs sm:text-sm font-bold transition-all
                            ${isToday ? "bg-primary text-white shadow-md scale-110" : isCurrent ? "text-text-main group-hover:text-primary" : "text-text-muted"}`}
                          >
                            {day.num}
                          </span>
                          {hasEvents && (
                            <div className="flex gap-0.5">
                              {day.events.slice(0, 3).map((ev, i) => (
                                <span
                                  key={i}
                                  className={`w-1.5 h-1.5 rounded-full ${typeDot[ev.type] || "bg-purple-500"}`}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                        {/* Mobile: colored dots */}
                        {day.events.length > 0 && (
                          <div className="flex gap-1 mt-1 sm:hidden flex-wrap justify-center">
                            {day.events.slice(0, 4).map((ev, i) => (
                              <span
                                key={i}
                                className={`w-2 h-2 rounded-full ${ev.type === "exam" ? "bg-red-500" : ev.type === "assignment" ? "bg-amber-500" : ev.type === "class" ? "bg-blue-500" : ev.type === "study" ? "bg-green-500" : "bg-purple-500"}`}
                              />
                            ))}
                          </div>
                        )}
                        <div className="space-y-1 mt-1 hidden sm:block">
                          {day.events.slice(0, 3).map((ev, eventIdx) => (
                            <div
                              key={eventIdx}
                              onClick={(e) => {
                                e.stopPropagation();
                                openEventDetail(ev);
                              }}
                              className={`px-2 py-1 text-xs font-semibold rounded-lg truncate shadow-sm transition-all hover:scale-[1.02] hover:shadow-md cursor-pointer border ${typeColor[ev.type] || "bg-purple-100 text-purple-700 border-purple-200"}`}
                            >
                              {ev.time && (
                                <span className="opacity-70 mr-1">
                                  {ev.time}
                                </span>
                              )}
                              {ev.title}
                            </div>
                          ))}
                          {day.events.length > 3 && (
                            <div className="text-xs text-text-muted font-medium pl-2">
                              +{day.events.length - 3} more
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* ────── WEEK VIEW ────── */}
            {!loading && !searchQuery.trim() && view === "Week" && (
              <div className="overflow-x-auto -mx-2 px-2">
                <div className="grid grid-cols-7 gap-2 sm:gap-3 min-w-[700px]">
                  {weekDays.map((day, idx) => {
                    const isToday = day.active;
                    return (
                      <div
                        key={idx}
                        onClick={() => openDayOverlay(day.date)}
                        className={`rounded-2xl border transition-all cursor-pointer hover:shadow-soft ${isToday ? "border-primary/40 bg-primary/5" : "border-border/50 bg-background/50 hover:bg-surface"}`}
                      >
                        <div
                          className={`text-center py-2 sm:py-3 rounded-t-2xl border-b ${isToday ? "bg-primary text-white border-primary" : "bg-surface border-border/30"}`}
                        >
                          <div className="text-[10px] sm:text-xs font-bold tracking-wider uppercase opacity-80">
                            {day.dayName}
                          </div>
                          <div
                            className={`text-xl sm:text-2xl font-bold mt-1 ${isToday ? "" : "text-text-main"}`}
                          >
                            {day.num}
                          </div>
                          <div
                            className={`text-[10px] sm:text-xs mt-0.5 ${isToday ? "opacity-80" : "text-text-muted"}`}
                          >
                            {day.fullDate}
                          </div>
                        </div>
                        <div className="p-2 sm:p-3 space-y-2 min-h-[140px] sm:min-h-[200px]">
                          {day.events.length === 0 && (
                            <p className="text-xs text-text-muted text-center mt-8 opacity-60">
                              No events
                            </p>
                          )}
                          {day.events.map((ev, i) => (
                            <div
                              key={i}
                              onClick={(e) => {
                                e.stopPropagation();
                                openEventDetail(ev);
                              }}
                              className={`px-3 py-2 text-xs font-semibold rounded-xl border shadow-sm hover:shadow-md transition-all cursor-pointer ${typeColor[ev.type] || "bg-purple-100 text-purple-700 border-purple-200"}`}
                            >
                              {ev.time && (
                                <div className="opacity-70 text-[10px] mb-0.5">
                                  {ev.time}
                                </div>
                              )}
                              <div className="truncate">{ev.title}</div>
                              {ev.reminder && (
                                <BellRing
                                  size={10}
                                  className="mt-1 opacity-60"
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ────── DAY VIEW ────── */}
            {!loading && !searchQuery.trim() && view === "Day" && (
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1 bg-background/50 rounded-2xl border border-border/50 overflow-hidden">
                  <div
                    className={`p-4 border-b border-border/30 flex items-center justify-between ${isSameDay(selectedDate, new Date()) ? "bg-primary/10" : "bg-surface"}`}
                  >
                    <div>
                      <h2 className="text-lg font-bold text-text-main">
                        {formatDate(selectedDate)}
                      </h2>
                      <p className="text-sm text-text-secondary mt-0.5">
                        {dayEvents.length} event
                        {dayEvents.length !== 1 ? "s" : ""} scheduled
                      </p>
                    </div>
                    <button
                      onClick={() => openAddForDate(selectedDate)}
                      className="p-2 rounded-xl bg-primary text-white hover:bg-primary/90 transition-all"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                  <div className="max-h-[600px] overflow-y-auto">
                    {HOURS.map((hour, hIdx) => {
                      const hourEvents = dayEvents.filter((ev) => {
                        if (!ev.time) return hIdx === 9;
                        const h = parseInt(ev.time.split(":")[0], 10);
                        return h === hIdx;
                      });
                      return (
                        <div
                          key={hIdx}
                          className="flex border-b border-border/20 hover:bg-surface/50 transition-colors min-h-[60px]"
                        >
                          <div className="w-20 py-2 px-3 text-xs text-text-muted font-medium border-r border-border/20 flex-shrink-0">
                            {hour}
                          </div>
                          <div className="flex-1 py-1.5 px-3 space-y-1">
                            {hourEvents.map((ev, i) => (
                              <div
                                key={i}
                                onClick={() => openEventDetail(ev)}
                                className={`px-3 py-2 text-sm font-semibold rounded-xl border shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between ${typeColor[ev.type] || "bg-purple-100 text-purple-700 border-purple-200"}`}
                              >
                                <div className="flex items-center gap-2">
                                  <span>{ev.title}</span>
                                  <span className="text-xs opacity-60 font-normal">
                                    {ev.type}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {ev.reminder && (
                                    <BellRing
                                      size={12}
                                      className="opacity-60"
                                    />
                                  )}
                                  {ev.time && (
                                    <span className="text-xs opacity-70">
                                      {ev.time}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Day sidebar */}
                <div className="w-full lg:w-72 flex-shrink-0">
                  <div className="bg-surface rounded-2xl border border-border/50 p-4">
                    <h3 className="text-sm font-bold text-text-main mb-3 flex items-center gap-2">
                      <CalendarIcon size={16} className="text-primary" /> Events
                      for this day
                    </h3>
                    {dayEvents.length === 0 ? (
                      <div className="text-center py-8">
                        <CalendarIcon
                          size={32}
                          className="mx-auto text-text-muted/40 mb-2"
                        />
                        <p className="text-sm text-text-muted">
                          No events scheduled
                        </p>
                        <button
                          onClick={() => openAddForDate(selectedDate)}
                          className="mt-3 text-xs text-primary font-semibold hover:underline"
                        >
                          + Add an event
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {dayEvents.map((ev, i) => (
                          <div
                            key={i}
                            onClick={() => openEventDetail(ev)}
                            className="p-3 bg-background/80 rounded-xl border border-border/30 hover:border-primary/30 transition-all cursor-pointer group"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-text-main truncate group-hover:text-primary transition-colors">
                                  {ev.title}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span
                                    className={`inline-flex px-2 py-0.5 text-[10px] font-bold rounded-md ${typeColor[ev.type]}`}
                                  >
                                    {ev.type}
                                  </span>
                                  {ev.time && (
                                    <span className="text-xs text-text-muted flex items-center gap-1">
                                      <Clock size={10} />
                                      {ev.time}
                                    </span>
                                  )}
                                </div>
                              </div>
                              {ev.reminder && (
                                <BellRing
                                  size={14}
                                  className="text-primary flex-shrink-0 mt-0.5"
                                />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="bg-surface rounded-2xl border border-border/50 p-4 mt-4">
                    <h3 className="text-sm font-bold text-text-main mb-3">
                      Event Types
                    </h3>
                    <div className="space-y-2">
                      {Object.entries(typeColor).map(([type]) => (
                        <div key={type} className="flex items-center gap-2">
                          <span
                            className={`w-3 h-3 rounded-full ${typeDot[type]}`}
                          />
                          <span className="text-xs text-text-secondary">
                            {type}
                          </span>
                          <span className="text-xs text-text-muted ml-auto">
                            {events.filter((e) => e.type === type).length}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Legend + Stats */}
            {!loading && !searchQuery.trim() && view !== "Day" && (
              <div className="flex flex-wrap items-center justify-between mt-6 pt-4 border-t border-border/30">
                <div className="flex flex-wrap gap-4">
                  {Object.entries(typeColor).map(([type]) => (
                    <div key={type} className="flex items-center gap-2">
                      <span
                        className={`w-3 h-3 rounded-full ${typeDot[type]}`}
                      />
                      <span className="text-xs text-text-secondary font-medium">
                        {type}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-text-muted font-medium mt-2 md:mt-0">
                  {filteredEvents.length} total event
                  {filteredEvents.length !== 1 ? "s" : ""}
                  {searchQuery && ` matching "${searchQuery}"`}
                </p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ═══════════════════ MODALS ═══════════════════ */}

      {/* ──── ADD EVENT MODAL ──── */}
      {showAddModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-surface rounded-3xl p-6 w-full max-w-lg shadow-xl border border-border/50 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-text-main flex items-center gap-2">
                <Plus size={20} className="text-primary" /> Add New Event
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-text-muted hover:text-text-main hover:bg-background transition-all"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-text-secondary mb-1.5 block">
                  Title *
                </label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, title: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-background border border-border/50 rounded-xl text-text-main focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-all"
                  placeholder="Event title..."
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm font-medium text-text-secondary mb-1.5 block">
                  Description
                </label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, description: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-background border border-border/50 rounded-xl text-text-main focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-all resize-none"
                  placeholder="Add details..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-text-secondary mb-1.5 block">
                    Type
                  </label>
                  <select
                    value={newEvent.type}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, type: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-background border border-border/50 rounded-xl text-text-main focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none cursor-pointer"
                  >
                    <option value="Quiz">Quiz</option>
                    <option value="Exam">Exam</option>
                    <option value="Assignment">Assignment</option>
                    <option value="Reminder">Reminder</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-text-secondary mb-1.5 block">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={newEvent.date}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, date: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-background border border-border/50 rounded-xl text-text-main focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-text-secondary mb-1.5 block">
                  Time (optional)
                </label>
                <input
                  type="time"
                  value={newEvent.time}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, time: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-background border border-border/50 rounded-xl text-text-main focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
                />
              </div>

              {/* Reminder toggle */}
              <div
                className={`p-4 rounded-xl border transition-all ${newEvent.reminder ? "bg-primary/5 border-primary/20" : "bg-background border-border/50"}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {newEvent.reminder ? (
                      <BellRing size={20} className="text-primary" />
                    ) : (
                      <BellOff size={20} className="text-text-muted" />
                    )}
                    <div>
                      <p className="text-sm font-semibold text-text-main">
                        Enable Reminder
                      </p>
                      <p className="text-xs text-text-muted">
                        Get notified before this event
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setNewEvent({
                        ...newEvent,
                        reminder: !newEvent.reminder,
                      });
                      if (!newEvent.reminder) requestNotifPermission();
                    }}
                    className={`w-12 h-7 rounded-full transition-all duration-300 flex items-center ${newEvent.reminder ? "bg-primary" : "bg-border"}`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${newEvent.reminder ? "ml-6" : "ml-1"}`}
                    />
                  </button>
                </div>
                {newEvent.reminder && (
                  <div className="mt-3 pt-3 border-t border-border/30">
                    <label className="text-xs font-medium text-text-secondary mb-1.5 block">
                      Remind me
                    </label>
                    <select
                      value={newEvent.reminderMinutes}
                      onChange={(e) =>
                        setNewEvent({
                          ...newEvent,
                          reminderMinutes: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 bg-surface border border-border/50 rounded-lg text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
                    >
                      <option value={5}>5 minutes before</option>
                      <option value={10}>10 minutes before</option>
                      <option value={15}>15 minutes before</option>
                      <option value={30}>30 minutes before</option>
                      <option value={60}>1 hour before</option>
                      <option value={120}>2 hours before</option>
                      <option value={1440}>1 day before</option>
                    </select>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3.5 rounded-xl transition-all shadow-sm hover:shadow-md mt-2"
              >
                Create Event
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ──── EDIT EVENT MODAL ──── */}
      {showEditModal && editEvent && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          onClick={() => setShowEditModal(false)}
        >
          <div
            className="bg-surface rounded-3xl p-6 w-full max-w-lg shadow-xl border border-border/50 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-text-main flex items-center gap-2">
                <Edit3 size={20} className="text-primary" /> Edit Event
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1.5 rounded-lg text-text-muted hover:text-text-main hover:bg-background transition-all"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdateEvent} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-text-secondary mb-1.5 block">
                  Title *
                </label>
                <input
                  type="text"
                  value={editEvent.title}
                  onChange={(e) =>
                    setEditEvent({ ...editEvent, title: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-background border border-border/50 rounded-xl text-text-main focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm font-medium text-text-secondary mb-1.5 block">
                  Description
                </label>
                <textarea
                  value={editEvent.description}
                  onChange={(e) =>
                    setEditEvent({ ...editEvent, description: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-background border border-border/50 rounded-xl text-text-main focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-text-secondary mb-1.5 block">
                    Type
                  </label>
                  <select
                    value={editEvent.type}
                    onChange={(e) =>
                      setEditEvent({ ...editEvent, type: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-background border border-border/50 rounded-xl text-text-main focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="Quiz">Quiz</option>
                    <option value="Exam">Exam</option>
                    <option value="Assignment">Assignment</option>
                    <option value="Reminder">Reminder</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-text-secondary mb-1.5 block">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={editEvent.date}
                    onChange={(e) =>
                      setEditEvent({ ...editEvent, date: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-background border border-border/50 rounded-xl text-text-main focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-text-secondary mb-1.5 block">
                  Time (optional)
                </label>
                <input
                  type="time"
                  value={editEvent.time}
                  onChange={(e) =>
                    setEditEvent({ ...editEvent, time: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-background border border-border/50 rounded-xl text-text-main focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {/* Reminder toggle */}
              <div
                className={`p-4 rounded-xl border transition-all ${editEvent.reminder ? "bg-primary/5 border-primary/20" : "bg-background border-border/50"}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {editEvent.reminder ? (
                      <BellRing size={20} className="text-primary" />
                    ) : (
                      <BellOff size={20} className="text-text-muted" />
                    )}
                    <div>
                      <p className="text-sm font-semibold text-text-main">
                        Enable Reminder
                      </p>
                      <p className="text-xs text-text-muted">
                        Get notified before this event
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditEvent({
                        ...editEvent,
                        reminder: !editEvent.reminder,
                      });
                      if (!editEvent.reminder) requestNotifPermission();
                    }}
                    className={`w-12 h-7 rounded-full transition-all duration-300 flex items-center ${editEvent.reminder ? "bg-primary" : "bg-border"}`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${editEvent.reminder ? "ml-6" : "ml-1"}`}
                    />
                  </button>
                </div>
                {editEvent.reminder && (
                  <div className="mt-3 pt-3 border-t border-border/30">
                    <label className="text-xs font-medium text-text-secondary mb-1.5 block">
                      Remind me
                    </label>
                    <select
                      value={editEvent.reminderMinutes}
                      onChange={(e) =>
                        setEditEvent({
                          ...editEvent,
                          reminderMinutes: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 bg-surface border border-border/50 rounded-lg text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value={5}>5 minutes before</option>
                      <option value={10}>10 minutes before</option>
                      <option value={15}>15 minutes before</option>
                      <option value={30}>30 minutes before</option>
                      <option value={60}>1 hour before</option>
                      <option value={120}>2 hours before</option>
                      <option value={1440}>1 day before</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-2">
                <button
                  type="submit"
                  className="flex-1 bg-primary hover:bg-primary/90 text-white font-semibold py-3.5 rounded-xl transition-all shadow-sm hover:shadow-md"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleDeleteEvent(editEvent._id);
                    setShowEditModal(false);
                  }}
                  className="px-6 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-semibold py-3.5 rounded-xl transition-all border border-red-500/20"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──── DAY OVERLAY MODAL ──── */}
      {showDayOverlay && overlayDate && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          onClick={() => setShowDayOverlay(false)}
        >
          <div
            className="bg-surface rounded-3xl p-6 w-full max-w-md shadow-xl border border-border/50 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold text-text-main">
                  {formatDate(overlayDate)}
                </h2>
                <p className="text-sm text-text-secondary mt-1">
                  {getEventsForDate(events, overlayDate).length} event
                  {getEventsForDate(events, overlayDate).length !== 1
                    ? "s"
                    : ""}{" "}
                  scheduled
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openAddForDate(overlayDate)}
                  className="p-2 rounded-xl bg-primary text-white hover:bg-primary/90 transition-all"
                  title="Add event"
                >
                  <Plus size={18} />
                </button>
                <button
                  onClick={() => setShowDayOverlay(false)}
                  className="p-2 rounded-xl text-text-muted hover:text-text-main hover:bg-background transition-all"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {isSameDay(overlayDate, new Date()) && (
              <div className="mb-4 px-4 py-2.5 bg-primary/10 rounded-xl border border-primary/20 flex items-center gap-2">
                <CalendarIcon size={16} className="text-primary" />
                <span className="text-sm font-semibold text-primary">
                  Today
                </span>
              </div>
            )}

            {getEventsForDate(events, overlayDate).length === 0 ? (
              <div className="text-center py-12">
                <CalendarIcon
                  size={48}
                  className="mx-auto text-text-muted/30 mb-3"
                />
                <p className="text-text-muted font-medium">
                  No events for this day
                </p>
                <button
                  onClick={() => openAddForDate(overlayDate)}
                  className="mt-4 text-sm text-primary font-semibold hover:underline inline-flex items-center gap-1"
                >
                  <Plus size={14} /> Create an event
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {getEventsForDate(events, overlayDate)
                  .sort((a, b) => {
                    if (!a.time && !b.time) return 0;
                    if (!a.time) return 1;
                    if (!b.time) return -1;
                    return a.time.localeCompare(b.time);
                  })
                  .map((ev) => (
                    <div
                      key={ev._id}
                      className="p-4 bg-background/80 rounded-2xl border border-border/30 hover:border-primary/30 hover:shadow-soft transition-all cursor-pointer group"
                      onClick={() => {
                        setShowDayOverlay(false);
                        openEventDetail(ev);
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-1.5 h-full min-h-[40px] rounded-full flex-shrink-0 ${typeDot[ev.type] || "bg-purple-500"}`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <p className="text-sm font-bold text-text-main group-hover:text-primary transition-colors">
                              {ev.title}
                            </p>
                            <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                              {ev.reminder && (
                                <BellRing size={14} className="text-primary" />
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditModal(ev);
                                  setShowDayOverlay(false);
                                }}
                                className="p-1 rounded-lg opacity-100 md:opacity-0 md:group-hover:opacity-100 text-text-muted hover:text-primary hover:bg-surface transition-all"
                              >
                                <Edit3 size={14} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteEvent(ev._id);
                                }}
                                className="p-1 rounded-lg opacity-100 md:opacity-0 md:group-hover:opacity-100 text-text-muted hover:text-red-500 hover:bg-red-50 transition-all"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                          {ev.description && (
                            <p className="text-xs text-text-secondary mt-1 line-clamp-2">
                              {ev.description}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-2">
                            <span
                              className={`inline-flex px-2 py-0.5 text-[10px] font-bold rounded-md border ${typeColor[ev.type]}`}
                            >
                              {ev.type}
                            </span>
                            {ev.time && (
                              <span className="text-xs text-text-muted flex items-center gap-1">
                                <Clock size={11} />
                                {ev.time}
                              </span>
                            )}
                            {ev.reminder && (
                              <span className="text-xs text-primary/70 flex items-center gap-1">
                                <BellRing size={11} />
                                {ev.reminderMinutes >= 1440
                                  ? `${ev.reminderMinutes / 1440}d`
                                  : ev.reminderMinutes >= 60
                                    ? `${ev.reminderMinutes / 60}h`
                                    : `${ev.reminderMinutes}m`}{" "}
                                before
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ──── EVENT DETAIL MODAL ──── */}
      {showEventDetail && detailEvent && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          onClick={() => setShowEventDetail(false)}
        >
          <div
            className="bg-surface rounded-3xl p-6 w-full max-w-md shadow-xl border border-border/50"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`h-2 -mt-6 -mx-6 mb-4 rounded-t-3xl ${typeDot[detailEvent.type] || "bg-purple-500"}`}
            />
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`inline-flex px-2.5 py-1 text-xs font-bold rounded-lg border ${typeColor[detailEvent.type]}`}
                  >
                    {detailEvent.type}
                  </span>
                  {detailEvent.reminder && (
                    <span className="inline-flex px-2.5 py-1 text-xs font-bold rounded-lg bg-primary/10 text-primary border border-primary/20 items-center gap-1">
                      <BellRing size={12} /> Reminder On
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-bold text-text-main mt-2">
                  {detailEvent.title}
                </h2>
              </div>
              <button
                onClick={() => setShowEventDetail(false)}
                className="p-1.5 rounded-lg text-text-muted hover:text-text-main hover:bg-background transition-all flex-shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            {detailEvent.description && (
              <p className="text-sm text-text-secondary mb-4 leading-relaxed bg-background/50 p-3 rounded-xl">
                {detailEvent.description}
              </p>
            )}

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-sm">
                <CalendarIcon
                  size={18}
                  className="text-primary flex-shrink-0"
                />
                <span className="text-text-main font-medium">
                  {formatDate(detailEvent.date)}
                </span>
              </div>
              {detailEvent.time && (
                <div className="flex items-center gap-3 text-sm">
                  <Clock size={18} className="text-primary flex-shrink-0" />
                  <span className="text-text-main font-medium">
                    {detailEvent.time}
                  </span>
                </div>
              )}
              {detailEvent.reminder && (
                <div className="flex items-center gap-3 text-sm">
                  <BellRing size={18} className="text-primary flex-shrink-0" />
                  <span className="text-text-main font-medium">
                    Reminder:{" "}
                    {detailEvent.reminderMinutes >= 1440
                      ? `${detailEvent.reminderMinutes / 1440} day${detailEvent.reminderMinutes > 1440 ? "s" : ""}`
                      : detailEvent.reminderMinutes >= 60
                        ? `${detailEvent.reminderMinutes / 60} hour${detailEvent.reminderMinutes > 60 ? "s" : ""}`
                        : `${detailEvent.reminderMinutes} minutes`}{" "}
                    before
                  </span>
                </div>
              )}
              <div className="flex items-center gap-3 text-xs text-text-muted">
                <span>
                  Created{" "}
                  {formatDateShort(detailEvent.createdAt || detailEvent.date)}
                </span>
              </div>
            </div>

            {/* Quick reminder toggle */}
            <div
              className={`p-3 rounded-xl border mb-4 flex items-center justify-between ${detailEvent.reminder ? "bg-primary/5 border-primary/20" : "bg-background border-border/50"}`}
            >
              <div className="flex items-center gap-2">
                {detailEvent.reminder ? (
                  <BellRing size={16} className="text-primary" />
                ) : (
                  <BellOff size={16} className="text-text-muted" />
                )}
                <span className="text-sm font-medium text-text-main">
                  {detailEvent.reminder
                    ? "Reminder enabled"
                    : "Reminder disabled"}
                </span>
              </div>
              <button
                onClick={() => {
                  toggleEventReminder(detailEvent);
                  if (!detailEvent.reminder) requestNotifPermission();
                }}
                className={`w-10 h-6 rounded-full transition-all duration-300 flex items-center ${detailEvent.reminder ? "bg-primary" : "bg-border"}`}
              >
                <div
                  className={`w-4 h-4 bg-white rounded-full shadow-md transition-all duration-300 ${detailEvent.reminder ? "ml-5" : "ml-1"}`}
                />
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => openEditModal(detailEvent)}
                className="flex-1 bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-xl transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
              >
                <Edit3 size={16} /> Edit
              </button>
              <button
                onClick={() => handleDeleteEvent(detailEvent._id)}
                className="px-6 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-semibold py-3 rounded-xl transition-all border border-red-500/20 flex items-center justify-center gap-2"
              >
                <Trash2 size={16} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──── REMINDER SETTINGS MODAL ──── */}
      {showReminderSettings && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          onClick={() => setShowReminderSettings(false)}
        >
          <div
            className="bg-surface rounded-3xl p-6 w-full max-w-md shadow-xl border border-border/50 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-text-main flex items-center gap-2">
                <Settings size={20} className="text-primary" /> Reminder
                Settings
              </h2>
              <button
                onClick={() => setShowReminderSettings(false)}
                className="p-1.5 rounded-lg text-text-muted hover:text-text-main hover:bg-background transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5">
              {/* Master toggle */}
              <div
                className={`p-4 rounded-2xl border transition-all ${globalReminders.enabled ? "bg-primary/5 border-primary/20" : "bg-background border-border/50"}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {globalReminders.enabled ? (
                      <BellRing size={22} className="text-primary" />
                    ) : (
                      <BellOff size={22} className="text-text-muted" />
                    )}
                    <div>
                      <p className="text-sm font-bold text-text-main">
                        Global Reminders
                      </p>
                      <p className="text-xs text-text-muted">
                        {globalReminders.enabled
                          ? "Reminders are active"
                          : "All reminders disabled"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setGlobalReminders({
                        ...globalReminders,
                        enabled: !globalReminders.enabled,
                      })
                    }
                    className={`w-14 h-8 rounded-full transition-all duration-300 flex items-center ${globalReminders.enabled ? "bg-primary" : "bg-border"}`}
                  >
                    <div
                      className={`w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 ${globalReminders.enabled ? "ml-7" : "ml-1"}`}
                    />
                  </button>
                </div>
              </div>

              {/* Notification permission */}
              <div
                className={`p-4 rounded-2xl border transition-all ${notifPermission === "granted" ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-200"}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {notifPermission === "granted" ? (
                      <Check size={20} className="text-green-600" />
                    ) : (
                      <AlertCircle size={20} className="text-yellow-600" />
                    )}
                    <div>
                      <p className="text-black text-sm font-bold">
                        Desktop Notifications
                      </p>
                      <p className="text-xs text-text-muted">
                        {notifPermission === "granted"
                          ? "Permission granted"
                          : notifPermission === "denied"
                            ? "Blocked by browser"
                            : "Permission needed"}
                      </p>
                    </div>
                  </div>
                  {notifPermission !== "granted" &&
                    notifPermission !== "denied" && (
                      <button
                        onClick={requestNotifPermission}
                        className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90 transition-all"
                      >
                        Enable
                      </button>
                    )}
                  {notifPermission === "granted" && (
                    <span className="px-3 py-1.5 bg-green-100 text-green-700 text-xs font-bold rounded-lg">
                      Active
                    </span>
                  )}
                </div>
              </div>

              {globalReminders.enabled && (
                <>
                  <div className="p-4 rounded-2xl border border-border/50 bg-background">
                    <label className="text-sm font-bold text-text-main mb-2 block">
                      Default Reminder Time
                    </label>
                    <p className="text-xs text-text-muted mb-3">
                      Applied to new events with reminders
                    </p>
                    <select
                      value={globalReminders.defaultMinutes}
                      onChange={(e) =>
                        setGlobalReminders({
                          ...globalReminders,
                          defaultMinutes: Number(e.target.value),
                        })
                      }
                      className="w-full px-4 py-3 bg-surface border border-border/50 rounded-xl text-text-main focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
                    >
                      <option value={5}>5 minutes before</option>
                      <option value={10}>10 minutes before</option>
                      <option value={15}>15 minutes before</option>
                      <option value={30}>30 minutes before</option>
                      <option value={60}>1 hour before</option>
                      <option value={120}>2 hours before</option>
                      <option value={1440}>1 day before</option>
                    </select>
                  </div>

                  <div className="p-4 rounded-2xl border border-border/50 bg-background">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-text-main">
                          Desktop Alerts
                        </p>
                        <p className="text-xs text-text-muted">
                          Show browser notification popups
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setGlobalReminders({
                            ...globalReminders,
                            desktop: !globalReminders.desktop,
                          });
                          if (!globalReminders.desktop)
                            requestNotifPermission();
                        }}
                        className={`w-12 h-7 rounded-full transition-all duration-300 flex items-center ${globalReminders.desktop ? "bg-primary" : "bg-border"}`}
                      >
                        <div
                          className={`w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${globalReminders.desktop ? "ml-6" : "ml-1"}`}
                        />
                      </button>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl border border-border/50 bg-background">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-text-main">
                          Sound Alerts
                        </p>
                        <p className="text-xs text-text-muted">
                          Play a sound with notifications
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          setGlobalReminders({
                            ...globalReminders,
                            sound: !globalReminders.sound,
                          })
                        }
                        className={`w-12 h-7 rounded-full transition-all duration-300 flex items-center ${globalReminders.sound ? "bg-primary" : "bg-border"}`}
                      >
                        <div
                          className={`w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${globalReminders.sound ? "ml-6" : "ml-1"}`}
                        />
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Active reminders summary */}
              <div className="p-4 rounded-2xl border border-border/50 bg-background">
                <h3 className="text-sm font-bold text-text-main mb-2">
                  Active Reminders
                </h3>
                {events.filter((e) => e.reminder).length === 0 ? (
                  <p className="text-xs text-text-muted">
                    No events with reminders set
                  </p>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {events
                      .filter((e) => e.reminder)
                      .map((ev) => (
                        <div
                          key={ev._id}
                          className="flex items-center justify-between p-2 bg-surface rounded-lg"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={`w-2 h-2 rounded-full flex-shrink-0 ${typeDot[ev.type]}`}
                            />
                            <span className="text-xs font-medium text-text-main truncate">
                              {ev.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-[10px] text-text-muted">
                              {formatDateShort(ev.date)}
                            </span>
                            <button
                              onClick={() => toggleEventReminder(ev)}
                              className="p-1 rounded text-red-400 hover:text-red-600 hover:bg-red-50 transition-all"
                              title="Remove reminder"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Right Panel */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-full sm:w-80 transform transition-transform duration-300 ease-in-out shrink-0 ${isRightPanelOpen ? "translate-x-0" : "translate-x-full"} ${isRightPanelOpenDesktop ? "xl:relative xl:transform-none xl:translate-x-0" : "xl:fixed xl:translate-x-full"}`}
      >
        <RightPanel onClose={() => setIsRightPanelOpen(false)} />
      </div>

      <NudgesPanel />
    </div>
  );
};

export default CalendarPage;
