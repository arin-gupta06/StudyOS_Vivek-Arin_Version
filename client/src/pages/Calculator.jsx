import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import RightPanel from "../components/RightPanel";
import { useAuth } from "../context/AuthContext";
import { useLayoutStore } from "../store/layoutStore";
import { History, Menu, Delete, Filter, PanelRightOpen, PanelRightClose } from "lucide-react";

const API = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/calculator`;
const axiosCfg = { withCredentials: true };

/* ── safe math evaluator ── */
const evaluateMath = (expr) => {
  if (!expr) return "";
  try {
    let toEval = expr
      .replace(/\u00d7/g, "*")
      .replace(/\u00f7/g, "/")
      .replace(/\u2212/g, "-")
      .replace(/\u03c0/g, "Math.PI")
      .replace(/sin\(/g, "Math.sin(")
      .replace(/cos\(/g, "Math.cos(")
      .replace(/tan\(/g, "Math.tan(")
      .replace(/log\(/g, "Math.log10(")
      .replace(/ln\(/g, "Math.log(")
      .replace(/\u221a\(/g, "Math.sqrt(")
      .replace(/\^/g, "**")
      .replace(/%/g, "/100");

    // replace standalone e (Euler) only when not part of a word / exponent notation
    toEval = toEval.replace(/(?<![a-zA-Z0-9.])e(?![a-zA-Z0-9])/g, "Math.E");

    // auto-close parentheses
    const open = (toEval.match(/\(/g) || []).length;
    const close = (toEval.match(/\)/g) || []).length;
    for (let i = 0; i < open - close; i++) toEval += ")";

    const res = new Function(`return ${toEval}`)();
    if (res === Infinity || res === -Infinity) return "Error";
    if (isNaN(res) || res === undefined) return "Error";
    return parseFloat(res.toFixed(8)).toString();
  } catch {
    return "Error";
  }
};

/* ── relative time helper ── */
const timeAgo = (dateStr) => {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} mins ago`;
  if (diff < 86400)
    return `${Math.floor(diff / 3600)} hour${Math.floor(diff / 3600) > 1 ? "s" : ""} ago`;
  if (diff < 172800) return "Yesterday";
  return new Date(dateStr).toLocaleDateString();
};

