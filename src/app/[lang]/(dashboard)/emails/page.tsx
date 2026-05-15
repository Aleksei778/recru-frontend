// src/app/[lang]/(dashboard)/emails/page.tsx

'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { emails as api } from '@/lib/api'
import type { Email, EmailStatus } from '@/types'
import { MailIcon, SearchIcon, ClockIcon, CheckIcon, XCircleIcon } from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'
import { useLanguage } from '@/contexts/language-context'
import React from 'react'

type Tab = 'inbox' | 'sent'

const getStatusConfig = (t: (key: string) => string) => ({
    sent: { label: t('dashboard.emails.status.sent'), icon: CheckIcon, color: 'text-black dark:text-white' },
    pending: { label: t('dashboard.emails.status.pending'), icon: ClockIcon, color: 'text-gray-400 dark:text-gray-500' },
    failed: { label: t('dashboard.emails.status.failed'), icon: XCircleIcon, color: 'text-red-500 dark:text-red-400' },
})

const getStatuses = (t: (key: string) => string) => [
    { value: 'all', label: t('dashboard.emails.statusFilter.all') },
    { value: 'sent', label: t('dashboard.emails.statusFilter.sent') },
    { value: 'pending', label: t('dashboard.emails.statusFilter.pending') },
    { value: 'failed', label: t('dashboard.emails.statusFilter.failed') },
] as const

function getRecipientName(email: Email): string {
    if (email.recipient_type === 'candidate') {
        const d = email.recipient
        return `${d.last_name} ${d.first_name}`
    }

    return email.recipient.email
}

