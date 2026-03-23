"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import PageTransition from "./PageTransition";
import AnnouncementModal from "./AnnouncementModal";
import { sanitizeCanvasHtml } from "@/lib/sanitize";

export default function ClassAnnouncementsView({
  announcements = [],
}: {
  announcements: any[];
}) {
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAnnouncementClick = (announcement: any) => {
    setSelectedAnnouncement(announcement);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAnnouncement(null);
  };

  return (
    <PageTransition>
      <motion.div
        className="space-y-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <motion.h1
          className="text-xl md:text-2xl font-semibold mb-4"
          style={{ color: "var(--color-text)" }}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Announcements
        </motion.h1>
        {announcements.length === 0 ? (
          <div
            className="glass p-6 rounded-xl"
            style={{ background: "var(--color-surface)" }}
          >
            <p style={{ color: "var(--color-muted)" }}>
              No announcements found for this course.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {announcements.map((announcement: any, index: number) => (
              <motion.article
                key={announcement.id}
                className="glass p-4 md:p-6 rounded-xl cursor-pointer hover:opacity-80 transition-opacity"
                style={{ background: "var(--color-surface)" }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                whileHover={{ scale: 1.02, y: -2 }}
                onClick={() => handleAnnouncementClick(announcement)}
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-3">
                  <h2
                    className="text-lg md:text-xl font-semibold"
                    style={{ color: "var(--color-text)" }}
                  >
                    {announcement.title}
                  </h2>
                  {announcement.posted_at && (
                    <time
                      className="text-sm whitespace-nowrap"
                      style={{ color: "var(--color-muted)" }}
                    >
                      {new Date(announcement.posted_at).toLocaleString()}
                    </time>
                  )}
                </div>
                {announcement.message && (
                  <div
                    className="prose prose-sm max-w-none announcement-description line-clamp-3"
                    style={{ color: "var(--color-text)" }}
                    dangerouslySetInnerHTML={{
                      __html: sanitizeCanvasHtml(announcement.message),
                    }}
                  />
                )}
                {announcement.author && (
                  <p
                    className="text-sm mt-3"
                    style={{ color: "var(--color-muted)" }}
                  >
                    Posted by{" "}
                    {announcement.author.display_name ||
                      announcement.author.name}
                  </p>
                )}
              </motion.article>
            ))}
          </div>
        )}
      </motion.div>

      <AnnouncementModal
        announcement={selectedAnnouncement}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </PageTransition>
  );
}
