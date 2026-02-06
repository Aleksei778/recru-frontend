// src/app/[lang]/register/page.tsx

"use client";

import { useState } from "react";
import { nauryzRedKeds } from "@/lib/font";
import { useTranslation } from "@/hooks/useTranslation";
import { useLanguage } from "@/contexts/language-context";

export default function Register() {
  const { t } = useTranslation();
  const { language } = useLanguage();

  const [company, setCompany] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subdomain: subdomain,
          company: company,
          email: email,
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Ошибка входа");
      }

      window.location.href = `${language}/dashboard`;
    } catch (error) {
      setError(error instanceof Error ? error.message : "Произошла ошибка");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="w-full max-w-sm mx-4">
        <div className="bg-white rounded-3xl shadow-2xl p-12">
          <div className="text-center mb-8">
            <h1
              className={`text-2xl md:text-3xl font-bold text-black dark:text-white ${nauryzRedKeds.className}`}
            >
              RECRU
            </h1>
            <h2 className="text-3xl mt-15 font-bold text-black dark:text-white">
              {t("register.header")}
            </h2>
            <p className="text-slate-300"></p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Company Input */}
            <div>
              <input
                type="input"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full px-5 py-3.5 bg-white border border-gray-300 rounded-full text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition text-sm"
                placeholder={t("register.companyPlaceholder")}
                required
              />
            </div>

            {/* Subdomain Input */}
            <div>
              <input
                type="input"
                value={subdomain}
                onChange={(e) => setSubdomain(e.target.value)}
                className="w-full px-5 py-3.5 bg-white border border-gray-300 rounded-full text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition text-sm"
                placeholder={t("register.subdomainPlaceholder")}
                required
              />
            </div>

            {/* Email Input */}
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-3.5 bg-white border border-gray-300 rounded-full text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition text-sm"
                placeholder={t("register.emailPlaceholder")}
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
                placeholder={t("register.passwordPlaceholder")}
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
                className="w-full py-3.5 px-5 bg-black hover:bg-gray-800 text-white font-medium rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {loading
                  ? t("register.registeringIn")
                  : t("register.registerButton")}
              </button>
            </div>

            {/* Links */}
            <div className="flex items-center justify-center gap-6 text-xs pt-2">
              <a
                href={`/${language}/login`}
                className="text-gray-500 hover:text-gray-700 transition"
              >
                {t("register.login")}
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
