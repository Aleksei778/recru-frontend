// components/Sidebar.tsx

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    MessageSquare,
    CalendarDays,
    UserRoundCheck,
    FileText,
    BarChart3,
    User,
    Settings,
    LogOut,
    Globe,
    Moon,
    Sun,
} from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { useTranslation } from "@/hooks/useTranslation";
import { nauryzRedKeds } from "@/lib/font";
import { useTheme } from "@/contexts/theme-context";

export default function Sidebar() {
  const pathname = usePathname();
  const { language, toggleLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();

  const menuItems = [
    {
      icon: LayoutDashboard,
      label: t("dashboard.sidebar.vacancies"),
      href: `/${language}/vacancies`,
    },
    {
      icon: Users,
      label: t("dashboard.sidebar.candidates"),
      href: `/${language}/candidates`,
    },
    {
      icon: UserRoundCheck,
      label: t("dashboard.sidebar.interviews"),
      href: `/${language}/interviews`,
    },
    {
      icon: MessageSquare,
      label: t("dashboard.sidebar.messages"),
      href: `/${language}/messages`,
    },
    {
      icon: CalendarDays,
      label: t("dashboard.sidebar.events"),
      href: `/${language}/events`,
    },
    {
      icon: FileText,
      label: t("dashboard.sidebar.templates"),
      href: `/${language}/templates`,
    },
    {
      icon: BarChart3,
      label: t("dashboard.sidebar.statistics"),
      href: `/${language}/statistics`,
    },
    { icon: User, label: t("dashboard.sidebar.profile"), href: `/${language}/profile` },
    {
      icon: Settings,
      label: t("dashboard.sidebar.settings"),
      href: `/${language}/settings`,
    },
  ];

  return (
    <aside className="w-64 h-screen bg-white dark:bg-black flex flex-col border-r border-black dark:border-white">
      <div className="p-6 border-b border-black dark:border-white">
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
                      ? "bg-black text-white dark:bg-white dark:text-black"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900 hover:text-black dark:hover:text-white"
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

      <div className="border-t border-black dark:border-white px-4 py-3 w-full">
          <button
              onClick={toggleTheme}
              className="inline-flex items-center ml-2 gap-2 px-4 py-3 rounded-xl bg-white dark:bg-black hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors w-max"
              aria-label="Toggle theme"
          >
              {theme === "light" ? (
                  <Moon className="w-6 h-6 text-gray-700" />
              ) : (
                  <Sun className="w-6 h-6 text-gray-300" />
              )}
          </button>

          <button
              onClick={toggleLanguage}
              className="inline-flex items-center ml-2 gap-2 px-4 py-3 rounded-xl bg-white dark:bg-black hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors w-max"
          >
              <Globe className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              <span className="font-medium text-gray-700 dark:text-gray-300">
                    {language === "ru" ? "EN" : "RU"}
                  </span>
          </button>
      </div>

      <div className="p-3">
        <button className="flex items-center gap-3 px-4 py-3 w-full text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900 hover:text-black dark:hover:text-white rounded-lg transition-all">
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">{t("dashboard.sidebar.logout")}</span>
        </button>
      </div>
    </aside>
  );
}
