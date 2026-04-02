"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ListCollapse, ClipboardList, BarChart2, Users, Megaphone, MessageSquare, BookOpen, FileText, Folder, HelpCircle } from "lucide-react";
import { motion } from "framer-motion";

type NavItem =
  | { section: string; label: string; icon: React.ReactNode; href?: never }
  | { href: string; label: string; icon: React.ReactNode; section?: never };

const navItems: NavItem[] = [
  { section: "home", label: "Home", icon: <Home size={18} /> },
  { section: "modules", label: "Modules", icon: <ListCollapse size={18} /> },
  { section: "assignments", label: "Assignments", icon: <ClipboardList size={18} /> },
  { section: "grades", label: "Grades", icon: <BarChart2 size={18} /> },
  { section: "people", label: "People", icon: <Users size={18} /> },
  { section: "announcements", label: "Announcements", icon: <Megaphone size={18} /> },
  { section: "discussions", label: "Discussions", icon: <MessageSquare size={18} /> },
  { section: "pages", label: "Pages", icon: <BookOpen size={18} /> },
  { section: "syllabus", label: "Syllabus", icon: <FileText size={18} /> },
  { section: "files", label: "Files", icon: <Folder size={18} /> },
  { section: "quizzes", label: "Quizzes", icon: <HelpCircle size={18} /> },
];

export default function CourseNavSidebar({ courseId }: { courseId: string }) {
  const pathname = usePathname();
  return (
    <motion.aside
      className="hidden md:flex flex-col w-48 h-screen fixed top-0 left-16 z-30 border-r pt-8"
      style={{ background: 'var(--color-bg)', color: 'var(--color-text)', borderColor: 'var(--color-border)' }}
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <nav className="flex-1 flex flex-col gap-0.5 px-2">
        {navItems.map((item) => {
          const href = item.href
            ? item.href
            : `/classes/${courseId}/${item.section === "home" ? "" : item.section}`;
          const isActive = item.href
            ? pathname === item.href
            : pathname === href || (item.section === "home" && pathname === `/classes/${courseId}`);
          return (
            <Link
              key={item.href ?? item.section}
              href={href}
              className={`flex items-center gap-3 mx-1.5 px-3 py-1.5 rounded-lg transition-colors text-sm ${
                isActive ? "bg-accent/15 text-accent font-medium" : "hover:bg-accent/10"
              }`}
              style={isActive ? {} : { color: 'var(--color-text)' }}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </motion.aside>
  );
}
