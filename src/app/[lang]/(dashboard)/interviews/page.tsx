// src/app/[lang]/(dashboard)/interviews/page.tsx

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { useTranslation } from "@/hooks/useTranslation";
import { interviews as api } from '@/lib/api'
import { Interview, Vacancy } from '@/lib/types'
import { ClockIcon, CheckCircleIcon, XCircleIcon, PlayIcon } from 'lucide-react'

const getStatusConfig = (t: (key: string) => string) => ({
    pending: { label: t('interviews.status.pending'), icon: ClockIcon, color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20' },
    in_progress: { label: t('interviews.status.in_progress'), icon: PlayIcon, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
    completed: { label: t('interviews.status.completed'), icon: CheckCircleIcon, color: 'text-green-600 bg-green-50 dark:bg-green-900/20' },
    cancel: { label: t('interviews.status.cancel'), icon: XCircleIcon, color: 'text-red-600 bg-red-50 dark:bg-red-900/20' },
})

const getRecConfig = (t: (key: string) => string) => ({
    hire: { label: t('interviews.rec.hire'), color: 'text-green-600' },
    maybe: { label: t('interviews.rec.maybe'), color: 'text-yellow-600' },
    reject: { label: t('interviews.rec.reject'), color: 'text-red-600' },
})

export default function InterviewPage() {
    const { t } = useTranslation()
    const { token } = useAuth()

    const [items, setItems] = useState<Interview[]>([])
    const [loading, setLoading] = useState<boolean>(true)

    const STATUS_CONFIG = getStatusConfig(t)
    const REC_CONFIG = getRecConfig(t)

    useEffect(() => {
        if (!token) return;

        api.list(token).then(res => {
            setItems(res.data);

            setLoading(false)
        })
    })

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-black dark:text-white">
                    { t('interviews.page.interview') }
                </h1>
                <p className="text-sm text-black dark:text-white">{ items.length } { t('dashboard.interviews.heading') }</p>
            </div>

            {loading ? (
                <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-20 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
                    ))}
                </div>
            ) : items.length === 0 ? (
                <div className="text-center py-20 text-black dark:text-white">
                    <p> { t("dashboard.interviews.no_interviews") } </p>
                </div>
            ) : (
                <div className="space-y-3">
                    { items.map(item => {
                        const cfg = STATUS_CONFIG[item.status]
                        const StatusIcon = cfg.icon
                        const eval_ = item.ai_evaluation

                        return (
                            <Link
                                key={item.id}
                                href={`/interviews/${item.id}`}
                                className="flex items-center gap-5 bg-white dark:bg-gray-900 rounded-xl border
                                           border-gray-200 dark:border-gray-800 px-5 py-4 hover:shadow-sm
                                           hover:border-blue-200 dark:hover:border-blue-800 transition-all"
                            >
                                {/* Status badge */}
                                <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg shrink-0 ${cfg.color}`}>
                                    <StatusIcon className="w-3.5 h-3.5" />
                                    { cfg.label }
                                </div>

                                {/* Candidate + Vacancy */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-black dark:text-white truncate">
                                        {
                                            
                                        }
                                    </p>
                                </div>
                            </Link>
                        )
                    }) }
                </div>
            )}
        </div>
    )
}
