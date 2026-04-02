"use client";
import { X } from "lucide-react";
import { sanitizeCanvasHtml } from "@/lib/sanitize";
import BaseModal from "@/components/BaseModal";

interface AnnouncementModalProps {
  announcement: any | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function AnnouncementModal({
  announcement,
  isOpen,
  onClose,
}: AnnouncementModalProps) {
  if (!announcement) return null;

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} variant="content" maxWidth="2xl">
      {/* Header */}
      <div
        className="sticky top-0 p-4 md:p-6 border-b flex items-start justify-between gap-4"
        style={{
          background: "var(--color-surface)",
          borderColor: "var(--color-border)",
        }}
      >
        <div className="flex-1">
          <h2
            className="text-xl md:text-2xl font-bold mb-2"
            style={{ color: "var(--color-text)" }}
          >
            {announcement.title}
          </h2>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm">
            {announcement.course_name && (
              <span style={{ color: "var(--color-accent)" }} className="font-medium">
                {announcement.course_name}
                {announcement.course_code && ` (${announcement.course_code})`}
              </span>
            )}
            {announcement.posted_at && (
              <time style={{ color: "var(--color-muted)" }}>
                {announcement.course_name && " • "}
                {new Date(announcement.posted_at).toLocaleDateString(undefined, {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </time>
            )}
            {announcement.author && (
              <span style={{ color: "var(--color-muted)" }}>
                {(announcement.posted_at || announcement.course_name) && " • "}
                Posted by {announcement.author.display_name || announcement.author.name || "Unknown"}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
          aria-label="Close"
          style={{ background: "transparent" }}
        >
          <X className="w-5 h-5" style={{ color: "var(--color-text)" }} />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 md:p-6 space-y-6">
        {announcement.message && (
          <div
            className="prose prose-sm max-w-none announcement-description"
            style={{ color: "var(--color-text)" }}
            dangerouslySetInnerHTML={{
              __html: sanitizeCanvasHtml(announcement.message),
            }}
          />
        )}

        {announcement.html_url && (
          <div>
            <a
              href={announcement.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm underline inline-flex items-center gap-1"
              style={{ color: "var(--color-accent)" }}
            >
              View in Canvas
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          </div>
        )}
      </div>
    </BaseModal>
  );
}
