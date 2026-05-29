// app/[lang]/(dashboard)/interviews/[id]/page.tsx

'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { interviews as api } from '@/lib/api'
import type { Interview } from '@/types'
import { CheckCircleIcon, ClockIcon, ChevronRightIcon, MailIcon, SendIcon } from 'lucide-react'
import { useTranslation } from "@/hooks/useTranslation";
import { useLanguage } from "@/contexts/language-context";

export default function InterviewDetailPage() {
    const { id } = useParams<{ id: string }>()
    const { token } = useAuth()
    const { language } = useLanguage()
    const { t } = useTranslation()

    const interviewId = Number(id)
    const router = useRouter()

    const [interview, setInterview] = useState<Interview | null>(null)
    const [loading, setLoading] = useState(true)
    const [closing, setClosing] = useState(false)
    const [inviting, setInviting] = useState(false)
    const [inviteSent, setInviteSent] = useState(false)

    useEffect(() => {
        if (!token) return
        api.get(interviewId, token).then(res => {
            setInterview(res)
            setLoading(false)
        })
    }, [interviewId, token])

    const sendInvite = async () => {
        if (!token) return
        setInviting(true)
        try {
            await api.sendInvite(interviewId, token)
            setInviteSent(true)
        } finally {
            setInviting(false)
        }
    }

    const close = async (decision: 'approve' | 'reject') => {
        if (!token) return
        setClosing(true)
        await api.close(decision, interviewId, token)
        setInterview(prev => prev ? { ...prev, status: 'closed' } : prev)
        setClosing(false)
    }

    if (loading || !interview || !interview.candidate || !interview.vacancy) {
        return (
            <div className="min-h-screen p-4 sm:p-8">
                <div className="max-w-3xl mx-auto space-y-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-24 rounded-2xl border border-gray-100 dark:border-gray-900 animate-pulse" />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen p-8">
            <div className="max-w-3xl mx-auto">

                <div className="mb-6 sm:mb-8 flex items-start justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-black dark:text-white">
                            {interview.candidate.last_name} {interview.candidate.first_name}
                        </h1>
                        <p className="text-sm text-gray-400 mt-1">{interview.vacancy.title}</p>
                    </div>
                    <span className="text-xs border border-gray-300 dark:border-gray-700
                        text-gray-500 px-3 py-1.5 rounded-full">
                        {t(`dashboard.interviews.status.${interview.status}`)}
                    </span>
                </div>

                {interview.status === 'questions_review' && (
                    <div className="rounded-3xl border border-black dark:border-white p-6 bg-white dark:bg-black mb-6">
                        <p className="text-sm text-black dark:text-white font-medium mb-1">
                            {t('dashboard.interviews.id.questionsReady')}
                        </p>
                        <p className="text-xs text-gray-400 mb-4">
                            {t('dashboard.interviews.id.questionsReadyHint')}
                        </p>
                        <button
                            onClick={() => router.push(`/${language}/interviews/${id}/questions`)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-black dark:bg-white
                                text-white dark:text-black rounded-full text-sm font-medium"
                        >
                            {t('dashboard.interviews.id.checkQuestions')}
                            <ChevronRightIcon className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {['pending', 'generating_questions', 'synthesizing'].includes(interview.status) && (
                    <div className="rounded-3xl border border-gray-200 dark:border-gray-800 p-6 mb-6
                        flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full border-2 border-gray-200 dark:border-gray-800
                            border-t-black dark:border-t-white animate-spin shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-black dark:text-white">
                                {t(`dashboard.interviews.status.${interview.status}`)}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">{t('dashboard.interviews.id.processingHint')}</p>
                        </div>
                    </div>
                )}

                {interview.status === 'ready' && (
                    <div className="rounded-3xl border border-black dark:border-white p-6 bg-white dark:bg-black mb-6">
                        <div className="flex items-center gap-3 mb-1">
                            <MailIcon className="w-5 h-5 text-black dark:text-white" />
                            <p className="text-sm font-medium text-black dark:text-white">
                                {t('dashboard.interviews.id.readyToSend')}
                            </p>
                        </div>
                        <p className="text-xs text-gray-400 mb-4">
                            {t('dashboard.interviews.id.readyToSendHint')}
                            {interview.candidate.email && (
                                <> {t('dashboard.interviews.id.on')} <span className="text-black dark:text-white">{interview.candidate.email}</span></>
                            )}
                        </p>

                        {inviteSent ? (
                            <div className="flex items-center gap-2 text-sm text-black dark:text-white font-medium">
                                <CheckCircleIcon className="w-4 h-4" />
                                {t('dashboard.interviews.id.inviteSent')}
                            </div>
                        ) : (
                            <button
                                onClick={sendInvite}
                                disabled={inviting}
                                className="flex items-center gap-2 px-5 py-2.5 bg-black dark:bg-white
                                    text-white dark:text-black rounded-full text-sm font-medium
                                    disabled:opacity-40 transition-all hover:opacity-80"
                            >
                                {inviting ? (
                                    <div className="w-4 h-4 rounded-full border-2 border-white/30
                                        dark:border-black/30 border-t-white dark:border-t-black animate-spin" />
                                ) : (
                                    <SendIcon className="w-4 h-4" />
                                )}
                                {inviting ? t('dashboard.interviews.id.sending') : t('dashboard.interviews.id.sendInvite')}
                            </button>
                        )}
                    </div>
                )}

                {interview.status === 'evaluated' && (
                    <div className="rounded-3xl border border-black dark:border-white p-6 bg-white dark:bg-black mb-6">
                        <div className="flex items-center gap-3 mb-4">
                            <CheckCircleIcon className="w-5 h-5 text-black dark:text-white" />
                            <span className="font-semibold text-black dark:text-white">{t('dashboard.interviews.id.evaluationResults')}</span>
                        </div>
                        <div className="flex items-center gap-6 mb-4">
                            <div>
                                <p className="text-4xl font-bold text-black dark:text-white">
                                    {interview.grade}
                                </p>
                                <p className="text-xs text-gray-400">{t('dashboard.interviews.id.outOf10')}</p>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed flex-1">
                                {interview.text_grade}
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100 dark:border-gray-900">
                            <button
                                onClick={() => close('approve')}
                                disabled={closing}
                                className="flex-1 py-3 bg-black dark:bg-white text-white dark:text-black
                                    rounded-full text-sm font-medium disabled:opacity-40 transition-all"
                            >
                                {t('dashboard.interviews.id.sendApproval')}
                            </button>
                            <button
                                onClick={() => close('reject')}
                                disabled={closing}
                                className="flex-1 py-3 border border-gray-300 dark:border-gray-700
                                    text-gray-500 rounded-full text-sm hover:border-black hover:text-black
                                    dark:hover:border-white dark:hover:text-white disabled:opacity-40 transition-all"
                            >
                                {t('dashboard.interviews.id.sendRejection')}
                            </button>
                        </div>
                    </div>
                )}

                {interview.questions?.length > 0 && (
                    <div className="space-y-4">
                        <h2 className="text-sm font-semibold text-black dark:text-white uppercase tracking-widest">
                            {t('dashboard.interviews.id.candidateAnswers')}
                        </h2>
                        {interview.questions.map(q => (
                            <div key={q.id} className="rounded-2xl border border-gray-200 dark:border-gray-800 p-5 bg-white dark:bg-black">
                                <p className="text-xs text-gray-400 mb-2">{t('dashboard.interviews.id.questionNumber', { number: q.number })}</p>
                                <p className="text-sm font-medium text-black dark:text-white mb-3">{q.text}</p>
                                {q.answer?.text ? (
                                    <div className="bg-gray-50 dark:bg-gray-950 rounded-xl p-4">
                                        <p className="text-xs text-gray-400 mb-1">{t('dashboard.interviews.id.answer')}</p>
                                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                            {q.answer.text}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-xs text-gray-400">
                                        <ClockIcon className="w-3.5 h-3.5" />
                                        {t('dashboard.interviews.id.processing')}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
