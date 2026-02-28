// contexts/auth-context.tsx

'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { useRouter } from 'next/navigation'
import type {User, Tenant, AuthContext, LoginData, RegisterData} from '@/lib/types'
import { auth } from '@/lib/api'

const ctx = createContext<AuthContext>({} as AuthContext)

export function AuthProvider({ children }: { children: ReactNode }) {
    const router = useRouter()

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

    const login = async (loginData: LoginData): Promise<void> => {
        const { token: t, user: u, tenant: te } = await auth.login(loginData)

        localStorage.setItem('recru-token', t)

        setToken(t)
        setUser(u)
        setTenant(te)

        router.push('/vacancies')
    }

    const register = async (registerData: RegisterData) => {
        const { token: t, user: u, tenant: te } = await auth.register(registerData)

        localStorage.setItem('recru-token', t)

        setToken(t)
        setUser(u)
        setTenant(te)

        router.push('/vacancies')
    }

    const logout = () => {
        if (token) auth.logout(token).catch(() => {})

        localStorage.removeItem('recru-token')

        setToken(null)
        setUser(null)
        setTenant(null)

        router.push('/login')
    }

    return (
        <ctx.Provider value={{ user, token, tenant, login, register, logout, loading }}>
            { children }
        </ctx.Provider>
    )
}

export const useAuth = () => useContext(ctx)
