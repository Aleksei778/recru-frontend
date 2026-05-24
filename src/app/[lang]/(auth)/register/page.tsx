// src/app/[lang]/(auth)/register/page.tsx

"use client";

import { useState } from "react";
import { nauryzRedKeds } from "@/lib/font";
import { useTranslation } from "@/hooks/useTranslation";
import { useLanguage } from "@/contexts/language-context";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import Link from "next/link";

// ──────────────────────────────────────────────
// Типы
// ──────────────────────────────────────────────

type FieldErrors = {
  company?: string;
  subdomain?: string;
  email?: string;
  password?: string;
  password_confirmation?: string;
  general?: string;
};

type PasswordChecks = {
  minLength: boolean;
  uppercase: boolean;
  lowercase: boolean;
  number: boolean;
  symbol: boolean;
};

// ──────────────────────────────────────────────
// Вспомогательный компонент — одно требование к паролю
// ──────────────────────────────────────────────

function PasswordRequirement({ met, label }: { met: boolean; label: string }) {
  return (
    <li className={`flex items-center gap-1.5 text-xs transition-colors ${met ? "text-green-600" : "text-gray-400"}`}>
      <span className="text-[10px] font-bold">{met ? "✓" : "✗"}</span>
      {label}
    </li>
  );
}

// ──────────────────────────────────────────────
// Утилиты валидации
// ──────────────────────────────────────────────

function checkPassword(value: string): PasswordChecks {
  return {
    minLength: value.length >= 8,
    uppercase: /[A-Z]/.test(value),
    lowercase: /[a-z]/.test(value),
    number: /[0-9]/.test(value),
    symbol: /[^A-Za-z0-9]/.test(value),
  };
}

