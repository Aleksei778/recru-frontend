'use client'

import { useCallback, useMemo } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'

type FilterValue = string | number | undefined

export function useUrlFilters<T extends Record<string, FilterValue>>(defaults: T): {
    filters: T
    setFilter: (key: keyof T, value: FilterValue) => void
    setFilters: (updates: Partial<Record<keyof T, FilterValue>>) => void
    resetFilters: () => void
} {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const filters = useMemo((): T => {
        const result = { ...defaults }
        for (const key of Object.keys(defaults)) {
            const raw = searchParams.get(key)
            if (raw !== null) {
                const def = defaults[key]
                if (typeof def === 'number') {
                    const n = Number(raw)
                    result[key as keyof T] = (isNaN(n) ? def : n) as T[keyof T]
                } else {
                    result[key as keyof T] = raw as T[keyof T]
                }
            }
        }
        return result
    }, [searchParams]) // eslint-disable-line react-hooks/exhaustive-deps

    const buildUrl = useCallback(
        (updates: Partial<Record<keyof T, FilterValue>>, resetPage = true) => {
            const params = new URLSearchParams(searchParams.toString())

            for (const key of Object.keys(updates)) {
                const val = updates[key as keyof T]
                const def = defaults[key]
                if (val === undefined || val === '' || val === def) {
                    params.delete(key)
                } else {
                    params.set(key, String(val))
                }
            }

            if (resetPage && !('page' in updates)) {
                params.delete('page')
            }

            const qs = params.toString()
            router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false })
        },
        [searchParams, pathname, router], // eslint-disable-line react-hooks/exhaustive-deps
    )

    const setFilter = useCallback(
        (key: keyof T, value: FilterValue) =>
            buildUrl({ [key]: value } as Partial<Record<keyof T, FilterValue>>),
        [buildUrl],
    )

    const setFilters = useCallback(
        (updates: Partial<Record<keyof T, FilterValue>>) => buildUrl(updates),
        [buildUrl],
    )

    const resetFilters = useCallback(() => {
        router.replace(pathname, { scroll: false })
    }, [pathname, router])

    return { filters, setFilter, setFilters, resetFilters }
}
