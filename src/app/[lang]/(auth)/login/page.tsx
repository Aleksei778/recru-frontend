// src/app/[lang]/(auth)/login/page.tsx

'use client';

import { useState } from "react";
import { nauryzRedKeds } from "@/lib/font";
import { useTranslation } from "@/hooks/useTranslation";
import { useLanguage } from "@/contexts/language-context";
import { useAuth } from "@/contexts/auth-context";
import { ApiError } from "@/lib/api";
import Link from "next/link";

export default function Login() {
  const { language } = useLanguage();
  const { t } = useTranslation();
  const { login } = useAuth();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      setLoading(true)
      setError("")

      try {
          await login({ email, password })
      } catch (err) {
          setError(err instanceof ApiError ? err.message : 'Неверный логин или пароль')
          setLoading(false)
      }
  };

  return (
    <div className="min-h-screen flex items-center justify-center  bg-white dark:bg-black">
      <div className="w-full max-w-sm mx-4">
          <div className="rounded-3xl border border-black dark:border-white shadow-2xl p-12">
          <div className="text-center mb-8">
            <h1
              className={`text-2xl md:text-3xl font-bold text-black dark:text-white ${nauryzRedKeds.className}`}
            >
              RECRU
            </h1>
            <h2 className="text-3xl mt-15 font-bold text-black dark:text-white">
              {t("login.header")}
            </h2>
            <p className="text-slate-300"></p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-3.5 bg-white border border-gray-300 rounded-full text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition text-sm"
                placeholder={t("login.emailPlaceholder")}
                required
              />
            </div>

            {/* Password Input */}
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-3.5 bg-white border border-gray-300 rounded-full text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition text-sm"
                placeholder={t("login.passwordPlaceholder")}
                required
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="text-center">
                <p className="text-red-500 text-xs">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-5 bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-black font-medium rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {loading ? t("login.loggingIn") : t("login.loginButton")}
              </button>
            </div>

            {/* Links */}
            <div className="flex items-center justify-center gap-6 text-xs pt-2">
              <Link
                href={`/${language}/forgot-password`}
                className="text-gray-500 hover:text-gray-700 transition"
              >
                {t("login.forgotPassword")}
              </Link>
              <span className="text-gray-300">•</span>
              <Link
                href={`/${language}/register`}
                className="text-gray-500 hover:text-gray-700 transition"
              >
                {t("login.register")}
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
