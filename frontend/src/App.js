import { useState, useEffect, useCallback, useRef } from "react";
import {
  Brain, Plus, X, Search, RefreshCw, Upload,
  Cpu, Flame, Lightbulb, Sparkles, Hash, Clock, CheckCircle, AlertCircle,
  Trash2, Pencil, Save
} from "lucide-react";
import "./App.css";

const API_BASE = "http://127.0.0.1:8000/api";

const TAG_CONFIG = {
  All:       { icon: <Sparkles size={13} />, color: "#a78bfa", glow: "rgba(167,139,250,0.3)" },
  Technical: { icon: <Cpu size={13} />,      color: "#38bdf8", glow: "rgba(56,189,248,0.3)"  },
  Urgent:    { icon: <Flame size={13} />,    color: "#fb7185", glow: "rgba(251,113,133,0.3)" },
  General:   { icon: <Lightbulb size={13} />,color: "#f59e0b", glow: "rgba(245,158,11,0.3)"  },
};

/* ── Animated Form Panel ───────────────────────────────────────────── */
function AnimatedForm({ show, children }) {
  const [render, setRender] = useState(show);
  const [animClass, setAnimClass] = useState("");
  const timerRef = useRef(null);

  useEffect(() => {
    if (show) {
      // Clear any pending close timer
      if (timerRef.current) clearTimeout(timerRef.current);
      setRender(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setAnimClass("form-enter"));
      });
    } else {
      setAnimClass("form-exit");
      // Wait for exit animation to finish THEN remove from DOM
      timerRef.current = setTimeout(() => {
        setRender(false);
        setAnimClass("");
      }, 400);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [show]);

  if (!render) return null;

  return (
    <div className={`form-panel ${animClass}`}>
      {children}
    </div>
  );
}

/* ── Snippet Card ──────────────────────────────────────────────────── */
function SnippetCard({ item, index, onDelete, onEdit }) {
  const cfg = TAG_CONFIG[item.ai_tag] || TAG_CONFIG.General;
  const date = new Date(item.created_at).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });

  const [editing, setEditing]     = useState(false);
  const [editText, setEditText]   = useState(item.content);
  const [saving, setSaving]       = useState(false);
  const [deleting, setDeleting]   = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleSave = async () => {
    if (!editText.trim()) return;
    setSaving(true);
    await onEdit(item.id, editText);
    setSaving(false);
    setEditing(false);
  };

  const handleDeleteClick = () => setConfirmDelete(true);

  const handleConfirmDelete = async () => {
    setDeleting(true);
    await onDelete(item.id);
  };

  const handleCancelDelete = () => setConfirmDelete(false);

  return (
    <div
      className={`card ${deleting ? "card-deleting" : ""}`}
      style={{ animationDelay: `${index * 0.08}s` }}
    >
      <div className="card-glow" style={{ background: cfg.glow }} />
      <div className="card-header">
        <span className="card-tag" style={{ color: cfg.color, borderColor: cfg.color, boxShadow: `0 0 12px ${cfg.glow}` }}>
          {cfg.icon}
          {item.ai_tag}
        </span>
        <div className="card-actions">
          {!editing && (
            <>
              <button className="card-btn card-btn-edit" onClick={() => setEditing(true)} title="Edit">
                <Pencil size={13} />
              </button>
              <button className="card-btn card-btn-delete" onClick={handleDeleteClick} title="Delete">
                <Trash2 size={13} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Confirm Delete Dialog */}
      {confirmDelete && (
        <div className="confirm-overlay">
          <div className="confirm-box">
            <div className="confirm-icon"><Trash2 size={32} strokeWidth={1.5} /></div>
            <p className="confirm-title">Delete Snippet?</p>
            <p className="confirm-sub">This action cannot be undone.</p>
            <div className="confirm-actions">
              <button className="confirm-cancel" onClick={handleCancelDelete}>
                <X size={13} /> Cancel
              </button>
              <button className="confirm-delete" onClick={handleConfirmDelete}>
                <Trash2 size={13} /> Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {editing ? (
        <div className="card-edit-wrap">
          <textarea
            className="card-edit-textarea"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            rows={4}
            autoFocus
          />
          <div className="card-edit-footer">
            <button className="card-edit-cancel" onClick={() => { setEditing(false); setEditText(item.content); }}>
              <X size={13} /> Cancel
            </button>
            <button className="card-edit-save" onClick={handleSave} disabled={saving}>
              {saving ? <span className="spinner-sm" /> : <><Save size={13} /> Save</>}
            </button>
          </div>
        </div>
      ) : (
        <p className="card-content">{item.content}</p>
      )}

      <div className="card-footer">
        <span className="card-date">
          <Clock size={11} style={{ marginRight: 4, opacity: 0.6 }} />
          {date}
        </span>
        <span className="card-id">
          <Hash size={11} />
          {item.id}
        </span>
      </div>
    </div>
  );
}

/* ── Toast ─────────────────────────────────────────────────────────── */
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`toast toast-${type}`}>
      {type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
      <span>{message}</span>
    </div>
  );
}

