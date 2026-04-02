"use client";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /**
   * "compact" (default) — account/form modals: blur backdrop, z-[9999], rounded-2xl + border + p-6
   * "content" — reading modals: dark overlay, z-50, glass + rounded-xl + max-h scroll, no inner padding
   */
  variant?: "compact" | "content";
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
  /** When false, clicking the backdrop does nothing (e.g. forced-action modals). Default: true. */
  backdropClose?: boolean;
}

const maxWidthMap: Record<string, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
};

export default function BaseModal({
  isOpen,
  onClose,
  children,
  variant = "compact",
  maxWidth = "md",
  backdropClose = true,
}: BaseModalProps) {
  const isContent = variant === "content";
  const zIndex = isContent ? 50 : 9999;

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && backdropClose) onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, backdropClose, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0"
            style={{
              zIndex,
              ...(isContent
                ? { background: "rgba(0,0,0,0.5)" }
                : { backdropFilter: "blur(6px)", background: "rgba(0,0,0,0.6)" }),
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={backdropClose ? onClose : undefined}
          />

          {/* Centering container */}
          <div
            className="fixed inset-0 flex items-center justify-center p-4"
            style={{ zIndex }}
            onClick={backdropClose ? onClose : undefined}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              className={[
                "w-full",
                maxWidthMap[maxWidth] ?? "max-w-md",
                isContent
                  ? "glass rounded-xl shadow-xl max-h-[90vh] overflow-y-auto modal-scroll"
                  : "rounded-2xl shadow-2xl border p-6",
              ].join(" ")}
              style={{
                background: "var(--color-surface)",
                ...(isContent ? {} : { borderColor: "var(--color-border)" }),
              }}
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={
                isContent
                  ? { type: "spring", damping: 25, stiffness: 300 }
                  : { duration: 0.2 }
              }
              onClick={(e) => e.stopPropagation()}
            >
              {children}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
