// app/[lang]/auth/callback/page.tsx

'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { auth as api } from '@/lib/api'

export default function AuthCallbackPage() {
    const router       = useRouter()
    const searchParams = useSearchParams()
    const { setTokenAndUser } = useAuth()

    useEffect(() => {
        const token = searchParams.get('token')
        if (!token) { router.replace('/login'); return }

        api.me(token).then(({ user, tenant }) => {
            localStorage.setItem('recru-token', token)
            setTokenAndUser(token, user, tenant)
            router.replace('/vacancies')
        }).catch(() => {
            router.replace('/login')
        })
    }, [])

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-gray-200
                border-t-black animate-spin" />
        </div>
    )
}
