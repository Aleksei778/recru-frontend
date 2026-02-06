// components/Sidebar.tsx

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  CalendarDays,
  FileText,
  BarChart3,
  User,
  Settings,
  LogOut,
} from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { useTranslation } from "@/hooks/useTranslation";
import { nauryzRedKeds } from "@/lib/font";

export default function Sidebar() {
  const pathname = usePathname();
  const { language } = useLanguage();
  const { t } = useTranslation();

  const menuItems = [
    {
      icon: LayoutDashboard,
      label: t("sidebar.vacancies"),
      href: `/${language}/dashboard`,
    },
    {
      icon: Users,
      label: t("sidebar.candidates"),
      href: `/${language}/candidates`,
    },
    {
      icon: MessageSquare,
      label: t("sidebar.messages"),
      href: `/${language}/messages`,
    },
    {
      icon: CalendarDays,
      label: t("sidebar.events"),
      href: `/${language}/events`,
    },
    {
      icon: FileText,
      label: t("sidebar.templates"),
      href: `/${language}/templates`,
    },
    {
      icon: BarChart3,
      label: t("sidebar.statistics"),
      href: `/${language}/statistics`,
    },
    { icon: User, label: t("sidebar.profile"), href: `/${language}/profile` },
    {
      icon: Settings,
      label: t("sidebar.settings"),
      href: `/${language}/settings`,
    },
  ];

  return (
    <aside className="w-64 h-screen bg-slate-950 text-white flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h1
          className={`text-2xl md:text-3xl font-bold text-black dark:text-white ${nauryzRedKeds.className}`}
        >
          RECRU
        </h1>
      </div>

      <nav className="flex-1 py-6 px-3">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? "bg-slate-800 text-white"
                      : "text-slate-400 hover:bg-slate-900 hover:text-white"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-3 border-t border-slate-800">
        <button className="flex items-center gap-3 px-4 py-3 w-full text-slate-400 hover:bg-slate-900 hover:text-white rounded-lg transition-all">
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">{t("sidebar.logout")}</span>
        </button>
      </div>
    </aside>
  );
}
