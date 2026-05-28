// app/[lang]/(dashboard)/interviews/[id]/questions/page.tsx

'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { interviews as api} from '@/lib/api'
import type { Question } from '@/types'
import { CheckIcon, PencilIcon } from 'lucide-react'
import {useTranslation} from "@/hooks/useTranslation";
import {useLanguage} from "@/contexts/language-context";

export default function QuestionsReviewPage() {
    const { id } = useParams<{ id: string }>()
    const interviewId = Number(id)

    const { token } = useAuth()
    const { language } = useLanguage()
    const { t } = useTranslation()

    const router = useRouter()

    const [questions, setQuestions] = useState<Question[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [editingId, setEditingId] = useState<number | null>(null)

    useEffect(() => {
        if (!token) return
        api.get(interviewId, token).then((res) => {
            const interview = res.data ?? res
            setQuestions(interview.questions ?? [])
            setLoading(false)
        })
    }, [interviewId, token])

    const updateText = (questionId: number, text: string) => {
        setQuestions(qs => qs.map(q => q.id === questionId ? { ...q, text } : q))
    }

    const moveUp = (index: number) => {
        if (index === 0) return

        setQuestions(qs => {
            const next = [...qs]
            ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
            return next.map((q, i) => ({ ...q, number: i + 1 }))
        })
    }

    const moveDown = (index: number) => {
        if (index === questions.length - 1) return

        setQuestions(qs => {
            const next = [...qs]
            ;[next[index + 1], next[index]] = [next[index], next[index + 1]]
            return next.map((q, i) => ({ ...q, number: i + 1 }))
        })
    }

    const approve = async () => {
        if (!token) return
        setSaving(true)

        try {
            await api.approveQuestions({ questions: questions }, interviewId, token)
            router.push(`/${language}/interviews/${interviewId}`)
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen p-4 sm:p-8">
                <div className="max-w-2xl mx-auto space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-20 rounded-2xl border border-gray-100 dark:border-gray-900 animate-pulse" />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen p-4 sm:p-8">
            <div className="max-w-2xl mx-auto">

                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-black dark:text-white">
                        {t('dashboard.interviews.id.questions.heading')}
                    </h1>
                    <p className="text-sm text-gray-400">
                        {t('dashboard.interviews.id.questions.can_edit')}
                    </p>
                </div>

                <div className="space-y-3 mb-8">
                    {questions.map((q, index) => (
                        <div
                            key={q.id}
                            className="flex items-start gap-4 rounded-2xl border border-gray-200
                                dark:border-gray-800 p-5 bg-white dark:bg-black"
                        >
                            <div className="flex flex-col items-center gap-1 shrink-0">
                                <span className="text-xs font-bold text-gray-400 w-6 text-center">
                                    {q.number}
                                </span>
                                <button
                                    onClick={() => moveUp(index)}
                                    disabled={index === 0}
                                    className="text-gray-300 hover:text-black dark:hover:text-white
                                        disabled:opacity-20 transition text-xs"
                                >
                                    ▲
                                </button>
                                <button
                                    onClick={() => moveDown(index)}
                                    disabled={index === questions.length - 1}
                                    className="text-gray-300 hover:text-black dark:hover:text-white
                                        disabled:opacity-20 transition text-xs"
                                >
                                    ▼
                                </button>
                            </div>

                            <div className="flex-1">
                                {editingId === q.id ? (
                                    <textarea
                                        value={q.text}
                                        onChange={e => updateText(q.id, e.target.value)}
                                        onBlur={() => setEditingId(null)}
                                        autoFocus
                                        rows={3}
                                        className="w-full text-sm text-black dark:text-white bg-transparent
                                            border-b border-gray-300 dark:border-gray-700 focus:outline-none
                                            focus:border-black dark:focus:border-white resize-none"
                                    />
                                ) : (
                                    <p className="text-sm text-black dark:text-white leading-relaxed">
                                        {q.text}
                                    </p>
                                )}
                            </div>

                            <button
                                onClick={() => setEditingId(editingId === q.id ? null : q.id)}
                                className="text-gray-400 hover:text-black dark:hover:text-white transition shrink-0"
                            >
                                <PencilIcon className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>

                <button
                    onClick={approve}
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2 py-4
                        bg-black dark:bg-white text-white dark:text-black rounded-full
                        font-medium text-sm disabled:opacity-40 transition-all hover:opacity-80"
                >
                    <CheckIcon className="w-4 h-4" />
                    {saving ? t('dashboard.interviews.id.questions.saving') : t('dashboard.interviews.id.questions.confirm')}
                </button>
            </div>
        </div>
    )
}
