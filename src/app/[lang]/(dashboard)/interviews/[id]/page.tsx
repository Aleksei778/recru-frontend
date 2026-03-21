// src/app/[lang]/(dashboard)/interviews/[id]/page.tsx

'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import type { Interview } from "@/types"
import { ArrowLeftIcon, LinkIcon, CheckIcon } from 'lucide-react'
import { interviews as api } from "@/lib/api";
import {useTranslation} from "@/hooks/useTranslation";

export default function InterviewDetailPage() {
    const { id } = useParams<{ id: string }>()
    const { token } = useAuth()
    const { t } = useTranslation()

    const router = useRouter()

    const [data, setData] = useState<Interview | null>(null)
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        if (!token) return

        api.get(parseInt(id), token).then(setData)
    }, [token, id]);

    const copyLink = () => {
        if (!token) return
    }

    const regenerate = async () => {
        if (!token || !data) return

        const result = await api.regenerateToken(data.id, token)
        await navigator.clipboard.writeText(result.link)

        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    if (!data) return <div className="p-8 text-gray-400">Загрузка...</div>

    const _eval = data.ai_evaluation

    return (
        <div className="max-w-3xl mx-auto p-8">
            <button onClick={() => router.back()} className="flex items-center gap-2 mb-6 text-gray-500 hover:text-gray-700 mb-6">
                <ArrowLeftIcon className="w-4 h-4" />
                {t('dashboard.interview.id.back')}
            </button>

            {/* Header */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 mb-5">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                            {data?.candidate.candidateData.last_name} {data?.candidate.candidateData.first_name}
                        </h1>

                        <p className="text-sm text-gray-500">
                            {data.vacancy?.title} · {data.vacancy?.tenant?.name ?? 'NDA Company'}
                        </p>
                    </div>

                    {data.score && (
                        <div className="text-center">
                            <div className="text-center">
                                <div className="text-4xl font-bold text-blue-600">
                                    {data.score}
                                </div>
                                <div className="text-xs text-gray-400">
                                    {t('dashboard.interviews.id.grade')}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Regenerate link button */}
                <button
                    onClick={regenerate}
                    className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                >
                    {copied ? <CheckIcon className="w-3.5 h-3.5" /> : <LinkIcon className="w-3.5 h-3.5" />}
                    {copied ? t('dashboard.interviews.id.copied') : t('dashboard.interviews.id.regenerate')}
                </button>
            </div>

            {/* AI evaluation */}
            {_eval && (
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 mb-5">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        {t('dashboard.interviews.id.aiEvaluation')}
                    </h2>

                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-5">
                        {_eval.summary}
                    </p>

                    <div className="grid grid-cols-2 gap-5 mb-5">
                        <div>
                            <p className="text-xs font-medium text-green-600 uppercase tracking-wide mb-2">
                                {t('dashboard.interviews.id.strengths')}
                            </p>

                            <ul className="space-y-1">
                                {_eval.strengths?.map((s, i) => (
                                    <li key={i} className="text-sm text-gray-600 dark:text-gray-300 flex gap-2">
                                        <span className="text-green-500">✓</span>
                                        { s }
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-red-600 uppercase tracking-wide mb-2">
                                {t('dashboard.interviews.id.weaknesses')}
                            </p>

                            <ul className="space-y-1">
                                {_eval.weaknesses?.map((s, i) => (
                                    <li className="text-sm text-gray-600 dark:text-gray-300 flex gap-2">
                                        <span className="text-red-400">✗</span>
                                        { s }
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Skills */}
                    {_eval.skills_assessment && (
                        <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">{t('dashboard.interviews.id.skills')}</p>
                            <div className="space-y-2">
                                {Object.entries(_eval.skills_assessment).map(([skill, score]) => (
                                    <div key={skill} className="flex items-center gap-3">
                                        <span className="text-sm text-gray-600 dark:text-gray-300 w-32 truncate">{skill}</span>
                                        <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
                                            <div
                                                className="bg-blue-500 h-1.5 rounded-full transition-all"
                                                style={{ width: `${(score / 5) * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-xs text-gray-400">{score}/5</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Conversation */}
            {data.conversation && data.conversation.length > 0 && (
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
                    <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
                        Диалог <span className="text-gray-400 font-normal text-sm">({data.conversation.length} сообщений)</span>
                    </h2>
                    <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                        {data.conversation.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-lg text-sm px-4 py-2.5 rounded-2xl leading-relaxed ${
                                    msg.role === 'user'
                                        ? 'bg-blue-600 text-white rounded-br-sm'
                                        : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-bl-sm'
                                }`}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
