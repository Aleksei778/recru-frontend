// app/page.tsx

import { redirect } from "next/navigation";
import { headers } from "next/headers";

export default async function RootPage() {
  const headersList = await headers();
  const acceptLanguage = headersList.get("accept-language") || "";

  const preferredLang = acceptLanguage.toLowerCase().includes("ru")
    ? "ru"
    : "en";

  redirect(`/${preferredLang}/vacancies`);
}
