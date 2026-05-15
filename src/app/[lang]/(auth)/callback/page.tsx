// app/[lang]/auth/callback/page.tsx

'use client'

import { useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { auth as api } from '@/lib/api'
import {useLanguage} from "@/contexts/language-context";

export default function AuthCallbackPage() {
    const router = useRouter()
    const { language } = useLanguage()
    const searchParams = useSearchParams()
    const { setTokenAndUser } = useAuth()
    const initialized = useRef(false)

    useEffect(() => {
        if (initialized.current) return
        initialized.current = true

        const token = searchParams.get('token')
        if (!token) { router.replace('/login'); return }

        api.me(token).then(({ user, tenant }) => {
            localStorage.setItem('recru-token', token)
            setTokenAndUser(token, user, tenant)
            router.replace(`/${language}/vacancies`)
        }).catch(() => {
            router.replace('/${language}/login')
        })
    }, [])

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-gray-200
                border-t-black animate-spin" />
        </div>
    )
}
