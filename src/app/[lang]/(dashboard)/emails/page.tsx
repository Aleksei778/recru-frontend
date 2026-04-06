'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { emails as api } from '@/lib/api'
import type { Email, EmailStatus } from '@/types'
import { MailIcon, SearchIcon, PlusIcon } from 'lucide-react'
import React from 'react'
import { useTranslation } from "@/hooks/useTranslation"
import { ClockIcon, CheckIcon, XCircleIcon } from 'lucide-react'

const getStatusConfig = (t: (key: string) => string): Record<EmailStatus, {
    label: string
    icon:  React.ElementType
    color: string
}> => ({
    sent: { label: t('dashboard.emails.status.sent'), icon: CheckIcon, color: 'border-black dark:border-white text-black dark:text-white' },
    draft: { label: t('dashboard.emails.status.draft'), icon: ClockIcon, color: 'border-gray-300 dark:border-gray-700 text-gray-400 dark:text-gray-500' },
    failed: { label: t('interviews.status.error'), icon: XCircleIcon, color: 'border-red-300 dark:border-red-800 text-red-500 dark:text-red-400' },
})



export default function EmailsPage() {
    const { token } = useAuth()
    const { t } = useTranslation()

    const [items, setItems] = useState<Email[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [search, setSearch] = useState<string>('')
    const [selected, setSelected] = useState<Email | null>(null)
    const [statusFilter, setStatusFilter] = useState<EmailStatus | 'all'>('all')

    const STATUS_CONFIG = getStatusConfig(t)

    useEffect(() => {
        if (!token) return
        api.list(token).then(res => {
            setItems(res.data)
            setLoading(false)
        }, [token])

        const filtered = items.filter(e => {
            const matchSearch = search === '' ||
                e.subject.toLowerCase().includes(search.toLowerCase() ||
                    `${e.candidate.candidateData.first_name} ${e.candidate.candidateData.middle_name}`.toLowerCase().includes(search.toLowerCase())
                )

            const matchStatus = statusFilter === 'all' || e.status === statusFilter

            return matchSearch && matchStatus
        })

        const statuses: { value: EmailStatus | 'all'; label: string }[] = [
            { value: 'all', label: 'Все' },
            { value: 'sent', label: 'Отправленные' },
            { value: 'draft', label: 'Черновики' },
            { value: 'failed', label: 'Ошибки' }
        ];

        return (
            <div className="min-h-screen bg-white dark:bg-black">
                <div className="flex h-screen">
                    {/* Sidebar list */}
                    <div className={`flex flex-col border-r border-gray-100 dark:border-gray-900
                                 ${selected ? 'hidden md:flex w-80' : 'flex w-full md:w-80'}`}>
                        {/* Header */}
                        <div className="px-6 pt-8 pb-4 flex items-center justify-between shrink-0">
                            <div>
                                <h1 className="text-xl font-bold text-black dark:text-white">
                                    {t('dashboard.emails.heading')}
                                </h1>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {items.length} {t('dashboard.emails.total')}
                                </p>
                            </div>
                            <button
                                className="w-9 h-9 flex items-center justify-center rounded-full
                                       border border-black dark:border-white
                                       hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black
                                       text-black dark:text-white transition-all duration-200"
                            >
                                <PlusIcon className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Search */}
                        <div className="px-4 pb-3 shrink-0">
                            <div className="relative">
                                <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2
                                    w-3.5 h-3.5 text-gray-400 pointer-events-none"
                                />
                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder={t('dashboard.emails.search')}
                                    className="w-full pl-9 pr-4 py-2.5 text-sm rounded-full
                                           border border-gray-200 dark:border-gray-800
                                           bg-gray-50 dark:bg-gray-950
                                           text-black dark:text-white placeholder-gray-400
                                           focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white
                                           focus:border-transparent transition"
                                />
                            </div>
                        </div>

                        {/* Status filter */}
                        <div className="px-4 pb-3 flex gap-1.5 flex-wrap shrink-0">
                            {statuses.map(s => (
                                <button
                                    key={s.value}
                                    onClick={() => setStatusFilter(s.value)}
                                    className={`text-xs px-3 py-1.5 rounded-full border transition-all duration-200
                                    ${statusFilter === s.value
                                        ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white'
                                        : 'border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:border-black dark:hover:border-white hover:text-black dark:hover:text-white'
                                    }`}
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto">
                            {loading ? (
                                <div className="space-y-1 px-2">
                                    {[...Array(6)].map((_, i) => (
                                        <div className="h-20 rounded-2xl bg-gray-50 dark:bg-gray-950 animate-pulse" />
                                    ))}
                                </div>
                            ) : filtered.length === 0 ? (
                                <div className="text-center py-16">
                                    <MailIcon className="w-8 h-8 text-gray-200 dark:text-gray-800 mx-auto mb-3" />
                                <p className="text-sm text-gray-400">{t('dashboard.emails.empty')}</p>
                                </div>
                            ) : filtered.length === 0 ? (
                                <div className="text-center py-16">
                                    <MailIcon className="w-8 h-8 text-gray-200 dark:text-gray-800 mx-auto mb-3" />
                                    <p className="text-sm text-gray-400">{t('dashboard')}</p>
                                </div>
                            ) : (
                                <div className="space-y-px px-2 pb-4">
                                    {filtered.map(email => {
                                        const cfg = STATUS_CONFIG[email.status]
                                        const StatusIcon = cfg.icon
                                        const isSelected = selected?.id === email.id

                                        return (
                                            <button
                                                key={email.id}
                                                onClick={() => setSelected(email)}
                                                className={`w-full text-left px-4 py-3.5 rounded-2xl transition-all duration-150
                                                ${isSelected
                                                    ? 'bg-black dark:bg-white'
                                                    : 'hover:bg-gray-50 dark:hover:bg-gray-950'
                                                }`}
                                            >
                                                {/* Candidate + status */}
                                                <div className="flex items-center gap-2 mb-1 justify-between">
                                                    <p className=text-sm font-medium truncate
                                                       ${isSelected ? 'text-white dark:text-black' : 'text-black dark:text-white'}>
                                                        {email.candidate
                                                            ? `${email.candidate.last_name} ${email.candidate.first_name}`
                                                            : '—'
                                                        }
                                                    </p>
                                                    <div className={`flex items-center gap-1 text-xs shrink-0 ${isSelected ? 'text-gray-300 dark:text-gray-600' : cfg.color.split(' ')[2] + ' ' + cfg.color.split(' ')[3]}`}>
                                                        <StatusIcon className="w-3 h-3" />
                                                    </div>
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )
    })
}