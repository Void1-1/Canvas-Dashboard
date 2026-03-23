"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ListCollapse, ClipboardList, BarChart2, Users, Megaphone } from "lucide-react";
import { motion } from "framer-motion";

const navItems = [
  { section: "home", label: "Home", icon: <Home size={20} /> },
  { section: "modules", label: "Modules", icon: <ListCollapse size={20} /> },
  { section: "assignments", label: "Assignments", icon: <ClipboardList size={20} /> },
  { section: "grades", label: "Grades", icon: <BarChart2 size={20} /> },
  { section: "people", label: "People", icon: <Users size={20} /> },
  { section: "announcements", label: "Announcements", icon: <span className="flex items-center min-w-[19px] min-h-[19px]"><Megaphone size={20} /></span> },
];

export default function CourseNavSidebar({ courseId }: { courseId: string }) {
  const pathname = usePathname();
  return (
    <motion.aside
      className="hidden md:flex flex-col w-48 h-screen fixed top-0 left-16 z-30 border-r border-slate-200 dark:border-slate-700 pt-8"
      style={{ background: 'var(--color-bg)', color: 'var(--color-text)' }}
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <nav className="flex-1 flex flex-col gap-2 px-2">
        {navItems.map((item, idx) => {
          const href = `/classes/${courseId}/${item.section === "home" ? "" : item.section}`;
          const isActive = pathname === href || (item.section === "home" && pathname === `/classes/${courseId}`);
          return (
            <Link
              key={item.section}
              href={href}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-accent/10 transition-colors text-base ${
                isActive ? "bg-accent/20 text-accent font-medium" : ""
              }`}
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