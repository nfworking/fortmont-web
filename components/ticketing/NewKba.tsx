"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X, Bold, Italic, Heading2, List, ListOrdered, Code, Link2, Eye, Edit3, Send, FileText } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface KbaPostPayload {
  title: string;
  content: string;
  is_published: boolean;
}

interface KbaPostModalProps {
  trigger?: React.ReactNode;
}

// ─── Minimal MD renderer (no external deps) ──────────────────────────────────

function renderMarkdown(md: string): string {
  return md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    // Headings
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    // Bold / italic
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/_(.+?)_/g, "<em>$1</em>")
    // Inline code
    .replace(/`(.+?)`/g, "<code>$1</code>")
    // Code blocks
    .replace(/```[\s\S]*?```/g, (m) => {
      const inner = m.slice(3, -3).replace(/^[^\n]*\n?/, "");
      return `<pre><code>${inner.trim()}</code></pre>`;
    })
    // Links
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    // Unordered lists
    .replace(/^\- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>[\s\S]+?<\/li>)(?!\s*<li>)/g, "<ul>$1</ul>")
    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, "<li>$1</li>")
    // Paragraphs (double newline)
    .replace(/\n\n+/g, "</p><p>")
    // Single newlines
    .replace(/\n/g, "<br />")
    // Wrap in paragraph
    .replace(/^(.+)$/, "<p>$1</p>");
}

// ─── Toolbar button helper ────────────────────────────────────────────────────