const Calculator = () => {
  const { user } = useAuth();
  const { isRightPanelOpen: isRightPanelOpenDesktop, toggleRightPanel } = useLayoutStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
  const [scientificMode, setScientificMode] = useState(true);

  const [expression, setExpression] = useState("");
  const [result, setResult] = useState("0");
  const [lastExpression, setLastExpression] = useState("");
  const [historyItems, setHistoryItems] = useState([]);

  /* ── fetch history from backend ── */
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data } = await axios.get(API, axiosCfg);
        setHistoryItems(data);
        if (data.length > 0) setLastExpression(data[0].expression);
      } catch (err) {
        console.error("Failed to fetch calculator history:", err);
      }
    };
    fetchHistory();
  }, []);

  /* ── live evaluation ── */
  useEffect(() => {
    if (expression) {
      const res = evaluateMath(expression);
      setResult(res !== "Error" ? res : "...");
    } else {
      setResult("0");
    }
  }, [expression]);

  /* ── save calculation to backend ── */
  const saveCalculation = useCallback(async (expr, res) => {
    try {
      const { data } = await axios.post(
        API,
        { title: "CALCULATION", expression: expr, result: res },
        axiosCfg,
      );
      setHistoryItems((prev) => [data, ...prev].slice(0, 50));
    } catch (err) {
      console.error("Failed to save calculation:", err);
    }
  }, []);

  /* ── clear history ── */
  const clearHistory = async () => {
    try {
      await axios.delete(API, axiosCfg);
      setHistoryItems([]);
    } catch (err) {
      console.error("Failed to clear history:", err);
    }
  };

  const handleButtonClick = (btn) => {
    if (btn.label === "C") {
      setExpression("");
      setResult("0");
      return;
    }
    if (btn.id === "backspace") {
      setExpression((prev) => (prev.length > 0 ? prev.slice(0, -1) : ""));
      return;
    }
    if (btn.label === "=") {
      if (!expression) return;
      const res = evaluateMath(expression);
      setResult(res);
      if (res !== "Error" && res !== "...") {
        saveCalculation(expression, res);
        setLastExpression(expression);
        setExpression(res);
      }
      return;
    }

    let val = btn.value || btn.label;
    if (btn.action === "func") val = btn.label + "(";
    if (btn.action === "sq") val = "^2";
    setExpression((prev) => prev + val);
  };

  const handlePreset = (val) => {
    setExpression((prev) => prev + val);
  };

  // Button Grid Configuration
  const sciColor =
    "bg-background text-text-secondary font-semibold hover:bg-border/50";
  const numColor =
    "bg-background text-text-main font-bold text-base sm:text-xl hover:bg-border/50";
  const opColor =
    "bg-background text-primary font-semibold text-base sm:text-xl hover:bg-primary/10";

  const buttons = scientificMode
    ? [
        { label: "sin", action: "func", color: sciColor },
        { label: "cos", action: "func", color: sciColor },
        {
          label: "C",
          color: "bg-background text-red-500 font-semibold hover:bg-red-500/10",
        },
        {
          id: "backspace",
          label: "\u232B",
          icon: <Delete size={20} />,
          color: "bg-background text-primary hover:bg-primary/10",
        },
        { label: "%", color: opColor },
        { label: "\u00f7", value: "\u00f7", color: opColor },

        { label: "tan", action: "func", color: sciColor },
        { label: "log", action: "func", color: sciColor },
        { label: "7", color: numColor },
        { label: "8", color: numColor },
        { label: "9", color: numColor },
        { label: "\u00d7", value: "\u00d7", color: opColor },

        { label: "ln", action: "func", color: sciColor },
        { label: "\u221a", action: "func", value: "\u221a(", color: sciColor },
        { label: "4", color: numColor },
        { label: "5", color: numColor },
        { label: "6", color: numColor },
        {
          label: "\u2212",
          value: "-",
          color:
            "bg-background text-primary font-semibold text-xl sm:text-3xl pb-1 hover:bg-primary/10",
        },

        { label: "x\u00b2", action: "sq", color: sciColor },
        { label: "^", color: sciColor },
        { label: "1", color: numColor },
        { label: "2", color: numColor },
        { label: "3", color: numColor },
        {
          label: "+",
          color:
            "bg-background text-primary font-semibold text-lg sm:text-2xl hover:bg-primary/10",
        },

        { label: "\u03c0", value: "\u03c0", color: sciColor },
        { label: "e", value: "e", color: sciColor },
        { label: "0", color: numColor },
        { label: ".", color: numColor },
        {
          label: "=",
          color:
            "bg-primary text-white font-bold text-lg sm:text-2xl hover:bg-primary/90 shadow-[0_8px_16px_rgba(16,185,129,0.3)]",
          classes: "col-span-2",
        },
      ]
    : [
        {
          label: "C",
          color: "bg-background text-red-500 font-semibold hover:bg-red-500/10",
        },
        {
          id: "backspace",
          label: "\u232B",
          icon: <Delete size={20} />,
          color: "bg-background text-primary hover:bg-primary/10",
        },
        { label: "%", color: opColor },
        { label: "\u00f7", value: "\u00f7", color: opColor },

        { label: "7", color: numColor },
        { label: "8", color: numColor },
        { label: "9", color: numColor },
        { label: "\u00d7", value: "\u00d7", color: opColor },

        { label: "4", color: numColor },
        { label: "5", color: numColor },
        { label: "6", color: numColor },
        {
          label: "\u2212",
          value: "-",
          color:
            "bg-background text-primary font-semibold text-xl sm:text-3xl pb-1 hover:bg-primary/10",
        },

        { label: "1", color: numColor },
        { label: "2", color: numColor },
        { label: "3", color: numColor },
        {
          label: "+",
          color:
            "bg-background text-primary font-semibold text-lg sm:text-2xl hover:bg-primary/10",
        },

        { label: "0", color: numColor, classes: "col-span-2" },
        { label: ".", color: numColor },
        {
          label: "=",
          color:
            "bg-primary text-white font-bold text-lg sm:text-2xl hover:bg-primary/90 shadow-[0_8px_16px_rgba(16,185,129,0.3)]",
        },
      ];

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

      {/* Mobile RightPanel Overlay */}
      {isRightPanelOpen && (
        <div
          onClick={() => setIsRightPanelOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 xl:hidden backdrop-blur-sm"
        />
      )}

      {/* Main Content Area Wrapper */}
      <div className={`flex-1 flex flex-col md:ml-20 min-h-screen relative transition-all duration-300 z-10 min-w-0`}>
        {/* Main Content */}
        <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 overflow-y-auto w-full space-y-4 sm:space-y-6">
          {/* Header */}
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 bg-surface rounded-xl text-text-secondary hover:text-primary transition-colors border border-border/50 md:hidden"
              >
                <Menu size={24} />
              </button>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-text-main">
                  Study Calculator
                </h1>
                <p className="text-sm text-text-secondary mt-1 hidden sm:block">
                  Quick calculations for your research and labs
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsRightPanelOpen(true)}
                className="p-2 bg-surface rounded-xl text-text-secondary hover:text-primary transition-colors border border-border/50 xl:hidden"
              >
                <Filter size={20} />
              </button>
              <button
                onClick={toggleRightPanel}
                className="hidden xl:flex p-2 bg-surface rounded-xl text-text-secondary hover:text-primary transition-colors border border-border/50"
                title={isRightPanelOpenDesktop ? "Close Right Panel" : "Open Right Panel"}
              >
                {isRightPanelOpenDesktop ? <PanelRightClose size={20} /> : <PanelRightOpen size={20} />}
              </button>
              <div className="hidden sm:flex items-center gap-2 bg-surface px-4 py-2 rounded-full shadow-sm border border-border/50">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-sm font-medium text-text-secondary">
                  Focus Mode: Physics Lab
                </span>
              </div>
            </div>
          </header>

          {/* Calculator Layout */}
          <div className="flex flex-col xl:flex-row gap-4 sm:gap-6 lg:gap-8">
            {/* Left Box (Calculator) */}
            <div className="flex-1 bg-surface rounded-2xl sm:rounded-[2rem] p-3 sm:p-5 md:p-6 lg:p-8 shadow-card border border-border/50 flex flex-col min-w-0">
              {/* Display Area */}
              <div className="flex flex-col items-end mb-8 relative min-h-[120px]">
                {/* Scientific toggle */}
                <div className="absolute top-0 left-0 flex items-center gap-3">
                  <span className="text-xs font-bold text-text-muted tracking-widest uppercase">
                    Scientific Mode
                  </span>
                  <button
                    onClick={() => setScientificMode(!scientificMode)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${scientificMode ? "bg-primary" : "bg-border"}`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${scientificMode ? "left-6" : "left-1"}`}
                    ></span>
                  </button>
                </div>

                <div className="text-sm sm:text-lg text-text-secondary tracking-widest font-medium mt-10 md:mt-0 h-8 flex items-end break-all text-right">
                  {expression || lastExpression}
                </div>
                <div className="text-2xl sm:text-4xl md:text-5xl font-bold text-text-main mt-2 tracking-tight overflow-hidden break-all max-w-full">
                  {result}
                </div>
              </div>

              {/* Number Pad Grid */}
              <div
                className={`grid gap-1.5 sm:gap-2 md:gap-3 w-full flex-1 ${scientificMode ? "grid-cols-6" : "grid-cols-4"}`}
              >
                {buttons.map((btn, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleButtonClick(btn)}
                    className={`
                          py-2 sm:py-3 md:py-4 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-200 active:scale-95 shadow-sm text-xs sm:text-sm md:text-base
                          ${btn.color || "bg-background hover:bg-border/50 text-text-main"}
                          ${btn.classes ? btn.classes : "col-span-1"}
                        `}
                  >
                    {btn.icon ? btn.icon : btn.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Right Stack (History & Presets) */}
            <div className="w-full xl:w-[380px] flex flex-col gap-4 sm:gap-6 shrink-0">
              {/* History Section */}
              <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-4 px-2">
                  <div className="flex items-center gap-2">
                    <History size={20} className="text-text-main" />
                    <h2 className="text-xl font-bold text-text-main">
                      History
                    </h2>
                  </div>
                  <button
                    onClick={clearHistory}
                    className="text-sm font-semibold text-text-muted hover:text-text-secondary transition-colors"
                  >
                    Clear All
                  </button>
                </div>

                <div className="flex flex-col gap-4 overflow-y-auto max-h-[500px] custom-scrollbar pr-2">
                  {historyItems.length === 0 ? (
                    <div className="text-center p-8 text-text-muted text-sm font-medium">
                      No calculation history
                    </div>
                  ) : (
                    historyItems.map((item, index) => (
                      <div
                        key={item._id || index}
                        onClick={() => setExpression(item.result)}
                        className={`p-5 rounded-2xl shadow-sm border transition-all cursor-pointer group
                                ${index === 0 ? "bg-surface border-primary/20 shadow-card hover:shadow-soft" : "bg-surface border-border/50 hover:shadow-soft"}
                            `}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-bold text-text-muted tracking-widest">
                            {item.title}
                          </span>
                          <span className="text-xs font-medium text-text-muted">
                            {item.createdAt ? timeAgo(item.createdAt) : ""}
                          </span>
                        </div>
                        <div className="flex justify-between items-end">
                          <span className="text-text-secondary font-medium tracking-wide truncate max-w-[180px]">
                            {item.expression}
                          </span>
                          <span
                            className={`text-xl font-bold ${index === 0 ? "text-primary" : "text-text-main"}`}
                          >
                            {item.result}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Scientific Presets */}
              <div className="bg-primary/5 rounded-2xl sm:rounded-[2rem] p-4 sm:p-6 border border-primary/10">
                <h3 className="text-sm font-bold text-text-main mb-4">
                  Scientific Presets
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handlePreset("\u03c0")}
                    className="bg-surface py-3 px-4 rounded-xl text-sm font-semibold text-text-main shadow-sm hover:shadow hover:text-primary transition-all flex items-center justify-center"
                  >
                    Pi (π)
                  </button>
                  <button
                    onClick={() => handlePreset("e")}
                    className="bg-surface py-3 px-4 rounded-xl text-sm font-semibold text-text-main shadow-sm hover:shadow hover:text-primary transition-all flex items-center justify-center"
                  >
                    Euler (e)
                  </button>
                  <button
                    onClick={() => handlePreset("9.81")}
                    className="bg-surface py-3 px-4 rounded-xl text-sm font-semibold text-text-main shadow-sm hover:shadow hover:text-primary transition-all flex items-center justify-center"
                  >
                    Gravity (g)
                  </button>
                  <button
                    onClick={() => handlePreset("6.626e-34")}
                    className="bg-surface py-3 px-4 rounded-xl text-sm font-semibold text-text-main shadow-sm hover:shadow hover:text-primary transition-all flex items-center justify-center"
                  >
                    Planck (h)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Right Panel */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-full sm:w-80 transform transition-transform duration-300 ease-in-out shrink-0 ${isRightPanelOpen ? "translate-x-0" : "translate-x-full"} ${isRightPanelOpenDesktop ? "xl:relative xl:transform-none xl:translate-x-0" : "xl:fixed xl:translate-x-full"}`}
      >
        <RightPanel onClose={() => setIsRightPanelOpen(false)} />
      </div>
    </div>
  );
};

export default Calculator;