function allPasswordChecksMet(checks: PasswordChecks): boolean {
  return Object.values(checks).every(Boolean);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// строчные буквы, цифры, дефисы; не начинается/не заканчивается на дефис; 1–63 символа
const SUBDOMAIN_RE = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$|^[a-z0-9]$/;

// ──────────────────────────────────────────────
// Страница регистрации
// ──────────────────────────────────────────────

export default function Register() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { register } = useAuth();

  const [company, setCompany] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const pwdChecks = checkPassword(password);

  // ── Клиентская валидация ─────────────────────
  const validate = (): boolean => {
    const errs: FieldErrors = {};

    if (!company.trim()) {
      errs.company = t("validation.companyRequired");
    }

    if (!subdomain.trim()) {
      errs.subdomain = t("validation.subdomainRequired");
    } else if (!SUBDOMAIN_RE.test(subdomain)) {
      errs.subdomain = t("validation.subdomainInvalid");
    }

    if (!email.trim()) {
      errs.email = t("validation.emailRequired");
    } else if (!EMAIL_RE.test(email)) {
      errs.email = t("validation.emailInvalid");
    }

    if (!password) {
      errs.password = t("validation.passwordRequired");
    } else if (!allPasswordChecksMet(pwdChecks)) {
      // показываем чеклист (он уже видим), просто ставим ошибку поля
      errs.password = " "; // пробел — чтобы поле покрасилось, но не дублировать текст
    }

    if (!passwordConfirmation) {
      errs.password_confirmation = t("validation.passwordConfirmRequired");
    } else if (password !== passwordConfirmation) {
      errs.password_confirmation = t("validation.passwordConfirmMismatch");
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Сброс ошибки поля при вводе ──────────────
  const clearFieldError = (field: keyof FieldErrors) => {
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  // ── Маппинг серверных ошибок по полям ────────
  const applyServerErrors = (err: unknown) => {
    if (err instanceof ApiError && err.fieldErrors) {
      const mapped: FieldErrors = {};
      for (const [field, msgs] of Object.entries(err.fieldErrors)) {
        const msg = Array.isArray(msgs) ? msgs[0] : String(msgs);
        if (field === "company") mapped.company = msg;
        else if (field === "subdomain") mapped.subdomain = msg;
        else if (field === "email") mapped.email = msg;
        else if (field === "password") {
          // Laravel "confirmed" rule пишет в поле password, но это ошибка подтверждения
          if (msg.toLowerCase().includes("confirm")) {
            mapped.password_confirmation = msg;
          } else {
            mapped.password = msg;
          }
        } else {
          mapped.general = msg;
        }
      }
      setFieldErrors(mapped);
    } else if (err instanceof ApiError) {
      setFieldErrors({ general: err.message });
    } else {
      setFieldErrors({ general: "Registration error. Please try again." });
    }
  };

  // ── Отправка формы ───────────────────────────
  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);
    setFieldErrors({});

    try {
      await register({
        subdomain,
        company,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });
    } catch (err) {
      console.error(err);
      applyServerErrors(err);
      setLoading(false);
    }
  };

  // ── Стиль поля в зависимости от ошибки ───────
  const inputClass = (hasError?: string) =>
    `w-full px-5 py-3.5 bg-white border ${
      hasError
        ? "border-red-400 focus:ring-red-300"
        : "border-gray-300 focus:ring-gray-400"
    } rounded-full text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition text-sm`;

  const showPasswordChecklist = passwordFocused || password.length > 0;

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
      <div className="w-full max-w-sm mx-4">
        <div className="rounded-3xl border border-black dark:border-white shadow-2xl p-12">
          <div className="text-center mb-8">
            <h1 className={`text-2xl md:text-3xl font-bold text-black dark:text-white ${nauryzRedKeds.className}`}>
              RECRU
            </h1>
            <h2 className="text-3xl mt-15 font-bold text-black dark:text-white">
              {t("register.header")}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>

            {/* Общая ошибка */}
            {fieldErrors.general && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-2.5">
                <p className="text-red-600 text-xs text-center">{fieldErrors.general}</p>
              </div>
            )}

            {/* Компания */}
            <div>
              <input
                type="text"
                value={company}
                onChange={(e) => { setCompany(e.target.value); clearFieldError("company"); }}
                className={inputClass(fieldErrors.company)}
                placeholder={t("register.companyPlaceholder")}
                autoComplete="organization"
              />
              {fieldErrors.company && (
                <p className="text-red-500 text-xs mt-1 ml-4">{fieldErrors.company}</p>
              )}
            </div>

            {/* Субдомен */}
            <div>
              <input
                type="text"
                value={subdomain}
                onChange={(e) => {
                  // Автоматически приводим к нижнему регистру и убираем недопустимые символы
                  const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
                  setSubdomain(val);
                  clearFieldError("subdomain");
                }}
                className={inputClass(fieldErrors.subdomain)}
                placeholder={t("register.subdomainPlaceholder")}
                autoComplete="off"
                spellCheck={false}
              />
              {fieldErrors.subdomain && (
                <p className="text-red-500 text-xs mt-1 ml-4">{fieldErrors.subdomain}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); clearFieldError("email"); }}
                className={inputClass(fieldErrors.email)}
                placeholder={t("register.emailPlaceholder")}
                autoComplete="email"
              />
              {fieldErrors.email && (
                <p className="text-red-500 text-xs mt-1 ml-4">{fieldErrors.email}</p>
              )}
            </div>

            {/* Пароль + чеклист требований */}
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); clearFieldError("password"); }}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                className={inputClass(fieldErrors.password)}
                placeholder={t("register.passwordPlaceholder")}
                autoComplete="new-password"
              />
              {fieldErrors.password && fieldErrors.password.trim() && (
                <p className="text-red-500 text-xs mt-1 ml-4">{fieldErrors.password}</p>
              )}
              {/* Чеклист требований к паролю */}
              {showPasswordChecklist && (
                <ul className="mt-2 ml-4 space-y-0.5">
                  <PasswordRequirement met={pwdChecks.minLength}  label={t("validation.passwordMin")} />
                  <PasswordRequirement met={pwdChecks.uppercase}  label={t("validation.passwordUppercase")} />
                  <PasswordRequirement met={pwdChecks.lowercase}  label={t("validation.passwordLowercase")} />
                  <PasswordRequirement met={pwdChecks.number}     label={t("validation.passwordNumber")} />
                  <PasswordRequirement met={pwdChecks.symbol}     label={t("validation.passwordSymbol")} />
                </ul>
              )}
            </div>

            {/* Подтверждение пароля */}
            <div>
              <input
                type="password"
                value={passwordConfirmation}
                onChange={(e) => { setPasswordConfirmation(e.target.value); clearFieldError("password_confirmation"); }}
                className={inputClass(fieldErrors.password_confirmation)}
                placeholder={t("register.passwordConfirmationPlaceholder")}
                autoComplete="new-password"
              />
              {fieldErrors.password_confirmation && (
                <p className="text-red-500 text-xs mt-1 ml-4">{fieldErrors.password_confirmation}</p>
              )}
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-5 bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-black font-medium rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {loading ? t("register.registeringIn") : t("register.registerButton")}
              </button>
            </div>

            {/* Ссылка на вход */}
            <div className="flex items-center justify-center gap-6 text-xs pt-2">
              <Link
                href={`/${language}/login`}
                className="text-gray-500 hover:text-gray-700 transition"
              >
                {t("register.login")}
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
