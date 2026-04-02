"use client";
import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { X, Send, Loader2, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import CommentBubble from "./CommentBubble";

interface Comment {
  id: number;
  author_name: string;
  author_id: number;
  comment: string;
  created_at: string;
  _optimistic?: boolean;
}

interface CommentsPanelProps {
  assignment: { id: number; course_id: number };
  onClose: () => void;
}

export default function CommentsPanel({ assignment, onClose }: CommentsPanelProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [myCanvasId, setMyCanvasId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prevHeightRef = useRef<number | null>(null);

  // Auto-resize: clamp between 1 line (34 px) and 3 lines (76 px).
  // useLayoutEffect runs before paint so the initial (and every) height is
  // correct with no visible flash. Transition is applied only when the height
  // actually changes to avoid the oscillation caused by animating the 0 px reset.
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;

    if (!text) {
      el.style.transition = "none";
      el.style.height = "34px";
      prevHeightRef.current = 34;
      return;
    }

    el.style.transition = "none";
    el.style.height = "0px";
    
    const to = Math.max(Math.min(el.scrollHeight, 76), 34);

    const from = prevHeightRef.current;
    prevHeightRef.current = to;

    if (from === null || from === to) {
      el.style.height = to + "px";
      return;
    }

    el.style.height = from + "px";
    void el.offsetHeight;
    el.style.transition = "height 0.13s ease";
    el.style.height = to + "px";

  }, [text]);

  useEffect(() => {
    setLoading(true);
    setFetchError("");
    fetch(`/api/comments/${assignment.id}?course_id=${assignment.course_id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setComments(data.comments ?? []);
        if (data.user_id) setMyCanvasId(data.user_id);
      })
      .catch((e) => setFetchError(e.message || "Failed to load comments"))
      .finally(() => setLoading(false));
  }, [assignment.id, assignment.course_id]);

  useEffect(() => {
    if (!loading) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [comments.length, loading]);

  async function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setSending(true);
    setSendError("");

    const tempId = Date.now();
    const optimistic: Comment = {
      id: tempId,
      author_name: "You",
      author_id: myCanvasId ?? -1,
      comment: trimmed,
      created_at: new Date().toISOString(),
      _optimistic: true,
    };
    setComments((prev) => [...prev, optimistic]);
    setText("");

    try {
      const res = await fetch(`/api/comments/${assignment.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ course_id: assignment.course_id, text: trimmed }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Failed to send");
      setComments((prev) =>
        prev.map((c) => (c.id === tempId ? { ...data.comment, _optimistic: false } : c))
      );
    } catch (e: unknown) {
      setSendError(e instanceof Error ? e.message : "Failed to send");
      setComments((prev) => prev.filter((c) => c.id !== tempId));
      setText(trimmed);
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0"
        style={{ borderColor: "var(--color-border)" }}
      >
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4" style={{ color: "var(--color-accent)" }} />
          <span className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
            Comments
          </span>
          {!loading && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-xs px-1.5 py-0.5 rounded-full"
              style={{ background: "rgba(156,163,175,0.15)", color: "var(--color-muted)" }}
            >
              {comments.length}
            </motion.span>
          )}
        </div>
        <motion.button
          onClick={onClose}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Close comments"
        >
          <X className="w-4 h-4" style={{ color: "var(--color-muted)" }} />
        </motion.button>
      </div>

      {/* Comment list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 modal-scroll min-h-0">
        {loading ? (
          <div className="flex items-center justify-center h-full py-8">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: "var(--color-muted)" }} />
          </div>
        ) : fetchError ? (
          <p className="text-sm text-center py-8" style={{ color: "var(--color-muted)" }}>
            {fetchError}
          </p>
        ) : comments.length === 0 ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-center py-8"
            style={{ color: "var(--color-muted)" }}
          >
            No comments yet
          </motion.p>
        ) : (
          <AnimatePresence initial={false}>
            {comments.map((c) => {
              const isMe = myCanvasId != null && c.author_id === myCanvasId;
              return <CommentBubble key={c.id} comment={c} isMe={isMe} />;
            })}
          </AnimatePresence>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        className="px-3 pb-3 pt-2 border-t flex-shrink-0"
        style={{ borderColor: "var(--color-border)" }}
      >
        {sendError && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-red-500 mb-2"
          >
            {sendError}
          </motion.p>
        )}
        <div className="flex gap-2 items-center">
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Add a comment…"
            className="flex-1 rounded-xl border px-3 py-1.5 text-sm resize-none outline-none focus:ring-1 overflow-y-auto"
            style={{
              background: "var(--color-surface)",
              color: "var(--color-text)",
              borderColor: "rgba(156,163,175,0.3)",
              height: "34px",
              overflow: "hidden",
            }}
          />
          <motion.button
            onClick={handleSend}
            disabled={sending || !text.trim()}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2.5 rounded-xl transition-opacity disabled:opacity-40 flex-shrink-0"
            style={{ background: "var(--color-accent)", color: "#fff" }}
            aria-label="Send comment"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
