// src/app/[lang]/(dashboard)/interviews/[token]/page.tsx

'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import {session, vacancies} from '@/lib/api'
import type {
    AiEvaluation,
    InterviewSession,
    Message,
    Phase
} from '@/types'
import { useTranslation } from "@/hooks/useTranslation";

export default function CandidateInterviewPage() {
    const { token } = useParams<{ token: string }>()
    const { t } = useTranslation()

    const [info, setInfo] = useState<InterviewSession | null>(null)
    const [input, setInput] = useState<string>('')
    const [phase, setPhase] = useState<Phase>('loading')
    const [canFinish, setCanFinish] = useState<boolean>(false)
    const [messages, setMessages] = useState<Message[]>([])
    const [eval_, setEval_] = useState<AiEvaluation | null>(null)
    const [sending, setSending] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)

    const bottomRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        if (!token) return
        session.get(token).then(res => {
            setInfo(res)

            if (res.conversation?.length) {
                setMessages(res.conversation)
                setPhase('active')
            } else {
                setPhase('ready')
            }
        })
    }, [token])

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, phase])

    const start = async () => {
        setSending(true)
        const { message } = await session.start(token)
        setMessages([{ role: 'assistant', content: message }])
        setPhase('active')
        setSending(false)
    }

    const send = async () => {
        if (!input.trim) return

        const text = input.trim()

        setInput('')
        setMessages(m => [...m, { role: 'user', content: text }])
        setSending(true)

        try {
            const res = await session.answer(token, text)
            setMessages(m => [...m, { role: 'assistant', content: res.message }])
            if (res.can_finish) setCanFinish(true)
        } catch (error) {
            setError(error.message)
        }

        setSending(false)
    }

    const finish = async () => {
        setPhase('finishing')
        const res = await session.finish(token)
        setEval_(res)
        setPhase('done')
    }

    if (phase === 'error') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-sm">
                    <h1 className="text-lg font-semibold text-gray-900 mb-2">{t('interview.token.invalid_link')}</h1>
                    <p className="text-sm text-gray-500">{error}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-sceen bg-gray-50 dark:bg-gray-950 flex flex-col">
            {/* Header */}
            <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 p-4">
                <div className="max-w-2xl mx-auto flex items-center justify-between">
                    <div>
                        {info ? (
                            <>
                                <h1 className="text-base font-semibold text-gray-900 dark:text-white">
                                    {info.vacancy.title}
                                </h1>
                                <p className="text-xs text-gray-500">
                                    {info.vacancy.company}
                                </p>
                            </>
                        ) : (
                            <div className="h-8 w-48 bg-gray-100 animate-pulse" />
                        )}
                    </div>
                    {phase === 'active' && canFinish && (
                        <button
                            onClick={finish}
                            className="text-xs px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg
                                       text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                            {t('interview.token.finish')}
                        </button>
                    )}
                </div>
            </div>

            {/* Chat body */}
            <div className="flex-1 overflow -y-auto">
                <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
                    {/* Ready state */}
                    {phase === 'ready' && info && (
                        <div className="text-center py-16">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl mb-5">
                                <span className="text-2xl">
                                    👋
                                </span>
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                {t('interview.token.hello') + info.candidate.candidateData.last_name + info.candidate.candidateData.first_name}
                            </h2>
                            <p className="text-sm text-gray-500 mb-8 max-w-sm mx-auto">
                                {t('interview.token.wait')} <strong>{info.vacancy.title}</strong>.
                                {t('interview.token.honest')}
                            </p>
                            <button
                                onClick={start}
                                disabled={sending}
                                className="px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-medium
                                           hover:bg-blue-700 disabled:opacity-50 transition-colors"
                            >
                                {sending ? t('interview.token.connecting') : t('interview.token.start')}
                            </button>
                        </div>
                    )}

                    {/* Messages */}
                    {messages.map((msg: Message, i: number) => (
                        <div key={i} className="">

                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
