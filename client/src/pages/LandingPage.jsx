import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import av1 from "../assets/avatar/avatar_r1_c1_processed_by_imagy.jpg";
import av2 from "../assets/avatar/avatar_r2_c2_processed_by_imagy.jpg";
import av3 from "../assets/avatar/avatar_r3_c3_processed_by_imagy.jpg";
import {
  BookOpen,
  Calendar,
  Calculator,
  CheckSquare,
  ChevronRight,
  Clock,
  Layers,
  LayoutDashboard,
  Lightbulb,
  Pencil,
  StickyNote,
  Target,
  TrendingUp,
  Zap,
  Award,
  ArrowRight,
  Star,
  Play,
  Sparkles,
  Brain,
  Shield,
  Users,
  Flame,
  Github,
  ExternalLink,
} from "lucide-react";

// ─── Animation Variants ────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
};
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};
const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

// ─── Reusable InView Wrapper ────────────────────────────────────────────────
function AnimateWhenVisible({
  children,
  variants = fadeUp,
  className = "",
  delay = 0,
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={variants}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Section Label ──────────────────────────────────────────────────────────
function SectionLabel({ children, color = "bg-yellow-100 text-yellow-700" }) {
  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase mb-4 ${color}`}
    >
      {children}
    </span>
  );
}

// ─── Dashboard Mockup (Clean Flat Style) ───────────────────────────────────
function DashboardMockup() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((p) => p + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const minutes = String(Math.floor((1500 - tick) / 60) % 60).padStart(2, "0");
  const seconds = String((1500 - tick) % 60).padStart(2, "0");

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
      className="relative w-full max-w-4xl mx-auto z-10"
    >
      {/* Abstract decorative shapes behind mockup */}
      <div className="absolute -top-12 -left-12 w-48 h-48 bg-yellow-200 dark:bg-yellow-600/30 rounded-full blur-none opacity-50 animate-pulse" style={{ animationDuration: '4s' }} />
      <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-purple-200 dark:bg-purple-600/30 rounded-full blur-none opacity-50" />
      
      {/* Main Container */}
      <div className="bg-surface rounded-3xl shadow-xl border-[6px] border-text-main overflow-hidden relative">
        {/* Header */}
        <div className="bg-surface-hover border-b border-border px-4 py-3 flex items-center gap-4">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400 border border-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-400 border border-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-400 border border-green-500" />
          </div>
          <div className="flex-1 max-w-sm mx-auto bg-surface border border-border rounded-md h-8 flex items-center px-3 text-xs text-text-muted font-mono">
           mantessa.app
          </div>
        </div>

        {/* Browser Body */}
        <div className="p-1 flex h-87.5 bg-background">
           {/* Sidebar */}
           <div className="w-16 bg-surface m-2 mr-1 rounded-2xl border border-border flex flex-col items-center py-6 gap-6 shadow-sm">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200 dark:shadow-none">
                <LayoutDashboard size={20} />
              </div>
              <div className="w-10 h-10 text-text-muted hover:bg-surface-hover rounded-xl flex items-center justify-center transition-colors">
                <CheckSquare size={20} />
              </div>
              <div className="w-10 h-10 text-text-muted hover:bg-surface-hover rounded-xl flex items-center justify-center transition-colors">
                 <Calendar size={20} />
              </div>
              <div className="w-10 h-10 text-text-muted hover:bg-surface-hover rounded-xl flex items-center justify-center transition-colors">
                 <Brain size={20} />
              </div>
           </div>

           {/* Content */}
           <div className="flex-1 m-2 ml-1 grid grid-cols-12 grid-rows-6 gap-3">
              {/* Header Area */}
              <div className="col-span-12 row-span-1 flex items-center justify-between px-2">
                 <div className="flex flex-col">
                    <h3 className="text-xl font-bold text-text-main">Good Morning, Alex!</h3>
                    <p className="text-xs text-text-secondary">Ready to conquer your goals?</p>
                 </div>
                 <div className="w-8 h-8 rounded-full bg-emerald-300 border-2 border-white shadow-sm flex items-center justify-center font-bold text-xs">AK</div>
              </div>

              {/* Timer Card - Big & Bold */}
              <div className="col-span-4 row-span-3 bg-surface rounded-2xl border-2 border-border p-4 flex flex-col items-center justify-center relative overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                 <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
                 <span className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2">Focus Session</span>
                 <div className="text-5xl font-black text-text-main tracking-tighter mb-1 font-mono">
                    {minutes}:{seconds}
                 </div>
                 <span className="text-xs font-semibold px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-md">Deep Work</span>
              </div>

              {/* Stats Card */}
              <div className="col-span-4 row-span-3 bg-primary rounded-2xl p-4 text-white shadow-lg shadow-emerald-200 dark:shadow-none flex flex-col justify-between">
                 <div className="flex justify-between items-start">
                    <p className="text-emerald-50 text-xs font-medium uppercase">Total Study</p>
                    <TrendingUp size={16} className="text-emerald-100" />
                 </div>
                 <div>
                    <h4 className="text-4xl font-bold mb-1">4.5<span className="text-lg opacity-60">h</span></h4>
                    <p className="text-xs opacity-70">Top 5% of students today</p>
                 </div>
                 <div className="w-full bg-emerald-700/50 h-1.5 rounded-full overflow-hidden mt-2">
                    <div className="h-full bg-white w-[85%] rounded-full"></div>
                 </div>
              </div>

              {/* Tasks List */}
              <div className="col-span-4 row-span-5 bg-surface rounded-2xl border-2 border-border p-4 shadow-sm flex flex-col">
                 <div className="flex items-center justify-between mb-4">
                    <span className="font-bold text-text-main">Next Up</span>
                    <span className="bg-surface-hover text-text-secondary text-[10px] px-2 py-1 rounded-full font-bold border border-border">3 Left</span>
                 </div>
                 <div className="space-y-3 flex-1">
                    {[
                       { t: "Physics Lab Report", tag: "High", c: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
                       { t: "Read Chapter 4", tag: "Med", c: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
                       { t: "Calculus Quiz", tag: "High", c: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
                    ].map((item, i) => (
                       <div key={i} className="p-3 bg-surface-hover rounded-xl border border-border hover:bg-surface hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition-all cursor-pointer">
                          <p className="text-xs font-bold text-text-main mb-2">{item.t}</p>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${item.c}`}>{item.tag}</span>
                       </div>
                    ))}
                 </div>
              </div>

              {/* Bottom Quick Actions / Graph */}
              <div className="col-span-8 row-span-2 bg-surface rounded-2xl border-2 border-border p-4 flex items-center justify-between shadow-sm">
                  <div className="flex gap-4">
                     <div className="flex flex-col">
                        <span className="text-xs text-text-muted font-bold uppercase">Streak</span>
                        <div className="flex items-center gap-1">
                           <Flame size={18} className="text-orange-500 fill-orange-500" />
                           <span className="text-xl font-black text-text-main">12 Days</span>
                        </div>
                     </div>
                     <div className="w-px h-10 bg-border"></div>
                     <div className="flex flex-col">
                        <span className="text-xs text-text-muted font-bold uppercase">Focus Score</span>
                        <div className="flex items-center gap-1">
                           <Target size={18} className="text-emerald-500" />
                           <span className="text-xl font-black text-text-main">94/100</span>
                        </div>
                     </div>
                  </div>
                  <button className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 rounded-lg text-xs font-bold hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors">
                     View Report
                  </button>
              </div>
           </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Features Config ────────────────────────────────────────────────────────
