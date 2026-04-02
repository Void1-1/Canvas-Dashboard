"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, ClipboardList, BarChart2, Calendar, Megaphone, CheckSquare, LogOut, User, Mail, Bell } from "lucide-react";
import { motion } from "framer-motion";
import { useLogoutWithFade } from "./useLogoutWithFade";
import SearchModal from "./SearchModal";

const navItems = [
  { href: "/", icon: <Home size={22} />, label: "Home" },
  { href: "/classes", icon: <BookOpen size={22} />, label: "Classes" },
  { href: "/assignments", icon: <ClipboardList size={22} />, label: "Assignments" },
  { href: "/todo", icon: <CheckSquare size={22} />, label: "To-do" },
  { href: "/grades", icon: <BarChart2 size={22} />, label: "Grades" },
  { href: "/calendar", icon: <Calendar size={22} />, label: "Calendar" },
  { href: "/announcements", icon: <Megaphone size={22} />, label: "Announcements" },
];

export default function CollapsedSidebar() {
  const pathname = usePathname();
  const { isFading, handleLogout } = useLogoutWithFade();

  return (
    <motion.aside
      className="hidden md:flex flex-col w-16 h-screen fixed top-0 left-0 z-40 border-r border-slate-200 dark:border-slate-700 items-center py-4"
      style={{ background: 'var(--color-bg)', color: 'var(--color-text)' }}
      animate={{ opacity: isFading ? 0 : 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mb-6 text-accent">
        <BookOpen size={28} />
      </div>
      <nav className="flex-1 flex flex-col gap-4 items-center">
        {navItems.map((item, index) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center justify-center w-10 h-10 rounded-lg hover:bg-accent/10 transition-colors ${
              pathname === item.href ? "bg-accent/20 text-accent" : ""
            }`}
            title={item.label}
          >
            {item.icon}
          </Link>
        ))}
      </nav>
      {/* Search, Inbox, Notifications */}
      <div className="flex flex-col items-center gap-1 py-2 border-t w-full" style={{ borderColor: 'var(--color-border)' }}>
        <SearchModal />
        <Link
          href="/inbox"
          className={`flex items-center justify-center w-10 h-10 rounded-lg transition-colors hover:bg-accent/10 ${pathname === '/inbox' ? 'text-white' : ''}`}
          style={pathname === '/inbox' ? { background: 'var(--color-accent)', color: '#fff' } : { color: 'var(--color-muted)' }}
          title="Inbox"
          aria-label="Inbox"
        >
          <Mail size={20} />
        </Link>
        <Link
          href="/notifications"
          className={`flex items-center justify-center w-10 h-10 rounded-lg transition-colors hover:bg-accent/10`}
          style={pathname === '/notifications' ? { background: 'var(--color-accent)', color: '#fff' } : { color: 'var(--color-muted)' }}
          title="Notifications"
          aria-label="Notifications"
        >
          <Bell size={20} />
        </Link>
      </div>

      {/* Profile + Logout */}
      <div className="flex flex-col items-center gap-1 py-2 border-t w-full" style={{ borderColor: 'var(--color-border)' }}>
        <Link
          href="/profile"
          className={`flex items-center justify-center w-10 h-10 rounded-lg transition-colors hover:bg-accent/10`}
          style={pathname === '/profile' ? { background: 'var(--color-accent)', color: '#fff' } : { color: 'var(--color-muted)' }}
          title="Profile"
          aria-label="Profile"
        >
          <User size={20} />
        </Link>
        <motion.button
          className="w-10 h-10 flex items-center justify-center rounded-lg bg-accent text-white hover:opacity-90"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleLogout}
          disabled={isFading}
          title="Logout"
          aria-label="Logout"
        >
          <LogOut size={20} />
        </motion.button>
      </div>
    </motion.aside>
  );
} 