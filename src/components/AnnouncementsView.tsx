"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import PageTransition from "./PageTransition";
import AnnouncementModal from "./AnnouncementModal";
import { sanitizeCanvasHtml } from "@/lib/sanitize";

export default function AnnouncementsView({
  announcements,
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
        className="space-y-4 md:space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <h1
          className="text-2xl font-bold mb-4"
          style={{ color: "var(--color-text)" }}
        >
          Announcements
        </h1>
        <motion.section
          className="glass p-4 md:p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          whileHover={{ y: -2 }}
        >
          <h2 className="card-title">Recent Announcements</h2>
          {announcements.length === 0 ? (
            <p className="italic" style={{ color: "var(--color-muted)" }}>
              No announcements found.
            </p>
          ) : (
            <div className="space-y-4 md:space-y-6">
              {announcements.map((announcement, index) => (
                <motion.article
                  key={announcement.id}
                  className="border-b pb-4 md:pb-6 last:border-b-0 cursor-pointer hover:opacity-80 transition-opacity"
                  style={{ borderColor: "var(--color-border)" }}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  whileHover={{ x: 5 }}
                  onClick={() => handleAnnouncementClick(announcement)}
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-3">
                    <div className="flex-1">
                      <h3 className="text-base md:text-lg font-medium">
                        {announcement.title}
                      </h3>
                      {announcement.course_name && (
                        <p
                          className="text-sm mt-1"
                          style={{ color: "var(--color-accent)" }}
                        >
                          {announcement.course_name}
                          {announcement.course_code && ` (${announcement.course_code})`}
                        </p>
                      )}
                    </div>
                    {announcement.posted_at && (
                      <time
                        className="text-sm whitespace-nowrap"
                        style={{ color: "var(--color-muted)" }}
                      >
                        {new Date(announcement.posted_at).toLocaleDateString()}
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
                      Posted by {announcement.author.display_name}
                    </p>
                  )}
                </motion.article>
              ))}
            </div>
          )}
        </motion.section>
      </motion.div>

      <AnnouncementModal
        announcement={selectedAnnouncement}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </PageTransition>
  );
}
