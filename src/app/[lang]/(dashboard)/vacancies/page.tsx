// src/app/[lang]/(dashboard)/vacancies/page.tsx

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { vacancies as api } from '@/lib/api'
import type { Vacancy } from '@/types'
import { PlusIcon, MapPinIcon, ChevronRightIcon } from 'lucide-react'

const labels = {
    draft: 'Черновик',
    published: 'Опубликована',
    closed: 'Закрыта',
}

const colors = {
    draft: 'border-gray-400 dark:border-gray-500 text-gray-500 dark:text-gray-400',
    published: 'border-black dark:border-white text-black dark:text-white',
    closed: 'border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500',
}

export default function VacanciesPage() {
    const { token, tenant } = useAuth()
    const [items, setItems] = useState<Vacancy[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!token) {
            return
        }

        api.list(token)
            .then(r => {
                setItems(r.data)
                setLoading(false)
            })
    }, [token])

    return (
        <div className="min-h-screen bg-white dark:bg-black p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-10">
                <div>
                    <h1 className="text-2xl font-bold text-black dark:text-white">Вакансии</h1>
                    <p className="text-sm text-gray-400 mt-1">{items.length} вакансий</p>
                </div>
                <Link
                    href={"/vacancies/new"}
                    className="flex items-center gap-2 px-5 py-2.5 bg-black dark:bg-white
                               text-white dark:text-black text-sm font-medium rounded-full
                               hover:bg-gray-800 dark:hover:bg-gray-200 transition-all duration-200"
                >
                    <PlusIcon className="w-4 h-4" />
                    Создать вакансию
                </Link>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {[...Array(6)].map((_, i) => (
                        <div
                            key={i}
                            className="h-52 rounded-3xl border border-gray-200 dark:border-gray-800 animate-pulse"
                        />
                    ))}
                </div>
            ) : items.length === 0 ? (
                <div className="text-center py-20">
                    <p className="text-gray-400 mb-3">Нет вакансий</p>
                    <Link
                        href={"/vacancies/new"}
                        className="text-sm text-black dark:text-white underline underline-offset-4 hover:opacity-60 transition"
                    >
                        Создать первую вакансию →
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {items.map(v => (
                        <Link
                            key={v.id}
                            href={`/vacancies/${v.id}`}
                            className="group flex flex-col rounded-3xl border border-black dark:border-white
                                       p-7 hover:shadow-2xl transition-all duration-200"
                        >
                            {/* Title + status */}
                            <div className="flex items-start justify-between gap-2 mb-4">
                                <h2 className="text-base font-bold text-black dark:text-white leading-snug">
                                    {v.title}
                                </h2>
                                <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium flex-shrink-0 ${colors[v.status]}`}>
                                    {labels[v.status]}
                                </span>
                            </div>

                            {/* Company */}
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                                {tenant?.name ?? 'NDA Company'}
                            </p>

                            {/* Location */}
                            <div className="flex items-center gap-1 text-xs text-gray-400 mb-4">
                                <MapPinIcon className="w-3.5 h-3.5 flex-shrink-0" />
                                {v.location}
                            </div>
x
                            {/* Salary */}
                            {(v.salary_min || v.salary_max) && (
                                <p className="text-sm font-semibold text-black dark:text-white mb-4">
                                    {v.salary_min ?? 0} - {v.salary_max ?? 100000} {v.salary_currency ?? 'RUB'}
                                </p>
                            )}

                            {/* Skills */}
                            <div className="flex flex-wrap gap-1.5 mb-5">
                                {v.required_skills.slice(0, 4).map(skill => (
                                    <span
                                        key={skill}
                                        className="text-xs border border-gray-300 dark:border-gray-600
                                                   text-gray-600 dark:text-gray-300 px-2.5 py-0.5 rounded-full"
                                    >
                                        {skill}
                                    </span>
                                ))}
                                {v.required_skills.length > 4 && (
                                    <span className="text-xs text-gray-400">
                                        +{v.required_skills.length - 4}
                                    </span>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="mt-auto flex items-center justify-between text-xs text-gray-400">
                                <span>Опыт: {v.experience_years}+ лет</span>
                                <ChevronRightIcon className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}
