"use client";
import { motion } from "framer-motion";

interface Comment {
  id: number;
  author_name: string;
  author_id: number;
  comment: string;
  created_at: string;
  _optimistic?: boolean;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

interface CommentBubbleProps {
  comment: Comment;
  isMe: boolean;
}

export default function CommentBubble({ comment: c, isMe }: CommentBubbleProps) {
  return (
    <motion.div
      key={c.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: c._optimistic ? 0.65 : 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.18 }}
      className={`flex gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* Avatar initial */}
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1 select-none"
        style={
          isMe
            ? { background: "var(--color-accent)", color: "#fff" }
            : { background: "rgba(156,163,175,0.2)", color: "var(--color-muted)" }
        }
      >
        {c.author_name.charAt(0).toUpperCase()}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[78%] flex flex-col gap-0.5 ${
          isMe ? "items-end" : "items-start"
        }`}
      >
        <div
          className={`flex items-baseline gap-1.5 ${
            isMe ? "flex-row-reverse" : "flex-row"
          }`}
        >
          {!isMe && (
            <span
              className="text-xs font-semibold leading-none"
              style={{ color: "var(--color-text)" }}
            >
              {c.author_name}
            </span>
          )}
          <span
            className="text-[10px] leading-none"
            style={{ color: "var(--color-muted)" }}
          >
            {formatTime(c.created_at)}
          </span>
        </div>
        <div
          className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
            isMe
              ? "bubble-me rounded-tr-sm"
              : "bubble-other rounded-tl-sm"
          }`}
          style={{ color: "var(--color-text)" }}
        >
          {c.comment}
        </div>
      </div>
    </motion.div>
  );
}
