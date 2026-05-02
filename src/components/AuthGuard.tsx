'use client'

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useLanguage } from "@/contexts/language-context"

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth()
    const { language } = useLanguage()
    const router = useRouter()

    useEffect(() => {
        if (!loading && !user) {
            router.replace(`/${language}/login`)
        }
    }, [loading, user, language, router])

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        )
    }

    if (!user) return null

    return <>{children}</>
}
