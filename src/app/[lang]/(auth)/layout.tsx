// app/[lang]/(auth)/layout.tsx

import Header from "@/components/auth/Header";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
      <div>
          <Header />
          <div className="items-center justify-center">
              <div>{children}</div>
          </div>
      </div>
  );
}
