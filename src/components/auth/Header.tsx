"use client";

import { useTheme } from "@/contexts/theme-context";
import { useLanguage } from "@/contexts/language-context";
import Link from "next/link";
import { nauryzRedKeds } from "@/lib/font";
import { Globe, Moon, Sun, Menu, X } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useState } from "react";

export default function Header() {
  const { language, toggleLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed top-0 w-full bg-white/95 dark:bg-black/95 backdrop-blur-md shadow-sm z-50 border-b border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4 py-3 md:py-4 flex items-center justify-between">
        {/* LOGO */}
        <Link href={`/${language}`} className="flex items-center z-50">
          <h1
            className={`text-2xl md:text-3xl font-bold text-black dark:text-white ${nauryzRedKeds.className}`}
          >
            RECRU
          </h1>
        </Link>

        {/* RIGHT SIDE — Desktop */}
        <div className="hidden md:flex items-center space-x-3 lg:space-x-4">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300"
            aria-label="Toggle theme"
          >
            {theme === "light" ? (
              <Moon className="w-5 h-5 text-gray-700" />
            ) : (
              <Sun className="w-5 h-5 text-gray-300" />
            )}
          </button>

          {/* Language toggle */}
          <button
            onClick={toggleLanguage}
            className="flex items-center space-x-2 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300 group"
          >
            <Globe className="w-4 h-4 text-gray-700 dark:text-gray-400 group-hover:text-black dark:group-hover:text-white transition-colors" />
            <span className="font-medium text-gray-700 dark:text-gray-300 group-hover:text-black dark:group-hover:text-white transition-colors">
              {language === "ru" ? "EN" : "RU"}
            </span>
          </button>
        </div>

        {/* MOBILE BURGER */}
        <button
          className="md:hidden p-2 relative z-50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? (
            <X className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          ) : (
            <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          )}
        </button>
      </div>

      {/* MOBILE MENU */}
      <div
        className={`md:hidden fixed inset-0 bg-white dark:bg-black transition-all duration-300 ease-in-out ${mobileOpen ? "opacity-100 visible" : "opacity-0 invisible"}`}
      >
        <div className="container mx-auto px-6 pt-20 pb-8 h-full flex flex-col">
          {/* Закрывающая кнопка */}
          <button
            className="absolute top-5 right-4 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          </button>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Theme toggle */}
                <button
                  onClick={toggleTheme}
                  className="p-3 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Toggle theme"
                >
                  {theme === "light" ? (
                    <Moon className="w-6 h-6 text-gray-700" />
                  ) : (
                    <Sun className="w-6 h-6 text-gray-300" />
                  )}
                </button>

                {/* Language toggle */}
                <button
                  onClick={toggleLanguage}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <Globe className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {language === "ru" ? "EN" : "RU"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="w-full h-px bg-black dark:bg-white rounded-full" />
    </header>
  );
}
