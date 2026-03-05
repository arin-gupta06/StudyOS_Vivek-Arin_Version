import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { useSocket } from "../hooks/useSocket";
import {
  Bold,
  Italic,
  List,
  ImageIcon,
  Link2,
  Share2,
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
  Users,
  Eye,
  Copy,
  Hash,
  Clock,
  FileText,
  Calendar,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const API = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api`;
const axiosCfg = { withCredentials: true };
const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const LANGS = ["Java", "C++", "Python", "GO", "Typescript", "JavaScript"];

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

/* ══════════════ SharedNotebook (Sandboxed) ══════════════ */
const SharedNotebook = () => {
  const { id: notebookId } = useParams();
  const { socketRef, connected: socketConnected } = useSocket();
  const isRemoteUpdate = useRef(false);
  const [liveUsers, setLiveUsers] = useState(0);

  const [notebook, setNotebook] = useState(null);
  const [title, setTitle] = useState("Shared Notebook");
  const [blocks, setBlocks] = useState([{ id: uid(), type: "text", html: "" }]);
  const [tags, setTags] = useState([]);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState("");

  /* modals */
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);

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

  /* ─── set default paragraph separator ─── */
  useEffect(() => {
    document.execCommand("defaultParagraphSeparator", false, "p");
  }, []);

  const loadNb = (data) => {
    setNotebook(data);
    setTitle(data.title || "Shared Notebook");
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

  /* ─── load shared notebook ─── */
  useEffect(() => {
    if (!notebookId) return;
    (async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(
          `${API}/notebooks/shared/${notebookId}`,
          axiosCfg,
        );
        loadNb(data);
        setError(null);
      } catch (e) {
        console.error("Failed to load shared notebook:", e);
        setError("This notebook is not available or is no longer shared.");
      } finally {
        setLoading(false);
      }
    })();
  }, [notebookId]);

  /* ─── Socket.IO: join/leave notebook room & listen for changes ─── */
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !socketConnected || !notebook?._id) return;

    socket.emit("join-notebook", notebook._id);

    const handleUserCount = (count) => setLiveUsers(count);
    const handleNotebookChanged = ({ title: t, blocks: b, tags: tg }) => {
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

  /* ─── auto-save ─── */
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

  const triggerSave = useCallback(() => {
    clearTimeout(saveTimer.current);
    broadcastChanges();
    saveTimer.current = setTimeout(async () => {
      setSaving(true);
      try {
        if (nbRef.current?._id) {
          const { data } = await axios.put(
            `${API}/notebooks/shared/${nbRef.current._id}`,
            {
              title: titleRef.current,
              blocks: blocksRef.current,
              tags: tagsRef.current,
            },
            axiosCfg,
          );
          setNotebook(data);
          setLastSaved(data.updatedAt);
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
    broadcastChanges();
    setSaving(true);
    try {
      if (nbRef.current?._id) {
        const { data } = await axios.put(
          `${API}/notebooks/shared/${nbRef.current._id}`,
          {
            title: titleRef.current,
            blocks: blocksRef.current,
            tags: tagsRef.current,
          },
          axiosCfg,
        );
        setNotebook(data);
        setLastSaved(data.updatedAt);
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

  /* ─── File upload ─── */
  const handleFileUpload = useCallback((files) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (file.size > 10 * 1024 * 1024) {
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
      flash("Unsupported file type.");
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
      const bid = activeBlk.current;
      if (bid && textRefs.current[bid]) {
        const el = textRefs.current[bid];
        el.focus();
        const img = `<img src="${dataUrl}" alt="${file.name}" style="max-width:100%;border-radius:12px;margin:8px 0;" />`;
        document.execCommand("insertHTML", false, img);
        updateBlock(bid, { html: el.innerHTML });
      } else {
        const newId = uid();
        const img = `<img src="${dataUrl}" alt="${file.name}" style="max-width:100%;border-radius:12px;margin:8px 0;" />`;
        setBlocks((p) => [...p, { id: newId, type: "text", html: img }]);
        triggerSave();
      }
      setUploadProgress(null);
      setShowImageModal(false);
      setIsDragging(false);
      flash("Image inserted!");
    };
    reader.onerror = () => {
      setUploadProgress(null);
      flash("Failed to read file.");
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer?.files?.length) handleFileUpload(e.dataTransfer.files);
  };
  const handleBrowseFiles = () => fileInputRef.current?.click();
  const handleFileInputChange = (e) => {
    handleFileUpload(e.target.files);
    e.target.value = "";
  };

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
      if (e.shiftKey) addBlock("code", bid);
      else {
        saveSel();
        setShowLinkModal(true);
      }
    }
    if (ctrl && e.key === "s") {
      e.preventDefault();
      forceSave();
    }
  };

  const handleTitle = (e) => {
    setTitle(e.target.value);
    triggerSave();
  };

  const copyPageLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      flash("Link copied!");
    } catch {
      flash("Could not copy link.");
    }
  };

  /* computed */
  const wc = countWords(blocks);
  const rt = readTime(wc);
  const charCount = blocks.reduce((n, b) => {
    const t = b.type === "code" ? b.code || "" : strip(b.html);
    return n + t.length;
  }, 0);

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

  /* ─── Loading / Error states ─── */
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <p className="text-sm text-text-muted">Loading shared notebook...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md p-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-rose-500/10 flex items-center justify-center">
            <X size={32} className="text-rose-400" />
          </div>
          <h1 className="text-xl font-bold text-text-main mb-2">
            Notebook Not Available
          </h1>
          <p className="text-sm text-text-muted">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans text-text-main">
      {/* ─── Sandboxed header ─── */}
      <header className="h-14 border-b border-border flex items-center justify-between px-4 md:px-6 bg-surface/80 backdrop-blur-md sticky top-0 z-10 shrink-0">
        {/* Branding */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Share2 size={16} className="text-primary" />
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-bold text-text-main">Shared Notebook</p>
            <p className="text-[10px] text-text-muted">
              Real-time collaboration
            </p>
          </div>
        </div>

        {/* Format buttons */}
        <div className="flex items-center gap-0.5 border-x border-border px-2">
          <TBtn onClick={() => exec("bold")} title="Bold (Ctrl+B)">
            <Bold size={18} />
          </TBtn>
          <TBtn onClick={() => exec("italic")} title="Italic (Ctrl+I)">
            <Italic size={18} />
          </TBtn>
          <TBtn onClick={handleHeading} title="Heading">
            <Heading2 size={18} />
          </TBtn>
          <TBtn onClick={() => exec("insertUnorderedList")} title="Bullet List">
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
            title="Code Block"
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
            title="Insert Link"
          >
            <Link2 size={18} />
          </TBtn>
        </div>

        {/* Status / actions */}
        <div className="flex items-center gap-2">
          {liveUsers > 1 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs font-bold text-green-400">
                {liveUsers} live
              </span>
            </div>
          )}
          <span className="text-xs text-text-muted italic hidden sm:inline">
            {saving
              ? "Saving..."
              : lastSaved
                ? `Saved ${timeAgo(lastSaved)}`
                : ""}
          </span>
          <button
            onClick={forceSave}
            className="p-2 text-text-muted hover:text-primary transition-colors"
            title="Save"
          >
            <Save size={16} />
          </button>
          <button
            onClick={copyPageLink}
            className="p-2 text-text-muted hover:text-primary transition-colors hidden sm:inline-flex"
            title="Copy share link"
          >
            <Copy size={16} />
          </button>
        </div>
      </header>

      {/* ─── Editor ─── */}
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto px-6 py-10 md:px-16 lg:px-24">
          <div className="max-w-3xl mx-auto">
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
                    className="outline-none text-lg leading-relaxed text-text-secondary min-h-[1.5em] py-1 editable-block"
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
                onClick={() => addBlock("text", blocks[blocks.length - 1]?.id)}
                className="flex items-center gap-2 px-4 py-2 text-xs text-text-muted hover:text-primary border border-dashed border-border rounded-xl transition-all hover:border-primary"
              >
                <Type size={14} /> Text Block
              </button>
              <button
                onClick={() => addBlock("code", blocks[blocks.length - 1]?.id)}
                className="flex items-center gap-2 px-4 py-2 text-xs text-text-muted hover:text-primary border border-dashed border-border rounded-xl transition-all hover:border-primary"
              >
                <Code2 size={14} /> Code Block
              </button>
            </div>

            {/* drop zone */}
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
                      className={`mx-auto mb-2 transition-colors ${isDragging ? "text-primary" : "text-text-muted group-hover:text-primary"}`}
                    />
                    <p
                      className={`text-sm font-medium transition-colors ${isDragging ? "text-primary" : "text-text-muted group-hover:text-text-secondary"}`}
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
        </main>

        {/* ─── Minimal info sidebar ─── */}
        <aside className="hidden lg:flex w-72 border-l border-border bg-background/50 flex-col shrink-0 overflow-y-auto p-5 gap-5">
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

              {/* Status */}
              <div className="flex items-center gap-2 pt-2 border-t border-border/30">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 font-bold flex items-center gap-1">
                  <Users size={9} /> Shared
                </span>
                {liveUsers > 1 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                    {liveUsers} collaborators
                  </span>
                )}
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${saving ? "bg-amber-500/10 text-amber-400" : "bg-primary/10 text-primary"}`}
                >
                  {saving ? "Saving..." : "Saved"}
                </span>
              </div>

              {/* Tags */}
              {tags.length > 0 && (
                <div className="pt-2 border-t border-border/30">
                  <span className="text-[11px] text-text-muted block mb-2 font-medium">
                    Tags
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((tag, i) => (
                      <span
                        key={i}
                        className={`${tag.bg} ${tag.color} text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider`}
                      >
                        {tag.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Share info */}
          <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Share2 size={14} className="text-primary" />
              <span className="text-xs font-bold text-text-main">
                Shared Notebook
              </span>
            </div>
            <p className="text-[11px] text-text-secondary leading-relaxed mb-3">
              You're viewing a shared notebook. Changes sync in real-time with
              all collaborators.
            </p>
            <button
              onClick={copyPageLink}
              className="w-full flex items-center justify-center gap-1.5 text-[11px] font-bold text-primary bg-primary/10 py-2 rounded-lg hover:bg-primary/20 transition-colors"
            >
              <Copy size={12} /> Copy Share Link
            </button>
          </div>
        </aside>
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

      {/* ─── Image Modal ─── */}
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
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
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
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-border" />
                <span className="text-[10px] text-text-muted font-bold uppercase">
                  or paste URL
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>
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

export default SharedNotebook;
