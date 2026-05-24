// src/app/[lang]/(auth)/login/page.tsx

'use client';

import { useState } from "react";
import { nauryzRedKeds } from "@/lib/font";
import { useTranslation } from "@/hooks/useTranslation";
import { useLanguage } from "@/contexts/language-context";
import { useAuth } from "@/contexts/auth-context";
import { ApiError } from "@/lib/api";
import Link from "next/link";

type FieldErrors = {
  email?: string;
  password?: string;
  general?: string;
};

export default function Login() {
  const { language } = useLanguage();
  const { t } = useTranslation();
  const { login } = useAuth();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState<boolean>(false);

  // Валидация на клиенте
  const validate = (): boolean => {
    const errs: FieldErrors = {};

    if (!email.trim()) {
      errs.email = t("validation.emailRequired");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = t("validation.emailInvalid");
    }

    if (!password) {
      errs.password = t("validation.passwordRequired");
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Сбрасываем ошибку конкретного поля при вводе
  const clearFieldError = (field: keyof FieldErrors) => {
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  // Маппинг серверных ошибок по полям
  const applyServerErrors = (err: unknown) => {
    if (err instanceof ApiError) {
      // 401 invalid credentials — не раскрываем какое именно поле неверно
      if (err.status === 401) {
        setFieldErrors({ general: t("validation.invalidCredentials") });
        return;
      }
      // 422 field-level errors
      if (err.fieldErrors && Object.keys(err.fieldErrors).length > 0) {
        const mapped: FieldErrors = {};
        for (const [field, msgs] of Object.entries(err.fieldErrors)) {
          const msg = Array.isArray(msgs) ? msgs[0] : String(msgs);
          if (field === "email") mapped.email = msg;
          else if (field === "password") mapped.password = msg;
          else mapped.general = msg;
        }
        setFieldErrors(mapped);
        return;
      }
      setFieldErrors({ general: err.message });
    } else {
      setFieldErrors({ general: t("validation.invalidCredentials") });
    }
  };

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);
    setFieldErrors({});

    try {
      await login({ email, password, password_confirmation: password });
    } catch (err) {
      applyServerErrors(err);
      setLoading(false);
    }
  };

  const inputClass = (hasError?: string) =>
    `w-full px-5 py-3.5 bg-white border ${
      hasError ? "border-red-400 focus:ring-red-300" : "border-gray-300 focus:ring-gray-400"
    } rounded-full text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition text-sm`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
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
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Общая ошибка (например, неверные данные) */}
            {fieldErrors.general && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-2.5">
                <p className="text-red-600 text-xs text-center">{fieldErrors.general}</p>
              </div>
            )}

            {/* Email */}
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); clearFieldError("email"); }}
                className={inputClass(fieldErrors.email)}
                placeholder={t("login.emailPlaceholder")}
                autoComplete="email"
              />
              {fieldErrors.email && (
                <p className="text-red-500 text-xs mt-1 ml-4">{fieldErrors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); clearFieldError("password"); }}
                className={inputClass(fieldErrors.password)}
                placeholder={t("login.passwordPlaceholder")}
                autoComplete="current-password"
              />
              {fieldErrors.password && (
                <p className="text-red-500 text-xs mt-1 ml-4">{fieldErrors.password}</p>
              )}
            </div>

            {/* Submit */}
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
