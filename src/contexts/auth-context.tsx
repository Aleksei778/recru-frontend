// contexts/auth-context.tsx

'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import type {
    User,
    Tenant,
    AuthContext,
    LoginData,
    RegisterData
} from '@/types'
import { auth } from '@/lib/api'
import { useLanguage } from "@/contexts/language-context"

const ctx = createContext<AuthContext>({} as AuthContext)

export function AuthProvider({ children }: { children: ReactNode }) {
    const { language } = useLanguage();

    const [user, setUser] = useState<User | null>(null)
    const [tenant, setTenant] = useState<Tenant | null>(null)
    const [token, setToken] = useState<string | null>(null)
    const [loading, setLoading] = useState<boolean>(true)

    useEffect(() => {
        const initAuth = async () => {
            const t = localStorage.getItem("recru-token")

            if (!t) {
                setLoading(false)
                return
            }

            setToken(t)

            try {
                const { user: u, tenant: te } = await auth.me(t)

                setUser(u)
                setTenant(te)
            } catch {
                localStorage.removeItem("recru-token")

                setToken(null)
            } finally {
                setLoading(false)
            }
        }

        initAuth()
    }, [])

    const CENTRAL_DOMAIN = process.env.NEXT_PUBLIC_CENTRAL_DOMAIN ?? 'recru.local'
    const PORT = process.env.NEXT_PUBLIC_FRONTEND_PORT ? `:${process.env.NEXT_PUBLIC_FRONTEND_PORT}` : '3000'

    const login = async (loginData: LoginData): Promise<void> => {
        const { token: t, user: u, tenant: te } = await auth.login(loginData)

        localStorage.setItem('recru-token', t)

        setToken(t)
        setUser(u)
        setTenant(te)

        const subdomain = te.subdomain
        window.location.href = `${window.location.protocol}//${subdomain}.${CENTRAL_DOMAIN}${PORT}/${language}/callback?token=${t}`
    }

    const register = async (registerData: RegisterData) => {
        const { token: t, user: u, tenant: te } = await auth.register(registerData)

        localStorage.setItem('recru-token', t)

        setToken(t)
        setUser(u)
        setTenant(te)

        const subdomain = te.subdomain
        window.location.href = `${window.location.protocol}//${subdomain}.${CENTRAL_DOMAIN}${PORT}/${language}/callback?token=${t}`
    }

    const logout = async () => {
        if (token) await auth.logout(token)

        localStorage.removeItem('recru-token')

        setToken(null)
        setUser(null)
        setTenant(null)

        window.location.href = `${window.location.protocol}//${CENTRAL_DOMAIN}${PORT}/${language}/login`
    }

    const setTokenAndUser = (t: string, u: User, te: Tenant) => {
        setToken(t)
        setUser(u)
        setTenant(te)
    }

    return (
        <ctx.Provider value={{ user, token, tenant, login, register, logout, loading, setTokenAndUser }}>
            { children }
        </ctx.Provider>
    )
}

export const useAuth = () => useContext(ctx)
