import React, { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import {
  Menu,
  PenTool,
  Eraser,
  Download,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Image as ImageIcon,
  AlignLeft,
  Cloud,
  Sparkles,
  MoreVertical,
  Save,
  Trash2,
  Edit3,
  Loader2,
  Plus,
  Check,
  X,
  Pen,
  Pencil,
  Highlighter,
  Paintbrush,
  CircleDot,
  Square as SquareIcon,
  ChevronDown,
} from "lucide-react";
import { useThemeStore } from "../store/themeStore";

const API = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/sketches`;
const ax = { withCredentials: true };

/* ──────────── TOAST ──────────── */
const Toast = ({ msg, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 2500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className="fixed top-6 right-6 z-[200] flex items-center gap-2 bg-primary text-white px-5 py-3 rounded-2xl shadow-lg text-sm font-semibold animate-[fadeIn_.25s]">
      <Check size={16} /> {msg}
    </div>
  );
};

const DrawingPad = () => {
  const { isDarkMode } = useThemeStore();
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const canvasRef = useRef(null);
  const contextRef = useRef(null);

  /* ── drawing state ── */
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState("pen");
  const [color, setColor] = useState("#10B981");
  const [lineWidth, setLineWidth] = useState(5);
  const [hasDrawn, setHasDrawn] = useState(false);

  /* ── tool customization state ── */
  const [expandedTool, setExpandedTool] = useState(null); // 'pen' | 'highlighter' | 'eraser' | null
  const [penType, setPenType] = useState("fine"); // 'fine' | 'ballpoint' | 'calligraphy' | 'marker'
  const [highlighterType, setHighlighterType] = useState("standard"); // 'standard' | 'soft' | 'neon'
  const [eraserType, setEraserType] = useState("point"); // 'point' | 'area'
  const [penOpacity, setPenOpacity] = useState(1.0);
  const [highlighterOpacity, setHighlighterOpacity] = useState(0.4);
  const [eraserSize, setEraserSize] = useState(20);
  const [customColor, setCustomColor] = useState("#10B981");
  const toolPanelRef = useRef(null);

  // Close tool panel on outside click
  useEffect(() => {
    if (!expandedTool) return;
    const handler = (e) => {
      if (toolPanelRef.current && !toolPanelRef.current.contains(e.target)) {
        setExpandedTool(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [expandedTool]);

  // Pen type presets: { lineWidth, lineCap, opacity }
  const penTypePresets = {
    fine: {
      width: 2,
      cap: "round",
      opacity: 1.0,
      label: "Fine Pen",
      icon: Pen,
    },
    ballpoint: {
      width: 4,
      cap: "round",
      opacity: 0.9,
      label: "Ballpoint",
      icon: PenTool,
    },
    calligraphy: {
      width: 6,
      cap: "square",
      opacity: 1.0,
      label: "Calligraphy",
      icon: Pencil,
    },
    marker: {
      width: 10,
      cap: "round",
      opacity: 0.85,
      label: "Marker",
      icon: Paintbrush,
    },
  };

  const highlighterPresets = {
    standard: { width: 20, opacity: 0.4, label: "Standard", color: null },
    soft: { width: 24, opacity: 0.25, label: "Soft Glow", color: null },
    neon: { width: 16, opacity: 0.55, label: "Neon", color: null },
  };

  const eraserPresets = {
    point: { label: "Point Eraser", icon: CircleDot, multiplier: 2 },
    area: { label: "Area Eraser", icon: SquareIcon, multiplier: 6 },
  };

  const handleToolToggle = (t) => {
    if (tool === t && expandedTool === t) {
      setExpandedTool(null);
    } else {
      setTool(t);
      setExpandedTool(t);
    }
  };

  /* ── history stored in refs so closures always have latest values ── */
  const historyRef = useRef([]);
  const historyStepRef = useRef(-1);
  const [, forceRender] = useState(0);

  /* ── gallery / backend state ── */
  const [sketches, setSketches] = useState([]);
  const [activeSketchId, setActiveSketchId] = useState(null);
  const [loadingGallery, setLoadingGallery] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [menuOpen, setMenuOpen] = useState(null); // id of open menu
  const [renamingId, setRenamingId] = useState(null);
  const [renameVal, setRenameVal] = useState("");

  /* ──────────── fetch gallery ──────────── */
  const fetchGallery = useCallback(async () => {
    try {
      setLoadingGallery(true);
      const { data } = await axios.get(API, ax);
      setSketches(data);
    } catch (e) {
      console.error("Gallery fetch failed", e);
    } finally {
      setLoadingGallery(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchGallery();
  }, [user, fetchGallery]);

  /* ── zoom & pan state ── */
  const [zoomLevel, setZoomLevel] = useState(1);

  /* ──────────── canvas init ──────────── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;
    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    contextRef.current = ctx;
    saveHistoryState(canvas);

    const handleResize = () => {
      const w = canvas.width;
      const h = canvas.height;
      const imgData = w > 0 && h > 0 ? ctx.getImageData(0, 0, w, h) : null;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      contextRef.current = ctx;
      if (imgData) ctx.putImageData(imgData, 0, 0);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /* ──────────── drawing helpers ──────────── */
  const saveHistoryState = (canvas) => {
    const dataUrl = canvas.toDataURL();
    const newHistory = historyRef.current.slice(0, historyStepRef.current + 1);
    newHistory.push(dataUrl);
    historyRef.current = newHistory;
    historyStepRef.current = newHistory.length - 1;
    forceRender((n) => n + 1);
  };

  const getCoordinates = (e) => {
    const parent = canvasRef.current;
    if (!parent) return { offsetX: 0, offsetY: 0 };
    const rect = parent.getBoundingClientRect();

    if (e.touches && e.touches.length > 0) {
      return {
        offsetX: (e.touches[0].clientX - rect.left) / zoomLevel,
        offsetY: (e.touches[0].clientY - rect.top) / zoomLevel,
      };
    }
    return {
      offsetX: (e.clientX - rect.left) / zoomLevel,
      offsetY: (e.clientY - rect.top) / zoomLevel,
    };
  };

  /* ── tools logic ── */
  const startDrawing = (e) => {
    const { offsetX, offsetY } = getCoordinates(e);
    const ctx = contextRef.current;
    if (tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      const mult = eraserPresets[eraserType]?.multiplier || 2;
      ctx.lineWidth = eraserSize * mult * 0.5;
      ctx.lineCap = eraserType === "area" ? "square" : "round";
    } else if (tool === "highlighter") {
      const preset = highlighterPresets[highlighterType];
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = highlighterOpacity;
      ctx.strokeStyle = color;
      ctx.lineWidth = preset.width;
      ctx.lineCap = "square";
    } else {
      const preset = penTypePresets[penType];
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = penOpacity;
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = preset.cap;
    }
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
    setIsDrawing(true);
    if (!hasDrawn) setHasDrawn(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const { offsetX, offsetY } = getCoordinates(e);
    contextRef.current.lineTo(offsetX, offsetY);
    contextRef.current.stroke();

    // Begin a new path for smoother stroke rendering without overlapping alpha
    contextRef.current.beginPath();
    contextRef.current.moveTo(offsetX, offsetY);
  };

  const endDrawing = () => {
    if (!isDrawing) return;
    contextRef.current.closePath();
    setIsDrawing(false);
    saveHistoryState(canvasRef.current);
  };

  const handleUndo = () => {
    if (historyStepRef.current > 0) {
      historyStepRef.current -= 1;
      restoreCanvas(historyRef.current[historyStepRef.current]);
      forceRender((n) => n + 1);
    } else if (historyStepRef.current === 0) {
      const c = canvasRef.current;
      c.getContext("2d").clearRect(0, 0, c.width, c.height);
      setHasDrawn(false);
    }
  };

  const handleRedo = () => {
    if (historyStepRef.current < historyRef.current.length - 1) {
      historyStepRef.current += 1;
      restoreCanvas(historyRef.current[historyStepRef.current]);
      setHasDrawn(true);
      forceRender((n) => n + 1);
    }
  };

  const restoreCanvas = (dataUrl) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1.0;
      ctx.drawImage(img, 0, 0);
    };
  };

  const clearCanvas = () => {
    const c = canvasRef.current;
    c.getContext("2d").clearRect(0, 0, c.width, c.height);
    saveHistoryState(c);
    setHasDrawn(false);
    setActiveSketchId(null);
  };

  const exportCanvas = () => {
    const canvas = canvasRef.current;
    const tmp = document.createElement("canvas");
    tmp.width = canvas.width;
    tmp.height = canvas.height;
    const ctx = tmp.getContext("2d");
    ctx.fillStyle = isDarkMode ? "#1E293B" : "#ffffff";
    ctx.fillRect(0, 0, tmp.width, tmp.height);
    ctx.drawImage(canvas, 0, 0);
    const link = document.createElement("a");
    link.download = "study_sketch.png";
    link.href = tmp.toDataURL("image/png");
    link.click();
  };

  /* ──────────── generate thumbnail ──────────── */
  const makeThumbnail = () => {
    const canvas = canvasRef.current;
    const tmp = document.createElement("canvas");
    const scale = 200 / canvas.width;
    tmp.width = 200;
    tmp.height = canvas.height * scale;
    const ctx = tmp.getContext("2d");
    ctx.fillStyle = isDarkMode ? "#1E293B" : "#ffffff";
    ctx.fillRect(0, 0, tmp.width, tmp.height);
    ctx.drawImage(canvas, 0, 0, tmp.width, tmp.height);
    return tmp.toDataURL("image/jpeg", 0.6);
  };

  /* ──────────── save / create sketch ──────────── */
  const saveSketch = async () => {
    if (!hasDrawn) return;
    setSaving(true);
    try {
      const canvas = canvasRef.current;

      // We must compress the canvas data before sending to MongoDB to avoid the 16MB document limit
      const tmp = document.createElement("canvas");
      tmp.width = canvas.width;
      tmp.height = canvas.height;
      const ctx = tmp.getContext("2d");
      ctx.fillStyle = isDarkMode ? "#1E293B" : "#ffffff";
      ctx.fillRect(0, 0, tmp.width, tmp.height);
      ctx.drawImage(canvas, 0, 0);
      const dataUrl = tmp.toDataURL("image/jpeg", 0.8);

      const thumbnail = makeThumbnail();
      const payload = {
        dataUrl,
        thumbnail,
        width: canvas.width,
        height: canvas.height,
      };

      if (activeSketchId) {
        await axios.put(`${API}/${activeSketchId}`, payload, ax);
        setToast("Sketch updated!");
      } else {
        const { data } = await axios.post(
          API,
          { ...payload, title: "Untitled Sketch" },
          ax,
        );
        setActiveSketchId(data._id);
        setToast("Sketch saved!");
      }
      fetchGallery();
    } catch (e) {
      console.error("Save failed", e);
      setToast("Save failed \u2013 try again");
    } finally {
      setSaving(false);
    }
  };

  /* ──────────── load sketch onto canvas ──────────── */
  const loadSketch = async (id) => {
    try {
      const { data } = await axios.get(`${API}/${id}`, ax);
      if (!data.dataUrl) return;
      setActiveSketchId(id);
      setHasDrawn(true);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.src = data.dataUrl;
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 1.0;

        // Draw image keeping ratio and centering OR at top-left
        ctx.drawImage(img, 0, 0);
        saveHistoryState(canvas);
      };
    } catch (e) {
      console.error("Load failed", e);
    }
    setMenuOpen(null);
  };

  /* ──────────── delete sketch ──────────── */
  const deleteSketch = async (id) => {
    try {
      await axios.delete(`${API}/${id}`, ax);
      if (activeSketchId === id) {
        clearCanvas();
        setActiveSketchId(null);
      }
      setToast("Sketch deleted");
      fetchGallery();
    } catch (e) {
      console.error("Delete failed", e);
    }
    setMenuOpen(null);
  };

  /* ──────────── rename sketch ──────────── */
  const submitRename = async (id) => {
    if (!renameVal.trim()) {
      setRenamingId(null);
      return;
    }
    try {
      await axios.put(`${API}/${id}`, { title: renameVal.trim() }, ax);
      fetchGallery();
    } catch (e) {
      console.error("Rename failed", e);
    }
    setRenamingId(null);
  };

  /* ──────────── new blank sketch ──────────── */
  const newSketch = () => {
    clearCanvas();
    setActiveSketchId(null);
    setHasDrawn(false);
  };

  /* ── colors / sizes ── */
  const colors = [
    "#10B981",
    "#EC4899",
    "#3B82F6",
    "#F59E0B",
    isDarkMode ? "#F8FAFC" : "#1F2937",
  ];
  useEffect(() => {
    if (color === "#1F2937" && isDarkMode) setColor("#F8FAFC");
    if (color === "#F8FAFC" && !isDarkMode) setColor("#1F2937");
  }, [isDarkMode]);
  const linePicks = [1, 3, 6, 10, 16];

  /* ── format date ── */
  const fmtDate = (d) =>
    new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  /* ──────────── RENDER ──────────── */
  return (
    <div className="flex bg-background min-h-screen text-text-main font-sans overflow-hidden">
      {toast && <Toast msg={toast} onClose={() => setToast("")} />}

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
        />
      )}

      {/* Left Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <Sidebar onMobileClose={() => setIsSidebarOpen(false)} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:ml-20 xl:mr-[340px] min-h-screen relative transition-all duration-300 z-0">
        {/* Mobile menu trigger */}
        <div className="md:hidden p-4 absolute top-0 left-0 z-40 flex items-center gap-2">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 bg-surface rounded-xl text-text-secondary hover:text-primary transition-colors border border-border/50 shadow-sm"
          >
            <Menu size={24} />
          </button>
        </div>

        {/* Mobile gallery trigger */}
        <div className="xl:hidden p-4 absolute top-0 right-0 z-40">
          <button
            onClick={() => setIsGalleryOpen(true)}
            className="p-2 bg-surface rounded-xl text-text-secondary hover:text-primary transition-colors border border-border/50 shadow-sm"
          >
            <ImageIcon size={24} />
          </button>
        </div>

        {/* ── Top Floating Toolbar ── */}
        <div
          ref={toolPanelRef}
          className="absolute top-4 md:top-6 left-1/2 -translate-x-1/2 z-30 md:z-40 flex flex-col items-center gap-2 w-full px-4 sm:w-auto"
        >
          <div className="flex bg-surface p-1.5 sm:p-2 rounded-2xl sm:rounded-full shadow-card border border-border/50 items-center gap-1.5 sm:gap-2 overflow-x-auto max-w-full no-scrollbar">
            {/* Tools */}
            <div className="flex bg-background rounded-xl sm:rounded-full p-1 border border-border/50 shadow-inner shrink-0">
              <button
                onClick={() => handleToolToggle("pen")}
                className={`p-2 sm:p-2.5 rounded-lg sm:rounded-full transition-all flex items-center justify-center gap-1`}
                style={{
                  backgroundColor:
                    tool === "pen" ? "var(--color-surface)" : "transparent",
                  color: tool === "pen" ? color : "var(--color-text-muted)",
                  boxShadow: tool === "pen" ? "var(--shadow-soft)" : "none",
                }}
                title="Pen — click to customize"
              >
                <PenTool size={16} className="sm:w-[18px] sm:h-[18px]" />
                {tool === "pen" && (
                  <ChevronDown size={10} className="opacity-60 sm:w-[12px] sm:h-[12px]" />
                )}
              </button>
              <button
                onClick={() => handleToolToggle("highlighter")}
                className={`p-2 sm:p-2.5 rounded-lg sm:rounded-full transition-all flex items-center justify-center gap-1`}
                style={{
                  backgroundColor:
                    tool === "highlighter"
                      ? "var(--color-surface)"
                      : "transparent",
                  color:
                    tool === "highlighter" ? color : "var(--color-text-muted)",
                  boxShadow:
                    tool === "highlighter" ? "var(--shadow-soft)" : "none",
                }}
                title="Highlighter — click to customize"
              >
                <Highlighter size={16} className="sm:w-[18px] sm:h-[18px]" />
                {tool === "highlighter" && (
                  <ChevronDown size={10} className="opacity-60 sm:w-[12px] sm:h-[12px]" />
                )}
              </button>
              <button
                onClick={() => handleToolToggle("eraser")}
                className={`p-2 sm:p-2.5 rounded-lg sm:rounded-full transition-all flex items-center justify-center gap-1`}
                style={{
                  backgroundColor:
                    tool === "eraser" ? "var(--color-surface)" : "transparent",
                  color:
                    tool === "eraser"
                      ? "var(--color-text-main)"
                      : "var(--color-text-muted)",
                  boxShadow: tool === "eraser" ? "var(--shadow-soft)" : "none",
                }}
                title="Eraser — click to customize"
              >
                <Eraser size={16} className="sm:w-[18px] sm:h-[18px]" />
                {tool === "eraser" && (
                  <ChevronDown size={10} className="opacity-60 sm:w-[12px] sm:h-[12px]" />
                )}
              </button>
            </div>

            <div className="w-px h-6 sm:h-8 bg-border/60 mx-0.5 sm:mx-1 shrink-0" />

            {/* Colors */}
            <div className="flex gap-1.5 sm:gap-2 px-1 items-center shrink-0">
              {colors.map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    setColor(c);
                    setCustomColor(c);
                    if (tool === "eraser") setTool("pen");
                  }}
                  className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full transition-all relative ${color === c && tool !== "eraser" ? "scale-110 z-10" : "hover:scale-110"}`}
                  style={{ backgroundColor: c }}
                >
                  {color === c && tool !== "eraser" && (
                    <span
                      className="absolute -inset-1 rounded-full border-[1.5px]"
                      style={{ borderColor: c }}
                    />
                  )}
                </button>
              ))}
              {/* Custom color picker */}
              <div className="relative">
                <input
                  type="color"
                  value={customColor}
                  onChange={(e) => {
                    setCustomColor(e.target.value);
                    setColor(e.target.value);
                    if (tool === "eraser") setTool("pen");
                  }}
                  className="absolute inset-0 w-5 h-5 sm:w-6 sm:h-6 opacity-0 cursor-pointer"
                  title="Custom color"
                />
                <div
                  className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-dashed border-text-muted/40 hover:border-primary/60 transition-all flex items-center justify-center cursor-pointer"
                  style={{
                    background: `conic-gradient(red, yellow, lime, aqua, blue, magenta, red)`,
                  }}
                >
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-surface" />
                </div>
              </div>
            </div>

            <div className="w-px h-6 sm:h-8 bg-border/60 mx-0.5 sm:mx-1 shrink-0" />

            {/* Actions */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <button
                onClick={clearCanvas}
                className="p-1.5 sm:p-2 rounded-full text-text-muted hover:text-text-main transition-colors"
                title="Clear Canvas"
              >
                <Sparkles size={16} className="sm:w-[18px] sm:h-[18px]" />
              </button>
              <button
                onClick={saveSketch}
                disabled={saving || !hasDrawn}
                className="p-1.5 sm:p-2 rounded-full text-text-muted hover:text-text-main transition-colors disabled:opacity-40"
                title="Save Sketch"
              >
                {saving ? (
                  <Loader2 size={16} className="animate-spin sm:w-[18px] sm:h-[18px]" />
                ) : (
                  <Save size={16} className="sm:w-[18px] sm:h-[18px]" />
                )}
              </button>
              <button
                onClick={exportCanvas}
                disabled={!hasDrawn}
                className="flex items-center gap-1.5 sm:gap-2 bg-background px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-full border border-border/50 text-xs sm:text-sm font-semibold text-text-main hover:text-primary transition-all shadow-sm disabled:opacity-40"
                title="Export Image"
              >
                <Download size={14} className="sm:w-[16px] sm:h-[16px]" />
                <span className="hidden xs:inline">Export</span>
              </button>
            </div>
          </div>

          {/* ── Expanded Customization Panels ── */}
          {expandedTool === "pen" && (
            <div className="bg-surface rounded-2xl shadow-card border border-border/50 p-4 w-80 animate-[fadeIn_.15s]">
              <div className="flex items-center gap-2 mb-3">
                <PenTool size={14} className="text-primary" />
                <h4 className="text-xs font-bold text-text-main uppercase tracking-wider">
                  Pen Settings
                </h4>
              </div>

              {/* Pen Type Selector */}
              <div className="mb-3">
                <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1.5 block">
                  Pen Type
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {Object.entries(penTypePresets).map(([key, preset]) => {
                    const Icon = preset.icon;
                    return (
                      <button
                        key={key}
                        onClick={() => {
                          setPenType(key);
                          setLineWidth(preset.width);
                          setPenOpacity(preset.opacity);
                        }}
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all text-center ${
                          penType === key
                            ? "bg-primary/10 text-primary border border-primary/30 shadow-sm"
                            : "bg-background text-text-muted border border-border hover:bg-surface hover:text-text-main"
                        }`}
                      >
                        <Icon
                          size={16}
                          strokeWidth={penType === key ? 2.5 : 2}
                        />
                        <span className="text-[9px] font-medium leading-tight">
                          {preset.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Size Slider */}
              <div className="mb-3">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                    Size
                  </label>
                  <span className="text-[10px] font-bold text-primary">
                    {lineWidth}px
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={20}
                  step={1}
                  value={lineWidth}
                  onChange={(e) => setLineWidth(Number(e.target.value))}
                  className="w-full accent-primary h-1.5 cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-text-muted mt-0.5">
                  <span>1px</span>
                  <span>20px</span>
                </div>
              </div>

              {/* Opacity Slider */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                    Opacity
                  </label>
                  <span className="text-[10px] font-bold text-primary">
                    {Math.round(penOpacity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={100}
                  step={5}
                  value={Math.round(penOpacity * 100)}
                  onChange={(e) => setPenOpacity(Number(e.target.value) / 100)}
                  className="w-full accent-primary h-1.5 cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-text-muted mt-0.5">
                  <span>10%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Live Preview */}
              <div className="mt-3 pt-3 border-t border-border/50">
                <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1.5 block">
                  Preview
                </label>
                <div className="bg-background rounded-xl h-10 flex items-center justify-center overflow-hidden">
                  <div
                    className="rounded-full"
                    style={{
                      width: `${Math.max(lineWidth * 2, 6)}px`,
                      height: `${Math.max(lineWidth * 2, 6)}px`,
                      backgroundColor: color,
                      opacity: penOpacity,
                      borderRadius:
                        penTypePresets[penType].cap === "square"
                          ? "2px"
                          : "50%",
                    }}
                  />
                  <div
                    className="ml-2 h-[2px] flex-1 max-w-24 rounded-full"
                    style={{
                      height: `${lineWidth}px`,
                      backgroundColor: color,
                      opacity: penOpacity,
                      borderRadius:
                        penTypePresets[penType].cap === "square"
                          ? "1px"
                          : "999px",
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {expandedTool === "highlighter" && (
            <div className="bg-surface rounded-2xl shadow-card border border-border/50 p-4 w-80 animate-[fadeIn_.15s]">
              <div className="flex items-center gap-2 mb-3">
                <Highlighter size={14} className="text-primary" />
                <h4 className="text-xs font-bold text-text-main uppercase tracking-wider">
                  Highlighter Settings
                </h4>
              </div>

              {/* Highlighter Type */}
              <div className="mb-3">
                <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1.5 block">
                  Type
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {Object.entries(highlighterPresets).map(([key, preset]) => (
                    <button
                      key={key}
                      onClick={() => {
                        setHighlighterType(key);
                        setHighlighterOpacity(preset.opacity);
                      }}
                      className={`flex flex-col items-center gap-1 p-2.5 rounded-xl transition-all ${
                        highlighterType === key
                          ? "bg-primary/10 text-primary border border-primary/30 shadow-sm"
                          : "bg-background text-text-muted border border-border hover:bg-surface hover:text-text-main"
                      }`}
                    >
                      <div
                        className="w-10 h-2 rounded-sm"
                        style={{
                          backgroundColor: color,
                          opacity: preset.opacity,
                        }}
                      />
                      <span className="text-[9px] font-medium">
                        {preset.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Opacity Slider */}
              <div className="mb-3">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                    Opacity
                  </label>
                  <span className="text-[10px] font-bold text-primary">
                    {Math.round(highlighterOpacity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={70}
                  step={5}
                  value={Math.round(highlighterOpacity * 100)}
                  onChange={(e) =>
                    setHighlighterOpacity(Number(e.target.value) / 100)
                  }
                  className="w-full accent-primary h-1.5 cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-text-muted mt-0.5">
                  <span>10%</span>
                  <span>70%</span>
                </div>
              </div>

              {/* Preview */}
              <div className="mt-3 pt-3 border-t border-border/50">
                <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1.5 block">
                  Preview
                </label>
                <div className="bg-background rounded-xl h-10 flex items-center justify-center">
                  <div className="text-xs text-text-main font-medium relative px-4">
                    Sample Text
                    <div
                      className="absolute inset-x-0 bottom-0 h-3 rounded-sm"
                      style={{
                        backgroundColor: color,
                        opacity: highlighterOpacity,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {expandedTool === "eraser" && (
            <div className="bg-surface rounded-2xl shadow-card border border-border/50 p-4 w-72 animate-[fadeIn_.15s]">
              <div className="flex items-center gap-2 mb-3">
                <Eraser size={14} className="text-primary" />
                <h4 className="text-xs font-bold text-text-main uppercase tracking-wider">
                  Eraser Settings
                </h4>
              </div>

              {/* Eraser Type */}
              <div className="mb-3">
                <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1.5 block">
                  Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(eraserPresets).map(([key, preset]) => {
                    const Icon = preset.icon;
                    return (
                      <button
                        key={key}
                        onClick={() => setEraserType(key)}
                        className={`flex items-center gap-2 p-3 rounded-xl transition-all ${
                          eraserType === key
                            ? "bg-primary/10 text-primary border border-primary/30 shadow-sm"
                            : "bg-background text-text-muted border border-border hover:bg-surface hover:text-text-main"
                        }`}
                      >
                        <Icon
                          size={18}
                          strokeWidth={eraserType === key ? 2.5 : 2}
                        />
                        <span className="text-[11px] font-semibold">
                          {preset.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Size Slider */}
              <div className="mb-3">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                    Size
                  </label>
                  <span className="text-[10px] font-bold text-primary">
                    {eraserSize}px
                  </span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={80}
                  step={5}
                  value={eraserSize}
                  onChange={(e) => setEraserSize(Number(e.target.value))}
                  className="w-full accent-primary h-1.5 cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-text-muted mt-0.5">
                  <span>5px</span>
                  <span>80px</span>
                </div>
              </div>

              {/* Size Preview */}
              <div className="mt-3 pt-3 border-t border-border/50">
                <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1.5 block">
                  Preview
                </label>
                <div className="bg-background rounded-xl h-14 flex items-center justify-center">
                  <div
                    className="border-2 border-text-muted/40 bg-text-muted/10 transition-all"
                    style={{
                      width: `${Math.min(eraserSize, 60)}px`,
                      height: `${Math.min(eraserSize, 60)}px`,
                      borderRadius: eraserType === "point" ? "50%" : "4px",
                    }}
                  />
                </div>
              </div>

              {/* Eraser Quick Actions */}
              <div className="mt-3 pt-3 border-t border-border/50">
                <button
                  onClick={() => {
                    clearCanvas();
                    setExpandedTool(null);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-red-500/10 text-red-500 rounded-xl text-xs font-semibold hover:bg-red-500/20 transition-colors"
                >
                  <Trash2 size={14} /> Clear Entire Canvas
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Canvas Workspace ── */}
        <main className="flex-1 relative isolate bg-surface m-2 sm:m-4 md:m-6 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-sm border border-border/40 overflow-hidden group">
          {/* Dot grid */}
          <div
            className="absolute inset-0 pointer-events-none opacity-30"
            style={{
              backgroundImage:
                "radial-gradient(circle, #9ca3af 1.5px, transparent 1.5px)",
              backgroundSize: "24px 24px",
            }}
          />

          {/* Empty state */}
          {!hasDrawn && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 transition-opacity duration-300">
              <div className="w-20 h-20 bg-primary/10 rounded-[1.5rem] flex items-center justify-center text-primary mb-6 shadow-sm">
                <PenTool size={32} strokeWidth={2.5} />
              </div>
              <h2 className="text-3xl font-bold text-text-main tracking-tight">
                Premium Workspace
              </h2>
              <p className="text-text-secondary mt-3 max-w-sm text-center leading-relaxed">
                Capture your best ideas on our tactile paper-textured digital
                canvas.
              </p>
            </div>
          )}

          {/* Canvas */}
          <div className="absolute inset-0 z-20 overflow-hidden">
            <canvas
              ref={canvasRef}
              className="absolute inset-0 touch-none w-full h-full cursor-crosshair origin-center transition-transform duration-200"
              style={{ transform: `scale(${zoomLevel})` }}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={endDrawing}
              onMouseOut={endDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={endDrawing}
            />
          </div>

          {/* Bottom left controls */}
          <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 z-30 flex flex-col gap-2 sm:gap-3">
            <button
              onClick={handleUndo}
              className="p-2 sm:p-3 bg-surface rounded-xl sm:rounded-2xl shadow-card border border-border/50 text-text-secondary hover:text-primary transition-colors"
              title="Undo"
            >
              <Undo2 size={18} className="sm:w-[20px] sm:h-[20px]" />
            </button>
            <button
              onClick={handleRedo}
              className="p-2 sm:p-3 bg-surface rounded-xl sm:rounded-2xl shadow-card border border-border/50 text-text-secondary hover:text-primary transition-colors"
              title="Redo"
            >
              <Redo2 size={18} className="sm:w-[20px] sm:h-[20px]" />
            </button>
            <button
              onClick={() => setZoomLevel((z) => Math.min(z + 0.2, 3))}
              className="p-2 sm:p-3 bg-surface rounded-xl sm:rounded-2xl shadow-card border border-border/50 text-text-secondary hover:text-primary transition-colors mt-1 sm:mt-2"
              title="Zoom In"
            >
              <ZoomIn size={18} className="sm:w-[20px] sm:h-[20px]" />
            </button>
            <button
              onClick={() => setZoomLevel((z) => Math.max(z - 0.2, 0.5))}
              className="p-2 sm:p-3 bg-surface rounded-xl sm:rounded-2xl shadow-card border border-border/50 text-text-secondary hover:text-primary transition-colors"
              title="Zoom Out"
            >
              <ZoomOut size={18} className="sm:w-[20px] sm:h-[20px]" />
            </button>
          </div>

          {/* Bottom status tickers */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-6 md:gap-10 opacity-60 pointer-events-none hidden sm:flex">
            <div className="flex items-center gap-2">
              <div
                className={`w-1.5 h-3 rounded-full ${saving ? "bg-yellow-400 animate-pulse" : "bg-primary"}`}
              />
              <span className="text-[10px] font-bold text-text-main tracking-widest leading-tight uppercase">
                Canvas
                <br />
                {saving ? "Saving\u2026" : "Synced"}
              </span>
            </div>
            <div className="w-px h-6 bg-border" />
            <div className="text-[10px] font-bold text-text-secondary tracking-widest leading-tight uppercase">
              4K
              <br />
              Resolution
            </div>
            <div className="w-px h-6 bg-border" />
            <div className="text-[10px] font-bold text-text-secondary tracking-widest leading-tight uppercase">
              Pressure
              <br />
              Enabled
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Gallery Overlay */}
      {isGalleryOpen && (
        <div
          onClick={() => setIsGalleryOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 xl:hidden backdrop-blur-sm"
        />
      )}

      {/* ── Right Gallery Panel ── */}
      <aside
        className={`fixed inset-y-0 right-0 w-[340px] bg-background border-l border-border/50 flex-col py-8 px-6 shadow-card z-50 transform transition-transform duration-300 ease-in-out xl:translate-x-0 xl:flex ${isGalleryOpen ? "translate-x-0 flex" : "translate-x-full hidden xl:flex"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <ImageIcon className="text-primary" size={24} />
            <h2 className="text-xl font-bold text-text-main">Gallery</h2>
          </div>
          <span className="bg-primary/10 text-primary text-[10px] font-bold px-3 py-1.5 rounded-full tracking-wider">
            {sketches.length} SKETCH{sketches.length !== 1 ? "ES" : ""}
          </span>
        </div>

        {/* New Sketch button */}
        <button
          onClick={newSketch}
          className="w-full mb-5 py-3 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold text-primary hover:bg-primary/20 transition-all"
        >
          <Plus size={16} /> New Sketch
        </button>

        {/* Cards */}
        <div className="flex-1 flex flex-col gap-5 overflow-y-auto custom-scrollbar pr-2 pb-6">
          {loadingGallery ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="animate-spin text-primary" size={28} />
            </div>
          ) : sketches.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-text-muted">
              <ImageIcon size={40} className="mb-3 opacity-30" />
              <p className="text-sm">No sketches yet</p>
              <p className="text-xs mt-1">Draw something and hit save!</p>
            </div>
          ) : (
            sketches.map((sk) => (
              <div
                key={sk._id}
                className={`group cursor-pointer relative ${activeSketchId === sk._id ? "ring-2 ring-primary/40 rounded-[1.7rem]" : ""}`}
              >
                {/* Thumbnail */}
                <div
                  onClick={() => loadSketch(sk._id)}
                  className="bg-surface rounded-[1.5rem] border border-border/60 p-1.5 shadow-sm group-hover:shadow-card transition-all mb-3 h-40 flex items-center justify-center overflow-hidden"
                >
                  {sk.thumbnail ? (
                    <img
                      src={sk.thumbnail}
                      alt={sk.title}
                      className="w-full h-full object-contain rounded-[1.2rem]"
                    />
                  ) : (
                    <ImageIcon className="text-text-muted/30" size={32} />
                  )}
                </div>

                {/* Info row */}
                <div className="flex justify-between items-start px-1">
                  <div className="flex-1 min-w-0">
                    {renamingId === sk._id ? (
                      <div className="flex items-center gap-1">
                        <input
                          autoFocus
                          value={renameVal}
                          onChange={(e) => setRenameVal(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") submitRename(sk._id);
                            if (e.key === "Escape") setRenamingId(null);
                          }}
                          onBlur={() => submitRename(sk._id)}
                          className="text-sm font-bold border-b border-primary bg-transparent outline-none text-text-main w-full"
                        />
                      </div>
                    ) : (
                      <h4
                        className="text-sm font-bold text-text-main group-hover:text-primary transition-colors truncate"
                        onDoubleClick={() => {
                          setRenamingId(sk._id);
                          setRenameVal(sk.title);
                        }}
                      >
                        {sk.title}
                      </h4>
                    )}
                    <p className="text-xs text-text-muted mt-0.5">
                      {fmtDate(sk.updatedAt || sk.createdAt)}
                    </p>
                  </div>

                  {/* Menu trigger */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(menuOpen === sk._id ? null : sk._id);
                      }}
                      className="text-text-muted hover:text-text-main p-1"
                    >
                      <MoreVertical size={16} />
                    </button>

                    {/* Dropdown */}
                    {menuOpen === sk._id && (
                      <div className="absolute right-0 top-8 bg-surface border border-border rounded-xl shadow-card p-1.5 z-50 w-36 animate-[fadeIn_.15s]">
                        <button
                          onClick={() => {
                            setRenamingId(sk._id);
                            setRenameVal(sk.title);
                            setMenuOpen(null);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-main hover:bg-background rounded-lg transition-colors"
                        >
                          <Edit3 size={14} /> Rename
                        </button>
                        <button
                          onClick={() => deleteSketch(sk._id)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Sync button */}
        <div className="pt-4 border-t border-border/50 shrink-0">
          <button
            onClick={saveSketch}
            disabled={saving || !hasDrawn}
            className="w-full py-3.5 bg-surface border border-border/80 shadow-sm rounded-2xl flex items-center justify-center gap-2 text-sm font-bold text-text-secondary hover:text-primary hover:border-primary/30 transition-all group disabled:opacity-40"
          >
            {saving ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Cloud
                size={18}
                className="group-hover:-translate-y-0.5 transition-transform"
              />
            )}
            {saving ? "Saving\u2026" : "Sync Cloud Gallery"}
          </button>
        </div>
      </aside>

      {/* Close menus on outside click */}
      {menuOpen && (
        <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(null)} />
      )}
    </div>
  );
};

export default DrawingPad;
