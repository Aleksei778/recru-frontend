// src/app/[lang]/(dashboard)/interviews/page.tsx

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { useTranslation } from '@/hooks/useTranslation'
import { interviews as api } from '@/lib/api'
import type { Interview, InterviewStatus } from '@/types'
import {
    ClockIcon, CheckCircleIcon, XCircleIcon, PlayIcon,
    SparklesIcon, MicIcon, SearchIcon, CheckIcon,
} from 'lucide-react'
import React from 'react'

const getStatusConfig = (t: (key: string) => string): Record<InterviewStatus, {
    label: string
    icon: React.ElementType
    color: string
}> => ({
    pending: { label: t('dashboard.interviews.status.pending'), icon: ClockIcon, color: 'border-gray-300 dark:border-gray-700 text-gray-400' },
    generating_questions: { label: t('dashboard.interviews.status.generating_questions'), icon: SparklesIcon, color: 'border-gray-300 dark:border-gray-700 text-gray-400' },
    questions_review: { label: t('dashboard.interviews.status.questions_review'), icon: SearchIcon, color: 'border-black dark:border-white text-black dark:text-white' },
    synthesizing: { label: t('dashboard.interviews.status.synthesizing'), icon: SparklesIcon, color: 'border-gray-300 dark:border-gray-700 text-gray-400' },
    ready: { label: t('dashboard.interviews.status.ready'), icon: CheckIcon, color: 'border-black dark:border-white text-black dark:text-white' },
    in_progress: { label: t('dashboard.interviews.status.in_progress'), icon: PlayIcon, color: 'border-black dark:border-white text-black dark:text-white' },
    processing: { label: t('dashboard.interviews.status.processing'), icon: MicIcon, color: 'border-gray-300 dark:border-gray-700 text-gray-400' },
    evaluating: { label: t('dashboard.interviews.status.evaluating'), icon: SparklesIcon, color: 'border-gray-300 dark:border-gray-700 text-gray-400' },
    evaluated: { label: t('dashboard.interviews.status.evaluated'), icon: CheckCircleIcon, color: 'border-black dark:border-white text-black dark:text-white' },
    closed: { label: t('dashboard.interviews.status.closed'), icon: XCircleIcon, color: 'border-gray-300 dark:border-gray-700 text-gray-400' },
})

const PROCESSING_STATUSES: InterviewStatus[] = [
    'generating_questions',
    'synthesizing',
    'processing',
    'evaluating',
]

export default function InterviewsPage() {
    const { t } = useTranslation()
    const { token } = useAuth()

    const [items, setItems] = useState<Interview[]>([])
    const [loading, setLoading] = useState(true)

    const STATUS_CONFIG = getStatusConfig(t)

    useEffect(() => {
        if (!token) return
        api.list(token).then(res => {
            setItems(res.data)
            setLoading(false)
        })
    }, [token])

    return (
        <div className="min-h-screen bg-white dark:bg-black p-8">

            <div className="mb-10 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-black dark:text-white">
                        {t('dashboard.interviews.heading')}
                    </h1>
                    <p className="text-sm text-gray-400 mt-1">
                        {items.length} {t('dashboard.interviews.total')}
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-20 rounded-2xl border border-gray-100
                            dark:border-gray-900 animate-pulse" />
                    ))}
                </div>

            ) : items.length === 0 ? (
                <div className="text-center py-20">
                    <p className="text-gray-400">{t('dashboard.interviews.empty')}</p>
                </div>

            ) : (
                <div className="space-y-3">
                    {items.map(item => {
                        const status = item.status as InterviewStatus
                        const cfg= STATUS_CONFIG[status]
                        const StatusIcon = cfg.icon
                        const isProcessing = PROCESSING_STATUSES.includes(status)

                        return (
                            <Link
                                key={item.id}
                                href={status === 'questions_review'
                                    ? `/interviews/${item.id}/questions`
                                    : `/interviews/${item.id}`
                                }
                                className="flex items-center gap-5 rounded-2xl border border-black
                                    dark:border-white px-6 py-4 hover:shadow-xl
                                    transition-all duration-200 group"
                            >
                                <div className={`flex items-center gap-1.5 text-xs font-medium
                                    px-3 py-1.5 rounded-full border shrink-0 ${cfg.color}`}>
                                    {isProcessing ? (
                                        <div className="w-3 h-3 rounded-full border border-current
                                            border-t-transparent animate-spin" />
                                    ) : (
                                        <StatusIcon className="w-3 h-3" />
                                    )}
                                    {cfg.label}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-black dark:text-white truncate">
                                        {item.candidate.last_name}{' '}
                                        {item.candidate.first_name}
                                    </p>
                                    <p className="text-xs text-gray-400 truncate mt-0.5">
                                        {item.vacancy.title}
                                    </p>
                                </div>

                                {(status === 'evaluated' || status === 'closed') && item.grade != null ? (
                                    <div className="text-right shrink-0">
                                        <div className="text-xl font-bold text-black dark:text-white">
                                            {item.grade}
                                        </div>
                                        <div className="text-xs text-gray-400">{t('dashboard.interviews.grade')}</div>
                                    </div>
                                ) : (
                                    <div className="w-12 shrink-0" />
                                )}

                                {status === 'questions_review' && (
                                    <div className="text-xs px-3 py-1.5 rounded-full
                                        bg-black dark:bg-white text-white dark:text-black
                                        font-medium shrink-0">
                                        {t('dashboard.interviews.check')}
                                    </div>
                                )}

                                <div className="text-xs text-gray-400 shrink-0">
                                    {new Date(item.created_at).toLocaleDateString('ru-RU')}
                                </div>
                            </Link>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