const features = [
  {
    icon: LayoutDashboard,
    title: "All-in-One Dashboard",
    desc: "Your entire academic life in one view. Track tasks, schedules, and goals without the clutter.",
    bg: "bg-blue-600",
    color: "text-white",
  },
  {
    icon: Clock,
    title: "Focus Timer",
    desc: "A built-in Pomodoro timer that tracks your deep work sessions and blocks distractions automatically.",
    bg: "bg-red-500",
    color: "text-white",
  },
  {
    icon: CheckSquare,
    title: "Smart Tasks",
    desc: "More than just a todo list. Organizes assignments by priority, subject, and looming deadlines.",
    bg: "bg-emerald-600",
    color: "text-white",
  },
  {
    icon: Calendar,
    title: "Student Calendar",
    desc: "Synced with your tasks. Visualize exam dates and study blocks with a drag-and-drop interface.",
    bg: "bg-purple-600",
    color: "text-white",
  },
  {
    icon: StickyNote,
    title: "Quick Notes",
    desc: "Capture ideas instantly. Sticky notes live on your dashboard for those 'aha!' moments.",
    bg: "bg-yellow-500",
    color: "text-white",
  },
  {
    icon: Calculator,
    title: "Study Tools",
    desc: "Integrated scientific calculator and formula sheets so you never have to switch apps.",
    bg: "bg-pink-600",
    color: "text-white",
  },
  {
    icon: Pencil,
    title: "Infinite Canvas",
    desc: "A whiteboard for your thoughts. Sketch diagrams, mind maps, and solve problems visually.",
    bg: "bg-orange-500",
    color: "text-white",
  },
  {
    icon: Users,
    title: "Study Groups",
    desc: "Share notebooks and collaborate on study guides with classmates in real-time.",
    bg: "bg-cyan-600",
    color: "text-white",
  },
];

