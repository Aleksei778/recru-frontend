// app/[lang]/(dashboard)/layout.tsx

"use client";

import React, { useState } from "react";
import Sidebar from "@/components/Sidebar";
import AuthGuard from "@/components/AuthGuard";
import { MenuIcon } from "lucide-react";
import { nauryzRedKeds } from "@/lib/font";

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <AuthGuard>
            <div className="flex h-screen overflow-hidden">
                <Sidebar
                    isOpen={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                />

                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    {/* Mobile header */}
                    <header className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-black dark:border-white bg-white dark:bg-black shrink-0">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="p-1.5 -ml-1.5 text-black dark:text-white"
                            aria-label="Open menu"
                        >
                            <MenuIcon className="w-5 h-5" />
                        </button>
                        <span
                            className={`text-xl font-bold text-black dark:text-white ${nauryzRedKeds.className}`}
                        >
                            RECRU
                        </span>
                    </header>

                    <main className="flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-900">{children}</main>
                </div>
            </div>
        </AuthGuard>
    );
}