/* ── Main App ──────────────────────────────────────────────────────── */
export default function App() {
  const [snippets, setSnippets]   = useState([]);
  const [activeTag, setActiveTag] = useState("All");
  const [search, setSearch]       = useState("");
  const [content, setContent]     = useState("");
  const [loading, setLoading]     = useState(false);
  const [fetching, setFetching]   = useState(false);
  const [toast, setToast]         = useState(null);
  const [showForm, setShowForm]   = useState(false);
  const [charCount, setCharCount] = useState(0);

  const showToast = (message, type = "success") => setToast({ message, type });

  const fetchSnippets = useCallback(async () => {
    setFetching(true);
    try {
      let url = `${API_BASE}/snippets/`;
      const params = new URLSearchParams();
      if (activeTag !== "All") params.append("tag", activeTag);
      if (search.trim())       params.append("search", search.trim());
      if ([...params].length)  url += `?${params.toString()}`;

      const res  = await fetch(url);
      const data = await res.json();
      setSnippets(data.results || []);
    } catch {
      showToast("Failed to fetch snippets.", "error");
    } finally {
      setFetching(false);
    }
  }, [activeTag, search]);

  useEffect(() => { fetchSnippets(); }, [fetchSnippets]);

  const handleSubmit = async () => {
    if (!content.trim()) return showToast("Please enter some content.", "error");
    if (content.length > 500) return showToast("Content too long (max 500 chars).", "error");

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/snippets/`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ content }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Tagged as "${data.data.ai_tag}" successfully!`);
        setContent("");
        setCharCount(0);
        setShowForm(false);
        fetchSnippets();
      } else {
        showToast(data.errors?.content?.[0] || "Upload failed.", "error");
      }
    } catch {
      showToast("Server error. Is Django running?", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleContentChange = (e) => {
    setContent(e.target.value);
    setCharCount(e.target.value.length);
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`${API_BASE}/snippets/${id}/`, { method: "DELETE" });
      showToast("Snippet deleted successfully.");
      fetchSnippets();
    } catch {
      showToast("Failed to delete snippet.", "error");
    }
  };

  const handleEdit = async (id, newContent) => {
    try {
      const res = await fetch(`${API_BASE}/snippets/${id}/`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ content: newContent }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Updated & re-tagged as "${data.data.ai_tag}"!`);
        fetchSnippets();
      } else {
        showToast("Failed to update snippet.", "error");
      }
    } catch {
      showToast("Server error.", "error");
    }
  };

  return (
    <div className="app">
      <div className="bg-orb orb1" />
      <div className="bg-orb orb2" />
      <div className="bg-orb orb3" />

      {/* Header */}
      <header className="header">
        <div className="logo">
          <div className="logo-icon-wrap">
            <svg
              className="brain-svg"
              viewBox="0 0 100 100"
              width="36"
              height="36"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Left hemisphere */}
              <path className="brain-path" d="M50 20 C35 20 20 30 20 45 C20 52 24 58 28 62 C24 65 22 70 24 75 C26 80 32 82 38 80 C40 85 45 88 50 88" strokeLinecap="round" strokeLinejoin="round" />
              {/* Right hemisphere */}
              <path className="brain-path brain-path-2" d="M50 20 C65 20 80 30 80 45 C80 52 76 58 72 62 C76 65 78 70 76 75 C74 80 68 82 62 80 C60 85 55 88 50 88" strokeLinecap="round" strokeLinejoin="round" />
              {/* Center line */}
              <path className="brain-path brain-path-3" d="M50 20 L50 88" strokeLinecap="round" />
              {/* Left inner curves */}
              <path className="brain-path brain-path-4" d="M28 62 C33 60 38 63 40 68" strokeLinecap="round" />
              <path className="brain-path brain-path-5" d="M35 45 C33 52 34 58 38 62" strokeLinecap="round" />
              {/* Right inner curves */}
              <path className="brain-path brain-path-4" d="M72 62 C67 60 62 63 60 68" strokeLinecap="round" />
              <path className="brain-path brain-path-5" d="M65 45 C67 52 66 58 62 62" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <h1 className="logo-title">SmartBase</h1>
            <p className="logo-sub">AI Knowledge Engine</p>
          </div>
        </div>
        <button
          className={`btn-upload ${showForm ? "btn-upload-active" : ""}`}
          onClick={() => setShowForm(!showForm)}
        >
          <span className="btn-icon-morph">
            <span className="btn-icon-inner">
              {showForm ? <X size={15} /> : <Plus size={15} />}
            </span>
          </span>
          <span className="btn-label-morph">
            {showForm ? "Close" : "New Snippet"}
          </span>
          <span className="btn-liquid-blob" />
        </button>
      </header>

      {/* Animated Form */}
      <AnimatedForm show={showForm}>
        <div className="form-inner">
          <h2 className="form-title">
            <Upload size={18} style={{ marginRight: 8, verticalAlign: "middle" }} />
            Upload Knowledge Snippet
          </h2>
          <p className="form-subtitle">Gemini AI will automatically analyze and tag your content</p>
          <textarea
            className="form-textarea"
            placeholder="Paste your text here... (bug reports, meeting notes, urgent tasks)"
            value={content}
            onChange={handleContentChange}
            rows={5}
          />
          <div className="form-footer">
            <span className={`char-count ${charCount > 450 ? "char-warn" : ""}`}>
              {charCount} / 500
            </span>
            <button className="btn-submit" onClick={handleSubmit} disabled={loading}>
              {loading
                ? <span className="spinner" />
                : <><Sparkles size={15} /> Analyze & Upload</>
              }
            </button>
          </div>
        </div>
      </AnimatedForm>

      {/* Search Bar */}
      <div className="search-wrap">
        <div className="search-box">
          <Search size={17} className="search-icon" />
          <input
            className="search-input"
            type="text"
            placeholder="Search your knowledge base..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="search-clear" onClick={() => setSearch("")}>
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Tag Filters */}
      <div className="tag-filters">
        {Object.entries(TAG_CONFIG).map(([tag, cfg]) => (
          <button
            key={tag}
            className={`tag-btn ${activeTag === tag ? "tag-active" : ""}`}
            style={activeTag === tag ? {
              borderColor: cfg.color,
              color: cfg.color,
              boxShadow: `0 0 20px ${cfg.glow}, inset 0 0 20px rgba(255,255,255,0.05)`,
            } : {}}
            onClick={() => setActiveTag(tag)}
          >
            <span className="tag-btn-icon">{cfg.icon}</span>
            {tag}
          </button>
        ))}
      </div>

      {/* Stats Bar */}
      <div className="stats-bar">
        <span className="stats-text">
          {fetching ? "Loading..." : `${snippets.length} snippet${snippets.length !== 1 ? "s" : ""} found`}
        </span>
        <button className="refresh-btn" onClick={fetchSnippets} title="Refresh">
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Snippets Grid */}
      <main className="grid">
        {fetching ? (
          <div className="empty-state">
            <div className="big-spinner" />
          </div>
        ) : snippets.length === 0 ? (
          <div className="empty-state">
            <Search size={48} className="empty-icon" />
            <p className="empty-text">No snippets found</p>
            <p className="empty-sub">Upload your first snippet to get started</p>
          </div>
        ) : (
          snippets.map((item, i) => (
            <SnippetCard key={item.id} item={item} index={i} onDelete={handleDelete} onEdit={handleEdit} />
          ))
        )}
      </main>

      {/* Toast */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}