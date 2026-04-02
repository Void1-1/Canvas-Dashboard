'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PageTransition from './PageTransition';
import { sanitizeCanvasHtml } from '@/lib/sanitize';

interface Participant {
  id: number;
  name: string;
}

interface ConversationMessage {
  id: number;
  body: string;
  author_id: number;
  created_at: string;
  author?: Participant;
}

interface Conversation {
  id: number;
  subject: string;
  last_message: string;
  last_authored_message?: string;
  message_count: number;
  workflow_state: 'read' | 'unread' | 'archived';
  participants: Participant[];
  avatar_url?: string;
  last_message_at: string;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
}

function getParticipantNames(participants: Participant[], max = 3): string {
  if (!participants || participants.length === 0) return 'Unknown';
  const names = participants.slice(0, max).map((p) => p.name);
  const extra = participants.length - max;
  if (extra > 0) return `${names.join(', ')} +${extra}`;
  return names.join(', ');
}

function AvatarInitial({ name, size = 36 }: { name: string; size?: number }) {
  const initial = name ? name.charAt(0).toUpperCase() : '?';
  return (
    <div
      className="flex-shrink-0 rounded-full flex items-center justify-center font-semibold text-white"
      style={{
        width: size,
        height: size,
        background: 'var(--color-accent)',
        fontSize: size * 0.4,
      }}
    >
      {initial}
    </div>
  );
}

export default function InboxView({ conversations }: { conversations: Conversation[] }) {
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const handleSelectConversation = useCallback(async (conv: Conversation) => {
    setSelected(conv);
    setShowDetail(true);
    setMessages([]);
    setFetchError(null);
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/inbox/${conv.id}`);
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const data = await res.json();
      const rawMessages: ConversationMessage[] = Array.isArray(data?.messages) ? data.messages : [];
      const participantMap = new Map<number, Participant>(
        (data?.participants ?? conv.participants ?? []).map((p: Participant) => [p.id, p])
      );
      const enriched = rawMessages.map((m) => ({
        ...m,
        author: participantMap.get(m.author_id),
      }));
      setMessages(enriched);
    } catch (err: any) {
      setFetchError(err?.message ?? 'Failed to load messages');
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  const handleBack = () => {
    setShowDetail(false);
  };

  return (
    <PageTransition>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="h-full"
      >
        <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>
          Inbox
        </h1>

        <div className="flex gap-4" style={{ minHeight: '60vh' }}>
          {/* Conversation list */}
          <motion.div
            className={`glass flex-shrink-0 overflow-y-auto ${showDetail ? 'hidden md:flex' : 'flex'} flex-col`}
            style={{ width: '100%', maxWidth: 380 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {conversations.length === 0 ? (
              <p className="p-6 italic" style={{ color: 'var(--color-muted)' }}>
                No conversations found.
              </p>
            ) : (
              <ul className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                {conversations.map((conv, index) => {
                  const isUnread = conv.workflow_state === 'unread';
                  const isActive = selected?.id === conv.id;
                  const participantNames = getParticipantNames(conv.participants);
                  return (
                    <motion.li
                      key={conv.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.04 }}
                    >
                      <button
                        className="w-full text-left px-4 py-3 transition-colors hover:bg-accent/10 focus:outline-none focus:bg-accent/10"
                        style={{
                          background: isActive ? 'var(--color-glass)' : undefined,
                          borderLeft: isActive ? '3px solid var(--color-accent)' : '3px solid transparent',
                        }}
                        onClick={() => handleSelectConversation(conv)}
                      >
                        <div className="flex items-start gap-3">
                          <AvatarInitial name={participantNames} size={36} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className="truncate text-sm"
                                style={{
                                  color: 'var(--color-text)',
                                  fontWeight: isUnread ? 700 : 400,
                                }}
                              >
                                {participantNames}
                              </span>
                              {conv.last_message_at && (
                                <span className="text-xs flex-shrink-0" style={{ color: 'var(--color-muted)' }}>
                                  {formatDate(conv.last_message_at)}
                                </span>
                              )}
                            </div>
                            <p
                              className="text-sm truncate"
                              style={{
                                color: 'var(--color-text)',
                                fontWeight: isUnread ? 600 : 400,
                              }}
                            >
                              {conv.subject || '(No subject)'}
                            </p>
                            {conv.last_message && (
                              <p className="text-xs truncate mt-0.5" style={{ color: 'var(--color-muted)' }}>
                                {conv.last_message}
                              </p>
                            )}
                          </div>
                          {isUnread && (
                            <span
                              className="flex-shrink-0 w-2 h-2 rounded-full mt-2"
                              style={{ background: 'var(--color-accent)' }}
                            />
                          )}
                        </div>
                      </button>
                    </motion.li>
                  );
                })}
              </ul>
            )}
          </motion.div>

          {/* Conversation detail */}
          <AnimatePresence mode="wait">
            {showDetail && selected ? (
              <motion.div
                key={selected.id}
                className="glass flex-1 flex flex-col overflow-hidden md:flex"
                style={{ minWidth: 0 }}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Detail header */}
                <div
                  className="px-4 py-3 border-b flex items-center gap-3"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  <button
                    className="md:hidden p-1 rounded hover:bg-accent/10 transition-colors"
                    style={{ color: 'var(--color-accent)' }}
                    onClick={handleBack}
                    aria-label="Back to conversations"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <div className="flex-1 min-w-0">
                    <h2
                      className="text-base font-semibold truncate"
                      style={{ color: 'var(--color-text)' }}
                    >
                      {selected.subject || '(No subject)'}
                    </h2>
                    <p className="text-xs truncate" style={{ color: 'var(--color-muted)' }}>
                      {getParticipantNames(selected.participants)}
                    </p>
                  </div>
                  <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                    {selected.message_count} {selected.message_count === 1 ? 'message' : 'messages'}
                  </span>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {loadingMessages ? (
                    <div className="flex items-center justify-center h-32">
                      <div
                        className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
                        style={{ borderColor: 'var(--color-accent)', borderTopColor: 'transparent' }}
                      />
                    </div>
                  ) : fetchError ? (
                    <p className="italic text-sm" style={{ color: 'var(--color-muted)' }}>
                      {fetchError}
                    </p>
                  ) : messages.length === 0 ? (
                    <p className="italic text-sm" style={{ color: 'var(--color-muted)' }}>
                      No messages to display.
                    </p>
                  ) : (
                    messages.map((msg, index) => {
                      const authorName = msg.author?.name ?? 'Unknown';
                      return (
                        <motion.div
                          key={msg.id}
                          className="flex gap-3"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                        >
                          <AvatarInitial name={authorName} size={32} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2 mb-1">
                              <span
                                className="text-sm font-medium"
                                style={{ color: 'var(--color-text)' }}
                              >
                                {authorName}
                              </span>
                              <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                                {formatDate(msg.created_at)}
                              </span>
                            </div>
                            <div
                              className="prose prose-sm max-w-none rounded-lg px-3 py-2"
                              style={{
                                background: 'var(--color-glass)',
                                color: 'var(--color-text)',
                              }}
                              dangerouslySetInnerHTML={{
                                __html: sanitizeCanvasHtml(msg.body ?? ''),
                              }}
                            />
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                className="glass flex-1 hidden md:flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center">
                  <svg
                    className="w-12 h-12 mx-auto mb-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    style={{ color: 'var(--color-muted)' }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                    Select a conversation
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </PageTransition>
  );
}
