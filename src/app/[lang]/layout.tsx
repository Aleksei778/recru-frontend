// app/[lang]/layout.tsx

import type { Metadata } from "next";
import "../globals.css";
import { ThemeProvider } from "@/contexts/theme-context";
import { LanguageProvider } from "@/contexts/language-context";
import { montserrat } from "@/lib/font";
import { notFound } from "next/navigation";

const languages = ["en", "ru"] as const;
type Language = (typeof languages)[number];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;

  const titles = {
    ru: "Recru: чтобы нанимать быстрее",
    en: "Recru: to hire faster",
  };

  const descriptions = {
    ru: "Recru - это современная ATS-система с автоматизированным техническим скринингом кандидатов",
    en: "Recru is a modern ATS system with automated technical screening of candidates",
  };

  return {
    title: titles[lang as Language],
    description: descriptions[lang as Language],
    keywords: ["ats", "hiring", "hiring candidates", "candidates", "Recru"],
    authors: [{ name: "Recru Team" }],
    openGraph: {
      type: "website",
      locale: lang === "ru" ? "ru_RU" : "en_US",
      url: `https://recru-landing.vercel.app/${lang}`,
      siteName: "Recru",
      title: titles[lang as Language],
      description: descriptions[lang as Language],
      images: [
        {
          url: "/logo-color.png",
          width: 1200,
          height: 630,
          alt: "Recru",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: titles[lang as Language],
      description: descriptions[lang as Language],
      images: ["/logo-color.png"],
    },
    alternates: {
      canonical: `https://recru-hr.vercel.app/${lang}`,
      languages: {
        en: "https://recru-hr.vercel.app/en",
        ru: "https://recru-hr.vercel.app/ru",
      },
    },
  };
}

export function generateStaticParams() {
  return languages.map((lang) => ({ lang }));
}

interface RootLayoutProps {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}

export default async function RootLayout({
  children,
  params,
}: RootLayoutProps) {
  const { lang } = await params;

  if (!languages.includes(lang as Language)) {
    notFound();
  }

  return (
    <html lang={lang} className={montserrat.variable} suppressHydrationWarning>
      <body className={`${montserrat.className} antialiased`}>
        <ThemeProvider>
          <LanguageProvider initialLanguage={lang as "en" | "ru"}>
            {children}
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