const stack = [
  { name: "React 19", icon: "⚛️", bg: "bg-blue-50 dark:bg-blue-900/30 border-blue-100 dark:border-blue-800" },
  { name: "Node.js", icon: "🟢", bg: "bg-green-50 dark:bg-green-900/30 border-green-100 dark:border-green-800" },
  { name: "MongoDB", icon: "🍃", bg: "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-100 dark:border-emerald-800" },
  { name: "Tailwind", icon: "🌊", bg: "bg-cyan-50 dark:bg-cyan-900/30 border-cyan-100 dark:border-cyan-800" },
  { name: "Motion", icon: "✨", bg: "bg-purple-50 dark:bg-purple-900/30 border-purple-100 dark:border-purple-800" },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background text-text-main font-sans selection:bg-emerald-200">
      
      {/* ── Navigation ─────────────────────────────────────────────────── */}
      <nav
        className={`fixed top-0 inset-x-0 z-50 backdrop-blur-md transition-all duration-300 ${
          scrolled ? "bg-surface/90 border-b border-border shadow-sm" : "bg-transparent border-b border-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.jpeg" alt="Mantessa" className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl object-contain shadow-lg shadow-emerald-200 dark:shadow-none" />
            <span className="text-lg sm:text-xl font-bold tracking-tight text-text-main">Mantessa</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {["Features", "Methodology", "Testimonials"].map((item) => (
              <a 
                key={item} 
                href={`#${item.toLowerCase()}`}
                className="text-sm font-semibold text-text-secondary hover:text-primary transition-colors"
              >
                {item}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <Link to="/login" className="text-sm font-bold text-text-secondary hover:text-primary hidden sm:inline">
              Log in
            </Link>
            <Link
              to="/login"
              className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-emerald-700 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-emerald-200 dark:shadow-none"
            >
              Get Started
            </Link>
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-surface transition-colors text-text-main"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-surface/95 backdrop-blur-md border-t border-border/30 px-4 py-4 space-y-3">
            {["Features", "Methodology", "Testimonials"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-semibold text-text-secondary hover:text-primary transition-colors py-1"
              >
                {item}
              </a>
            ))}
            <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-bold text-text-secondary hover:text-primary py-1 sm:hidden">
              Log in
            </Link>
          </div>
        )}
      </nav>

      <main className="pt-24 sm:pt-32 pb-12 sm:pb-20 overflow-hidden">
        
        {/* ── Hero Section ─────────────────────────────────────────────── */}
        <section className="relative px-4 sm:px-6 mb-16 sm:mb-32">
          {/* Background decor */}
          <div className="absolute top-0 right-0 -z-10 opacity-20 dark:opacity-10 transform translate-x-1/3 -translate-y-1/4">
            <svg width="600" height="600" viewBox="0 0 600 600" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="300" cy="300" r="300" fill="#E0E7FF" className="dark:fill-indigo-900"/>
            </svg>
          </div>
          <div className="absolute bottom-0 left-0 -z-10 opacity-20 dark:opacity-10 transform -translate-x-1/3 translate-y-1/3">
             <svg width="500" height="500" viewBox="0 0 500 500" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="0" y="0" width="500" height="500" rx="40" fill="#FEF3C7" className="dark:fill-amber-900"/>
             </svg>
          </div>

          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Text Content */}
            <motion.div 
               initial="hidden"
               animate="visible"
               variants={stagger}
               className="text-center lg:text-left"
            >
              <motion.div variants={fadeUp}>
                <span className="inline-block px-3 py-1 mb-6 text-xs font-bold tracking-wider text-white uppercase bg-emerald-600 rounded-full">
                  v1.0 is now live
                </span>
              </motion.div>
              
              <motion.h1 variants={fadeUp} className="text-3xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight text-text-main leading-[1.1] mb-4 sm:mb-6">
                Master your <br/>
                <span className="text-transparent bg-clip-text bg-linear-to-r from-emerald-600 to-teal-500">
                  academic life.
                </span>
              </motion.h1>
              
              <motion.p variants={fadeUp} className="text-base sm:text-lg text-text-secondary mb-6 sm:mb-8 max-w-lg mx-auto lg:mx-0 leading-relaxed">
                Mantessa unifies task management, scheduling, and creative tools into one powerful platform designed for high-performance students.
              </motion.p>
              
              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                <Link
                  to="/login"
                  className="px-8 py-4 rounded-xl bg-primary text-white font-bold text-lg hover:bg-emerald-700 transition-all hover:-translate-y-1 shadow-xl shadow-emerald-200 dark:shadow-none w-full sm:w-auto flex items-center justify-center gap-2"
                >
                  Start for free <ArrowRight size={18} />
                </Link>
                <div className="flex items-center gap-4 text-sm font-semibold text-text-secondary px-4">
                  <div className="flex -space-x-2">
                     <img src={av1} className="w-8 h-8 rounded-full border-2 border-background object-cover" alt="student" />
                     <img src={av2} className="w-8 h-8 rounded-full border-2 border-background object-cover" alt="student" />
                     <img src={av3} className="w-8 h-8 rounded-full border-2 border-background object-cover" alt="student" />
                  </div>
                  <span>Trusted by 2,000+ students</span>
                </div>
              </motion.div>
            </motion.div>

            {/* Hero Visualization – hidden on small screens */}
            <div className="hidden lg:block">
              <DashboardMockup />
            </div>
          </div>
        </section>

        {/* ── Logos / Trust ────────────────────────────────────────────── */}
        <section className="py-14 sm:py-20 border-y border-border bg-surface/50 mb-16 sm:mb-32">
          <AnimateWhenVisible>
            <div className="max-w-3xl mx-auto px-6 text-center">
              <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-8">Built & Maintained by</p>

              {/* ChronalLabs card */}
              <a
                href="https://chronallab-site.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex flex-col items-center gap-2 mb-8"
              >
                <div className="flex items-center gap-3 px-6 py-3 rounded-2xl border border-border bg-bg hover:border-emerald-500/50 hover:bg-emerald-500/5 shadow-sm hover:shadow-emerald-500/10 hover:shadow-md transition-all duration-300">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                    <Zap size={16} className="text-emerald-500" />
                  </div>
                  <span className="text-2xl font-serif font-black text-text-main group-hover:text-emerald-500 transition-colors duration-300">
                    ChronalLabs
                  </span>
                  <ExternalLink size={14} className="text-text-muted group-hover:text-emerald-500 transition-colors duration-300" />
                </div>
                <span className="text-xs text-text-muted group-hover:text-emerald-500 transition-colors duration-300">
                  chronallab-site.vercel.app
                </span>
              </a>

              {/* Divider */}
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="h-px w-16 bg-border" />
                <span className="text-xs text-text-muted uppercase tracking-widest">registered under</span>
                <div className="h-px w-16 bg-border" />
              </div>

              {/* Bytedu card */}
              <a
                href="https://byteedu.co.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex flex-col items-center gap-2"
              >
                <div className="flex items-center gap-3 px-5 py-2.5 rounded-xl border border-border bg-bg hover:border-blue-500/50 hover:bg-blue-500/5 shadow-sm hover:shadow-blue-500/10 hover:shadow-md transition-all duration-300">
                  <div className="w-6 h-6 rounded-md bg-blue-500/15 flex items-center justify-center">
                    <BookOpen size={13} className="text-blue-500" />
                  </div>
                  <span className="text-base font-bold text-text-secondary group-hover:text-blue-500 transition-colors duration-300">
                    Bytedu Learning Platform
                  </span>
                  <ExternalLink size={12} className="text-text-muted group-hover:text-blue-500 transition-colors duration-300" />
                </div>
                <span className="text-xs text-text-muted group-hover:text-blue-500 transition-colors duration-300">
                  byteedu.co.in
                </span>
              </a>
            </div>
          </AnimateWhenVisible>
        </section>

        {/* ── Features Grid ────────────────────────────────────────────── */}
        <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 mb-16 sm:mb-32">
          <div className="text-center mb-10 sm:mb-20">
            <SectionLabel color="bg-emerald-600 text-white">Everything Included</SectionLabel>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-text-main mb-4">
              More than just a todo list
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              We've packed every tool you need to succeed into one cohesive operating system.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="group p-8 rounded-3xl bg-surface border border-border shadow-sm hover:shadow-xl hover:shadow-emerald-200/50 dark:hover:shadow-none hover:border-emerald-200 dark:hover:border-emerald-800 transition-all duration-300"
              >
                <div className={`w-14 h-14 rounded-2xl ${feature.bg} ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon size={26} strokeWidth={2.5} />
                </div>
                <h3 className="text-xl font-bold text-text-main mb-3">{feature.title}</h3>
                <p className="text-text-secondary leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Big Feature Highlight 1 ──────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 mb-16 sm:mb-32">
           <div className="bg-slate-900 rounded-2xl sm:rounded-[2.5rem] p-5 sm:p-8 md:p-16 text-white overflow-hidden relative shadow-2xl shadow-emerald-900/20">
              <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
                 <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-bold mb-6 border border-white/20">
                       <Zap size={14} className="fill-emerald-400 text-emerald-400" />
                       <span className="uppercase tracking-wide">Focus Mode</span>
                    </div>
                    <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold mb-4 sm:mb-6 leading-tight text-white">
                       Deep work made <br/>
                       <span className="text-emerald-400">effortless.</span>
                    </h2>
                    <p className="text-gray-300 text-lg mb-8 leading-relaxed max-w-md">
                       Our scientifically-tuned Pomodoro timer helps you maintain flow state. Block distractions, track your streaks, and visualize your productivity patterns over time.
                    </p>
                    <button className="bg-white text-slate-900 px-6 py-3 rounded-xl font-bold hover:bg-gray-100 transition-colors">
                       Try Focus Mode
                    </button>
                 </div>

                 <div className="relative">
                    {/* Abstract shapes */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-75 h-75 bg-emerald-500/30 rounded-full blur-3xl"></div>
                    
                    {/* Simple UI Card Representation */}
                    <div className="bg-white/10 backdrop-blur-md border border-white/10 dark:border-white/5 rounded-2xl p-8 max-w-sm mx-auto shadow-2xl">
                       <div className="flex justify-between items-center mb-8">
                          <span className="text-sm font-bold opacity-60 text-white">TIMER</span>
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                       </div>
                       <div className="text-center mb-8">
                          <div className="text-4xl sm:text-7xl font-mono font-bold tracking-tighter mb-2 text-white">25:00</div>
                          <span className="text-sm font-medium bg-white/20 dark:bg-white/10 text-white px-3 py-1 rounded-full">Work Session</span>
                       </div>
                       <div className="flex gap-4">
                          <button className="flex-1 bg-white dark:bg-white/90 text-text-main py-3 rounded-lg font-bold hover:scale-105 transition-transform">Pause</button>
                          <button className="flex-1 bg-white/10 dark:bg-white/5 text-white py-3 rounded-lg font-bold hover:bg-white/20 dark:hover:bg-white/10 transition-colors">Stop</button>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </section>

        {/* ── Methodology / Steps ─────────────────────────────────────── */}
        <section id="methodology" className="max-w-7xl mx-auto px-4 sm:px-6 mb-16 sm:mb-32">
           <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                 <SectionLabel color="bg-emerald-600 text-white">The Workflow</SectionLabel>
                 <h2 className="text-2xl sm:text-4xl font-extrabold text-text-main mb-6">Designed for flow, not friction.</h2>
                 <p className="text-lg text-text-secondary mb-10">Mantessa gets out of your way so the only thing you have to focus on is your work.</p>
                 
                 <div className="space-y-8">
                    {[
                       { title: "Plan", desc: "Dump all your assignments and exams into the calendar.", color: "bg-blue-500" },
                       { title: "Focus", desc: "Pick one task, start the timer, and execute.", color: "bg-emerald-500" },
                       { title: "Review", desc: "Check your analytics and optimize your routine.", color: "bg-purple-500" }
                    ].map((step, i) => (
                       <div key={i} className="flex gap-5">
                          <div className={`w-10 h-10 rounded-full ${step.color} flex items-center justify-center text-white font-bold shrink-0 shadow-lg shadow-${step.color}/20`}>
                             {i+1}
                          </div>
                          <div>
                             <h4 className="text-xl font-bold text-text-main mb-2">{step.title}</h4>
                             <p className="text-text-secondary leading-relaxed">{step.desc}</p>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
              <div className="bg-surface-hover rounded-2xl sm:rounded-4xl h-75 sm:h-100 md:h-125 relative overflow-hidden text-text-muted">
                 {/* Decorative Illustration Area */}
                 <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative w-64 h-64">
                       <motion.div 
                          animate={{ rotate: 360 }}
                          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                          className="absolute inset-0 border-2 border-dashed border-border rounded-full"
                       />
                       <motion.div 
                          animate={{ rotate: -360 }}
                          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                          className="absolute inset-4 border-2 border-dashed border-emerald-300 rounded-full"
                       />
                       <div className="absolute inset-0 flex items-center justify-center">
                          <Brain size={64} className="text-text-muted" />
                       </div>
                       {/* Orbiting elements */}
                       <div className="absolute -top-6 left-1/2 w-12 h-12 bg-surface rounded-xl shadow-lg border border-border flex items-center justify-center">
                          <CheckSquare size={20} className="text-emerald-500" />
                       </div>
                       <div className="absolute bottom-10 -right-6 w-12 h-12 bg-surface rounded-xl shadow-lg border border-border flex items-center justify-center">
                          <Clock size={20} className="text-red-500" />
                       </div>
                       <div className="absolute bottom-10 -left-6 w-12 h-12 bg-surface rounded-xl shadow-lg border border-border flex items-center justify-center">
                          <Award size={20} className="text-yellow-500" />
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </section>

        {/* ── Testimonials ────────────────────────────────────────────── */}
        <section id="testimonials" className="bg-surface-hover py-12 sm:py-24 mb-12 sm:mb-24">
           <div className="max-w-7xl mx-auto px-6">
              <div className="text-center mb-8 sm:mb-16">
                 <h2 className="text-2xl sm:text-3xl font-bold text-text-main">What students are saying</h2>
              </div>
              <div className="grid md:grid-cols-3 gap-8">
                 {[
                    { text: "It's clean, it's fast, and it doesn't try to do too much. Exactly what I needed.", author: "Sarah J.", role: "Med Student", color: "bg-amber-100 dark:bg-amber-900/40" },
                    { text: "The visualization of my study hours actually motivated me to work harder.", author: "Mike T.", role: "Engineering", color: "bg-blue-100 dark:bg-blue-900/40" },
                    { text: "Finally a productivity app that doesn't feel like a spreadsheet.", author: "Jessica L.", role: "Design", color: "bg-purple-100 dark:bg-purple-900/40" },
                 ].map((t, i) => (
                    <div key={i} className="bg-surface p-8 rounded-2xl shadow-sm border border-border flex flex-col justify-between h-full hover:-translate-y-1 transition-transform duration-300">
                       <div className="flex gap-1 mb-6">
                          {[1,2,3,4,5].map(s => <Star key={s} size={16} className="fill-amber-400 text-amber-400" />)}
                       </div>
                       <p className="text-text-secondary text-lg font-medium leading-relaxed mb-6">"{t.text}"</p>
                       <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full ${t.color} flex items-center justify-center font-bold text-text-main`}>
                             {t.author[0]}
                          </div>
                          <div>
                             <div className="font-bold text-text-main text-sm">{t.author}</div>
                             <div className="text-text-muted text-xs">{t.role}</div>
                          </div>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </section>

        {/* ── Tech Stack ──────────────────────────────────────────────── */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 mb-16 sm:mb-32 text-center">
           <p className="font-bold text-text-muted text-sm tracking-widest uppercase mb-8">Built with modern tech</p>
           <div className="flex flex-wrap justify-center gap-4">
              {stack.map((tech) => (
                 <div key={tech.name} className={`flex items-center gap-2 px-4 py-2 rounded-full border ${tech.bg} text-sm font-semibold text-text-secondary shadow-sm`}>
                    <span>{tech.icon}</span>
                    {tech.name}
                 </div>
              ))}
           </div>
        </section>

        {/* ── CTA ─────────────────────────────────────────────────────── */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 text-center pb-12 sm:pb-20">
           <div className="bg-linear-to-tr from-emerald-600 to-teal-600 rounded-2xl sm:rounded-3xl p-6 sm:p-12 md:p-20 text-white shadow-2xl shadow-emerald-200 dark:shadow-none relative overflow-hidden">
               {/* Decorative circles */}
               <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 dark:bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
               <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-400/20 dark:bg-amber-400/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>

               <div className="relative z-10">
                  <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold mb-4 sm:mb-6 tracking-tight">Ready to upgrade your workflow?</h2>
                  <p className="text-emerald-100 text-lg mb-10 max-w-xl mx-auto">Join the new wave of productive students. No credit card required, free forever for individuals.</p>
                  
                  <div className="flex flex-col sm:flex-row justify-center gap-4">
                     <Link to="/login" className="px-8 py-4 bg-white dark:bg-emerald-900 text-emerald-700 dark:text-emerald-100 rounded-xl font-bold text-lg hover:shadow-lg dark:hover:shadow-none hover:bg-emerald-50 dark:hover:bg-emerald-800 transition-all flex items-center justify-center gap-2 border border-transparent dark:border-emerald-700">
                        Get Started Now <Sparkles size={18} />
                     </Link>
                     <a href="https://github.com/mantessa" className="px-8 py-4 bg-emerald-700/50 backdrop-blur-sm border border-emerald-400/30 text-white rounded-xl font-bold text-lg hover:bg-emerald-700 transition-all flex items-center justify-center gap-2">
                        View Source <Github size={18} />
                     </a>
                  </div>
               </div>
           </div>
        </section>

      </main>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="bg-surface border-t border-border pt-12 pb-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Top section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
            {/* Brand */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <img src="/logo.jpeg" alt="Mantessa" className="w-8 h-8 rounded-lg object-contain" />
                <span className="font-bold text-text-main text-lg">Mantessa</span>
              </div>
              <p className="text-sm text-text-muted leading-relaxed">
                Your all-in-one study operating system. Track progress, stay focused, and ace your goals.
              </p>
            </div>

            {/* Product */}
            <div className="flex flex-col gap-3">
              <h4 className="text-sm font-semibold text-text-main uppercase tracking-wider">Product</h4>
              <Link to="/login" className="text-sm text-text-secondary hover:text-text-main transition-colors">Login</Link>
              <Link to="/register" className="text-sm text-text-secondary hover:text-text-main transition-colors">Get Started Free</Link>
              <a href="#features" className="text-sm text-text-secondary hover:text-text-main transition-colors">Features</a>
              <a href="#" className="text-sm text-text-secondary hover:text-text-main transition-colors">Changelog</a>
            </div>

            {/* Ecosystem */}
            <div className="flex flex-col gap-3">
              <h4 className="text-sm font-semibold text-text-main uppercase tracking-wider">Ecosystem</h4>
              <a href="https://chronallab-site.vercel.app/" target="_blank" rel="noopener noreferrer"
                className="text-sm text-text-secondary hover:text-text-main transition-colors flex items-center gap-1.5">
                ChronalLabs
                <svg className="w-3 h-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              </a>
              <a href="https://byteedu.co.in/" target="_blank" rel="noopener noreferrer"
                className="text-sm text-text-secondary hover:text-text-main transition-colors flex items-center gap-1.5">
                ByteEdu Learning Platform
                <svg className="w-3 h-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              </a>
            </div>

            {/* Legal */}
            <div className="flex flex-col gap-3">
              <h4 className="text-sm font-semibold text-text-main uppercase tracking-wider">Legal</h4>
              <a href="#" className="text-sm text-text-secondary hover:text-text-main transition-colors">Privacy Policy</a>
              <a href="#" className="text-sm text-text-secondary hover:text-text-main transition-colors">Terms of Service</a>
              <a href="#" className="text-sm text-text-secondary hover:text-text-main transition-colors">Cookie Policy</a>
            </div>
          </div>

          {/* Divider + bottom bar */}
          <div className="border-t border-border pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-2">
              <img src="/be.jpeg" alt="ByteEdu" className="w-8 h-8 rounded-md object-cover border border-border" />
              <p className="text-xs text-text-muted">© 2026 ByteEdu Learning Platform. All rights reserved.</p>
            </div>
            <p className="text-xs text-text-muted">Built with ❤️ for students everywhere</p>
          </div>
        </div>
      </footer>
    </div>
  );
}