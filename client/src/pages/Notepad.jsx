import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { useSearchParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import RightPanel from "../components/RightPanel";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../hooks/useSocket";
import { useLayoutStore } from "../store/layoutStore";
import {
  Bold,
  Italic,
  List,
  ImageIcon,
  Link2,
  Share2,
  ChevronRight,
  Plus,
  CheckCircle2,
  Circle,
  Sparkles,
  Menu,
  BookOpen,
  Trash2,
  X,
  Save,
  Code2,
  Heading2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Type,
  Upload,
  FileText,
  Users,
  Clock,
  Hash,
  Eye,
  Copy,
  Search,
  Calendar,
  Unlink,
  CheckSquare,
  Square,
  Trash,
  PanelRightOpen,
  PanelRightClose,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const API = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api`;
const axiosCfg = { withCredentials: true };
const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const LANGS = ["Java", "C++", "Python", "GO", "Typescript", "JavaScript"];

/* ── helpers ── */
const strip = (h) => (h || "").replace(/<[^>]*>/g, " ").trim();
const countWords = (bks) => {
  let n = 0;
  for (const b of bks) {
    const t = b.type === "code" ? b.code || "" : strip(b.html);
    n += t.split(/\s+/).filter(Boolean).length;
  }
  return n;
};
const readTime = (w) => `${Math.max(1, Math.round(w / 200))} min`;
const timeAgo = (d) => {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "Just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(d).toLocaleDateString();
};
const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

/* ── CodeBlock ── */
const CodeBlock = ({ block, onChange, onDelete }) => (
  <div className="rounded-xl overflow-hidden my-4 border border-white/10 bg-[#0d1117]">
    <div className="flex items-center px-4 py-2 border-b border-white/5 gap-1 flex-wrap">
      {LANGS.map((l) => (
        <button
          key={l}
          onClick={() => onChange({ ...block, language: l })}
          className={`px-3 py-1 rounded-md text-xs transition-all ${
            block.language === l
              ? "text-white font-bold bg-white/10"
              : "text-white/40 hover:text-white/70"
          }`}
        >
          {l}
        </button>
      ))}
      <button
        onClick={onDelete}
        className="ml-auto p-1 text-white/30 hover:text-rose-400 transition-colors rounded"
        title="Remove code block"
      >
        <X size={14} />
      </button>
    </div>
    <textarea
      value={block.code || ""}
      onChange={(e) => onChange({ ...block, code: e.target.value })}
      className="w-full bg-transparent text-emerald-300 font-mono text-sm p-4 outline-none resize-none min-h-[160px] leading-relaxed placeholder:text-white/20"
      spellCheck={false}
      placeholder="// Paste or write your code here..."
    />
  </div>
);

/* ══════════════ Notepad ══════════════ */
const Notepad = () => {
  const { user } = useAuth();
  const { isRightPanelOpen: isRightPanelOpenDesktop, toggleRightPanel } = useLayoutStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isDocInfoOpen, setIsDocInfoOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const { socketRef, connected: socketConnected } = useSocket();
  const [liveUsers, setLiveUsers] = useState(0);
  const isRemoteUpdate = useRef(false);
  const isSharedView = useRef(false);

  /* library */
  const [library, setLibrary] = useState([]);
  const [allNotebooks, setAllNotebooks] = useState([]);
  const [notebookSearch, setNotebookSearch] = useState("");
  const [activeSub, setActiveSub] = useState(null);
  const [activeCh, setActiveCh] = useState(null);

  /* notebook */
  const [notebook, setNotebook] = useState(null);
  const [title, setTitle] = useState("Untitled Document");
  const [blocks, setBlocks] = useState([{ id: uid(), type: "text", html: "" }]);
  const [tags, setTags] = useState([]);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  /* tasks */
  const [tasks, setTasks] = useState([]);

  /* modals */
  const [showNewModal, setShowNewModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [showTagModal, setShowTagModal] = useState(false);
  const [newTagVal, setNewTagVal] = useState("");
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [showLinkTaskModal, setShowLinkTaskModal] = useState(false);
  const [allTasks, setAllTasks] = useState([]);
  const [linkedTaskIds, setLinkedTaskIds] = useState([]);
  const [toast, setToast] = useState("");

  /* multi-select notebooks */
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedNbIds, setSelectedNbIds] = useState(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteAllMode, setDeleteAllMode] = useState(false);

  /* refs */
  const saveTimer = useRef(null);
  const textRefs = useRef({});
  const activeBlk = useRef(null);
  const selRef = useRef(null);
  const initBlocks = useRef(new Set());
  const fileInputRef = useRef(null);
  const nbRef = useRef(null);
  nbRef.current = notebook;
  const titleRef = useRef(title);
  titleRef.current = title;
  const blocksRef = useRef(blocks);
  blocksRef.current = blocks;
  const tagsRef = useRef(tags);
  tagsRef.current = tags;

  const flash = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  /* ─── fetch all user notebooks for library sidebar ─── */
  const fetchAllNotebooks = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/notebooks`, axiosCfg);
      setAllNotebooks(data);
    } catch (e) {
      console.error("Fetch notebooks error:", e);
    }
  }, []);

  /* ─── set default paragraph separator ─── */
  useEffect(() => {
    document.execCommand("defaultParagraphSeparator", false, "p");
  }, []);

  /* ─── fetch library (subjects) ─── */
  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`${API}/subjects`, axiosCfg);
        const m = data.map((s, i) => ({
          _id: s._id,
          name: s.name,
          open: i === 0,
          chapters: (s.chapters || []).map((c) => c.name),
        }));
        setLibrary(m);
        // Only auto-select chapter if not loading a shared notebook
        const sharedId = searchParams.get("id");
        if (!sharedId && m.length && m[0].chapters.length) {
          setActiveSub(m[0]);
          setActiveCh(m[0].chapters[0]);
        } else if (!sharedId && (!m.length || !m[0]?.chapters?.length)) {
          // No subjects/chapters available — auto-create a blank notebook so saving works
          try {
            const { data: nb } = await axios.post(
              `${API}/notebooks`,
              { title: "Untitled Document" },
              axiosCfg,
            );
            loadNb(nb);
          } catch (err) {
            console.error("Auto-create notebook error:", err);
          }
        }
      } catch (e) {
        console.error("Library fetch error:", e);
      }
    })();
    // Also fetch all notebooks for the sidebar
    fetchAllNotebooks();
  }, []);

  /* ─── load shared notebook from URL ?id=xxx ─── */
  useEffect(() => {
    const sharedId = searchParams.get("id");
    if (!sharedId) return;
    isSharedView.current = true;
    (async () => {
      try {
        // Try shared endpoint first, then owned endpoint
        let data;
        try {
          const res = await axios.get(
            `${API}/notebooks/shared/${sharedId}`,
            axiosCfg,
          );
          data = res.data;
        } catch {
          const res = await axios.get(`${API}/notebooks/${sharedId}`, axiosCfg);
          data = res.data;
        }
        loadNb(data);
        setActiveSub(null);
        setActiveCh(null);
      } catch (e) {
        console.error("Failed to load shared notebook:", e);
      }
    })();
  }, [searchParams]);

  /* ─── fetch notebook on chapter change ─── */
  useEffect(() => {
    if (!activeSub || !activeCh) return;
    (async () => {
      try {
        const { data } = await axios.get(`${API}/notebooks/chapter`, {
          ...axiosCfg,
          params: { subjectId: activeSub._id, chapterName: activeCh },
        });
        loadNb(data);
      } catch (e) {
        console.error("Notebook fetch error:", e);
      }
    })();
  }, [activeSub, activeCh]);

  const loadNb = (data) => {
    setNotebook(data);
    setTitle(data.title || "Untitled Document");
    setTags(data.tags || []);
    setLastSaved(data.updatedAt);
    initBlocks.current.clear();
    textRefs.current = {};
    if (data.blocks && data.blocks.length > 0) {
      setBlocks(data.blocks.map((b) => ({ ...b, id: b.id || uid() })));
    } else if (data.content) {
      setBlocks([{ id: uid(), type: "text", html: data.content }]);
    } else {
      setBlocks([{ id: uid(), type: "text", html: "" }]);
    }
  };

  /* ─── Socket.IO: join/leave notebook room & listen for changes ─── */
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !socketConnected || !notebook?._id) return;

    console.log("Joining notebook room:", notebook._id);
    socket.emit("join-notebook", notebook._id);

    const handleUserCount = (count) => {
      console.log("Live users:", count);
      setLiveUsers(count);
    };
    const handleNotebookChanged = ({ title: t, blocks: b, tags: tg }) => {
      console.log("Received remote notebook update");
      isRemoteUpdate.current = true;
      if (t !== undefined) {
        setTitle(t);
        titleRef.current = t;
      }
      if (tg !== undefined) {
        setTags(tg);
        tagsRef.current = tg;
      }
      if (b !== undefined) {
        initBlocks.current.clear();
        textRefs.current = {};
        const newBlocks = b.map((bl) => ({ ...bl, id: bl.id || uid() }));
        setBlocks(newBlocks);
        blocksRef.current = newBlocks;
      }
      setTimeout(() => {
        isRemoteUpdate.current = false;
      }, 300);
    };

    socket.on("user-count", handleUserCount);
    socket.on("notebook-changed", handleNotebookChanged);

    return () => {
      socket.emit("leave-notebook", notebook._id);
      socket.off("user-count", handleUserCount);
      socket.off("notebook-changed", handleNotebookChanged);
    };
  }, [notebook?._id, socketConnected]);

  /* ─── fetch tasks ─── */
  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`${API}/tasks`, axiosCfg);
        const all = [...(data.todo || []), ...(data.inProgress || [])].slice(
          0,
          5,
        );
        setTasks(
          all.map((t) => ({
            text: t.title,
            due: t.dueDate
              ? new Date(t.dueDate).toLocaleDateString()
              : "No due date",
            done: t.status === "completed",
            _id: t._id,
          })),
        );
      } catch (e) {
        console.error("Task fetch error:", e);
      }
    })();
  }, []);

  /* ─── init contentEditable blocks after render ─── */
  useEffect(() => {
    for (const b of blocks) {
      if (b.type === "text" && !initBlocks.current.has(b.id)) {
        const el = textRefs.current[b.id];
        if (el) {
          el.innerHTML = b.html || "";
          initBlocks.current.add(b.id);
        }
      }
    }
  }, [blocks]);

  /* ─── auto-save (refs-based, no stale closures) ─── */
  const broadcastChanges = useCallback(() => {
    if (
      !isRemoteUpdate.current &&
      socketRef.current?.connected &&
      nbRef.current?._id
    ) {
      socketRef.current.emit("notebook-update", {
        notebookId: nbRef.current._id,
        title: titleRef.current,
        blocks: blocksRef.current,
        tags: tagsRef.current,
      });
    }
  }, []);

  const saveToLocal = useCallback(async () => {
    try {
      await axios.post(
        `${API}/local-save`,
        {
          notebookId: nbRef.current?._id || `nb_${Date.now()}`,
          title: titleRef.current,
          blocks: blocksRef.current,
          tags: tagsRef.current,
        },
        axiosCfg,
      );
      console.log("Local save OK");
    } catch (e) {
      console.error("Local save failed:", e);
    }
  }, []);

  const triggerSave = useCallback(() => {
    clearTimeout(saveTimer.current);

    // Broadcast immediately for real-time feel
    broadcastChanges();

    saveTimer.current = setTimeout(async () => {
      setSaving(true);
      try {
        // Always save to local filesystem
        await saveToLocal();

        // Also save to MongoDB if we have a notebook ID
        if (nbRef.current?._id) {
          const endpoint = isSharedView.current
            ? `${API}/notebooks/shared/${nbRef.current._id}`
            : `${API}/notebooks/${nbRef.current._id}`;
          const { data } = await axios.put(
            endpoint,
            {
              title: titleRef.current,
              blocks: blocksRef.current,
              tags: tagsRef.current,
            },
            axiosCfg,
          );
          setNotebook(data);
          setLastSaved(data.updatedAt);
        } else {
          setLastSaved(new Date().toISOString());
        }
      } catch (e) {
        console.error("Save error:", e);
      } finally {
        setSaving(false);
      }
    }, 800);
  }, []);

  const forceSave = useCallback(async () => {
    clearTimeout(saveTimer.current);

    // Broadcast to other users
    broadcastChanges();

    setSaving(true);
    try {
      // Always save to local filesystem
      await saveToLocal();

      // Also save to MongoDB if we have a notebook ID
      if (nbRef.current?._id) {
        const endpoint = isSharedView.current
          ? `${API}/notebooks/shared/${nbRef.current._id}`
          : `${API}/notebooks/${nbRef.current._id}`;
        const { data } = await axios.put(
          endpoint,
          {
            title: titleRef.current,
            blocks: blocksRef.current,
            tags: tagsRef.current,
          },
          axiosCfg,
        );
        setNotebook(data);
        setLastSaved(data.updatedAt);
      } else {
        setLastSaved(new Date().toISOString());
      }
    } catch (e) {
      console.error("Save error:", e);
    } finally {
      setSaving(false);
    }
  }, []);

  useEffect(() => () => clearTimeout(saveTimer.current), []);

  /* ─── block operations ─── */
  const updateBlock = (id, newData) => {
    setBlocks((p) => p.map((b) => (b.id === id ? { ...b, ...newData } : b)));
    triggerSave();
  };

  const addBlock = (type, afterId) => {
    const nb =
      type === "code"
        ? { id: uid(), type: "code", language: "Java", code: "" }
        : { id: uid(), type: "text", html: "" };
    setBlocks((p) => {
      const idx = afterId ? p.findIndex((b) => b.id === afterId) : p.length - 1;
      return [...p.slice(0, idx + 1), nb, ...p.slice(idx + 1)];
    });
    triggerSave();
    if (type === "text") {
      setTimeout(() => textRefs.current[nb.id]?.focus(), 50);
    }
  };

  const deleteBlock = (id) => {
    setBlocks((p) => (p.length <= 1 ? p : p.filter((b) => b.id !== id)));
    triggerSave();
  };

  /* ─── toolbar commands ─── */
  const exec = (cmd, val = null) => document.execCommand(cmd, false, val);

  const handleHeading = () => {
    const sel = window.getSelection();
    let isH2 = false;
    if (sel?.anchorNode) {
      let node =
        sel.anchorNode.nodeType === 3
          ? sel.anchorNode.parentElement
          : sel.anchorNode;
      while (node && node.contentEditable !== "true") {
        if (node.tagName === "H2") {
          isH2 = true;
          break;
        }
        node = node.parentElement;
      }
    }
    exec("formatBlock", isH2 ? "P" : "H2");
  };

  const saveSel = () => {
    const sel = window.getSelection();
    if (sel?.rangeCount) selRef.current = sel.getRangeAt(0).cloneRange();
  };
  const restoreSel = () => {
    if (selRef.current) {
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(selRef.current);
      selRef.current = null;
    }
  };

  const insertLink = () => {
    if (!linkUrl.trim()) {
      setShowLinkModal(false);
      return;
    }
    restoreSel();
    exec("createLink", linkUrl.trim());
    setShowLinkModal(false);
    setLinkUrl("");
    const bid = activeBlk.current;
    if (bid && textRefs.current[bid])
      updateBlock(bid, { html: textRefs.current[bid].innerHTML });
  };

  const insertImage = () => {
    if (!imageUrl.trim()) {
      setShowImageModal(false);
      return;
    }
    restoreSel();
    exec("insertImage", imageUrl.trim());
    setShowImageModal(false);
    setImageUrl("");
    const bid = activeBlk.current;
    if (bid && textRefs.current[bid])
      updateBlock(bid, { html: textRefs.current[bid].innerHTML });
  };

  /* ─── File upload handler (drag & browse) ─── */
  const handleFileUpload = useCallback((files) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      flash("File too large. Max size is 10MB.");
      return;
    }
    const allowed = [
      "image/png",
      "image/jpeg",
      "image/gif",
      "image/webp",
      "image/svg+xml",
    ];
    if (!allowed.includes(file.type)) {
      flash("Unsupported file type. Use PNG, JPG, GIF, or WebP.");
      return;
    }
    setUploadProgress(0);
    const reader = new FileReader();
    reader.onprogress = (e) => {
      if (e.lengthComputable)
        setUploadProgress(Math.round((e.loaded / e.total) * 100));
    };
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      restoreSel();
      // Insert into the active block or any focused block
      const bid = activeBlk.current;
      if (bid && textRefs.current[bid]) {
        const el = textRefs.current[bid];
        el.focus();
        const img = `<img src="${dataUrl}" alt="${file.name}" style="max-width:100%;border-radius:12px;margin:8px 0;" />`;
        document.execCommand("insertHTML", false, img);
        updateBlock(bid, { html: el.innerHTML });
      } else {
        // Create a new text block with the image
        const newId = uid();
        const img = `<img src="${dataUrl}" alt="${file.name}" style="max-width:100%;border-radius:12px;margin:8px 0;" />`;
        setBlocks((p) => [...p, { id: newId, type: "text", html: img }]);
        triggerSave();
      }
      setUploadProgress(null);
      setShowImageModal(false);
      setIsDragging(false);
      flash("Image inserted successfully!");
    };
    reader.onerror = () => {
      setUploadProgress(null);
      flash("Failed to read file.");
    };
    reader.readAsDataURL(file);
  }, []);

  /* ─── Drag & drop handlers for the drop zone ─── */
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer?.files;
    if (files?.length) handleFileUpload(files);
  };
  const handleBrowseFiles = () => fileInputRef.current?.click();
  const handleFileInputChange = (e) => {
    handleFileUpload(e.target.files);
    e.target.value = "";
  };

  const handleShare = async () => {
    if (!nbRef.current?._id) {
      flash("Please save the notebook first before sharing.");
      return;
    }
    await forceSave();
    try {
      // Mark notebook as shared on the server
      await axios.put(
        `${API}/notebooks/${nbRef.current._id}/share`,
        {},
        axiosCfg,
      );
      const shareUrl = `${window.location.origin}/shared/${nbRef.current._id}`;
      setShareLink(shareUrl);
      setShowShareModal(true);
    } catch {
      flash("Notebook saved & shared!");
    }
  };

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      flash("Share link copied to clipboard!");
    } catch {
      flash("Could not copy link.");
    }
  };

  const stopSharing = async () => {
    if (!nbRef.current?._id) return;
    try {
      await axios.put(
        `${API}/notebooks/${nbRef.current._id}`,
        { isShared: false },
        axiosCfg,
      );
      setShowShareModal(false);
      flash("Sharing disabled.");
    } catch {
      flash("Could not disable sharing.");
    }
  };

  /* ─── link task to notebook ─── */
  const openLinkTaskModal = async () => {
    try {
      const { data } = await axios.get(`${API}/tasks`, axiosCfg);
      const all = [
        ...(data.todo || []),
        ...(data.inProgress || []),
        ...(data.completed || []),
      ];
      setAllTasks(all);
      setShowLinkTaskModal(true);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleLinkedTask = (taskId) => {
    setLinkedTaskIds((p) =>
      p.includes(taskId) ? p.filter((id) => id !== taskId) : [...p, taskId],
    );
  };

  const confirmLinkTasks = () => {
    const linked = allTasks
      .filter((t) => linkedTaskIds.includes(t._id))
      .map((t) => ({
        text: t.title,
        due: t.dueDate
          ? new Date(t.dueDate).toLocaleDateString()
          : "No due date",
        done: t.status === "completed",
        _id: t._id,
      }));
    setTasks((prev) => {
      const existingIds = new Set(prev.map((t) => t._id));
      const newTasks = linked.filter((t) => !existingIds.has(t._id));
      return [...prev, ...newTasks];
    });
    setShowLinkTaskModal(false);
    flash("Tasks linked!");
  };

  /* ─── keyboard shortcuts for text blocks ─── */
  const handleKeyDown = (e, bid) => {
    const ctrl = e.ctrlKey || e.metaKey;
    if (ctrl && e.key === "b") {
      e.preventDefault();
      exec("bold");
    }
    if (ctrl && e.key === "i") {
      e.preventDefault();
      exec("italic");
    }
    if (ctrl && e.key === "k") {
      e.preventDefault();
      if (e.shiftKey) {
        addBlock("code", bid);
      } else {
        saveSel();
        setShowLinkModal(true);
      }
    }
    if (ctrl && e.key === "s") {
      e.preventDefault();
      forceSave();
    }
  };

  /* ─── folder, chapter, title, task handlers ─── */
  const toggleFolder = (i) =>
    setLibrary((p) => p.map((f, j) => (j === i ? { ...f, open: !f.open } : f)));

  const selectChapter = (sub, ch) => {
    forceSave();
    setActiveSub(sub);
    setActiveCh(ch);
  };

  const handleTitle = (e) => {
    setTitle(e.target.value);
    triggerSave();
  };

  const toggleTask = async (i) => {
    const t = tasks[i];
    if (!t) return;
    const ns = t.done ? "todo" : "completed";
    try {
      if (t._id)
        await axios.put(`${API}/tasks/${t._id}`, { status: ns }, axiosCfg);
      setTasks((p) => p.map((x, j) => (j === i ? { ...x, done: !x.done } : x)));
    } catch (e) {
      console.error(e);
    }
  };

  /* ─── notebook CRUD ─── */
  const createBlankNb = async () => {
    try {
      const { data } = await axios.post(
        `${API}/notebooks`,
        { title: newTitle || "Untitled Document" },
        axiosCfg,
      );
      loadNb(data);
      setActiveSub(null);
      setActiveCh(null);
      setShowNewModal(false);
      setNewTitle("");
      fetchAllNotebooks(); // refresh sidebar list
    } catch (e) {
      console.error(e);
    }
  };

  const deleteNb = async () => {
    if (!nbRef.current?._id) return;
    try {
      await axios.delete(`${API}/notebooks/${nbRef.current._id}`, axiosCfg);
      setNotebook(null);
      setTitle("Untitled Document");
      setBlocks([{ id: uid(), type: "text", html: "" }]);
      setTags([]);
      initBlocks.current.clear();
      if (library.length && library[0].chapters.length) {
        setActiveSub(library[0]);
        setActiveCh(library[0].chapters[0]);
      } else {
        // Auto-create a new blank notebook so the editor stays functional
        try {
          const { data } = await axios.post(
            `${API}/notebooks`,
            { title: "Untitled Document" },
            axiosCfg,
          );
          loadNb(data);
        } catch (err) {
          console.error("Auto-create notebook error:", err);
        }
      }
    } catch (e) {
      console.error(e);
    }
    fetchAllNotebooks(); // refresh sidebar list
  };

  /* ─── multi-select & bulk delete ─── */
  const toggleSelectionMode = () => {
    setSelectionMode((p) => !p);
    setSelectedNbIds(new Set());
  };

  const toggleSelectNb = (id) => {
    setSelectedNbIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllNbs = () => {
    if (selectedNbIds.size === filteredNotebooks.length) {
      setSelectedNbIds(new Set());
    } else {
      setSelectedNbIds(new Set(filteredNotebooks.map((nb) => nb._id)));
    }
  };

  const bulkDeleteNbs = async () => {
    try {
      if (deleteAllMode) {
        await axios.delete(`${API}/notebooks/all`, axiosCfg);
      } else {
        await axios.post(
          `${API}/notebooks/bulk-delete`,
          { ids: [...selectedNbIds] },
          axiosCfg,
        );
      }
      // If current notebook was in the deleted set, reset editor
      if (deleteAllMode || (notebook?._id && selectedNbIds.has(notebook._id))) {
        setNotebook(null);
        setTitle("Untitled Document");
        setBlocks([{ id: uid(), type: "text", html: "" }]);
        setTags([]);
        initBlocks.current.clear();
        // Auto-create a new blank notebook
        try {
          const { data } = await axios.post(
            `${API}/notebooks`,
            { title: "Untitled Document" },
            axiosCfg,
          );
          loadNb(data);
        } catch (err) {
          console.error("Auto-create notebook error:", err);
        }
      }
      setSelectedNbIds(new Set());
      setSelectionMode(false);
      setShowDeleteConfirm(false);
      setDeleteAllMode(false);
      fetchAllNotebooks();
      flash(
        deleteAllMode
          ? "All notebooks deleted!"
          : `${selectedNbIds.size} notebook(s) deleted!`,
      );
    } catch (e) {
      console.error("Bulk delete error:", e);
      flash("Failed to delete notebooks.");
    }
  };

  /* ─── tags ─── */
  const tagColors = [
    { bg: "bg-primary/15", color: "text-primary" },
    { bg: "bg-blue-500/15", color: "text-blue-400" },
    { bg: "bg-purple-500/15", color: "text-purple-400" },
    { bg: "bg-amber-500/15", color: "text-amber-400" },
    { bg: "bg-rose-500/15", color: "text-rose-400" },
  ];

  const addTag = () => {
    if (!newTagVal.trim()) return;
    const c = tagColors[tags.length % tagColors.length];
    const up = [...tags, { label: newTagVal.trim(), ...c }];
    setTags(up);
    setNewTagVal("");
    setShowTagModal(false);
    triggerSave();
  };

  const removeTag = (i) => {
    setTags((p) => p.filter((_, j) => j !== i));
    triggerSave();
  };

  /* ─── computed ─── */
  const wc = countWords(blocks);
  const rt = readTime(wc);
  const charCount = blocks.reduce((n, b) => {
    const t = b.type === "code" ? b.code || "" : strip(b.html);
    return n + t.length;
  }, 0);

  // Extract headings from blocks for Table of Contents
  const headings = blocks.reduce((acc, b) => {
    if (b.type !== "text" || !b.html) return acc;
    const tmp = document.createElement("div");
    tmp.innerHTML = b.html;
    tmp.querySelectorAll("h1,h2,h3,h4").forEach((h) => {
      const text = h.textContent.trim();
      if (text)
        acc.push({ level: parseInt(h.tagName[1]), text, blockId: b.id });
    });
    return acc;
  }, []);

  // Filter notebooks for sidebar search
  const filteredNotebooks = allNotebooks.filter((nb) =>
    (nb.title || "Untitled")
      .toLowerCase()
      .includes(notebookSearch.toLowerCase()),
  );

  /* ─── select a notebook from the sidebar list ─── */
  const selectNotebook = (nb) => {
    forceSave();
    setActiveSub(null);
    setActiveCh(null);
    loadNb(nb);
  };

  /* ─── toolbar button helper ─── */
  const TBtn = ({ onClick, title: tip, children }) => (
    <button
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={tip}
      className="p-2 text-text-muted hover:bg-surface-hover hover:text-text-main rounded-lg transition-colors"
    >
      {children}
    </button>
  );

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
        className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar onMobileClose={() => setIsSidebarOpen(false)} />
      </div>

      {/* ─── main area ─── */}
      <div className={`flex-1 md:ml-20 main-content right-panel-transition flex h-screen overflow-hidden`}>
        {/* Mobile Library Overlay */}
        {isLibraryOpen && (
          <div
            onClick={() => setIsLibraryOpen(false)}
            className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-sm"
          />
        )}

        {/* Doc Info Overlay (below lg) */}
        {isDocInfoOpen && (
          <div
            onClick={() => setIsDocInfoOpen(false)}
            className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-sm"
          />
        )}

        {/* ─── library sidebar ─── */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-64 lg:w-60 xl:w-64 border-r border-border bg-surface/95 backdrop-blur-md flex-col shrink-0 overflow-y-auto transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:flex ${isLibraryOpen ? "translate-x-0 flex" : "-translate-x-full hidden lg:flex"}`}
        >
          <div className="p-4 flex flex-col h-full overflow-hidden">
            {/* Mobile close + heading */}
            <div className="flex items-center justify-between mb-4 px-2">
              <h2 className="text-xs font-bold uppercase tracking-widest text-text-muted">
                Library
              </h2>
              <button
                onClick={() => setIsLibraryOpen(false)}
                className="lg:hidden p-1 text-text-muted hover:text-primary rounded-lg transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="space-y-1">
              {library.map((folder, fi) => (
                <div key={folder._id || fi}>
                  <button
                    onClick={() => toggleFolder(fi)}
                    className={`w-full flex items-center justify-between gap-1 p-2 rounded-xl transition-all ${
                      folder.open
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-text-secondary hover:bg-surface-hover"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                      <BookOpen size={16} className="shrink-0" />
                      <span className="text-sm truncate">{folder.name}</span>
                    </div>
                    <ChevronRight
                      size={14}
                      className={`shrink-0 transition-transform ${folder.open ? "rotate-90" : ""}`}
                    />
                  </button>
                  {folder.open && folder.chapters.length > 0 && (
                    <div className="ml-3 pl-3 border-l-2 border-border space-y-1 mt-1">
                      {folder.chapters.map((child) => (
                        <button
                          key={child}
                          onClick={() => selectChapter(folder, child)}
                          className={`w-full text-left p-2 text-sm rounded-lg transition-colors truncate ${
                            activeSub?._id === folder._id && activeCh === child
                              ? "text-primary font-medium bg-primary/5"
                              : "text-text-secondary hover:bg-surface-hover"
                          }`}
                        >
                          {child}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Notebooks Section */}
            <div className="mt-6 pt-4 border-t border-border/50 flex-1 flex flex-col min-h-0">
              <h2 className="text-xs font-bold uppercase tracking-widest text-text-muted mb-3 px-2 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileText size={12} />
                  My Notebooks
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-bold">
                    {allNotebooks.length}
                  </span>
                </span>
              </h2>

              {/* Multi-select controls */}
              <div className="flex flex-wrap items-center gap-1.5 px-1 mb-2">
                <button
                  onClick={toggleSelectionMode}
                  className={`flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded-lg transition-all ${
                    selectionMode
                      ? "bg-primary/15 text-primary border border-primary/30"
                      : "text-text-muted hover:text-text-secondary hover:bg-surface-hover border border-transparent"
                  }`}
                >
                  <CheckSquare size={11} />
                  {selectionMode ? "Cancel" : "Select"}
                </button>
                {selectionMode && (
                  <>
                    <button
                      onClick={selectAllNbs}
                      className="px-2 py-1 text-[10px] font-medium text-text-muted hover:text-primary hover:bg-surface-hover rounded-lg transition-all"
                    >
                      {selectedNbIds.size === filteredNotebooks.length
                        ? "Deselect All"
                        : "Select All"}
                    </button>
                    {selectedNbIds.size > 0 && (
                      <button
                        onClick={() => {
                          setDeleteAllMode(false);
                          setShowDeleteConfirm(true);
                        }}
                        className="ml-auto flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                      >
                        <Trash2 size={10} />
                        {selectedNbIds.size}
                      </button>
                    )}
                  </>
                )}
                {!selectionMode && allNotebooks.length > 0 && (
                  <button
                    onClick={() => {
                      setDeleteAllMode(true);
                      setShowDeleteConfirm(true);
                    }}
                    className="ml-auto flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-rose-400/70 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                    title="Delete all notebooks"
                  >
                    <Trash size={10} />
                    Clear All
                  </button>
                )}
              </div>

              {/* Search */}
              <div className="relative mb-3 px-1">
                <Search
                  size={13}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                />
                <input
                  type="text"
                  value={notebookSearch}
                  onChange={(e) => setNotebookSearch(e.target.value)}
                  placeholder="Search notebooks..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-background/60 border border-border/50 rounded-lg text-text-main placeholder:text-text-muted outline-none focus:border-primary/50 transition-colors"
                />
              </div>

              {/* Notebook list */}
              <div className="flex-1 overflow-y-auto space-y-1 min-h-0 px-1">
                {filteredNotebooks.length === 0 && (
                  <p className="text-[11px] text-text-muted italic px-2 py-3">
                    {notebookSearch
                      ? "No notebooks match search"
                      : "No notebooks yet"}
                  </p>
                )}
                {filteredNotebooks.map((nb) => (
                  <button
                    key={nb._id}
                    onClick={() =>
                      selectionMode
                        ? toggleSelectNb(nb._id)
                        : selectNotebook(nb)
                    }
                    className={`w-full text-left p-2.5 rounded-xl transition-all group ${
                      selectionMode && selectedNbIds.has(nb._id)
                        ? "bg-rose-500/10 border border-rose-400/30"
                        : notebook?._id === nb._id && !selectionMode
                          ? "bg-primary/10 border border-primary/20"
                          : "hover:bg-surface-hover border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {selectionMode ? (
                        selectedNbIds.has(nb._id) ? (
                          <CheckSquare
                            size={14}
                            className="text-rose-400 shrink-0"
                          />
                        ) : (
                          <Square
                            size={14}
                            className="text-text-muted shrink-0"
                          />
                        )
                      ) : (
                        <FileText
                          size={14}
                          className={
                            notebook?._id === nb._id
                              ? "text-primary shrink-0"
                              : "text-text-muted shrink-0"
                          }
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-xs font-medium truncate ${
                            notebook?._id === nb._id
                              ? "text-primary"
                              : "text-text-main"
                          }`}
                        >
                          {nb.title || "Untitled Document"}
                        </p>
                        <p className="text-[10px] text-text-muted mt-0.5 flex items-center gap-2">
                          <span>{fmtDate(nb.updatedAt || nb.createdAt)}</span>
                          {nb.isShared && (
                            <span className="text-primary flex items-center gap-0.5">
                              <Users size={9} /> Shared
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setShowNewModal(true)}
              className="mt-4 w-full flex items-center gap-2 p-2.5 text-sm text-text-muted hover:text-primary border-2 border-dashed border-border rounded-xl transition-all hover:border-primary shrink-0"
            >
              <Plus size={16} />
              <span>New Notebook</span>
            </button>
          </div>
        </aside>

        {/* ─── editor area ─── */}
        <main className="flex-1 flex flex-col bg-surface overflow-hidden min-w-0">
          {/* toolbar */}
          <header className="h-14 border-b border-border flex items-center justify-between px-4 md:px-6 bg-surface/80 backdrop-blur-md sticky top-0 z-10 shrink-0 gap-4">
            <div className="flex items-center flex-1 min-w-0">
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="md:hidden p-2 text-text-secondary hover:text-primary"
                >
                  <Menu size={22} />
                </button>
                <button
                  onClick={() => setIsLibraryOpen(true)}
                  className="lg:hidden p-2 text-text-secondary hover:text-primary"
                  title="Library"
                >
                  <BookOpen size={20} />
                </button>
              </div>

              {/* breadcrumb */}
              <div className="hidden md:flex items-center gap-2 text-sm text-text-muted truncate ml-2">
                {activeSub ? (
                  <>
                    <span className="truncate">{activeSub.name}</span>
                    <ChevronRight size={14} className="shrink-0" />
                    <span className="text-text-main font-medium shrink-0">
                      {activeCh || "Untitled"}
                    </span>
                  </>
                ) : (
                  <span className="text-text-main font-medium truncate">
                    {title || "Untitled Document"}
                  </span>
                )}
              </div>
            </div>

            {/* format buttons */}
            <div className="hidden sm:flex items-center justify-center gap-0.5 border-x border-border px-2 overflow-x-auto min-w-0 shrink-0 mx-auto">
              <TBtn onClick={() => exec("bold")} title="Bold (Ctrl+B)">
                <Bold size={18} />
              </TBtn>
              <TBtn onClick={() => exec("italic")} title="Italic (Ctrl+I)">
                <Italic size={18} />
              </TBtn>
              <TBtn onClick={handleHeading} title="Heading">
                <Heading2 size={18} />
              </TBtn>
              <TBtn
                onClick={() => exec("insertUnorderedList")}
                title="Bullet List"
              >
                <List size={18} />
              </TBtn>

              <div className="w-px h-5 bg-border mx-0.5" />

              <TBtn onClick={() => exec("justifyLeft")} title="Align Left">
                <AlignLeft size={18} />
              </TBtn>
              <TBtn onClick={() => exec("justifyCenter")} title="Align Center">
                <AlignCenter size={18} />
              </TBtn>
              <TBtn onClick={() => exec("justifyRight")} title="Align Right">
                <AlignRight size={18} />
              </TBtn>
              <TBtn onClick={() => exec("justifyFull")} title="Justify">
                <AlignJustify size={18} />
              </TBtn>

              <div className="w-px h-5 bg-border mx-0.5" />

              <TBtn
                onClick={() => addBlock("code", activeBlk.current)}
                title="Code Block (Ctrl+Shift+K)"
              >
                <Code2 size={18} />
              </TBtn>
              <TBtn
                onClick={() => {
                  saveSel();
                  setShowImageModal(true);
                }}
                title="Insert Image"
              >
                <ImageIcon size={18} />
              </TBtn>
              <TBtn
                onClick={() => {
                  saveSel();
                  setShowLinkModal(true);
                }}
                title="Insert Link (Ctrl+K)"
              >
                <Link2 size={18} />
              </TBtn>
            </div>

            {/* save + share */}
            <div className="flex items-center gap-2 flex-1 justify-end shrink-0 min-w-0">
              {liveUsers > 1 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full shrink-0">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs font-bold text-green-400">
                    {liveUsers} live
                  </span>
                </div>
              )}
              <span className="text-xs text-text-muted italic hidden sm:inline truncate">
                {saving
                  ? "Saving..."
                  : lastSaved
                    ? `Saved ${timeAgo(lastSaved)}`
                    : "Not saved yet"}
              </span>
              <button
                onClick={forceSave}
                className="p-2 text-text-muted hover:text-primary transition-colors shrink-0"
                title="Save (Ctrl+S)"
              >
                <Save size={16} />
              </button>
              <button
                onClick={handleShare}
                className="btn-primary flex items-center gap-2 !px-4 !py-2 text-sm hidden sm:flex shrink-0"
              >
                <Share2 size={16} /> Share
              </button>
              <button
                onClick={() => setIsDocInfoOpen((v) => !v)}
                className="lg:hidden p-2 text-text-muted hover:text-primary transition-colors shrink-0"
                title="Document Info"
              >
                <FileText size={16} />
              </button>
              <button
                onClick={() => setIsRightPanelOpen(true)}
                className="xl:hidden p-2 text-text-muted hover:text-primary transition-colors shrink-0"
                title="Panel"
              >
                <Eye size={16} />
              </button>
              <button
                onClick={toggleRightPanel}
                className="hidden xl:flex p-2 text-text-muted hover:text-primary transition-colors shrink-0"
                title={isRightPanelOpenDesktop ? "Close Right Panel" : "Open Right Panel"}
              >
                {isRightPanelOpenDesktop ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
              </button>
            </div>
          </header>

          {/* blocks content */}
          <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 md:px-8 lg:px-8 xl:px-8 2xl:px-12">
            <div className="max-w-3xl lg:max-w-none mx-auto">
              {/* title */}
              <input
                type="text"
                value={title}
                onChange={handleTitle}
                className="w-full text-3xl md:text-4xl font-bold border-none bg-transparent focus:ring-0 text-text-main mb-8 p-0 placeholder:text-text-muted outline-none"
                placeholder="Untitled Document"
              />

              {/* blocks */}
              {blocks.map((block) => (
                <React.Fragment key={block.id}>
                  {block.type === "text" ? (
                    <div
                      ref={(el) => {
                        if (el) textRefs.current[block.id] = el;
                      }}
                      contentEditable
                      suppressContentEditableWarning
                      onInput={() => {
                        const el = textRefs.current[block.id];
                        if (el) updateBlock(block.id, { html: el.innerHTML });
                      }}
                      onFocus={() => {
                        activeBlk.current = block.id;
                      }}
                      onKeyDown={(e) => handleKeyDown(e, block.id)}
                      className="outline-none text-lg leading-relaxed text-text-secondary min-h-[1.5em] py-1 editable-block break-words"
                      data-placeholder="Type something..."
                    />
                  ) : block.type === "code" ? (
                    <CodeBlock
                      block={block}
                      onChange={(d) => updateBlock(block.id, d)}
                      onDelete={() => deleteBlock(block.id)}
                    />
                  ) : null}
                </React.Fragment>
              ))}

              {/* add block bar */}
              <div className="flex items-center gap-3 mt-8 pt-4 border-t border-border/30">
                <button
                  onClick={() =>
                    addBlock("text", blocks[blocks.length - 1]?.id)
                  }
                  className="flex items-center gap-2 px-4 py-2 text-xs text-text-muted hover:text-primary border border-dashed border-border rounded-xl transition-all hover:border-primary"
                >
                  <Type size={14} /> Text Block
                </button>
                <button
                  onClick={() =>
                    addBlock("code", blocks[blocks.length - 1]?.id)
                  }
                  className="flex items-center gap-2 px-4 py-2 text-xs text-text-muted hover:text-primary border border-dashed border-border rounded-xl transition-all hover:border-primary"
                >
                  <Code2 size={14} /> Code Block
                </button>
              </div>

              {/* drop zone — drag & browse file upload */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileInputChange}
                accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
                className="hidden"
              />
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleBrowseFiles}
                className={`mt-6 flex items-center justify-center p-12 border-2 border-dashed rounded-3xl group cursor-pointer transition-all ${
                  isDragging
                    ? "border-primary bg-primary/5 scale-[1.02]"
                    : "border-border hover:bg-surface-hover hover:border-primary/50"
                }`}
              >
                <div className="text-center">
                  {uploadProgress !== null ? (
                    <>
                      <div className="w-12 h-12 mx-auto mb-3 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                      <p className="text-sm font-medium text-primary">
                        {uploadProgress}%
                      </p>
                    </>
                  ) : (
                    <>
                      <Upload
                        size={36}
                        className={`mx-auto mb-2 transition-colors ${
                          isDragging
                            ? "text-primary"
                            : "text-text-muted group-hover:text-primary"
                        }`}
                      />
                      <p
                        className={`text-sm font-medium transition-colors ${
                          isDragging
                            ? "text-primary"
                            : "text-text-muted group-hover:text-text-secondary"
                        }`}
                      >
                        {isDragging
                          ? "Drop your file here"
                          : "Click or drag to add images"}
                      </p>
                      <p className="text-[11px] text-text-muted mt-1">
                        PNG, JPG, GIF, WebP — Max 10MB
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* ─── document info sidebar (enhanced) ─── */}
        <aside
          className={`fixed inset-y-0 right-0 z-40 w-72 border-l border-border bg-background/95 backdrop-blur-md flex-col shrink-0 overflow-y-auto p-3 gap-3 lg:p-4 lg:gap-4 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:flex lg:w-56 xl:w-52 2xl:w-60 lg:bg-background/50 lg:backdrop-blur-none ${
            isDocInfoOpen ? "translate-x-0 flex" : "translate-x-full hidden lg:flex"
          }`}
        >
          {/* Mobile close button */}
          <button
            onClick={() => setIsDocInfoOpen(false)}
            className="lg:hidden self-end p-1 text-text-muted hover:text-primary rounded-lg transition-colors"
          >
            <X size={16} />
          </button>

          {/* ── Document Info ── */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-text-muted mb-3 flex items-center gap-2">
              <FileText size={13} className="text-primary" /> Document Info
            </h3>
            <div className="bg-surface p-4 rounded-2xl shadow-card border border-border/50 space-y-3">
              {[
                ["Word Count", `${wc} words`, Hash],
                ["Characters", `${charCount}`, Type],
                ["Read Time", rt, Eye],
                ["Blocks", `${blocks.length}`, Code2],
                [
                  "Created",
                  notebook?.createdAt ? fmtDate(notebook.createdAt) : "\u2014",
                  Calendar,
                ],
                [
                  "Last Modified",
                  notebook?.updatedAt ? timeAgo(notebook.updatedAt) : "\u2014",
                  Clock,
                ],
              ].map(([label, value, Icon]) => (
                <div key={label} className="flex justify-between items-center">
                  <span className="text-[11px] text-text-muted flex items-center gap-1.5">
                    <Icon size={11} className="text-text-muted/70" />
                    {label}
                  </span>
                  <span className="text-[11px] font-semibold text-text-secondary">
                    {value}
                  </span>
                </div>
              ))}

              {/* Status badges */}
              <div className="flex items-center gap-2 pt-2 border-t border-border/30">
                {notebook?.isShared && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 font-bold flex items-center gap-1">
                    <Users size={9} /> Shared
                  </span>
                )}
                {liveUsers > 1 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                    {liveUsers} collaborators
                  </span>
                )}
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    saving
                      ? "bg-amber-500/10 text-amber-400"
                      : "bg-primary/10 text-primary"
                  }`}
                >
                  {saving ? "Saving..." : "Saved"}
                </span>
              </div>

              {/* tags */}
              <div className="pt-2 border-t border-border/30">
                <span className="text-[11px] text-text-muted block mb-2 font-medium">
                  Tags
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag, i) => (
                    <span
                      key={i}
                      className={`${tag.bg} ${tag.color} text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 group cursor-pointer`}
                    >
                      {tag.label}
                      <X
                        size={9}
                        className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                        onClick={() => removeTag(i)}
                      />
                    </span>
                  ))}
                  <button
                    onClick={() => setShowTagModal(true)}
                    className="text-[10px] px-2 py-0.5 rounded-full border border-dashed border-border text-text-muted hover:text-primary hover:border-primary transition-colors"
                  >
                    + Add
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── Table of Contents ── */}
          {headings.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-text-muted mb-3 flex items-center gap-2">
                <BookOpen size={13} className="text-primary" /> Table of
                Contents
              </h3>
              <div className="bg-surface rounded-2xl border border-border/50 p-3 space-y-1">
                {headings.map((h, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      const el = textRefs.current[h.blockId];
                      if (el)
                        el.scrollIntoView({
                          behavior: "smooth",
                          block: "center",
                        });
                    }}
                    className="w-full text-left text-[11px] text-text-secondary hover:text-primary transition-colors py-1 px-2 rounded-lg hover:bg-surface-hover truncate"
                    style={{ paddingLeft: `${(h.level - 1) * 12 + 8}px` }}
                  >
                    <span className="text-text-muted mr-1.5">
                      {h.level === 1 ? "#" : h.level === 2 ? "##" : "###"}
                    </span>
                    {h.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Related Tasks ── */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-text-muted mb-3 flex items-center gap-2 justify-between">
              <span className="flex items-center gap-2">
                <CheckCircle2 size={13} className="text-primary" /> Related
                Tasks
              </span>
              {tasks.length > 0 && (
                <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-bold">
                  {tasks.filter((t) => t.done).length}/{tasks.length}
                </span>
              )}
            </h3>
            {/* Task progress bar */}
            {tasks.length > 0 && (
              <div className="mb-3">
                <div className="flex justify-between text-[10px] text-text-muted mb-1">
                  <span>Task Completion</span>
                  <span className="font-bold text-primary">
                    {Math.round(
                      (tasks.filter((t) => t.done).length / tasks.length) * 100,
                    )}
                    %
                  </span>
                </div>
                <div className="h-1.5 bg-border/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-emerald-400 rounded-full transition-all duration-500"
                    style={{
                      width: `${(tasks.filter((t) => t.done).length / tasks.length) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}
            <div className="space-y-2">
              {tasks.length === 0 && (
                <p className="text-[11px] text-text-muted italic px-2 py-3 text-center">
                  No tasks linked to this notebook
                </p>
              )}
              {tasks.map((task, idx) => (
                <div
                  key={task._id || idx}
                  onClick={() => toggleTask(idx)}
                  className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                    task.done
                      ? "bg-primary/5 border-primary/10 hover:bg-primary/10"
                      : "bg-surface border-border/50 hover:shadow-soft hover:border-border"
                  }`}
                >
                  {task.done ? (
                    <CheckCircle2
                      size={16}
                      className="mt-0.5 text-primary shrink-0"
                    />
                  ) : (
                    <Circle
                      size={16}
                      className="mt-0.5 text-text-muted shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-[11px] font-medium truncate ${
                        task.done
                          ? "text-text-muted line-through"
                          : "text-text-main"
                      }`}
                    >
                      {task.text}
                    </p>
                    <p className="text-[10px] text-text-muted mt-0.5 flex items-center gap-1">
                      <Calendar size={9} />
                      {task.due}
                    </p>
                  </div>
                </div>
              ))}
              <button
                onClick={openLinkTaskModal}
                className="w-full py-2.5 flex items-center justify-center gap-2 text-[11px] font-medium text-primary hover:bg-primary/5 rounded-xl border border-dashed border-primary/30 transition-all"
              >
                <Plus size={12} /> Link Task
              </button>
            </div>
          </div>

          {/* ── Quick Actions ── */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-text-muted mb-3 flex items-center gap-2">
              <Sparkles size={13} className="text-primary" /> Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={forceSave}
                className="flex flex-col items-center gap-1.5 p-3 bg-surface rounded-xl border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all"
              >
                <Save size={16} className="text-primary" />
                <span className="text-[10px] font-medium text-text-secondary">
                  Save Now
                </span>
              </button>
              <button
                onClick={handleShare}
                className="flex flex-col items-center gap-1.5 p-3 bg-surface rounded-xl border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all"
              >
                <Share2 size={16} className="text-primary" />
                <span className="text-[10px] font-medium text-text-secondary">
                  Share
                </span>
              </button>
              <button
                onClick={handleBrowseFiles}
                className="flex flex-col items-center gap-1.5 p-3 bg-surface rounded-xl border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all"
              >
                <Upload size={16} className="text-primary" />
                <span className="text-[10px] font-medium text-text-secondary">
                  Upload
                </span>
              </button>
              <button
                onClick={() => {
                  const blob = new Blob(
                    [
                      blocks
                        .map((b) =>
                          b.type === "code" ? b.code : strip(b.html),
                        )
                        .join("\n\n"),
                    ],
                    { type: "text/plain" },
                  );
                  const a = document.createElement("a");
                  a.href = URL.createObjectURL(blob);
                  a.download = `${title || "notebook"}.txt`;
                  a.click();
                  flash("Exported as text!");
                }}
                className="flex flex-col items-center gap-1.5 p-3 bg-surface rounded-xl border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all"
              >
                <FileText size={16} className="text-primary" />
                <span className="text-[10px] font-medium text-text-secondary">
                  Export
                </span>
              </button>
            </div>
          </div>

          {/* delete */}
          {notebook && (
            <button
              onClick={deleteNb}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-xs text-rose-400 hover:bg-rose-500/10 rounded-xl border border-dashed border-rose-400/30 transition-all shrink-0"
            >
              <Trash2 size={14} /> Delete Notebook
            </button>
          )}

          {/* AI insight */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-auto p-4 bg-gradient-to-br from-primary/10 to-surface rounded-2xl border border-primary/10"
          >
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={16} className="text-primary" />
              <span className="text-xs font-bold text-text-main">
                AI Study Insights
              </span>
            </div>
            <p className="text-[11px] text-text-secondary leading-relaxed">
              Based on your notes, you might want to review{" "}
              <span className="text-primary font-medium">
                Faraday&apos;s Law
              </span>{" "}
              next. There&apos;s a high probability it will be on the midterm.
            </p>
            <button className="mt-3 w-full text-[11px] font-bold text-white bg-primary py-2 rounded-lg hover:bg-primary-dark transition-colors">
              Generate Summary
            </button>
          </motion.div>
        </aside>
      </div>

      {/* Mobile RightPanel Overlay */}
      {isRightPanelOpen && (
        <div
          onClick={() => setIsRightPanelOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 xl:hidden backdrop-blur-sm transition-opacity"
        />
      )}

      {/* Right Panel Wrapper */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-full sm:w-80 transform transition-transform duration-300 ease-in-out shrink-0 ${isRightPanelOpen ? "translate-x-0" : "translate-x-full"} ${isRightPanelOpenDesktop ? "xl:relative xl:transform-none xl:translate-x-0" : "xl:fixed xl:translate-x-full"}`}
      >
        <RightPanel onClose={() => setIsRightPanelOpen(false)} />
      </div>

      {/* ─── Link Modal ─── */}
      <AnimatePresence>
        {showLinkModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={() => setShowLinkModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface rounded-2xl border border-border shadow-float w-full max-w-sm p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-bold text-text-main mb-4">
                Insert Link
              </h2>
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
                className="input-field mb-4"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && insertLink()}
              />
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowLinkModal(false)}
                  className="px-4 py-2 text-sm text-text-muted hover:text-text-main transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={insertLink}
                  className="btn-primary !px-6 !py-2 text-sm"
                >
                  Insert
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Image Modal (Upload-first) ─── */}
      <AnimatePresence>
        {showImageModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={() => setShowImageModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface rounded-2xl border border-border shadow-float w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-bold text-text-main mb-2">
                Insert Image
              </h2>
              <p className="text-xs text-text-muted mb-4">
                Upload from your device or paste a URL
              </p>

              {/* Upload zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => {
                  handleDrop(e);
                }}
                onClick={handleBrowseFiles}
                className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl cursor-pointer transition-all mb-4 ${
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-surface-hover"
                }`}
              >
                <Upload
                  size={28}
                  className={`mb-2 ${isDragging ? "text-primary" : "text-text-muted"}`}
                />
                <p className="text-sm font-medium text-text-secondary">
                  {isDragging ? "Drop here!" : "Click to browse or drag & drop"}
                </p>
                <p className="text-[10px] text-text-muted mt-1">
                  PNG, JPG, GIF, WebP — Max 10MB
                </p>
              </div>

              {/* OR divider */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-border" />
                <span className="text-[10px] text-text-muted font-bold uppercase">
                  or paste URL
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* URL input */}
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.png"
                className="input-field mb-4"
                onKeyDown={(e) => e.key === "Enter" && insertImage()}
              />
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowImageModal(false)}
                  className="px-4 py-2 text-sm text-text-muted hover:text-text-main transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={insertImage}
                  className="btn-primary !px-6 !py-2 text-sm"
                  disabled={!imageUrl.trim()}
                >
                  Insert URL
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── New Notebook Modal ─── */}
      <AnimatePresence>
        {showNewModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={() => setShowNewModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface rounded-2xl border border-border shadow-float w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-bold text-text-main mb-4">
                New Notebook
              </h2>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Notebook title..."
                className="input-field mb-4"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && createBlankNb()}
              />
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 text-sm text-text-muted hover:text-text-main transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createBlankNb}
                  className="btn-primary !px-6 !py-2 text-sm"
                >
                  Create
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Tag Modal ─── */}
      <AnimatePresence>
        {showTagModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={() => setShowTagModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface rounded-2xl border border-border shadow-float w-full max-w-sm p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-bold text-text-main mb-4">Add Tag</h2>
              <input
                type="text"
                value={newTagVal}
                onChange={(e) => setNewTagVal(e.target.value)}
                placeholder="Tag label..."
                className="input-field mb-4"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && addTag()}
              />
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowTagModal(false)}
                  className="px-4 py-2 text-sm text-text-muted hover:text-text-main transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addTag}
                  className="btn-primary !px-6 !py-2 text-sm"
                >
                  Add
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Share Modal ─── */}
      <AnimatePresence>
        {showShareModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={() => setShowShareModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface rounded-2xl border border-border shadow-float w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Share2 size={20} className="text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-text-main">
                    Share Notebook
                  </h2>
                  <p className="text-xs text-text-muted">
                    Only this notebook is shared, not your entire workspace
                  </p>
                </div>
              </div>

              {/* Share link */}
              <div className="mb-4">
                <label className="text-xs font-medium text-text-secondary mb-2 block">
                  Share Link
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={shareLink}
                    readOnly
                    className="input-field flex-1 text-xs !py-2.5 font-mono"
                  />
                  <button
                    onClick={copyShareLink}
                    className="btn-primary !px-4 !py-2.5 text-xs flex items-center gap-1.5 shrink-0"
                  >
                    <Copy size={14} /> Copy
                  </button>
                </div>
              </div>

              {/* Info */}
              <div className="bg-primary/5 border border-primary/10 rounded-xl p-3 mb-4">
                <p className="text-[11px] text-text-secondary leading-relaxed">
                  <span className="font-bold text-primary">
                    Real-time collaboration:
                  </span>{" "}
                  Anyone with this link can view and edit the notebook. Changes
                  sync instantly for all collaborators.
                </p>
              </div>

              {/* Live users */}
              {liveUsers > 1 && (
                <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-green-500/5 rounded-xl border border-green-500/10">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs text-green-400 font-medium">
                    {liveUsers} people currently viewing
                  </span>
                </div>
              )}

              <div className="flex justify-between">
                <button
                  onClick={stopSharing}
                  className="px-4 py-2 text-xs text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Unlink size={12} /> Stop Sharing
                </button>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="btn-primary !px-6 !py-2 text-sm"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Link Task Modal ─── */}
      <AnimatePresence>
        {showLinkTaskModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={() => setShowLinkTaskModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface rounded-2xl border border-border shadow-float w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-bold text-text-main mb-2">
                Link Tasks
              </h2>
              <p className="text-xs text-text-muted mb-4">
                Select tasks to link to this notebook
              </p>
              <div className="max-h-64 overflow-y-auto space-y-2 mb-4">
                {allTasks.length === 0 && (
                  <p className="text-xs text-text-muted italic text-center py-4">
                    No tasks available
                  </p>
                )}
                {allTasks.map((t) => (
                  <button
                    key={t._id}
                    onClick={() => toggleLinkedTask(t._id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                      linkedTaskIds.includes(t._id)
                        ? "bg-primary/10 border-primary/30"
                        : "bg-background/50 border-border/50 hover:border-border"
                    }`}
                  >
                    {linkedTaskIds.includes(t._id) ? (
                      <CheckCircle2
                        size={16}
                        className="text-primary shrink-0"
                      />
                    ) : (
                      <Circle size={16} className="text-text-muted shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-text-main truncate">
                        {t.title}
                      </p>
                      <p className="text-[10px] text-text-muted">
                        {t.dueDate
                          ? new Date(t.dueDate).toLocaleDateString()
                          : "No due date"}
                        {" · "}
                        {t.status}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowLinkTaskModal(false)}
                  className="px-4 py-2 text-sm text-text-muted hover:text-text-main transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmLinkTasks}
                  className="btn-primary !px-6 !py-2 text-sm"
                >
                  Link ({linkedTaskIds.length})
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Delete Confirm Modal ─── */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={() => {
              setShowDeleteConfirm(false);
              setDeleteAllMode(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface rounded-2xl border border-border shadow-float w-full max-w-sm p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
                  <Trash2 size={20} className="text-rose-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-text-main">
                    {deleteAllMode ? "Delete All Notebooks" : "Delete Selected"}
                  </h2>
                  <p className="text-xs text-text-muted">
                    {deleteAllMode
                      ? `This will permanently delete all ${allNotebooks.length} notebook(s).`
                      : `This will permanently delete ${selectedNbIds.size} selected notebook(s).`}
                  </p>
                </div>
              </div>
              <div className="bg-rose-500/5 border border-rose-500/10 rounded-xl p-3 mb-5">
                <p className="text-[11px] text-rose-300 leading-relaxed">
                  <span className="font-bold">Warning:</span> This action cannot
                  be undone. All content in the deleted notebooks will be
                  permanently lost.
                </p>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteAllMode(false);
                  }}
                  className="px-4 py-2 text-sm text-text-muted hover:text-text-main transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={bulkDeleteNbs}
                  className="px-6 py-2 text-sm font-medium bg-rose-500 hover:bg-rose-600 text-white rounded-xl transition-colors"
                >
                  {deleteAllMode
                    ? "Delete All"
                    : `Delete (${selectedNbIds.size})`}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Toast ─── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-primary text-white px-6 py-3 rounded-xl text-sm font-medium shadow-glow z-[200]"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Notepad;
