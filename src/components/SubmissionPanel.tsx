"use client";
import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Upload, FileText, Link, CheckCircle, AlertCircle, Loader2, Paperclip, MessageCircle } from "lucide-react";

const SUBMITTABLE_TYPES = ["online_upload", "online_text_entry", "online_url"];

type SubmitStatus = "idle" | "loading" | "success" | "error";

interface SubmissionPanelProps {
  assignment: {
    id: number;
    course_id: number;
    submission_types: string[];
    submission?: {
      workflow_state?: string;
      submitted_at?: string | null;
      submission_type?: string | null;
      attachments?: Array<{ display_name: string; url?: string }>;
      body?: string | null;
      url?: string | null;
    };
  };
  onOpenComments?: () => void;
}

export default function SubmissionPanel({ assignment, onOpenComments }: SubmissionPanelProps) {
  const types = (assignment.submission_types ?? []).filter((t) =>
    SUBMITTABLE_TYPES.includes(t)
  );

  const [activeType, setActiveType] = useState<string>(types[0] ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [textBody, setTextBody] = useState("");
  const [urlValue, setUrlValue] = useState("");
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [submittedAt, setSubmittedAt] = useState<string | null>(
    assignment.submission?.submitted_at ?? null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const existingSub = assignment.submission;
  const alreadySubmitted =
    existingSub?.workflow_state === "submitted" ||
    existingSub?.workflow_state === "graded";

  if (types.length === 0) return null;

  async function handleSubmit() {
    if (status === "loading") return;

    const fd = new FormData();
    fd.append("course_id", String(assignment.course_id));
    fd.append("submission_type", activeType);
    if (comment.trim()) fd.append("comment", comment.trim());

    if (activeType === "online_upload") {
      if (!file) {
        setErrorMsg("Please select a file to upload.");
        setStatus("error");
        return;
      }
      fd.append("file", file);
    } else if (activeType === "online_text_entry") {
      if (!textBody.trim()) {
        setErrorMsg("Please enter your submission text.");
        setStatus("error");
        return;
      }
      fd.append("body", textBody.trim());
    } else if (activeType === "online_url") {
      if (!urlValue.trim()) {
        setErrorMsg("Please enter a URL.");
        setStatus("error");
        return;
      }
      fd.append("url", urlValue.trim());
    }

    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch(`/api/submit/${assignment.id}`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Submission failed");
      }
      setSubmittedAt(data.submission?.submitted_at ?? new Date().toISOString());
      setStatus("success");
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : "Submission failed");
      setStatus("error");
    }
  }

  const tabIcons: Record<string, React.ReactNode> = {
    online_upload: <Upload className="w-3.5 h-3.5" />,
    online_text_entry: <FileText className="w-3.5 h-3.5" />,
    online_url: <Link className="w-3.5 h-3.5" />,
  };
  const tabLabels: Record<string, string> = {
    online_upload: "File Upload",
    online_text_entry: "Text Entry",
    online_url: "Website URL",
  };

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium" style={{ color: "var(--color-muted)" }}>
        Submit Assignment
      </p>

      {/* Prior submission banner */}
      {alreadySubmitted && status !== "success" && (
        <div
          className="flex items-center gap-2 p-3 rounded-lg text-sm"
          style={{ background: "rgba(34,197,94,0.1)", color: "var(--color-text)" }}
        >
          <CheckCircle className="w-4 h-4 shrink-0 text-green-500" />
          <span>
            {submittedAt
              ? `Submitted ${new Date(submittedAt).toLocaleString()}`
              : existingSub?.workflow_state === "graded"
              ? "Graded"
              : "Previously submitted"}
            {existingSub?.submission_type
              ? ` via ${tabLabels[existingSub.submission_type] ?? existingSub.submission_type}`
              : ""}
          </span>
        </div>
      )}

      {/* Success state after submitting in this session */}
      {status === "success" && submittedAt && (
        <div
          className="flex items-center gap-2 p-3 rounded-lg text-sm"
          style={{ background: "rgba(34,197,94,0.1)", color: "var(--color-text)" }}
        >
          <CheckCircle className="w-4 h-4 shrink-0 text-green-500" />
          <span>Submitted successfully — {new Date(submittedAt).toLocaleString()}</span>
        </div>
      )}

      {status !== "success" && (
        <>
          {/* Type tabs */}
          {types.length > 1 && (
            <div className="flex gap-1 flex-wrap">
              {types.map((t) => (
                <motion.button
                  key={t}
                  onClick={() => { setActiveType(t); setStatus("idle"); setErrorMsg(""); }}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  style={
                    activeType === t
                      ? { background: "var(--color-accent)", color: "#fff" }
                      : { background: "rgba(156,163,175,0.1)", color: "var(--color-muted)" }
                  }
                >
                  {tabIcons[t]}
                  {tabLabels[t]}
                </motion.button>
              ))}
            </div>
          )}

          {/* File upload */}
          {activeType === "online_upload" && (
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => {
                  setFile(e.target.files?.[0] ?? null);
                  setStatus("idle");
                  setErrorMsg("");
                }}
              />
              <motion.button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-dashed text-sm transition-colors w-full justify-center"
                style={{
                  borderColor: "rgba(156,163,175,0.4)",
                  color: "var(--color-muted)",
                }}
              >
                <Paperclip className="w-4 h-4" />
                {file ? file.name : "Choose a file…"}
              </motion.button>
              {file && (
                <p className="text-xs" style={{ color: "var(--color-muted)" }}>
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              )}
            </div>
          )}

          {/* Text entry */}
          {activeType === "online_text_entry" && (
            <textarea
              rows={5}
              placeholder="Type your submission here…"
              value={textBody}
              onChange={(e) => { setTextBody(e.target.value); setStatus("idle"); setErrorMsg(""); }}
              className="w-full rounded-lg border px-3 py-2 text-sm resize-y outline-none focus:ring-2"
              style={{
                background: "var(--color-surface)",
                color: "var(--color-text)",
                borderColor: "rgba(156,163,175,0.3)",
                minHeight: "7rem",
                maxHeight: "20rem",
              }}
            />
          )}

          {/* URL */}
          {activeType === "online_url" && (
            <input
              type="url"
              placeholder="https://…"
              value={urlValue}
              onChange={(e) => { setUrlValue(e.target.value); setStatus("idle"); setErrorMsg(""); }}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
              style={{
                background: "var(--color-surface)",
                color: "var(--color-text)",
                borderColor: "rgba(156,163,175,0.3)",
              }}
            />
          )}

          {/* Error */}
          {status === "error" && errorMsg && (
            <div
              className="flex items-center gap-2 p-3 rounded-lg text-sm"
              style={{ background: "rgba(239,68,68,0.1)", color: "var(--color-text)" }}
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              {errorMsg}
            </div>
          )}
        </>
      )}

      {/* Action row — always visible */}
      <div className="flex items-center gap-2">
        {status !== "success" && (
          <motion.button
            onClick={handleSubmit}
            disabled={status === "loading"}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex flex-1 items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-opacity disabled:opacity-60"
            style={{ background: "var(--color-accent)", color: "#fff" }}
          >
            {status === "loading" ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting…
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                {alreadySubmitted ? "Resubmit" : "Submit"}
              </>
            )}
          </motion.button>
        )}
        {onOpenComments && (
          <motion.button
            onClick={onOpenComments}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-medium border transition-colors shrink-0"
            style={{
              borderColor: "var(--color-border)",
              color: "var(--color-muted)",
              background: "transparent",
            }}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Comments
          </motion.button>
        )}
      </div>
    </div>
  );
}