export default function EmailsPage() {
    const { token } = useAuth()
    const { t } = useTranslation()
    const { language } = useLanguage()
    const STATUS_CONFIG = getStatusConfig(t)
    const STATUSES = getStatuses(t)

    const [items, setItems] = useState<Email[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [selected, setSelected] = useState<Email | null>(null)
    const [statusFilter, setStatusFilter] = useState<EmailStatus | 'all'>('all')
    const [tab, setTab] = useState<Tab>('inbox')

    useEffect(() => {
        if (!token) return
        setLoading(true)
        setSelected(null)
        const fetch = tab === 'inbox' ? api.inbox(token) : api.sent(token)
        fetch.then(res => {
            setItems(res.data ?? res)
            setLoading(false)
        })
    }, [token, tab])

    const filtered = useMemo(() => {
        return items.filter(e => {
            const name = getRecipientName(e).toLowerCase()
            const matchSearch = search === '' ||
                e.subject.toLowerCase().includes(search.toLowerCase()) ||
                name.includes(search.toLowerCase())

            const matchStatus = statusFilter === 'all' || e.status === statusFilter

            return matchSearch && matchStatus
        })
    }, [items, search, statusFilter])

    return (
        <div className="h-full bg-white dark:bg-black flex flex-col">
            <div className="flex flex-1 overflow-hidden">

                <div className={`flex flex-col border-r border-gray-100 dark:border-gray-900
                    ${selected ? 'hidden md:flex w-80' : 'flex w-full md:w-80'}`}>

                    <div className="px-6 pt-8 pb-4 shrink-0">
                        <h1 className="text-xl font-bold text-black dark:text-white">
                            {t('dashboard.emails.heading')}
                        </h1>
                        <p className="text-xs text-gray-400 mt-0.5">
                            {items.length} {t('dashboard.emails.total')}
                        </p>
                    </div>

                    <div className="px-4 pb-3 flex gap-1 shrink-0">
                        {(['inbox', 'sent'] as Tab[]).map(tabItem => (
                            <button
                                key={tabItem}
                                onClick={() => setTab(tabItem)}
                                className={`flex-1 py-2 text-xs font-medium rounded-full transition-all
                                    ${tab === tabItem
                                    ? 'bg-black dark:bg-white text-white dark:text-black'
                                    : 'text-gray-500 hover:text-black dark:hover:text-white'
                                }`}
                            >
                                {tabItem === 'inbox' ? t('dashboard.emails.inbox') : t('dashboard.emails.sentTab')}
                            </button>
                        ))}
                    </div>

                    <div className="px-4 pb-3 shrink-0">
                        <div className="relative">
                            <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2
                                w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder={t('dashboard.emails.search')}
                                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-full
                                    border border-gray-200 dark:border-gray-800
                                    bg-gray-50 dark:bg-gray-950 text-black dark:text-white
                                    placeholder-gray-400 focus:outline-none focus:ring-2
                                    focus:ring-black dark:focus:ring-white focus:border-transparent transition"
                            />
                        </div>
                    </div>

                    <div className="px-4 pb-3 flex gap-1.5 flex-wrap shrink-0">
                        {STATUSES.map(s => (
                            <button
                                key={s.value}
                                onClick={() => setStatusFilter(s.value)}
                                className={`text-xs px-3 py-1.5 rounded-full border transition-all
                                    ${statusFilter === s.value
                                    ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white'
                                    : 'border-gray-200 dark:border-gray-800 text-gray-500 hover:border-black hover:text-black dark:hover:border-white dark:hover:text-white'
                                }`}
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="space-y-1 px-2">
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="h-20 rounded-2xl bg-gray-50 dark:bg-gray-950 animate-pulse" />
                                ))}
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="text-center py-16">
                                <MailIcon className="w-8 h-8 text-gray-200 dark:text-gray-800 mx-auto mb-3" />
                                <p className="text-sm text-gray-400">{t('dashboard.emails.empty')}</p>
                            </div>
                        ) : (
                            <div className="space-y-px px-2 pb-4">
                                {filtered.map(email => {
                                    const cfg        = STATUS_CONFIG[email.status]
                                    const StatusIcon = cfg.icon
                                    const isSelected = selected?.id === email.id
                                    const name       = getRecipientName(email)

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
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                <p className={`text-sm font-medium truncate
                                                    ${isSelected ? 'text-white dark:text-black' : 'text-black dark:text-white'}`}>
                                                    {name}
                                                </p>
                                                <StatusIcon className={`w-3 h-3 shrink-0 ${isSelected ? 'text-gray-300 dark:text-gray-600' : cfg.color}`} />
                                            </div>
                                            <p className={`text-xs truncate
                                                ${isSelected ? 'text-gray-300 dark:text-gray-600' : 'text-gray-400'}`}>
                                                {email.subject}
                                            </p>
                                            <p className={`text-xs mt-0.5
                                                ${isSelected ? 'text-gray-400 dark:text-gray-500' : 'text-gray-300 dark:text-gray-700'}`}>
                                                {email.sent_at
                                                    ? new Date(email.sent_at).toLocaleDateString(language)
                                                    : '—'
                                                }
                                            </p>
                                        </button>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {selected && (
                    <div className="flex-1 flex flex-col min-w-0">
                        <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-gray-100 dark:border-gray-900
                            flex items-start justify-between shrink-0">
                            <div>
                                <p className="font-semibold text-black dark:text-white">
                                    {selected.subject}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    {t('dashboard.emails.to')} {getRecipientName(selected)}
                                </p>
                                {selected.sender && (
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        {t('dashboard.emails.from')} {selected.sender.name}
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={() => setSelected(null)}
                                className="md:hidden text-gray-400 hover:text-black dark:hover:text-white
                                    transition text-xl leading-none shrink-0"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="px-8 py-3 border-b border-gray-100 dark:border-gray-900 shrink-0">
                            <span className="text-xs border border-gray-200 dark:border-gray-800
                                text-gray-500 px-3 py-1 rounded-full">
                                {t(`dashboard.emails.types.${selected.type}`)}
                            </span>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 sm:p-8 text-sm text-gray-600
                            dark:text-gray-400 leading-relaxed">
                            {selected.interview && (
                                <p className="text-xs text-gray-400 mb-4">
                                    {t('dashboard.emails.interviewLabel', { id: selected.interview.id })} · {selected.interview.vacancy?.title}
                                </p>
                            )}
                            <p className="text-gray-400 italic">{t('dashboard.emails.previewUnavailable')}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