function ToolbarBtn({
  onClick,
  title,
  children,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="toolbar-btn"
    >
      {children}
    </button>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export default function KbaPostModal({ trigger }: KbaPostModalProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      setTimeout(() => firstInputRef.current?.focus(), 50);
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) handleClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  const handleClose = () => {
    if (status === "loading") return;
    setOpen(false);
    setStatus("idle");
    setErrorMsg("");
  };

  const resetForm = () => {
    setTitle("");
    setContent("");
    setIsPublished(false);
    setTab("write");
    setStatus("idle");
    setErrorMsg("");
  };

  // Toolbar actions: wrap selection or insert snippet
  const wrapSelection = useCallback((before: string, after: string, placeholder: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = content.slice(start, end) || placeholder;
    const next = content.slice(0, start) + before + selected + after + content.slice(end);
    setContent(next);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + before.length, start + before.length + selected.length);
    }, 0);
  }, [content]);

  const insertLinePrefix = useCallback((prefix: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const lineStart = content.lastIndexOf("\n", start - 1) + 1;
    const next = content.slice(0, lineStart) + prefix + content.slice(lineStart);
    setContent(next);
    setTimeout(() => ta.focus(), 0);
  }, [content]);

  const handleSubmit = async () => {
    if (!title.trim()) { setErrorMsg("Title is required."); return; }
    if (!content.trim()) { setErrorMsg("Content is required."); return; }
    setErrorMsg("");
    setStatus("loading");

    const payload: KbaPostPayload = {
      title: title.trim(),
      content: content.trim(),
      is_published: isPublished,
    };

    try {
      const res = await fetch("/api/ticketing/post/kba", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || `Server error: ${res.status}`);
      }

      setStatus("success");
      setTimeout(() => {
        handleClose();
        resetForm();
      }, 1600);
    } catch (err: unknown) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  const charCount = content.length;
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  return (
    <>
      {/* ── Trigger ── */}
      <div onClick={() => setOpen(true)} style={{ display: "inline-block", cursor: "pointer" }}>
        {trigger ?? (
          <button className="kba-trigger-btn">
            <FileText size={15} strokeWidth={2} />
            New KBA Article
          </button>
        )}
      </div>

      {/* ── Backdrop + Modal ── */}
      {open && (
        <div className="kba-overlay" onClick={(e) => e.target === e.currentTarget && handleClose()}>
          <div className="kba-modal" role="dialog" aria-modal="true" aria-label="New KBA Article">

            {/* Header */}
            <div className="kba-header">
              <div className="kba-header-left">
                <span className="kba-eyebrow">Knowledge Base</span>
                <h2 className="kba-heading">New Article</h2>
              </div>
              <button className="kba-close" onClick={handleClose} aria-label="Close">
                <X size={18} strokeWidth={1.75} />
              </button>
            </div>

            {/* Body */}
            <div className="kba-body">

              {/* Title */}
              <div className="kba-field">
                <label className="kba-label" htmlFor="kba-title">Title</label>
                <input
                  ref={firstInputRef}
                  id="kba-title"
                  className="kba-input"
                  type="text"
                  placeholder="e.g. How to reset your password"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={200}
                />
              </div>

              {/* Content editor */}
              <div className="kba-field kba-field--grow">
                <div className="kba-label-row">
                  <label className="kba-label" htmlFor="kba-content">Content</label>
                  <div className="kba-tabs">
                    <button
                      className={`kba-tab ${tab === "write" ? "kba-tab--active" : ""}`}
                      onClick={() => setTab("write")}
                      type="button"
                    >
                      <Edit3 size={12} strokeWidth={2} /> Write
                    </button>
                    <button
                      className={`kba-tab ${tab === "preview" ? "kba-tab--active" : ""}`}
                      onClick={() => setTab("preview")}
                      type="button"
                    >
                      <Eye size={12} strokeWidth={2} /> Preview
                    </button>
                  </div>
                </div>

                <div className="kba-editor-wrap">
                  {/* Toolbar */}
                  {tab === "write" && (
                    <div className="kba-toolbar">
                      <ToolbarBtn onClick={() => wrapSelection("**", "**", "bold text")} title="Bold (Ctrl+B)">
                        <Bold size={14} strokeWidth={2.2} />
                      </ToolbarBtn>
                      <ToolbarBtn onClick={() => wrapSelection("*", "*", "italic text")} title="Italic">
                        <Italic size={14} strokeWidth={2} />
                      </ToolbarBtn>
                      <span className="kba-toolbar-divider" />
                      <ToolbarBtn onClick={() => insertLinePrefix("## ")} title="Heading">
                        <Heading2 size={14} strokeWidth={2} />
                      </ToolbarBtn>
                      <ToolbarBtn onClick={() => insertLinePrefix("- ")} title="Bullet list">
                        <List size={14} strokeWidth={2} />
                      </ToolbarBtn>
                      <ToolbarBtn onClick={() => insertLinePrefix("1. ")} title="Numbered list">
                        <ListOrdered size={14} strokeWidth={2} />
                      </ToolbarBtn>
                      <span className="kba-toolbar-divider" />
                      <ToolbarBtn onClick={() => wrapSelection("`", "`", "code")} title="Inline code">
                        <Code size={14} strokeWidth={2} />
                      </ToolbarBtn>
                      <ToolbarBtn onClick={() => wrapSelection("[", "](url)", "link text")} title="Link">
                        <Link2 size={14} strokeWidth={2} />
                      </ToolbarBtn>
                    </div>
                  )}

                  {/* Write pane */}
                  {tab === "write" ? (
                    <textarea
                      ref={textareaRef}
                      id="kba-content"
                      className="kba-textarea"
                      placeholder={"Write your article in Markdown...\n\n## Section heading\n\nSupports **bold**, *italic*, `code`, lists, and links."}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      onKeyDown={(e) => {
                        if ((e.metaKey || e.ctrlKey) && e.key === "b") {
                          e.preventDefault();
                          wrapSelection("**", "**", "bold text");
                        }
                      }}
                    />
                  ) : (
                    <div
                      className="kba-preview"
                      dangerouslySetInnerHTML={{
                        __html: content.trim()
                          ? renderMarkdown(content)
                          : "<p class='kba-preview-empty'>Nothing to preview yet.</p>",
                      }}
                    />
                  )}

                  {/* Footer stats */}
                  <div className="kba-editor-footer">
                    <span>{wordCount} word{wordCount !== 1 ? "s" : ""}</span>
                    <span>{charCount} char{charCount !== 1 ? "s" : ""}</span>
                    <span className="kba-md-badge">Markdown</span>
                  </div>
                </div>
              </div>

              {/* Publish toggle */}
              <div className="kba-publish-row">
                <label className="kba-toggle-label" htmlFor="kba-published">
                  <span className="kba-toggle-text">
                    <span className="kba-toggle-title">Publish immediately</span>
                    <span className="kba-toggle-sub">
                      {isPublished ? "Article will be visible to all users." : "Article will be saved as a draft."}
                    </span>
                  </span>
                  <div
                    className={`kba-toggle ${isPublished ? "kba-toggle--on" : ""}`}
                    onClick={() => setIsPublished((v) => !v)}
                    role="switch"
                    aria-checked={isPublished}
                    tabIndex={0}
                    id="kba-published"
                    onKeyDown={(e) => e.key === " " && setIsPublished((v) => !v)}
                  >
                    <div className="kba-toggle-thumb" />
                  </div>
                </label>
              </div>

              {/* Error */}
              {errorMsg && (
                <p className="kba-error">{errorMsg}</p>
              )}
            </div>

            {/* Footer */}
            <div className="kba-footer">
              <button className="kba-btn kba-btn--ghost" onClick={handleClose} disabled={status === "loading"}>
                Cancel
              </button>
              <button
                className={`kba-btn kba-btn--primary ${status === "loading" ? "kba-btn--loading" : ""} ${status === "success" ? "kba-btn--success" : ""}`}
                onClick={handleSubmit}
                disabled={status === "loading" || status === "success"}
              >
                {status === "loading" ? (
                  <><span className="kba-spinner" /> Publishing…</>
                ) : status === "success" ? (
                  "✓ Published"
                ) : (
                  <><Send size={14} strokeWidth={2} /> {isPublished ? "Publish Article" : "Save Draft"}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Styles ── */}
      <style>{`
        /* Trigger */
        .kba-trigger-btn {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 8px 16px;
          background: #000;
          color: #ffffff;
          border: none;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          letter-spacing: 0.01em;
          cursor: pointer;
          transition: opacity 0.15s;
        }
        .kba-trigger-btn:hover { opacity: 0.82; }

        /* Overlay */
        .kba-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.45);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          padding: 24px;
          animation: kba-fade-in 0.18s ease;
        }
        @keyframes kba-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        /* Modal */
        .kba-modal {
          background: #000000;
          border: 1px solid #000000;
          border-radius: 12px;
          width: 100%;
          max-width: 740px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 32px 64px rgba(0,0,0,0.18), 0 8px 16px rgba(0,0,0,0.08);
          animation: kba-slide-up 0.22s cubic-bezier(0.16, 1, 0.3, 1);
          overflow: hidden;
        }
        @keyframes kba-slide-up {
          from { opacity: 0; transform: translateY(18px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* Header */
        .kba-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: 24px 24px 0;
          flex-shrink: 0;
        }
        .kba-header-left { display: flex; flex-direction: column; gap: 2px; }
        .kba-eyebrow {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #ffffff;
        }
        .kba-heading {
          font-size: 20px;
          font-weight: 700;
          color: #ffffff;
          margin: 0;
          letter-spacing: -0.02em;
        }
        .kba-close {
          background: none;
          border: 1px solid #000000;
          border-radius: 6px;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #ffffff;
          transition: border-color 0.15s, color 0.15s;
        }
        .kba-close:hover { border-color: #000; color: #000; }

        /* Body */
        .kba-body {
          display: flex;
          flex-direction: column;
          gap: 18px;
          padding: 20px 24px;
          overflow-y: auto;
          flex: 1 1 auto;
          min-height: 0;
        }

        /* Fields */
        .kba-field { display: flex; flex-direction: column; gap: 6px; }
        .kba-field--grow { flex: 1 1 auto; min-height: 0; }
        .kba-label {
          font-size: 12px;
          font-weight: 600;
          color: #ffffff;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        .kba-label-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .kba-input {
          width: 100%;
          padding: 10px 12px;
          border: 1.5px solid #161616;
          border-radius: 7px;
          font-size: 14px;
          color: #ffffff;
          background: #000000;
          transition: border-color 0.15s;
          box-sizing: border-box;
          outline: none;
          font-family: inherit;
        }
        .kba-input:focus { border-color: #ffffff; }
        .kba-input::placeholder { color: #ffffff; }

        /* Tabs */
        .kba-tabs {
          display: flex;
          gap: 2px;
          background: #000000;
          border-radius: 6px;
          padding: 2px;
        }
        .kba-tab {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          color: #ffffff;
          background: transparent;
          cursor: pointer;
          transition: background 0.12s, color 0.12s;
        }
        .kba-tab--active { background: #fff; color: #000; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }

        /* Editor */
        .kba-editor-wrap {
          border: 1.5px solid #000000;
          border-radius: 7px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          min-height: 280px;
          transition: border-color 0.15s;
          background: #000000;
        }
        .kba-editor-wrap:focus-within { border-color: #ffffff; }

        /* Toolbar */
        .kba-toolbar {
          display: flex;
          align-items: center;
          gap: 1px;
          padding: 6px 8px;
          border-bottom: 1px solid #000000;
          background: #141414;
          flex-shrink: 0;
        }
        .toolbar-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border: none;
          border-radius: 5px;
          background: transparent;
          color: #555;
          cursor: pointer;
          transition: background 0.12s, color 0.12s;
        }
        .toolbar-btn:hover { background: #000000; color: #000; }
        .kba-toolbar-divider {
          width: 1px;
          height: 18px;
          background: #000000;
          margin: 0 4px;
          flex-shrink: 0;
        }

        /* Textarea */
        .kba-textarea {
          flex: 1 1 auto;
          width: 100%;
          border: none;
          outline: none;
          resize: none;
          padding: 12px;
          font-size: 13.5px;
          line-height: 1.65;
          color: #ffffff;
          background: #000000;
          font-family: "SF Mono", "Fira Code", "Fira Mono", "Roboto Mono", monospace;
          min-height: 200px;
          box-sizing: border-box;
        }
        .kba-textarea::placeholder { color: #ffffff; }

        /* Preview */
        .kba-preview {
          flex: 1 1 auto;
          padding: 14px 14px;
          font-size: 14px;
          line-height: 1.7;
          color: #ffffff;
          overflow-y: auto;
          min-height: 200px;
        }
        .kba-preview h1 { font-size: 22px; font-weight: 700; margin: 0 0 12px; letter-spacing: -0.02em; }
        .kba-preview h2 { font-size: 17px; font-weight: 700; margin: 18px 0 8px; }
        .kba-preview h3 { font-size: 14px; font-weight: 700; margin: 14px 0 6px; }
        .kba-preview p { margin: 0 0 10px; }
        .kba-preview ul, .kba-preview ol { padding-left: 20px; margin: 0 0 10px; }
        .kba-preview li { margin: 3px 0; }
        .kba-preview code {
          background: #000000;
          padding: 2px 5px;
          border-radius: 3px;
          font-family: "SF Mono", "Fira Code", monospace;
          font-size: 12.5px;
        }
        .kba-preview pre {
          background: #111;
          color: #eee;
          padding: 12px;
          border-radius: 6px;
          overflow-x: auto;
          margin: 10px 0;
        }
        .kba-preview pre code { background: none; color: inherit; padding: 0; }
        .kba-preview a { color: #000; text-decoration: underline; }
        .kba-preview-empty { color: #bbb; font-style: italic; }

        /* Editor footer */
        .kba-editor-footer {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 5px 12px;
          border-top: 1px solid #000000;
          background: #0f0f0f;
          font-size: 11px;
          color: #aaa;
          flex-shrink: 0;
        }
        .kba-md-badge {
          margin-left: auto;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #ffffff;
        }

        /* Publish row */
        .kba-publish-row {
          border: 1.5px solid #000000;
          border-radius: 7px;
          padding: 12px 14px;
        }
        .kba-toggle-label {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          cursor: pointer;
          user-select: none;
        }
        .kba-toggle-text { display: flex; flex-direction: column; gap: 2px; }
        .kba-toggle-title { font-size: 13px; font-weight: 600; color: #000; }
        .kba-toggle-sub { font-size: 12px; color: #ffffff; }
        .kba-toggle {
          width: 40px;
          height: 22px;
          border-radius: 100px;
          border: color: #000000;
          background: #000000;
          flex-shrink: 0;
          position: relative;
          transition: background 0.2s;
          outline: none;
        }
        .kba-toggle:focus-visible { box-shadow: 0 0 0 2px #000; }
        .kba-toggle--on { background: #003cff; }
        .kba-toggle-thumb {
          position: absolute;
          top: 3px;
          left: 3px;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #fff;
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        }
        .kba-toggle--on .kba-toggle-thumb { transform: translateX(18px); }

        /* Error */
        .kba-error {
          font-size: 12.5px;
          color: #000;
          background: #f5f5f5;
          border: 1px solid #ddd;
          border-left: 3px solid #000;
          padding: 8px 12px;
          border-radius: 4px;
          margin: 0;
        }

        /* Footer */
        .kba-footer {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
          padding: 16px 24px;
          border-top: 1px solid #000000;
          background: #000000;
          flex-shrink: 0;
        }
        .kba-btn {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 9px 18px;
          border-radius: 7px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.15s, background 0.15s;
          border: none;
          letter-spacing: 0.01em;
        }
        .kba-btn:disabled { opacity: 0.5; cursor: default; }
        .kba-btn--ghost {
          background: transparent;
          border: 1.5px solid #353535;
          color: #ffffff;
        }
        .kba-btn--ghost:hover:not(:disabled) { border-color: #000; color: #000; }
        .kba-btn--primary {
          background: #000000;
          color: #fff;
        }
        .kba-btn--primary:hover:not(:disabled) { opacity: 0.82; }
        .kba-btn--success { background: #111; }
        .kba-btn--loading { opacity: 0.7; }

        /* Spinner */
        .kba-spinner {
          width: 13px;
          height: 13px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: kba-spin 0.65s linear infinite;
          display: inline-block;
        }
        @keyframes kba-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}