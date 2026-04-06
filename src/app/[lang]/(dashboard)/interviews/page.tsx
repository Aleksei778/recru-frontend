// src/app/[lang]/(dashboard)/interviews/page.tsx

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { useTranslation } from '@/hooks/useTranslation'
import { interviews as api } from '@/lib/api'
import type { Interview, InterviewStatus, RecommendationType } from '@/types'
import { ClockIcon, CheckCircleIcon, XCircleIcon, PlayIcon } from 'lucide-react'
import React from 'react'

const getStatusConfig = (t: (key: string) => string): Record<InterviewStatus, {
    label: string
    icon:  React.ElementType
    color: string
}> => ({
    pending: { label: t('dashboard.interviews.status.pending'), icon: ClockIcon, color: 'border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400' },
    in_progress: { label: t('dashboard.interviews.status.in_progress'), icon: PlayIcon, color: 'border-black dark:border-white text-black dark:text-white' },
    completed: { label: t('dashboard.interviews.status.completed'), icon: CheckCircleIcon, color: 'border-black dark:border-white text-black dark:text-white' },
    cancel: { label: t('dashboard.interviews.status.cancel'), icon: XCircleIcon, color: 'border-gray-300 dark:border-gray-700 text-gray-400' },
})

const getRecConfig = (t: (key: string) => string): Record<RecommendationType, {
    label: string
    color: string
}> => ({
    hire: { label: t('interviews.rec.hire'), color: 'border-black dark:border-white text-black dark:text-white' },
    maybe: { label: t('interviews.rec.maybe'), color: 'border-gray-400 dark:border-gray-600 text-gray-500 dark:text-gray-400' },
    reject: { label: t('interviews.rec.reject'), color: 'border-gray-300 dark:border-gray-700 text-gray-400 dark:text-gray-600' },
})

export default function InterviewPage() {
    const { t } = useTranslation()
    const { token } = useAuth()

    const [items,   setItems] = useState<Interview[]>([])
    const [loading, setLoading] = useState(true)

    const STATUS_CONFIG = getStatusConfig(t)
    const REC_CONFIG = getRecConfig(t)

    useEffect(() => {
        if (!token) return
        api.list(token).then(res => {
            setItems(res.data)
            setLoading(false)
        })
    }, [token])

    return (
        <div className="min-h-screen bg-white dark:bg-black p-8">

            {/* Header */}
            <div className="mb-10">
                <h1 className="text-2xl font-bold text-black dark:text-white">
                    {t('dashboard.interviews.heading')}
                </h1>
                <p className="text-sm text-gray-400 mt-1">
                    {items.length} {t('dashboard.interviews.heading')}
                </p>
            </div>

            {/* Loading */}
            {loading ? (
                <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <div
                            key={i}
                            className="h-20 rounded-2xl border border-gray-100 dark:border-gray-900 animate-pulse"
                        />
                    ))}
                </div>

            ) : items.length === 0 ? (
                <div className="text-center py-20">
                    <p className="text-gray-400">{t('dashboard.interviews.no_interviews')}</p>
                </div>

            ) : (
                <div className="space-y-3">
                    {items.map(item => {
                        const cfg = STATUS_CONFIG[item.status as InterviewStatus]
                        const StatusIcon = cfg.icon
                        const eval_ = item.ai_evaluation

                        return (
                            <Link
                                key={item.id}
                                href={`/interviews/${item.id}`}
                                className="flex items-center gap-5 rounded-2xl border border-black dark:border-white
                                           px-6 py-4 hover:shadow-xl transition-all duration-200 group"
                            >
                                {/* Status badge */}
                                <div className={`flex items-center gap-1.5 text-xs font-medium
                                                 px-3 py-1.5 rounded-full border shrink-0 ${cfg.color}`}>
                                    <StatusIcon />
                                    {cfg.label}
                                </div>

                                {/* Candidate + Vacancy */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-black dark:text-white truncate">
                                        {item.candidate.candidateData.last_name} {item.candidate.candidateData.first_name}
                                    </p>
                                    <p className="text-xs text-gray-400 truncate mt-0.5">
                                        {item.vacancy.title}
                                        <span className="mx-1.5">·</span>
                                        {item.vacancy?.tenant?.name ?? 'NDA Company'}
                                    </p>
                                </div>

                                {/* Score */}
                                <div className="text-right shrink-0">
                                    <div className="text-xl font-bold text-black dark:text-white">
                                        {item.score}
                                    </div>
                                    <div className="text-xs text-gray-400">из 100</div>
                                </div>

                                {/* Recommendation */}
                                {eval_?.recommendation && (
                                    <div className={`text-xs font-medium px-3 py-1.5 rounded-full border shrink-0 
                                                    ${REC_CONFIG[eval_.recommendation as RecommendationType].color}`}>

                                        {REC_CONFIG[eval_.recommendation as RecommendationType].label}

                                    </div>
                                )}

                                {/* Date */}
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
